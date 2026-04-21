'use server'

// Asset CRUD Server Actions. ADR-0008(zod + result) + ADR-0009(path-based revalidation).
// session 기반 소유권 검증 (ADR-0011).
//
// ADR-0014 하이브리드 스키마: 단일 Asset 테이블 + type/referenceKind discriminator.
// 입력 검증은 zod discriminatedUnion으로 타입별 필드 조합을 강제한다.
//
// 이 파일은 기능 4 D2 범위에서 Reference 생성(URL/text) + Asset 공통 삭제를 제공한다.
// Document 생성·포워딩은 D3, 이동·수정은 후속 D-stage에서 추가된다.

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import type { ActionResult } from '@/lib/actions/types'
import { getRequiredSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

// ---------- 공통 스키마 ----------

const titleSchema = z
  .string()
  .trim()
  .min(1, '제목을 입력해주세요')
  .max(200, '200자 이하로 입력해주세요')

const urlSchema = z
  .string()
  .trim()
  .min(1, 'URL을 입력해주세요')
  .max(2048, '2048자 이하로 입력해주세요')
  .url('올바른 URL 형식이 아닙니다')

const excerptSchema = z.string().trim().max(2000, '2000자 이하로 입력해주세요').optional()

const textSchema = z
  .string()
  .trim()
  .min(1, '텍스트를 입력해주세요')

// projectId를 선택적으로 받는다(미할당 허용). UI는 D2에서 현재 Project로 고정하되
// Server Action은 완성도를 유지해 D4에서 UI만 확장한다.
const projectIdSchema = z.string().min(1).optional()

// ---------- Reference 생성 ----------

// URL Reference 생성. 제목·발췌는 수동 입력 (자동 스크랩 없음 — PM 명세 Q3 해소).
const createReferenceUrlSchema = z.object({
  kind: z.literal('url'),
  title: titleSchema,
  url: urlSchema,
  excerpt: excerptSchema,
  projectId: projectIdSchema,
})

// 텍스트 스니펫 Reference. 제목은 선택 (없으면 text 앞 60자 자동).
const createReferenceTextSchema = z.object({
  kind: z.literal('text'),
  title: titleSchema.optional(),
  text: textSchema,
  projectId: projectIdSchema,
})

const createReferenceSchema = z.discriminatedUnion('kind', [
  createReferenceUrlSchema,
  createReferenceTextSchema,
])

export async function createReference(
  data: z.infer<typeof createReferenceSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createReferenceSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, error: { fields: z.flattenError(parsed.error).fieldErrors } }
  }

  const { user } = await getRequiredSession()

  // Project 소유권 검증 (projectId가 있을 때만)
  if (parsed.data.projectId) {
    const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } })
    if (!project || project.userId !== user.id) {
      return { ok: false, error: { message: '해당 Project를 찾을 수 없습니다' } }
    }
  }

  const asset = await (parsed.data.kind === 'url'
    ? prisma.asset.create({
        data: {
          userId: user.id,
          projectId: parsed.data.projectId ?? null,
          type: 'reference',
          title: parsed.data.title,
          referenceKind: 'url',
          referenceUrl: parsed.data.url,
          // URL 타입의 발췌는 referenceText 컬럼을 재사용해 저장.
          // Reference text kind의 "본문"과 구분은 referenceKind discriminator로.
          referenceText: parsed.data.excerpt && parsed.data.excerpt.length > 0
            ? parsed.data.excerpt
            : null,
        },
      })
    : prisma.asset.create({
        data: {
          userId: user.id,
          projectId: parsed.data.projectId ?? null,
          type: 'reference',
          title: parsed.data.title ?? parsed.data.text.slice(0, 60),
          referenceKind: 'text',
          referenceText: parsed.data.text,
        },
      }))

  // Project 스코프면 해당 Project의 references 페이지 revalidate.
  if (parsed.data.projectId) {
    revalidatePath(`/p/${parsed.data.projectId}/references`)
  }

  return { ok: true, data: { id: asset.id } }
}

// ---------- Document 생성 (빈 Document — 시나리오 5-a) ----------

const createDocumentSchema = z.object({
  title: titleSchema,
  projectId: projectIdSchema,
})

export async function createDocument(
  data: z.infer<typeof createDocumentSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createDocumentSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, error: { fields: z.flattenError(parsed.error).fieldErrors } }
  }

  const { user } = await getRequiredSession()

  // Project 소유권 검증 (projectId가 있을 때만)
  if (parsed.data.projectId) {
    const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } })
    if (!project || project.userId !== user.id) {
      return { ok: false, error: { message: '해당 Project를 찾을 수 없습니다' } }
    }
  }

  const asset = await prisma.asset.create({
    data: {
      userId: user.id,
      projectId: parsed.data.projectId ?? null,
      type: 'document',
      title: parsed.data.title,
      // 빈 Document. TipTap은 빈 doc이면 editor.getJSON()이 { type: 'doc', content: [] }를
      // 반환하므로 로드 시 호환 가능.
      documentContent: { type: 'doc', content: [] },
    },
  })

  if (parsed.data.projectId) {
    revalidatePath(`/p/${parsed.data.projectId}/write`)
  }

  return { ok: true, data: { id: asset.id } }
}

// ---------- Chat 응답 포워딩 (시나리오 5-b) ----------
//
// 어시스턴트 메시지 1건을 Document Asset으로 내보낸다. 트랜잭션 원자성:
//   1) Message 조회 + 소유권 검증 (assistant role 강제)
//   2) Asset 생성 — originChatId 자동 설정, content는 TipTap doc 구조로 감싼 응답 텍스트
//   3) Message.generatedAssetId 업데이트
// 셋 중 하나라도 실패 시 전체 롤백.

const forwardMessageToDocumentSchema = z.object({
  messageId: z.string().min(1),
  title: titleSchema.optional(),
})

export async function forwardMessageToDocument(
  data: z.infer<typeof forwardMessageToDocumentSchema>,
): Promise<ActionResult<{ id: string; projectId: string | null }>> {
  const parsed = forwardMessageToDocumentSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, error: { fields: z.flattenError(parsed.error).fieldErrors } }
  }

  const { user } = await getRequiredSession()

  // 소유권 + role 검증. Chat을 include해서 userId·projectId 한 번에 확인.
  const message = await prisma.message.findUnique({
    where: { id: parsed.data.messageId },
    include: { chat: true },
  })
  if (!message || message.chat.userId !== user.id) {
    return { ok: false, error: { message: '해당 메시지를 찾을 수 없습니다' } }
  }
  if (message.role !== 'assistant') {
    return { ok: false, error: { message: '어시스턴트 응답만 Document로 내보낼 수 있습니다' } }
  }

  // 이미 포워딩된 메시지인지 확인 — 중복 방지.
  if (message.generatedAssetId) {
    return {
      ok: false,
      error: { message: '이 응답은 이미 Document로 내보내졌습니다' },
    }
  }

  // 제목: 사용자 제공 > 응답 본문 앞 60자 자동.
  const title =
    parsed.data.title && parsed.data.title.length > 0
      ? parsed.data.title
      : message.content.slice(0, 60)

  // 응답 본문을 TipTap doc 단일 paragraph로 감싼다. 마크다운 파싱은 기능 5에서 도입.
  const documentContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: message.content }],
      },
    ],
  }

  const created = await prisma.$transaction(async (tx) => {
    const asset = await tx.asset.create({
      data: {
        userId: user.id,
        projectId: message.chat.projectId,
        type: 'document',
        title,
        originChatId: message.chatId,
        documentContent,
      },
    })
    await tx.message.update({
      where: { id: message.id },
      data: { generatedAssetId: asset.id },
    })
    return asset
  })

  if (message.chat.projectId) {
    revalidatePath(`/p/${message.chat.projectId}/write`)
    // 출처 패널/Chat 메시지 액션바의 "이미 내보내짐" 상태 갱신을 위해 liner 경로도 revalidate.
    revalidatePath(`/p/${message.chat.projectId}/liner`, 'layout')
  }

  return { ok: true, data: { id: created.id, projectId: created.projectId } }
}

// ---------- Asset 삭제 (Reference/Document 공통) ----------

const deleteAssetSchema = z.object({
  id: z.string().min(1),
})

export async function deleteAsset(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteAssetSchema.safeParse({
    id: formData.get('id'),
  })
  if (!parsed.success) {
    return { ok: false, error: { fields: z.flattenError(parsed.error).fieldErrors } }
  }

  const { user } = await getRequiredSession()
  const existing = await prisma.asset.findUnique({ where: { id: parsed.data.id } })
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: { message: '해당 Asset을 찾을 수 없습니다' } }
  }

  // 도메인 모델 §삭제 동작:
  //  - Message.referencedAssetIds 배열에서 이 ID 제거 (String[]은 Prisma FK 불가 → 애플리케이션 처리)
  //  - Message.generatedAssetId는 Prisma FK ON DELETE SET NULL로 자동 처리 (D1)
  //  - Asset hard delete
  // 원자성을 위해 트랜잭션으로 묶는다.
  await prisma.$transaction(async (tx) => {
    // Postgres array_remove()로 referencedAssetIds에서 이 Asset ID 제거.
    // Prisma 표준 API가 스칼라 배열 요소 제거를 지원하지 않아 $executeRaw 사용.
    await tx.$executeRaw`
      UPDATE messages
      SET referenced_asset_ids = array_remove(referenced_asset_ids, ${parsed.data.id})
      WHERE ${parsed.data.id} = ANY(referenced_asset_ids)
    `
    await tx.asset.delete({ where: { id: parsed.data.id } })
  })

  // 어느 경로들에 영향 주는지:
  //  - Asset 자체가 있던 Project(있다면)의 references 페이지
  //  - 이 Asset을 참조하던 Message가 있는 Chat들 (D6 출처 패널 실데이터 연결 이후 관련. D2에서는 Project 스코프만)
  if (existing.projectId) {
    revalidatePath(`/p/${existing.projectId}/references`)
  }

  return { ok: true, data: { id: parsed.data.id } }
}
