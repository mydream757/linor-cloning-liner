'use client'

// 메시지 목록 — 스크롤 가능 + 자동 스크롤 제어.
// 사용자가 수동으로 스크롤 업하면 자동 스크롤 해제, 하단 근처 복귀하면 재개.

import { useEffect, useRef, useState } from 'react'

import type { ClientMessage } from '@/lib/chat/message-types'

import { AssistantMessage } from './assistant-message'
import { UserBubble } from './user-bubble'

interface Props {
  messages: ClientMessage[]
  streamingContent?: string | null
}

const AUTO_SCROLL_THRESHOLD_PX = 80

export function MessageList({ messages, streamingContent }: Props) {
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
                <AssistantMessage content={m.content} />
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
