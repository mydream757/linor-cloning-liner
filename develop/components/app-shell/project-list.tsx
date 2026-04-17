// Project 목록 (Server Component).
// - listProjectsByUser는 React.cache 래핑. layout/page에서 다시 불러도 dedupe (ADR-0007).
// - 데이터 fetch는 서버에서, 인터랙티브 렌더는 <ProjectListClient />로 위임 (ADR-0010).

import { ProjectListClient } from '@/components/app-shell/project-list-client'
import { getRequiredSession } from '@/lib/auth-session'
import { listProjectsByUser } from '@/lib/queries/project'

export async function ProjectList({
  currentProjectId,
}: {
  currentProjectId: string
}) {
  const { user } = await getRequiredSession()
  const projects = await listProjectsByUser(user.id)

  if (projects.length === 0) {
    return (
      <p className="px-2 py-2 text-xs text-text-tertiary">
        아직 Project가 없어요
      </p>
    )
  }

  return <ProjectListClient projects={projects} currentProjectId={currentProjectId} />
}
