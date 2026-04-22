'use client'

// Reference 선택 팝오버 — 입력카드의 + 버튼 클릭 시 펼침.
// 디자인: design/features/4-asset.md §2-6.
// Portal로 뷰포트 기준 렌더 (sticky 입력카드 z-index/좌표 충돌 방지 — D3 Developer 참고사항).

import type { Asset } from '@prisma/client'
import { useEffect, useMemo, useRef, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
  references: Asset[]
  selectedIds: string[]
  onToggle: (id: string) => void
}

export function ReferenceAttachPopover({
  open,
  onClose,
  anchorRef,
  references,
  selectedIds,
  onToggle,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState<{ bottom: number; left: number } | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return references
    return references.filter((r) => r.title.toLowerCase().includes(q))
  }, [references, query])

  // 외부 클릭·Esc으로 닫기
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current?.contains(e.target as Node)) return
      if (anchorRef.current?.contains(e.target as Node)) return
      onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose, anchorRef])

  // 앵커 버튼 위치 기준으로 팝오버 좌표 계산 (뷰포트 고정)
  useEffect(() => {
    if (!open) return
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    setPosition({
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left,
    })
  }, [open, anchorRef])

  if (!open || !position) return null

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', bottom: position.bottom, left: position.left, zIndex: 50 }}
      className="flex w-[320px] max-h-[300px] flex-col gap-2 rounded-lg border border-border-subtle bg-bg-secondary p-2 shadow-dialog"
    >
      {references.length === 0 ? (
        <p className="px-2 py-4 text-center text-caption text-text-tertiary">
          저장된 Reference가 없습니다
        </p>
      ) : (
        <>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="Reference 제목 검색"
            className="h-8 rounded-md bg-bg-primary px-2 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <ul className="flex flex-1 flex-col overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-2 py-3 text-center text-caption text-text-tertiary">
                일치하는 Reference 없음
              </li>
            ) : (
              filtered.map((ref) => {
                const checked = selectedIds.includes(ref.id)
                return (
                  <li key={ref.id}>
                    <label
                      className={`flex h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] text-text-primary hover:bg-bg-hover ${
                        checked ? 'bg-bg-active-subtle' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(ref.id)}
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="truncate">{ref.title}</span>
                    </label>
                  </li>
                )
              })
            )}
          </ul>
        </>
      )}
    </div>
  )
}
