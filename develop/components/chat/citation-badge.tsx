// 어시스턴트 응답 본문에 인라인 렌더되는 [n] 배지.
// 디자인: design/features/3-liner.md §2-7. 개별 배지 클릭은 반응 없음 — 출처 진입은
// 응답 하단 "N개의 출처" 버튼에서만.

export function CitationBadge({ n }: { n: number }) {
  return (
    <span
      aria-label={`출처 ${n}`}
      className="mx-0.5 inline-flex h-4 min-w-[16px] cursor-default items-center justify-center rounded-md bg-bg-badge px-1 align-[2px] text-[11px] font-medium leading-none text-text-secondary"
    >
      {n}
    </span>
  )
}
