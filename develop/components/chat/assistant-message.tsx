// 어시스턴트 메시지 — 배경 없이 본문 + 마크다운 렌더.
// 디자인: design/features/3-liner.md §2-2 어시스턴트 메시지.
// 출처 배지 [n] 파싱·인터랙션은 D5에서 추가.

import ReactMarkdown from 'react-markdown'

export function AssistantMessage({ content }: { content: string }) {
  return (
    <div className="text-text-primary">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="text-body mb-3 last:mb-0">{children}</p>,
          h1: ({ children }) => (
            <h1 className="text-heading-1 mb-4 mt-6 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-heading-2 mb-3 mt-6 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-heading-2 mb-3 mt-5 first:mt-0">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="text-body mb-3 list-disc space-y-1 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="text-body mb-3 list-decimal space-y-1 pl-6">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          code: ({ children }) => (
            <code className="rounded bg-bg-secondary px-1 py-0.5 font-mono text-[13px]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-md bg-bg-secondary p-4 font-mono text-[13px]">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
