// 미할당 Liner 뷰 빈 상태 (/liner).
// Project 스코프의 /p/[projectId]/liner와 달리 "최근 Chat 자동 redirect"는 하지 않는다 —
// 미할당 진입점은 항상 새 Chat 시작 의도로 해석한다.
// design/features/4-asset.md §2-1.

import { EmptyComposer } from '@/components/chat/empty-composer'
import { getRequiredSession } from '@/lib/auth-session'

export default async function UnassignedLinerPage() {
  // 인증은 (app)/layout.tsx에서 보장되지만 서버 컴포넌트 컨벤션 유지.
  await getRequiredSession()

  return <EmptyComposer projectId={null} />
}
