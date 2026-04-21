'use client'

// 뷰 전환 pill 토글 (Client Component — usePathname으로 활성 상태 계산).
// - 원본 Scholar의 pill 스타일을 차용(디자인 명세 + ADR-0003).
// - 3개 뷰(Liner / Write / Scholar) 중 하나가 활성. Project 스코프는 모두 가능,
//   미할당 스코프는 Scholar 비활성(Project 필수).
// - 현재 projectId·view는 pathname에서 파싱.

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const VIEWS = [
  { key: 'liner', label: 'Liner', projectRequired: false },
  { key: 'write', label: 'Write', projectRequired: false },
  { key: 'scholar', label: 'Scholar', projectRequired: true },
] as const

type ViewKey = (typeof VIEWS)[number]['key']

function parsePath(pathname: string): { projectId: string | null; view: ViewKey | null } {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] === 'p' && segments[1]) {
    // /p/[projectId]/[view]/... — segments: ['p', projectId, view, ...]
    const view = segments[2]
    return {
      projectId: segments[1] ?? null,
      view: (VIEWS.some((v) => v.key === view) ? view : null) as ViewKey | null,
    }
  }
  // 미할당: /[view]/...
  const view = segments[0]
  return {
    projectId: null,
    view: (VIEWS.some((v) => v.key === view) ? view : null) as ViewKey | null,
  }
}

function hrefFor(view: ViewKey, projectId: string | null): string {
  if (projectId) return `/p/${projectId}/${view}`
  return `/${view}`
}

export function ViewToggle() {
  const pathname = usePathname()
  const { projectId, view: active } = parsePath(pathname)

  return (
    <nav
      className="flex items-center gap-1 rounded-lg bg-surface-overlay p-1"
      aria-label="뷰 전환"
    >
      {VIEWS.map(({ key, label, projectRequired }) => {
        const isActive = active === key
        const disabled = projectRequired && !projectId
        if (disabled) {
          return (
            <span
              key={key}
              aria-disabled="true"
              title="Project를 선택해야 사용할 수 있습니다"
              className="flex h-7 items-center rounded-md px-3 text-[13px] text-text-tertiary opacity-50"
            >
              {label}
            </span>
          )
        }
        return (
          <Link
            key={key}
            href={hrefFor(key, projectId)}
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
