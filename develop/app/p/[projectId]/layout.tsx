// Project 스코프 공유 레이아웃.
// - 현재 Project를 검증하고 (없으면 404), 사이드바·상단 헤더를 래핑한다.
// - 하위 page(liner/write/scholar)는 메인 패널에 들어간다.
// - getProject는 React.cache로 래핑되어 있어 page에서 다시 호출해도 중복 쿼리 없음 (ADR-0007).

import { notFound } from 'next/navigation'

import { Sidebar } from '@/components/app-shell/sidebar'
import { TopHeader } from '@/components/app-shell/top-header'
import { getDevUser } from '@/lib/dev-user'
import { getProject } from '@/lib/queries/project'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const devUser = await getDevUser()

  const project = await getProject(projectId)
  if (!project || project.userId !== devUser.id) {
    notFound()
  }

  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar currentProjectId={projectId} />
      <div className="flex flex-1 flex-col min-w-0">
        <TopHeader currentProjectId={projectId} />
        <main className="flex-1 min-h-0 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
