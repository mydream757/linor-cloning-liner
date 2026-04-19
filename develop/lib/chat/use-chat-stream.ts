// SSE 스트리밍 소비 훅 — fetch + ReadableStream 기반.
// EventSource는 GET만 지원하므로 POST body가 필요한 채팅에 부적합 (Q6 해소).

'use client'

import { useCallback, useRef, useState } from 'react'

import type { Citation, SSEEvent } from '@/lib/chat/sse-types'

export interface StreamingMessage {
  id: string
  content: string
  citations: Citation[]
}

interface UseChatStreamOptions {
  chatId: string
  onStreamEnd?: (message: StreamingMessage) => void
}

interface UseChatStreamReturn {
  /** 현재 스트리밍 중인 어시스턴트 메시지 */
  streamingMessage: StreamingMessage | null
  /** 스트리밍 진행 중 여부 */
  isStreaming: boolean
  /** 에러 상태 */
  error: { message: string; retryable: boolean } | null
  /** 메시지 전송 + 스트리밍 시작 */
  sendMessage: (content: string) => Promise<void>
  /** 스트리밍 중단 */
  abort: () => void
}

export function useChatStream({ chatId, onStreamEnd }: UseChatStreamOptions): UseChatStreamReturn {
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsStreaming(false)
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    // 이전 스트림 정리
    abortControllerRef.current?.abort()
    setError(null)
    setIsStreaming(true)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // ReadableStream 기반 SSE 파싱
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentMessage: StreamingMessage | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE 이벤트 파싱: "data: {...}\n\n" 단위로 분리
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? '' // 마지막 불완전 청크는 버퍼에 유지

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const jsonStr = trimmed.slice(6) // "data: " 제거
          let event: SSEEvent
          try {
            event = JSON.parse(jsonStr) as SSEEvent
          } catch {
            continue
          }

          switch (event.type) {
            case 'stream_start':
              currentMessage = { id: event.messageId, content: '', citations: [] }
              setStreamingMessage(currentMessage)
              break

            case 'text_delta':
              if (currentMessage) {
                currentMessage = {
                  id: currentMessage.id,
                  content: currentMessage.content + event.text,
                  citations: currentMessage.citations,
                }
                setStreamingMessage(currentMessage)
              }
              break

            case 'stream_end':
              if (currentMessage) {
                const finalMessage: StreamingMessage = {
                  id: event.messageId,
                  content: event.content,
                  citations: event.citations,
                }
                setStreamingMessage(null)
                setIsStreaming(false)
                onStreamEnd?.(finalMessage)
              }
              break

            case 'stream_error':
              setError({ message: event.error, retryable: event.retryable })
              setStreamingMessage(null)
              setIsStreaming(false)
              break
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 사용자가 중단 — 에러 아님. 수신분은 이미 state에 반영됨.
        setIsStreaming(false)
        setStreamingMessage(null)
        return
      }

      setError({
        message: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
        retryable: true,
      })
      setStreamingMessage(null)
      setIsStreaming(false)
    } finally {
      abortControllerRef.current = null
    }
  }, [chatId, onStreamEnd])

  return { streamingMessage, isStreaming, error, sendMessage, abort }
}
