// 사용자 메시지 버블. 우측 정렬, 비대칭 border-radius (말풍선 꼬리 효과).
// 디자인: design/features/3-liner.md §2-2 사용자 메시지 버블.

export function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[70%] whitespace-pre-wrap break-words bg-surface-overlay text-text-primary px-4 py-2.5 text-body"
        style={{ borderRadius: '20px 0 20px 20px' }}
      >
        {content}
      </div>
    </div>
  )
}
