'use server'

// Chat CRUD Server Actions. ADR-0008(zod + result) + ADR-0009(path-based revalidation).
// session 기반 소유권 검증 (ADR-0011).

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import type { ActionResult } from '@/lib/actions/types'
import { getRequiredSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Chat 제목을 입력해주세요')
  .max(200, '200자 이하로 입력해주세요')

// 첫 메시지 전송 시 자동 생성. title은 첫 메시지 앞 30자.
// projectId는 optional — 미할당 Chat(도메인 모델 v0.4 §Project 미할당)이 1급 지원.
const createChatSchema = z.object({
  projectId: z.string().min(1).optional(),
  title: titleSchema,
})

export async function createChat(
  data: z.infer<typeof createChatSchema>,
): Promise<ActionResult<{ id: string; projectId: string | null }>> {
  const parsed = createChatSchema.safeParse(data)
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

  const chat = await prisma.chat.create({
    data: {
      userId: user.id,
      projectId: parsed.data.projectId ?? null,
      title: parsed.data.title,
    },
  })

  if (parsed.data.projectId) {
    // Project 스코프 사이드바(Project 트리) 갱신.
    revalidatePath(`/p/${parsed.data.projectId}`, 'layout')
  } else {
    // 미할당 Chat 생성 — 사이드바 "최근 기록"에 반영.
    revalidatePath('/', 'layout')
  }
  return { ok: true, data: { id: chat.id, projectId: chat.projectId } }
}

// Chat 이름 변경
const renameChatSchema = z.object({
  id: z.string().min(1),
  title: titleSchema,
})

export async function renameChat(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = renameChatSchema.safeParse({
    id: formData.get('id'),
    title: formData.get('title'),
  })
  if (!parsed.success) {
    return { ok: false, error: { fields: z.flattenError(parsed.error).fieldErrors } }
  }

  const { user } = await getRequiredSession()
  const existing = await prisma.chat.findUnique({ where: { id: parsed.data.id } })
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: { message: '해당 Chat을 찾을 수 없습니다' } }
  }

  await prisma.chat.update({
    where: { id: parsed.data.id },
    data: { title: parsed.data.title },
  })

  if (existing.projectId) {
    revalidatePath(`/p/${existing.projectId}`, 'layout')
  }
  return { ok: true, data: { id: parsed.data.id } }
}

// Chat → Project 이동 (또는 미할당으로 되돌리기).
// Composition 모델 (ADR-0016) 관점에서 "이 Chat이 만든 Asset" 개념을 재정의:
//   - 동반 이동 대상 = 이 Chat만을 유일 재료로 쓰는 Asset (sourceChatIds = [thisChatId])
//   - 여러 Chat이 섞인 Asset은 건드리지 않음 — 소속 Project가 불명확하기 때문
// 트랜잭션으로 Chat.projectId + (조건부) Asset.projectId 업데이트.
const moveChatToProjectSchema = z.object({
  chatId: z.string().min(1),
  targetProjectId: z.string().min(1).nullable(), // null = 미할당
  moveSourcedAssets: z.boolean().optional(),
})

export async function moveChatToProject(
  data: z.infer<typeof moveChatToProjectSchema>,
): Promise<ActionResult<{ id: string; projectId: string | null; movedAssetCount: number }>> {
  const parsed = moveChatToProjectSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, error: { fields: z.flattenError(parsed.error).fieldErrors } }
  }

  const { user } = await getRequiredSession()

  // 소유권 검증
  const chat = await prisma.chat.findUnique({ where: { id: parsed.data.chatId } })
  if (!chat || chat.userId !== user.id) {
    return { ok: false, error: { message: '해당 Chat을 찾을 수 없습니다' } }
  }

  // 타겟 Project 검증 (null이면 미할당)
  if (parsed.data.targetProjectId) {
    const target = await prisma.project.findUnique({
      where: { id: parsed.data.targetProjectId },
    })
    if (!target || target.userId !== user.id) {
      return { ok: false, error: { message: '이동할 Project를 찾을 수 없습니다' } }
    }
  }

  if (chat.projectId === parsed.data.targetProjectId) {
    return { ok: false, error: { message: '이미 해당 Project에 있습니다' } }
  }

  const previousProjectId = chat.projectId
  let movedAssetCount = 0

  await prisma.$transaction(async (tx) => {
    await tx.chat.update({
      where: { id: parsed.data.chatId },
      data: { projectId: parsed.data.targetProjectId },
    })

    if (parsed.data.moveSourcedAssets) {
      // Postgres 배열 정확 일치: source_chat_ids = ARRAY[chatId]
      // Prisma has 대신 $executeRaw로 raw SQL. 결과로 업데이트된 row 수 반환.
      const result = await tx.$executeRaw`
        UPDATE assets
        SET project_id = ${parsed.data.targetProjectId}
        WHERE user_id = ${user.id}
          AND source_chat_ids = ARRAY[${parsed.data.chatId}]::text[]
      `
      movedAssetCount = typeof result === 'number' ? result : 0
    }
  })

  // 사이드바 Project 트리 + 최근 기록 갱신 — 이전/새 Project 양쪽 영향.
  if (previousProjectId) {
    revalidatePath(`/p/${previousProjectId}`, 'layout')
  }
  if (parsed.data.targetProjectId) {
    revalidatePath(`/p/${parsed.data.targetProjectId}`, 'layout')
  }
  // 미할당 섹션("최근 기록")도 영향 가능.
  revalidatePath('/', 'layout')

  return {
    ok: true,
    data: {
      id: chat.id,
      projectId: parsed.data.targetProjectId,
      movedAssetCount,
    },
  }
}

// Chat 삭제. Messages cascade.
// 도메인 모델 v0.4 (ADR-0016): 이 Chat을 재료로 삼던 Asset의 source_chat_ids 배열에서
// 해당 ID를 array_remove. Asset(Document)은 생존, 콘텐츠는 건드리지 않는다.
// deleteCurrent flag가 있으면 현재 보고 있는 Chat을 삭제 중이라는 의미 — 같은 Project의
// 다른 Chat으로 이동하거나 없으면 /liner(빈 상태)로 redirect한다.
const deleteChatSchema = z.object({
  id: z.string().min(1),
  deleteCurrent: z.string().optional(),
})

export async function deleteChat(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteChatSchema.safeParse({
    id: formData.get('id'),
    deleteCurrent: formData.get('deleteCurrent') ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: { fields: z.flattenError(parsed.error).fieldErrors } }
  }

  const { user } = await getRequiredSession()
  const existing = await prisma.chat.findUnique({ where: { id: parsed.data.id } })
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: { message: '해당 Chat을 찾을 수 없습니다' } }
  }

  // Messages는 onDelete: Cascade로 자동 삭제.
  // Asset.source_chat_ids 배열 정리와 Chat 삭제를 원자 트랜잭션으로 묶는다.
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE assets
      SET source_chat_ids = array_remove(source_chat_ids, ${parsed.data.id})
      WHERE ${parsed.data.id} = ANY(source_chat_ids)
    `
    await tx.chat.delete({ where: { id: parsed.data.id } })
  })

  if (existing.projectId) {
    revalidatePath(`/p/${existing.projectId}`, 'layout')
  } else {
    // 미할당 Chat — 사이드바 "최근 기록" 갱신.
    revalidatePath('/', 'layout')
  }

  if (parsed.data.deleteCurrent) {
    if (existing.projectId) {
      const next = await prisma.chat.findFirst({
        where: { projectId: existing.projectId },
        orderBy: { updatedAt: 'desc' },
      })
      if (next) {
        redirect(`/p/${existing.projectId}/liner/c/${next.id}`)
      }
      redirect(`/p/${existing.projectId}/liner`)
    } else {
      // 미할당 Chat 삭제 — 다른 미할당 Chat 또는 /liner(빈 상태)로.
      const next = await prisma.chat.findFirst({
        where: { userId: user.id, projectId: null },
        orderBy: { updatedAt: 'desc' },
      })
      if (next) {
        redirect(`/liner/c/${next.id}`)
      }
      redirect('/liner')
    }
  }

  return { ok: true, data: { id: parsed.data.id } }
}
