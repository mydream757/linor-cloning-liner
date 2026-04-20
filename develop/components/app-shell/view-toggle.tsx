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
  // /p/[projectId]/[view] 또는 /p/[projectId]/[view]/... — 3번째 세그먼트가 view.
  const segments = pathname.split('/').filter(Boolean)
  const viewSegment = segments[2]
  for (const { key } of VIEWS) {
    if (viewSegment === key) return key
  }
  return null
}

export function ViewToggle({ currentProjectId }: { currentProjectId: string }) {
  const pathname = usePathname()
  const active = getActiveView(pathname)

  return (
    <nav
      className="flex items-center gap-1 rounded-lg bg-surface-overlay p-1"
      aria-label="뷰 전환"
    >
      {VIEWS.map(({ key, label }) => {
        const isActive = active === key
        return (
          <Link
            key={key}
            href={`/p/${currentProjectId}/${key}`}
            aria-current={isActive ? 'page' : undefined}
            aria-disabled={isActive || undefined}
            tabIndex={isActive ? -1 : undefined}
            onClick={(e) => {
              if (isActive) e.preventDefault()
            }}
            className={`flex h-7 items-center rounded-md px-3 text-[13px] transition-colors ${
              isActive
                ? 'bg-bg-active-strong text-text-primary shadow cursor-default'
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
