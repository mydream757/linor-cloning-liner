// 루트 엔트리 (/). 세 가지 경로로 분기:
//
// 1. cookie(last-project)가 유효한 Project를 가리키면 해당 Project의 마지막 뷰로 redirect
// 2. cookie가 없거나 가리키는 Project가 사라졌으면 EmptyState 렌더 (+ 있었다면 cookie 정리)
// 3. 사용자는 EmptyState의 CTA로 새 Project를 만든다 (D3 Server Action 이후 동작)
//
// ADR-0003(URL Segment 뷰 전환) · ADR-0004(cookie 기반 last-location) 참조.

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { EmptyState } from '@/components/app-shell/empty-state'
import { getDevUser } from '@/lib/dev-user'
import { getProject } from '@/lib/queries/project'

const VALID_VIEWS = ['liner', 'write', 'scholar'] as const
type View = (typeof VALID_VIEWS)[number]

function isValidView(value: string | undefined): value is View {
  return typeof value === 'string' && (VALID_VIEWS as readonly string[]).includes(value)
}

export default async function RootPage() {
  // 기능 2(NextAuth) 통합 전에는 임시 dev user로 소유권 확인.
  const devUser = await getDevUser()

  const cookieStore = await cookies()
  const lastProjectId = cookieStore.get('last-project')?.value
  const lastViewRaw = cookieStore.get('last-view')?.value
  const lastView: View = isValidView(lastViewRaw) ? lastViewRaw : 'liner'

  if (lastProjectId) {
    const project = await getProject(lastProjectId)
    if (project && project.userId === devUser.id) {
      redirect(`/p/${project.id}/${lastView}`)
    }
    // cookie가 가리키는 Project가 없거나 다른 user 소유 → 정리는 D3(Server Action)에서.
    // 현재는 EmptyState로 fallback.
  }

  return <EmptyState />
}
