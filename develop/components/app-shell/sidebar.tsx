// 사이드바 (Server Component).
// - 접힘/펼침 UI는 SidebarShell(Client)에 위임, server-first 원칙 유지.
// - D6에서 인라인 NewProjectForm → CreateProjectButton 모달 트리거로 승격.
// - 기능 2 D4: 하단 프로필 영역 추가.
// - 디자인: design/features/1-app-shell.md, design/features/2-auth.md

import { CreateProjectButton } from '@/components/app-shell/create-project-button'
import { ProfileSection } from '@/components/app-shell/profile-section'
import { ProjectList } from '@/components/app-shell/project-list'
import { SidebarShell } from '@/components/app-shell/sidebar-shell'
import { RecentsSection } from '@/components/chat/recents-section'
import { getRequiredSession } from '@/lib/auth-session'

export async function Sidebar({ currentProjectId }: { currentProjectId: string }) {
  const { user } = await getRequiredSession()

  return (
    <SidebarShell>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-2 py-1">
        <div className="mx-2">
          <CreateProjectButton className="flex h-8 w-full items-center rounded-md bg-surface-overlay px-2 text-left text-sm text-text-primary hover:opacity-90">
            + 새 Project
          </CreateProjectButton>
        </div>

        <div className="flex flex-col gap-1">
          <div className="px-2 py-1 text-xs uppercase tracking-wide text-text-secondary">
            프로젝트
          </div>
          <ProjectList currentProjectId={currentProjectId} />
        </div>

        <RecentsSection />
      </div>

      <ProfileSection user={{ name: user.name, email: user.email, image: user.image }} />
    </SidebarShell>
  )
}
