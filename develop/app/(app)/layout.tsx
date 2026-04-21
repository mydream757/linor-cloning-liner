// 앱 공통 chrome layout (Server Component).
// - Sidebar + TopHeader + main 패널을 한 번만 마운트한다.
// - /p/[projectId]/... (Project 스코프)와 /liner, /write (미할당) 양쪽이
//   이 layout을 공유해 뷰 전환(Liner ↔ Write) 시 사이드바가 유지된다.
// - Project 소유권 검증은 하위 p/[projectId]/layout.tsx가 담당.
// - ADR-0015: 뷰 segment 원칙의 공간 확장. Route Group (app)는 URL에 반영되지 않음.

import { Sidebar } from '@/components/app-shell/sidebar'
import { TopHeader } from '@/components/app-shell/top-header'
import { getRequiredSession } from '@/lib/auth-session'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 인증 필수. projectId 없이도 사이드바 데이터(유저의 Project 목록, 최근 Chat,
  // 최근 Document)를 로드할 수 있도록 여기서 세션을 잠그고 하위 Sidebar 컴포넌트에
  // 위임한다.
  await getRequiredSession()

  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 min-h-0 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
