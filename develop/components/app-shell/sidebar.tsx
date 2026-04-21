// 사이드바 (Server Component).
// - 접힘/펼침 UI는 SidebarShell(Client)에 위임, server-first 원칙 유지.
// - currentProjectId prop을 폐지 — 하위 클라이언트 컴포넌트가 usePathname으로
//   현재 경로의 project·view·chat·document를 직접 파싱한다. Project 스코프와
//   미할당 스코프 양쪽이 같은 사이드바를 공유하도록 함.
// - 기능 4 D4: 전역 "+ 새 대화" 버튼은 Phase B에서 추가.
// - 디자인: design/features/1-app-shell.md, design/features/2-auth.md, 4-asset.md

import { CreateProjectButton } from '@/components/app-shell/create-project-button'
import { NewChatButton } from '@/components/app-shell/new-chat-button'
import { ProfileSection } from '@/components/app-shell/profile-section'
import { ProjectList } from '@/components/app-shell/project-list'
import { SidebarShell } from '@/components/app-shell/sidebar-shell'
import { RecentsSection } from '@/components/chat/recents-section'
import { getRequiredSession } from '@/lib/auth-session'

export async function Sidebar() {
  const { user } = await getRequiredSession()

  return (
    <SidebarShell>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-2 py-1">
        <div className="mx-2 flex flex-col gap-1">
          <NewChatButton />
          <CreateProjectButton className="flex h-8 w-full items-center rounded-md px-2 text-left text-sm text-text-primary transition-colors hover:bg-bg-hover">
            + 새 Project
          </CreateProjectButton>
        </div>

        <div className="flex flex-col gap-1">
          <div className="px-2 py-1 text-xs uppercase tracking-wide text-text-secondary">
            프로젝트
          </div>
          <ProjectList />
        </div>

        <RecentsSection />
      </div>

      <ProfileSection user={{ name: user.name, email: user.email, image: user.image }} />
    </SidebarShell>
  )
}
