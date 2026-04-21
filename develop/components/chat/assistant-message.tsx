// 어시스턴트 메시지 — 배경 없이 본문 + 마크다운 렌더.
// 디자인: design/features/3-liner.md §2-2 어시스턴트 메시지.
// [n] 출처 배지는 rehypeCitationBadges 플러그인이 span[data-citation]으로 변환.
// 완료된 메시지에만 하단 액션바("N개의 출처" 버튼) 노출 — 스트리밍 중엔 citations 없음.

import ReactMarkdown from 'react-markdown'

import { rehypeCitationBadges } from '@/lib/chat/rehype-citation-badges'
import type { Citation } from '@/lib/chat/sse-types'

import { CitationBadge } from './citation-badge'
import { ResponseActions } from './response-actions'

interface Props {
  // 영속된 메시지의 ID. 스트리밍 중 또는 tmp 메시지는 undefined → 포워딩 불가.
  messageId?: string
  content: string
  citations?: Citation[]
  // 이 메시지가 이미 Document로 내보내졌으면 해당 Asset ID. null이면 아직 안 됨.
  generatedAssetId?: string | null
  // 포워딩 후 Write 뷰로 이동할 때 사용.
  projectId?: string | null
  onOpenCitations?: (citations: Citation[]) => void
}

export function AssistantMessage({
  messageId,
  content,
  citations,
  generatedAssetId = null,
  projectId = null,
  onOpenCitations,
}: Props) {
  return (
    <div className="text-text-primary">
      <ReactMarkdown
        rehypePlugins={[rehypeCitationBadges]}
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
          span: ({ children, ...props }) => {
            const citation = (props as Record<string, unknown>)['data-citation']
            if (typeof citation === 'string') {
              return <CitationBadge n={Number(citation)} />
            }
            return <span {...props}>{children}</span>
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {messageId ? (
        <ResponseActions
          messageId={messageId}
          messageContent={content}
          citationCount={citations?.length ?? 0}
          onOpenCitations={
            citations && citations.length > 0 && onOpenCitations
              ? () => onOpenCitations(citations)
              : undefined
          }
          generatedAssetId={generatedAssetId}
          projectId={projectId}
        />
      ) : null}
    </div>
  )
}
