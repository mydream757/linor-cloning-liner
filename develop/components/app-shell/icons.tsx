// 사이드바·버튼 등에서 재사용할 인라인 SVG 아이콘.
// lucide-react 의존성을 추가하지 않고 필요한 path만 직접 렌더한다 (MIT 라이선스).

type IconProps = {
  className?: string
  'aria-hidden'?: boolean
}

export function FilesIcon({ className, ...rest }: IconProps) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={rest['aria-hidden'] ?? true}
    >
      <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
      <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z" />
      <path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" />
    </svg>
  )
}
