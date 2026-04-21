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

// ---------- Document 생성 (Composition 모델, ADR-0016) ----------
//
// 단일 API로 3가지 시나리오를 모두 커버한다:
//   - sourceChatIds=[] (또는 미전달): 빈 Document (시나리오 5-a)
//   - sourceChatIds=[chatId] 1개: Chat 응답 지름길 (시나리오 5-b)
//   - sourceChatIds=[chat1, chat2, ...] N개: 다중 재료 (시나리오 5-c)
// 재료 Chat들의 어시스턴트 응답을 순서대로 concat해 TipTap doc 초안에 주입한다.
// "이미 내보냄" 제약 없음 — 같은 Chat이 여러 Document 재료가 될 수 있다.

const createDocumentSchema = z.object({
  title: titleSchema,
  projectId: projectIdSchema,
  // 재료 Chat ID 배열. 비거나 미전달이면 빈 Document.
  sourceChatIds: z.array(z.string().min(1)).optional(),
})

export async function createDocument(
  data: z.infer<typeof createDocumentSchema>,
): Promise<ActionResult<{ id: string; projectId: string | null }>> {
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

  const sourceChatIds = parsed.data.sourceChatIds ?? []

  // 재료 Chat들의 소유권 검증 + 콘텐츠 수집. 순서는 sourceChatIds 배열 순서를 유지.
  let documentContent: unknown = { type: 'doc', content: [] }
  if (sourceChatIds.length > 0) {
    const chats = await prisma.chat.findMany({
      where: { id: { in: sourceChatIds } },
      include: { messages: { where: { role: 'assistant' }, orderBy: { createdAt: 'asc' } } },
    })

    // 모든 Chat이 현재 user 소유여야 하고, 요청된 ID가 모두 조회돼야 한다.
    if (chats.length !== sourceChatIds.length) {
      return { ok: false, error: { message: '선택한 Chat 중 일부를 찾을 수 없습니다' } }
    }
    if (chats.some((c) => c.userId !== user.id)) {
      return { ok: false, error: { message: '선택한 Chat 중 일부에 접근 권한이 없습니다' } }
    }

    // sourceChatIds 배열 순서대로 paragraph들을 이어붙인다. 각 Chat의 어시스턴트
    // 응답들을 순서대로 paragraph로 감싼다. 마크다운 파싱은 기능 5에서 도입.
    const chatById = new Map(chats.map((c) => [c.id, c]))
    const paragraphs: Array<{
      type: 'paragraph'
      content: Array<{ type: 'text'; text: string }>
    }> = []
    for (const chatId of sourceChatIds) {
      const chat = chatById.get(chatId)
      if (!chat) continue
      for (const msg of chat.messages) {
        if (msg.content.trim().length === 0) continue
        paragraphs.push({
          type: 'paragraph',
          content: [{ type: 'text', text: msg.content }],
        })
      }
    }
    documentContent = { type: 'doc', content: paragraphs }
  }

  const asset = await prisma.asset.create({
    data: {
      userId: user.id,
      projectId: parsed.data.projectId ?? null,
      type: 'document',
      title: parsed.data.title,
      sourceChatIds,
      documentContent: documentContent as object,
    },
  })

  if (parsed.data.projectId) {
    revalidatePath(`/p/${parsed.data.projectId}/write`)
    // 사이드바 "최근 기록" 갱신용 — Liner/Write 뷰 모두 영향.
    revalidatePath(`/p/${parsed.data.projectId}`, 'layout')
  }

  return { ok: true, data: { id: asset.id, projectId: asset.projectId } }
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

  // 도메인 모델 §삭제 동작 (v0.4):
  //  - Message.referencedAssetIds 배열에서 이 ID 제거 (스칼라 배열 FK 불가 → 애플리케이션 처리)
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
