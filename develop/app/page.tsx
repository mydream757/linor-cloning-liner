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
import { getProject, listProjectsByUser } from '@/lib/queries/project'

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

  // 1순위: cookie가 유효한 Project를 가리키면 그 뷰로 redirect
  if (lastProjectId) {
    const project = await getProject(lastProjectId)
    if (project && project.userId === devUser.id) {
      redirect(`/p/${project.id}/${lastView}`)
    }
    // cookie가 stale(프로젝트 없음/다른 user). cookie 정리는 D3 Server Action에서.
    // 다음 단계의 fallback이 첫 Project로 보내고, 그곳의 LastLocationTracker가
    // 쿠키를 자연스럽게 덮어쓴다.
  }

  // 2순위: cookie는 없거나 stale이지만 사용자가 소유한 Project가 있으면 첫 Project로
  const projects = await listProjectsByUser(devUser.id)
  if (projects.length > 0) {
    redirect(`/p/${projects[0].id}/liner`)
  }

  // 3순위: Project가 하나도 없으면 EmptyState
  return <EmptyState />
}
