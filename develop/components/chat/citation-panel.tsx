'use client'

// 우측 슬라이드-인 출처 패널 (399px). stub 데이터 기준.
// 디자인: design/features/3-liner.md §2-5.
// 탭(전체/웹문서/논문/컬렉션) 중 "전체"만 동작 — 필터링은 기능 4 실데이터 연결 시.

import type { Citation } from '@/lib/chat/sse-types'

interface Props {
  citations: Citation[]
  onClose: () => void
}

function getDomain(url?: string): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export function CitationPanel({ citations, onClose }: Props) {
  return (
    <aside
      role="complementary"
      aria-label="출처"
      className="flex h-full w-[399px] shrink-0 flex-col border-l border-border-subtle bg-bg-primary"
    >
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle px-4">
        <h2 className="text-heading-3 text-text-primary">출처</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="출처 패널 닫기"
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary"
        >
          ✕
        </button>
      </header>

      <div className="flex gap-4 border-b border-border-subtle px-4 py-3 text-caption">
        <span className="font-medium text-text-primary">전체 {citations.length}</span>
        <span className="cursor-not-allowed text-text-tertiary" title="기능 4에서 활성화">
          웹문서
        </span>
        <span className="cursor-not-allowed text-text-tertiary" title="기능 4에서 활성화">
          논문
        </span>
        <span className="cursor-not-allowed text-text-tertiary" title="기능 4에서 활성화">
          컬렉션
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
        {citations.map((c) => {
          const domain = getDomain(c.url)
          return (
            <article
              key={c.index}
              className="flex flex-col gap-1.5 rounded-sm border border-border-subtle bg-bg-primary px-6 pt-4 pb-5"
            >
              <div className="flex items-center gap-2 text-caption text-text-secondary">
                <span>{c.index}</span>
                {domain ? <span className="truncate">{domain}</span> : null}
              </div>
              <h3 className="text-[15px] font-medium text-text-primary">{c.title}</h3>
              {c.snippet ? (
                <p className="text-caption text-text-secondary">{c.snippet}</p>
              ) : null}
              <div className="mt-1 flex gap-3 text-caption text-text-secondary">
                <span className="cursor-not-allowed" title="기능 4에서 활성화">
                  인용
                </span>
                <span className="cursor-not-allowed" title="기능 4에서 활성화">
                  저장
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </aside>
  )
}
