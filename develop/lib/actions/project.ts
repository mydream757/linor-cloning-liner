'use server'

// Project CRUD Server Actions. ADR-0008(zod + result) + ADR-0009(Phase 1 path-based).
// 기능 2(NextAuth) 통합 전에는 임시 dev user로 소유권 검증.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import type { ActionResult } from '@/lib/actions/types'
import { getDevUser } from '@/lib/dev-user'
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
    return { ok: false, error: { fields: parsed.error.flatten().fieldErrors } }
  }

  const devUser = await getDevUser()
  const project = await prisma.project.create({
    data: { userId: devUser.id, name: parsed.data.name },
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
    return { ok: false, error: { fields: parsed.error.flatten().fieldErrors } }
  }

  const devUser = await getDevUser()
  const existing = await prisma.project.findUnique({ where: { id: parsed.data.id } })
  if (!existing || existing.userId !== devUser.id) {
    return { ok: false, error: { message: '해당 Project를 찾을 수 없습니다' } }
  }

  await prisma.project.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name },
  })

  revalidatePath('/', 'layout')
  return { ok: true, data: { id: parsed.data.id } }
}

const deleteProjectSchema = z.object({ id: z.string().min(1) })

export async function deleteProject(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteProjectSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success) {
    return { ok: false, error: { fields: parsed.error.flatten().fieldErrors } }
  }

  const devUser = await getDevUser()
  const existing = await prisma.project.findUnique({ where: { id: parsed.data.id } })
  if (!existing || existing.userId !== devUser.id) {
    return { ok: false, error: { message: '해당 Project를 찾을 수 없습니다' } }
  }

  await prisma.project.delete({ where: { id: parsed.data.id } })

  revalidatePath('/', 'layout')
  return { ok: true, data: { id: parsed.data.id } }
}
