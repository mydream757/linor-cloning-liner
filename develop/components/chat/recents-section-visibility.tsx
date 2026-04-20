'use client'

// "최근 기록" 섹션은 Liner 뷰 활성 시에만 표시. Write/Scholar 뷰에서는 숨김.
// 디자인: design/features/3-liner.md §2-6 "최근 기록 섹션" + §5 Q3 재해소.

import { usePathname } from 'next/navigation'

export function RecentsSectionVisibility({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // /p/[projectId]/[view]/... 의 3번째 세그먼트가 view
  const segments = pathname.split('/').filter(Boolean)
  const isLinerView = segments[2] === 'liner'
  if (!isLinerView) return null
  return <>{children}</>
}
