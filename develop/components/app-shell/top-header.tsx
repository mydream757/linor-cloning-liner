// 상단 헤더 (Server Component). 구조만 담당.
// - 높이 48px, 아래에 얇은 구분선(color-border-subtle).
// - 중앙에 뷰 전환 pill 토글(<ViewToggle />, client). ViewToggle이 usePathname으로
//   현재 projectId·view를 자체 파싱 — projectId prop 없음.
// - 디자인: design/features/1-app-shell.md 상단 헤더 섹션.

import { ViewToggle } from '@/components/app-shell/view-toggle'

export function TopHeader() {
  return (
    <header className="relative flex h-12 shrink-0 items-center justify-center border-b border-border-subtle bg-bg-primary">
      <ViewToggle />
    </header>
  )
}
