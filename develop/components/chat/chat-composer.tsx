'use client'

// 입력카드 — textarea (auto-height) + 전송/중단 버튼.
// 디자인: design/features/3-liner.md §2-1/§2-3 입력카드 + 스트리밍 중 상태.

import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  onSend: (content: string) => void
  onStop?: () => void
  isStreaming?: boolean
  disabled?: boolean
  autoFocus?: boolean
}

const MAX_HEIGHT_PX = 200

export function ChatComposer({ onSend, onStop, isStreaming, disabled, autoFocus }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current && !isStreaming) {
      textareaRef.current.focus()
    }
  }, [autoFocus, isStreaming])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT_PX) + 'px'
  }, [value])

  const canSend = value.trim().length > 0 && !disabled && !isStreaming

  const handleSend = useCallback(() => {
    if (!canSend) return
    onSend(value.trim())
    setValue('')
  }, [canSend, onSend, value])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-[28px] border border-border-subtle bg-bg-primary px-3 py-2.5">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder="무엇이든 물어보세요"
        rows={1}
        disabled={disabled || isStreaming}
        aria-label="메시지 입력"
        className="chat-textarea text-body text-text-primary placeholder:text-text-tertiary max-h-[200px] min-h-[32px] resize-none bg-transparent px-2 py-1 outline-none disabled:opacity-50"
      />
      <div className="flex justify-end">
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="응답 중단"
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-primary hover:bg-bg-hover"
          >
            <span className="block h-3 w-3 rounded-sm bg-text-primary" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="전송"
            className={
              'flex h-10 w-10 items-center justify-center rounded-full transition-colors ' +
              (canSend
                ? 'bg-primary text-text-primary hover:opacity-90'
                : 'text-text-tertiary cursor-not-allowed')
            }
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M10 4v12M4 10l6-6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
