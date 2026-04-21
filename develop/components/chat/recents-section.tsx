// 사이드바 "최근 기록" 섹션 — Server Component.
// - Liner 뷰: user의 cross-project 최신 Chat N개
// - Write 뷰: user의 cross-project 최신 Document N개
// 데이터는 서버에서 둘 다 미리 로드하고, 표시 분기는 RecentsSectionSwitch(client)가 담당.
// 디자인: design/features/3-liner.md §2-6 + 4-asset.md §2-10.
//
// Chat 생성은 Project 항목의 "+" 버튼이 담당한다 (in-project). 기능 4 D4에서
// 미할당 Chat 지원과 함께 별도 "+ 새 대화" 버튼이 복귀한다.

import { RecentsSectionSwitch } from '@/components/chat/recents-section-switch'
import { getRequiredSession } from '@/lib/auth-session'
import { listRecentDocumentsByUser } from '@/lib/queries/asset'
import { listRecentChatsByUser } from '@/lib/queries/chat'

export async function RecentsSection() {
  const { user } = await getRequiredSession()
  const [chats, documents] = await Promise.all([
    listRecentChatsByUser(user.id, 10),
    listRecentDocumentsByUser(user.id, 10),
  ])

  return <RecentsSectionSwitch chats={chats} documents={documents} />
}
