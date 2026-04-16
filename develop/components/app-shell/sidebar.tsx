// 사이드바 (Server Component).
// - 접힘/펼침 UI는 SidebarShell(Client)에 위임, server-first 원칙 유지.
// - D6에서 인라인 NewProjectForm → CreateProjectButton 모달 트리거로 승격.
// - 디자인: design/features/1-app-shell.md

import { CreateProjectButton } from '@/components/app-shell/create-project-button'
import { ProjectList } from '@/components/app-shell/project-list'
import { SidebarShell } from '@/components/app-shell/sidebar-shell'

export function Sidebar({ currentProjectId }: { currentProjectId: string }) {
  return (
    <SidebarShell>
      <div className="flex flex-col gap-3 px-2 py-1">
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
      </div>
    </SidebarShell>
  )
}
