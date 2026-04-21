'use client'

// 어시스턴트 응답 하단 액션바.
// - "N개의 출처" 버튼 (기능 3)
// - "Document로 내보내기" 버튼 + 인라인 폼 (기능 4 D3-B, 디자인 §2-9)
//   · 이미 내보낸 메시지면 "Document 보기 →" 링크로 대체
//   · 인라인 폼: 제목 편집 + 만들기/취소. 기본값은 응답 앞 60자.
//   · 성공 시 Write 편집 경로로 router.push.
// 복사/좋아요/싫어요 stub 아이콘은 T-005로 별도 부채.

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { forwardMessageToDocument } from '@/lib/actions/asset'

interface Props {
  messageId: string
  messageContent: string
  citationCount: number
  onOpenCitations?: () => void
  generatedAssetId: string | null
  projectId: string | null
}

export function ResponseActions({
  messageId,
  messageContent,
  citationCount,
  onOpenCitations,
  generatedAssetId,
  projectId,
}: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const alreadyForwarded = Boolean(generatedAssetId)

  function openForm() {
    setTitle(messageContent.slice(0, 60))
    setError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await forwardMessageToDocument({
        messageId,
        title: title.trim() || undefined,
      })
      if (!result.ok) {
        setError(result.error.message ?? '저장에 실패했습니다')
        return
      }
      // Document 편집 페이지로 이동. 미할당(projectId=null)은 D4 이후 지원이므로
      // 현시점엔 Server Action이 반환한 projectId가 항상 있다고 가정해도 무방.
      const docProjectId = result.data.projectId ?? projectId
      if (docProjectId) {
        router.push(`/p/${docProjectId}/write/d/${result.data.id}`)
      } else {
        // 방어적: 미할당 라우트 미구현 단계에서는 새로고침만.
        router.refresh()
      }
    })
  }

  // 출처 + 포워딩 모두 없으면 액션바 자체를 숨긴다.
  if (citationCount === 0 && !alreadyForwarded && !formOpen) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <ForwardButton onClick={openForm} />
      </div>
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {citationCount > 0 && onOpenCitations ? (
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
            {citationCount}개의 출처
          </button>
        ) : null}

        {alreadyForwarded && projectId ? (
          <Link
            href={`/p/${projectId}/write/d/${generatedAssetId}`}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-caption text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          >
            Document 보기 →
          </Link>
        ) : (
          !formOpen && <ForwardButton onClick={openForm} />
        )}
      </div>

      {formOpen ? (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 rounded-md border border-border-subtle bg-bg-secondary p-3"
        >
          <label className="flex flex-col gap-1">
            <span className="text-caption text-text-secondary">Document 제목</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoFocus
              placeholder="제목"
              className="h-9 rounded-md bg-bg-primary px-3 text-[14px] text-text-primary placeholder:text-text-tertiary"
            />
          </label>
          {error ? (
            <p className="text-caption text-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={closeForm}
              className="h-8 rounded-md px-3 text-caption text-text-secondary hover:bg-bg-hover disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-8 rounded-md bg-primary px-3 text-caption font-medium text-text-primary hover:opacity-90 disabled:opacity-60"
            >
              {pending ? '만드는 중…' : 'Document 만들기'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

function ForwardButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 items-center gap-1.5 rounded-md px-2 text-caption text-text-secondary hover:bg-bg-hover hover:text-text-primary"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3 2.5h6.5L13 6v7.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M9 2.5V6h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      Document로 내보내기
    </button>
  )
}
