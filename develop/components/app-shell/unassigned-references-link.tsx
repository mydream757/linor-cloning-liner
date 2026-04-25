'use client'

// 사이드바 "최근 기록" 섹션 최상단에 고정되는 "미할당 자료" 링크.
// design/features/4-asset.md §2-15 — references view에서도 진입점이 보이도록
// RecentsSectionSwitch의 view 분기와 무관하게 RecentsSection(server)에서 항상 렌더한다.

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { FilesIcon } from '@/components/app-shell/icons'

export function UnassignedReferencesLink() {
  const pathname = usePathname()
  const isActive = pathname === '/references'

  return (
    <Link
      href="/references"
      aria-current={isActive ? 'page' : undefined}
      className={`flex h-8 items-center gap-2 rounded-md px-2 text-[13px] text-text-secondary hover:bg-bg-hover hover:text-text-primary ${
        isActive ? 'bg-bg-active-subtle font-medium text-text-primary' : ''
      }`}
    >
      <FilesIcon />
      <span>미할당 자료</span>
    </Link>
  )
}
