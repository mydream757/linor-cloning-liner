'use client'

// "최근 기록" 섹션 — 활성 뷰에 따라 Chat 목록(Liner) 또는 Document 목록(Write)을 보여준다.
// 디자인: design/features/4-asset.md §2-10 — Write 뷰 사이드바의 "최근 기록" 재사용 방향.
// Scholar 뷰와 기타에서는 표시하지 않는다.

import type { Asset, Chat } from '@prisma/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ChatListClient } from '@/components/chat/chat-list-client'

interface Props {
  chats: Chat[]
  documents: Asset[]
}

export function RecentsSectionSwitch({ chats, documents }: Props) {
  const pathname = usePathname()
  // /p/[projectId]/[view]/... 또는 /[view]/... 의 view segment 추출
  const segments = pathname.split('/').filter(Boolean)
  const view = segments[0] === 'p' ? segments[2] : segments[0]

  if (view !== 'liner' && view !== 'write') return null

  return (
    <div className="flex flex-col gap-1">
      <div className="px-2 py-1 text-xs uppercase tracking-wide text-text-secondary">
        최근 기록
      </div>
      {view === 'liner' ? (
        <ChatListClient chats={chats} />
      ) : (
        <DocumentSidebarList documents={documents} />
      )}
    </div>
  )
}

function DocumentSidebarList({ documents }: { documents: Asset[] }) {
  const pathname = usePathname()
  const currentDocId = pathname.match(/\/write\/d\/([^/]+)/)?.[1] ?? null

  if (documents.length === 0) {
    return <p className="px-2 py-2 text-xs text-text-tertiary">아직 문서가 없어요</p>
  }

  return (
    <ul className="flex flex-col gap-1">
      {documents.map((doc) => {
        const href = doc.projectId
          ? `/p/${doc.projectId}/write/d/${doc.id}`
          : `/write/d/${doc.id}`
        const isActive = doc.id === currentDocId
        return (
          <li key={doc.id}>
            <Link
              href={href}
              title={doc.title}
              className={`flex h-8 items-center rounded-md px-2 text-[13px] text-text-primary hover:bg-bg-hover ${
                isActive ? 'bg-bg-active-subtle font-semibold' : ''
              }`}
            >
              <span className="truncate">{doc.title}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
