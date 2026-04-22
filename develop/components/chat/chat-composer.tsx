'use client'

// 입력카드 — textarea (auto-height) + 전송/중단 버튼 + Reference 첨부.
// 디자인: design/features/3-liner.md §2-1/§2-3 입력카드 + design/features/4-asset.md §2-6 Reference 선택.

import type { Asset } from '@prisma/client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ReferenceAttachPopover } from './reference-attach-popover'

interface Props {
  onSend: (content: string, options?: { referenceAssetIds?: string[] }) => void
  onStop?: () => void
  isStreaming?: boolean
  disabled?: boolean
  autoFocus?: boolean
  // D6: Reference 첨부 대상 목록. 현재 Chat scope(Project or 미할당)의 Reference들.
  // 제공되지 않으면 + 버튼이 숨겨진다 (EmptyComposer 첫 진입 등).
  references?: Asset[]
}

const MAX_HEIGHT_PX = 200

export function ChatComposer({
  onSend,
  onStop,
  isStreaming,
  disabled,
  autoFocus,
  references,
}: Props) {
  const [value, setValue] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [popoverOpen, setPopoverOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const attachBtnRef = useRef<HTMLButtonElement>(null)

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

  const refById = useMemo(() => {
    const map = new Map<string, Asset>()
    for (const r of references ?? []) map.set(r.id, r)
    return map
  }, [references])

  const selectedRefs = useMemo(
    () => selectedIds.map((id) => refById.get(id)).filter((r): r is Asset => Boolean(r)),
    [selectedIds, refById],
  )

  const canSend = value.trim().length > 0 && !disabled && !isStreaming

  const handleSend = useCallback(() => {
    if (!canSend) return
    onSend(value.trim(), {
      referenceAssetIds: selectedIds.length > 0 ? selectedIds : undefined,
    })
    setValue('')
    setSelectedIds([])
  }, [canSend, onSend, value, selectedIds])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleRef = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const removeRef = (id: string) =>
    setSelectedIds((prev) => prev.filter((x) => x !== id))

  return (
    <div className="flex w-full flex-col gap-2 rounded-[28px] border border-border-subtle bg-bg-primary px-3 py-2.5">
      {/* 선택된 Reference 칩 */}
      {selectedRefs.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-1">
          {selectedRefs.map((ref) => (
            <span
              key={ref.id}
              className="flex h-7 items-center gap-1 rounded-full bg-bg-badge px-2.5 text-[13px] text-text-primary"
            >
              <span className="max-w-[200px] truncate">{ref.title}</span>
              <button
                type="button"
                onClick={() => removeRef(ref.id)}
                aria-label={`${ref.title} 제거`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-text-secondary hover:text-text-primary"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

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
      <div className="flex items-center justify-between">
        {/* 왼쪽: Reference 첨부 버튼 (references prop 있을 때만) */}
        {references !== undefined ? (
          <button
            ref={attachBtnRef}
            type="button"
            onClick={() => setPopoverOpen((v) => !v)}
            aria-label="Reference 첨부"
            aria-expanded={popoverOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-normal text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : (
          <span />
        )}

        {/* 오른쪽: 전송/중단 버튼 */}
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

      {references !== undefined ? (
        <ReferenceAttachPopover
          open={popoverOpen}
          onClose={() => setPopoverOpen(false)}
          anchorRef={attachBtnRef}
          references={references}
          selectedIds={selectedIds}
          onToggle={toggleRef}
        />
      ) : null}
    </div>
  )
}
