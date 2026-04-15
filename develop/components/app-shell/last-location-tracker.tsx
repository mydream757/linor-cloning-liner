'use client'

// 마지막 위치 기록 트래커. ADR-0004 "쓰기 (Server Action, 클라이언트에서 trigger)" 섹션.
// [projectId]/layout 내부에 mount 되어 segment 변경마다 cookie를 갱신한다.
// fire-and-forget — 에러는 조용히 무시 (비-블로킹 오퍼레이션).

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { setLastLocation } from '@/lib/actions/last-location'

const VIEW_SEGMENTS = ['liner', 'write', 'scholar'] as const
type View = (typeof VIEW_SEGMENTS)[number]

function extractView(pathname: string): View | null {
  for (const v of VIEW_SEGMENTS) {
    if (pathname.endsWith(`/${v}`)) return v
  }
  return null
}

export function LastLocationTracker({ projectId }: { projectId: string }) {
  const pathname = usePathname()
  const view = extractView(pathname)

  useEffect(() => {
    if (!view) return
    void setLastLocation(projectId, view)
  }, [projectId, view])

  return null
}
