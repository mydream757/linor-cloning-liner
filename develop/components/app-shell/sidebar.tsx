// 사이드바 (Server Component).
// - 접힘/펼침 UI는 SidebarShell(Client)에 위임, server-first 원칙 유지.
// - 이 컴포넌트는 data fetch 의존 컴포넌트들(NewProjectForm, ProjectList)을
//   children으로 SidebarShell에 전달하는 구조적 역할만 한다.
// - 디자인: design/features/1-app-shell.md

import { NewProjectForm } from '@/components/app-shell/new-project-form'
import { ProjectList } from '@/components/app-shell/project-list'
import { SidebarShell } from '@/components/app-shell/sidebar-shell'

export function Sidebar({ currentProjectId }: { currentProjectId: string }) {
  return (
    <SidebarShell>
      <div className="flex flex-col gap-3 px-2 py-1">
        <div className="mx-2">
          <NewProjectForm />
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
