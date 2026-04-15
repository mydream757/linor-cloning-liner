'use client'

// 뷰 전환 pill 토글 (Client Component — usePathname으로 활성 상태 계산 필요).
// - 원본 Scholar의 pill 스타일을 차용(디자인 명세 + ADR-0003).
// - 상위 뷰 토글은 우리 앱의 발명. 3개 뷰(Liner / Write / Scholar) 중 하나가 활성.
// - 키보드 포커스는 전역 focus ring이 처리.

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const VIEWS = [
  { key: 'liner', label: 'Liner' },
  { key: 'write', label: 'Write' },
  { key: 'scholar', label: 'Scholar' },
] as const

type ViewKey = (typeof VIEWS)[number]['key']

function getActiveView(pathname: string): ViewKey | null {
  for (const { key } of VIEWS) {
    if (pathname.endsWith(`/${key}`)) return key
  }
  return null
}

export function ViewToggle({ currentProjectId }: { currentProjectId: string }) {
  const pathname = usePathname()
  const active = getActiveView(pathname)

  return (
    <nav
      className="flex items-center gap-1 rounded-[var(--radius-lg)] bg-surface-overlay p-1"
      aria-label="뷰 전환"
    >
      {VIEWS.map(({ key, label }) => {
        const isActive = active === key
        return (
          <Link
            key={key}
            href={`/p/${currentProjectId}/${key}`}
            aria-current={isActive ? 'page' : undefined}
            className={`flex h-7 items-center rounded-[var(--radius-md)] px-3 text-[13px] transition-colors ${
              isActive
                ? 'bg-bg-active-strong text-text-primary shadow'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
