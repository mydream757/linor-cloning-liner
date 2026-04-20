'use client'

// Chat 대화 화면의 클라이언트 최상위.
// - useChatStream으로 SSE 스트리밍 소비
// - 사용자 메시지는 낙관적으로 local state에 추가
// - 스트리밍 종료 시 어시스턴트 메시지를 local state에 append
// - 빈 상태에서 넘어온 직후 sessionStorage의 pending 메시지가 있으면 한 번 자동 발사

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { ClientMessage } from '@/lib/chat/message-types'
import type { Citation } from '@/lib/chat/sse-types'
import { useChatStream } from '@/lib/chat/use-chat-stream'

import { ChatComposer } from './chat-composer'
import { CitationPanel } from './citation-panel'
import { ErrorMessage } from './error-message'
import { MessageList } from './message-list'

interface Props {
  chatId: string
  initialMessages: ClientMessage[]
}

export function ChatView({ chatId, initialMessages }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<ClientMessage[]>(initialMessages)
  const [lastUserContent, setLastUserContent] = useState<string | null>(null)
  const [activeCitations, setActiveCitations] = useState<Citation[] | null>(null)
  const pendingFiredRef = useRef(false)

  const { streamingMessage, isStreaming, error, sendMessage, abort } = useChatStream({
    chatId,
    onStreamEnd: (finalMessage) => {
      setMessages((prev) => [
        ...prev,
        {
          id: finalMessage.id,
          role: 'assistant',
          content: finalMessage.content,
          citations: finalMessage.citations,
        },
      ])
      // 사이드바(제목 자동 갱신, 최근 기록 순서) 서버 컴포넌트 다시 렌더.
      router.refresh()
    },
  })

  const handleSend = useCallback(
    (content: string) => {
      setMessages((prev) => [
        ...prev,
        { id: `tmp:${Date.now()}`, role: 'user', content },
      ])
      setLastUserContent(content)
      sendMessage(content)
    },
    [sendMessage],
  )

  useEffect(() => {
    if (pendingFiredRef.current) return
    if (typeof window === 'undefined') return
    const key = `pending:${chatId}`
    const pending = sessionStorage.getItem(key)
    if (!pending) return
    sessionStorage.removeItem(key)
    pendingFiredRef.current = true
    // setState는 effect body가 아닌 마이크로태스크에서 호출 — 커밋 후 발사
    queueMicrotask(() => handleSend(pending))
  }, [chatId, handleSend])

  const handleRetry = useCallback(() => {
    if (!lastUserContent) return
    sendMessage(lastUserContent)
  }, [lastUserContent, sendMessage])

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <MessageList
          messages={messages}
          streamingContent={streamingMessage?.content ?? null}
          onOpenCitations={(citations) => setActiveCitations(citations)}
        />
        <div className="mx-auto mb-5 flex w-full max-w-180 shrink-0 flex-col px-4 pt-3 md:px-20">
          {error && (
            <div className="mb-3 rounded-md border border-border-subtle bg-bg-primary p-3">
              <ErrorMessage
                error={error.message}
                retryable={error.retryable}
                onRetry={handleRetry}
              />
            </div>
          )}
          <ChatComposer
            onSend={handleSend}
            onStop={abort}
            isStreaming={isStreaming}
            autoFocus
          />
        </div>
      </div>
      {activeCitations ? (
        <CitationPanel
          citations={activeCitations}
          onClose={() => setActiveCitations(null)}
        />
      ) : null}
    </div>
  )
}
