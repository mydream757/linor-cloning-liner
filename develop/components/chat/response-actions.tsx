// 어시스턴트 응답 하단 액션바 — 현재는 "N개의 출처" 버튼만 포함.
// 복사/좋아요/싫어요 등 stub 아이콘은 D6 정리 단계에서 시각만 추가 예정.
// 디자인: design/features/3-liner.md §2-2 응답 액션바.

interface Props {
  count: number
  onOpenCitations: () => void
}

export function ResponseActions({ count, onOpenCitations }: Props) {
  if (count === 0) return null

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        onClick={onOpenCitations}
        className="flex h-7 items-center gap-1.5 rounded-md px-2 text-caption text-text-secondary hover:bg-bg-hover hover:text-text-primary"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect
            x="2.5"
            y="3"
            width="11"
            height="10"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <line x1="5" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="5" y1="8.5" x2="11" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="5" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        {count}개의 출처
      </button>
    </div>
  )
}
