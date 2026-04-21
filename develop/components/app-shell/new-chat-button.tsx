// 사이드바 전역 "+ 새 대화" 버튼.
// 기능 4 D4: 미할당 Chat 진입점 — /liner(빈 상태)로 이동. EmptyComposer가 첫 메시지
// 전송 시 createChat({ projectId: null }) 호출해 미할당 Chat 생성.
// 기능 3 D4에서 제거됐던 전역 진입점이 미할당 라우트 도입과 함께 복귀.
// 디자인: design/features/4-asset.md §2-1, measurements `04-liner-unassigned-empty`.

import Link from 'next/link'

export function NewChatButton() {
  return (
    <Link
      href="/liner"
      className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-text-primary transition-colors hover:bg-bg-hover"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M8 3v10M3 8h10"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      새 대화
    </Link>
  )
}
