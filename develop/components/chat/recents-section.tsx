// 사이드바 "최근 기록" 섹션 — user의 cross-project 최신 Chat N개.
// 디자인: design/features/3-liner.md §2-6 "최근 기록 섹션".
// 데이터 로드는 서버에서, 표시 토글(Liner 뷰 활성)은 RecentsSectionVisibility(client)가 담당.
//
// Chat 생성은 Project 항목의 "+" 버튼이 담당한다 (in-project). 기능 4에서 미할당 Chat
// 지원과 함께 별도 "+ 새 대화" 버튼 부활 예정.

import { ChatListClient } from '@/components/chat/chat-list-client'
import { RecentsSectionVisibility } from '@/components/chat/recents-section-visibility'
import { getRequiredSession } from '@/lib/auth-session'
import { listRecentChatsByUser } from '@/lib/queries/chat'

export async function RecentsSection() {
  const { user } = await getRequiredSession()
  const chats = await listRecentChatsByUser(user.id, 10)

  return (
    <RecentsSectionVisibility>
      <div className="flex flex-col gap-1">
        <div className="px-2 py-1 text-xs uppercase tracking-wide text-text-secondary">
          최근 기록
        </div>
        <ChatListClient chats={chats} />
      </div>
    </RecentsSectionVisibility>
  )
}
