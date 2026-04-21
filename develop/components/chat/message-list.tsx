'use client'

// 메시지 목록 — 스크롤 가능 + 자동 스크롤 제어.
// 사용자가 수동으로 스크롤 업하면 자동 스크롤 해제, 하단 근처 복귀하면 재개.

import { useEffect, useRef, useState } from 'react'

import type { ClientMessage } from '@/lib/chat/message-types'
import type { Citation } from '@/lib/chat/sse-types'

import { AssistantMessage } from './assistant-message'
import { UserBubble } from './user-bubble'

interface Props {
  messages: ClientMessage[]
  // 단일 Chat 재료 지름길에서 sourceChatIds=[chatId]로 사용.
  chatId: string
  // 생성 후 Write 뷰로 이동할 때 사용. 미할당 Chat(D4 이후)은 null.
  projectId: string | null
  streamingContent?: string | null
  onOpenCitations?: (citations: Citation[]) => void
}

const AUTO_SCROLL_THRESHOLD_PX = 80

export function MessageList({ messages, chatId, projectId, streamingContent, onOpenCitations }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (!autoScroll) return
    const el = containerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, streamingContent, autoScroll])

  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    const atBottom =
      el.scrollHeight - (el.scrollTop + el.clientHeight) < AUTO_SCROLL_THRESHOLD_PX
    setAutoScroll(atBottom)
  }

  const lastMessageRole = messages[messages.length - 1]?.role

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      className="flex-1 overflow-y-auto"
    >
      <div className="mx-auto flex w-full max-w-180 flex-col px-4 pt-8 md:px-20">
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const marginTop = !prev ? '' : prev.role !== m.role ? 'mt-6' : 'mt-3'
          return (
            <div key={m.id} className={marginTop}>
              {m.role === 'user' ? (
                <UserBubble content={m.content} />
              ) : (
                <AssistantMessage
                  messageId={m.id}
                  content={m.content}
                  citations={m.citations}
                  projectId={projectId}
                  chatId={chatId}
                  onOpenCitations={onOpenCitations}
                />
              )}
            </div>
          )
        })}
        {streamingContent !== null && streamingContent !== undefined && (
          <div className={lastMessageRole === 'assistant' ? 'mt-3' : 'mt-6'}>
            <AssistantMessage content={streamingContent} />
          </div>
        )}
      </div>
    </div>
  )
}
