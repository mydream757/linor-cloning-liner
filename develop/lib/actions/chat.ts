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
const createChatSchema = z.object({
  projectId: z.string().min(1),
  title: titleSchema,
})

export async function createChat(
  data: z.infer<typeof createChatSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createChatSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, error: { fields: z.flattenError(parsed.error).fieldErrors } }
  }

  const { user } = await getRequiredSession()

  // Project 소유권 검증
  const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } })
  if (!project || project.userId !== user.id) {
    return { ok: false, error: { message: '해당 Project를 찾을 수 없습니다' } }
  }

  const chat = await prisma.chat.create({
    data: {
      userId: user.id,
      projectId: parsed.data.projectId,
      title: parsed.data.title,
    },
  })

  revalidatePath(`/p/${parsed.data.projectId}`, 'layout')
  return { ok: true, data: { id: chat.id } }
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

// Chat 삭제. Messages cascade, 연관 Asset의 origin_chat_id는 null 처리 (기능 4에서 Asset 모델 추가 시).
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
  await prisma.chat.delete({ where: { id: parsed.data.id } })

  if (existing.projectId) {
    revalidatePath(`/p/${existing.projectId}`, 'layout')
  }

  if (parsed.data.deleteCurrent && existing.projectId) {
    const next = await prisma.chat.findFirst({
      where: { projectId: existing.projectId },
      orderBy: { updatedAt: 'desc' },
    })
    if (next) {
      redirect(`/p/${existing.projectId}/liner/c/${next.id}`)
    }
    redirect(`/p/${existing.projectId}/liner`)
  }

  return { ok: true, data: { id: parsed.data.id } }
}
