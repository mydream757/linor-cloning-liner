// Project 목록 (Server Component).
// - listProjectsWithChatsByUser는 Project + 각 Chat을 한 번에 로드 (트리 UI용).
// - 데이터 fetch는 서버에서, 인터랙티브 렌더는 <ProjectListClient />로 위임 (ADR-0010).

import { ProjectListClient } from '@/components/app-shell/project-list-client'
import { getRequiredSession } from '@/lib/auth-session'
import { listProjectsWithChatsByUser } from '@/lib/queries/project'

export async function ProjectList({
  currentProjectId,
}: {
  currentProjectId: string
}) {
  const { user } = await getRequiredSession()
  const projects = await listProjectsWithChatsByUser(user.id)

  if (projects.length === 0) {
    return (
      <p className="px-2 py-2 text-xs text-text-tertiary">
        아직 Project가 없어요
      </p>
    )
  }

  return <ProjectListClient projects={projects} currentProjectId={currentProjectId} />
}
