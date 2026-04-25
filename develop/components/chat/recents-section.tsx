// 사이드바 "최근 기록" 섹션 — Server Component.
// - 상단: "미할당 자료" 고정 링크 (design §2-15 / 4-asset.md D7)
// - 하단: view 분기 목록 (Liner=Chat, Write=Document, 그 외 view에서는 렌더 없음)
// 디자인: design/features/3-liner.md §2-6 + 4-asset.md §2-10 / §2-15.
//
// "미할당 자료" 링크를 RecentsSectionSwitch(view 분기) 바깥에 두는 이유: references
// 뷰에서도 사이드바 진입점이 활성화 표시되어야 하는데, switch는 view가 liner/write가
// 아니면 전체 섹션을 숨긴다. 링크를 RecentsSection 상단으로 끌어올려 상시 노출한다.

import { UnassignedReferencesLink } from '@/components/app-shell/unassigned-references-link'
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

  return (
    <div className="flex flex-col gap-1">
      <UnassignedReferencesLink />
      <RecentsSectionSwitch chats={chats} documents={documents} />
    </div>
  )
}
