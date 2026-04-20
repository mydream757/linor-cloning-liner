// 인라인 에러 표시 + "다시 시도" 버튼. 디자인: design/features/3-liner.md §2-4.

export function ErrorMessage({
  error,
  retryable,
  onRetry,
}: {
  error: string
  retryable: boolean
  onRetry?: () => void
}) {
  return (
    <div className="flex items-start gap-2 text-text-secondary">
      <span aria-hidden>⚠</span>
      <div className="flex-1">
        <p className="text-body mb-2">{error}</p>
        {retryable && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-border-subtle px-3 py-1 text-caption text-text-primary hover:bg-bg-hover"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  )
}
