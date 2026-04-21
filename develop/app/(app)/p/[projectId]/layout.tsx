// Project 스코프 검증 레이어 (Server Component).
// - 공통 chrome(Sidebar + TopHeader + main)은 (app)/layout.tsx에서 마운트.
// - 여기선 Project 존재·소유권만 검증하고 LastLocationTracker를 띄운다.
// - getProject는 React.cache로 래핑되어 있어 page에서 다시 호출해도 중복 쿼리 없음 (ADR-0007).

import { notFound } from 'next/navigation'

import { LastLocationTracker } from '@/components/app-shell/last-location-tracker'
import { getRequiredSession } from '@/lib/auth-session'
import { getProject } from '@/lib/queries/project'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { user } = await getRequiredSession()

  const project = await getProject(projectId)
  if (!project || project.userId !== user.id) {
    notFound()
  }

  return (
    <>
      {children}
      <LastLocationTracker projectId={projectId} />
    </>
  )
}
