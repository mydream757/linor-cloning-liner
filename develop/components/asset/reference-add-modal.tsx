'use client'

// "+ Reference 추가" 버튼 + URL/텍스트 탭 전환 모달.
// design/features/4-asset.md §2-3 (URL) / §2-4 (텍스트) 준수.
// ADR-0010 하이브리드 원칙: 모달은 native <dialog>.

import { useRef, useState, useTransition } from 'react'

import { createReference } from '@/lib/actions/asset'
import type { ActionResult } from '@/lib/actions/types'

type Kind = 'url' | 'text'

export function ReferenceAddModal({ projectId }: { projectId: string }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [kind, setKind] = useState<Kind>('url')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({})
  const [pending, startTransition] = useTransition()

  // URL 탭
  const [urlTitle, setUrlTitle] = useState('')
  const [urlValue, setUrlValue] = useState('')
  const [urlExcerpt, setUrlExcerpt] = useState('')

  // 텍스트 탭
  const [textTitle, setTextTitle] = useState('')
  const [textBody, setTextBody] = useState('')

  function resetAll() {
    setError(null)
    setFieldErrors({})
    setUrlTitle('')
    setUrlValue('')
    setUrlExcerpt('')
    setTextTitle('')
    setTextBody('')
    setKind('url')
  }

  function openDialog() {
    resetAll()
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const payload =
      kind === 'url'
        ? {
            kind: 'url' as const,
            title: urlTitle,
            url: urlValue,
            excerpt: urlExcerpt || undefined,
            projectId,
          }
        : {
            kind: 'text' as const,
            title: textTitle || undefined,
            text: textBody,
            projectId,
          }

    startTransition(async () => {
      const result: ActionResult<{ id: string }> = await createReference(payload)
      if (!result.ok) {
        setError(result.error.message ?? null)
        setFieldErrors(result.error.fields ?? {})
        return
      }
      closeDialog()
      resetAll()
    })
  }

  const tabClass = (active: boolean) =>
    [
      'h-9 flex-1 rounded-md text-[13px] transition-colors',
      active ? 'bg-bg-active-strong text-text-primary' : 'text-text-secondary hover:bg-bg-hover',
    ].join(' ')

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="h-9 rounded-md bg-primary px-3 text-[13px] font-medium text-text-primary hover:opacity-90"
      >
        + Reference 추가
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDialog()
        }}
        className="fixed inset-0 m-auto h-fit w-[560px] max-w-[90vw] rounded-dialog border border-border-subtle bg-bg-primary p-0 text-text-primary shadow-dialog backdrop:bg-black/60"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <header className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold">Reference 추가</h2>
            <button
              type="button"
              onClick={closeDialog}
              aria-label="닫기"
              className="h-8 w-8 rounded-md text-text-secondary hover:bg-bg-hover"
            >
              ✕
            </button>
          </header>

          <div className="flex gap-2">
            <button
              type="button"
              className={tabClass(kind === 'url')}
              onClick={() => setKind('url')}
              aria-pressed={kind === 'url'}
            >
              URL
            </button>
            <button
              type="button"
              className={tabClass(kind === 'text')}
              onClick={() => setKind('text')}
              aria-pressed={kind === 'text'}
            >
              텍스트
            </button>
          </div>

          {kind === 'url' ? (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[13px] text-text-secondary">제목 <span className="text-text-tertiary">*</span></span>
                <input
                  value={urlTitle}
                  onChange={(e) => setUrlTitle(e.target.value)}
                  maxLength={200}
                  autoFocus
                  className="h-[52px] rounded-md bg-bg-badge px-3 text-[15px] text-text-primary placeholder:text-text-tertiary"
                  placeholder="웹 페이지 제목"
                  aria-invalid={fieldErrors.title ? true : undefined}
                />
                {fieldErrors.title?.[0] ? (
                  <span className="text-[13px] text-error">{fieldErrors.title[0]}</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[13px] text-text-secondary">URL <span className="text-text-tertiary">*</span></span>
                <input
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  type="url"
                  maxLength={2048}
                  className="h-[52px] rounded-md bg-bg-badge px-3 text-[15px] text-text-primary placeholder:text-text-tertiary"
                  placeholder="https://example.com/article"
                  aria-invalid={fieldErrors.url ? true : undefined}
                />
                {fieldErrors.url?.[0] ? (
                  <span className="text-[13px] text-error">{fieldErrors.url[0]}</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[13px] text-text-secondary">발췌 (선택)</span>
                <textarea
                  value={urlExcerpt}
                  onChange={(e) => setUrlExcerpt(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="resize-none rounded-md bg-bg-badge p-3 text-[15px] text-text-primary placeholder:text-text-tertiary"
                  placeholder="핵심 문장 또는 메모"
                />
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[13px] text-text-secondary">제목 (선택)</span>
                <input
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  maxLength={200}
                  autoFocus
                  className="h-[52px] rounded-md bg-bg-badge px-3 text-[15px] text-text-primary placeholder:text-text-tertiary"
                  placeholder="제목을 비우면 내용 앞 60자를 자동 사용"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[13px] text-text-secondary">텍스트 <span className="text-text-tertiary">*</span></span>
                <textarea
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  rows={8}
                  className="min-h-[200px] resize-none rounded-md bg-bg-badge p-3 text-[15px] text-text-primary placeholder:text-text-tertiary"
                  placeholder="저장할 텍스트 스니펫"
                  aria-invalid={fieldErrors.text ? true : undefined}
                />
                {fieldErrors.text?.[0] ? (
                  <span className="text-[13px] text-error">{fieldErrors.text[0]}</span>
                ) : null}
              </label>
            </div>
          )}

          {error ? (
            <p className="text-[13px] text-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={closeDialog}
              className="h-10 w-20 rounded-md border border-border-normal text-[13px] text-text-primary hover:bg-bg-hover disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-10 w-20 rounded-md bg-primary text-[13px] font-medium text-text-primary hover:opacity-90 disabled:opacity-60"
            >
              {pending ? '저장 중…' : '추가'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
