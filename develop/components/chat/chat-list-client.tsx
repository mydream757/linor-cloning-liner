'use client'

// Chat 목록의 클라이언트 래퍼 — Project 트리 하위·"최근 기록" 양쪽에서 재사용.
// 중앙 집중 editingId(한 번에 하나의 Chat만 rename 모드) + 현재 URL 기반 active 판정.

import type { Chat } from '@prisma/client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { ChatItem } from './chat-item'

export function ChatListClient({ chats }: { chats: Chat[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const pathname = usePathname()
  const currentChatId = pathname.match(/\/liner\/c\/([^/]+)/)?.[1] ?? null

  if (chats.length === 0) {
    return (
      <p className="px-2 py-2 text-xs text-text-tertiary">
        아직 대화가 없어요
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {chats.map((chat) => (
        <li key={chat.id}>
          <ChatItem
            chat={chat}
            isActive={chat.id === currentChatId}
            isEditing={editingId === chat.id}
            onStartEdit={() => setEditingId(chat.id)}
            onStopEdit={() => setEditingId(null)}
          />
        </li>
      ))}
    </ul>
  )
}
