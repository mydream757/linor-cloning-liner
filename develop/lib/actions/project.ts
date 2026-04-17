'use server'

// Project CRUD Server Actions. ADR-0008(zod + result) + ADR-0009(Phase 1 path-based).
// session 기반 소유권 검증 (ADR-0011).

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import type { ActionResult } from '@/lib/actions/types'
import { getRequiredSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Project 이름을 입력해주세요')
  .max(100, '100자 이하로 입력해주세요')

const createProjectSchema = z.object({ name: nameSchema })

export async function createProject(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createProjectSchema.safeParse({
    name: formData.get('name'),
  })
  if (!parsed.success) {
    return { ok: false, error: { fields: z.flattenError(parsed.error).fieldErrors } }
  }

  const { user } = await getRequiredSession()
  const project = await prisma.project.create({
    data: { userId: user.id, name: parsed.data.name },
  })

  revalidatePath('/', 'layout')
  redirect(`/p/${project.id}/liner`)
}

const renameProjectSchema = z.object({
  id: z.string().min(1),
  name: nameSchema,
})

export async function renameProject(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = renameProjectSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
  })
  if (!parsed.success) {
    return { ok: false, error: { fields: z.flattenError(parsed.error).fieldErrors } }
  }

  const { user } = await getRequiredSession()
  const existing = await prisma.project.findUnique({ where: { id: parsed.data.id } })
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: { message: '해당 Project를 찾을 수 없습니다' } }
  }

  await prisma.project.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name },
  })

  revalidatePath('/', 'layout')
  return { ok: true, data: { id: parsed.data.id } }
}

const deleteProjectSchema = z.object({
  id: z.string().min(1),
  // 호출부가 "현재 보고 있는 Project를 삭제 중"임을 표시하는 flag.
  // 존재하면 삭제 후 다른 Project 또는 /로 redirect를 수행한다.
  deleteCurrent: z.string().optional(),
})

export async function deleteProject(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteProjectSchema.safeParse({
    id: formData.get('id'),
    deleteCurrent: formData.get('deleteCurrent') ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: { fields: z.flattenError(parsed.error).fieldErrors } }
  }

  const { user } = await getRequiredSession()
  const existing = await prisma.project.findUnique({ where: { id: parsed.data.id } })
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: { message: '해당 Project를 찾을 수 없습니다' } }
  }

  await prisma.project.delete({ where: { id: parsed.data.id } })

  revalidatePath('/', 'layout')

  if (parsed.data.deleteCurrent) {
    // 현재 뷰가 방금 삭제된 Project를 가리키고 있다. 다른 Project로 이동하거나
    // 없으면 /로 보낸다. /는 다시 cookie/목록 기반으로 자연 복구된다.
    const next = await prisma.project.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    })
    if (next) {
      redirect(`/p/${next.id}/liner`)
    }
    redirect('/')
  }

  return { ok: true, data: { id: parsed.data.id } }
}
