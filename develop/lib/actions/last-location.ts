'use server'

// 마지막 위치 기록 Server Action (ADR-0004).
// 클라이언트의 <LastLocationTracker />가 segment 변경을 감지해 fire-and-forget으로 호출.
// 실패는 조용히 삼킨다 — 비-블로킹 UX 오퍼레이션.

import { cookies } from 'next/headers'

const VALID_VIEWS = ['liner', 'write', 'scholar'] as const
type View = (typeof VALID_VIEWS)[number]

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function isValidView(value: string): value is View {
  return (VALID_VIEWS as readonly string[]).includes(value)
}

export async function setLastLocation(projectId: string, view: string) {
  if (!projectId || !isValidView(view)) return

  const cookieStore = await cookies()
  const options = {
    path: '/',
    sameSite: 'lax' as const,
    httpOnly: true,
    maxAge: ONE_YEAR_SECONDS,
  }
  cookieStore.set('last-project', projectId, options)
  cookieStore.set('last-view', view, options)
}
