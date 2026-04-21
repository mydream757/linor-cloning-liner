'use client'

// "+ 새 Document" 버튼 + 미니 모달 (빈 Document 생성 — 시나리오 5-a).
// design/features/4-asset.md §2-8 준수. ADR-0010 하이브리드: 모달은 native <dialog>.
// 생성 성공 시 Write 뷰 편집 경로(/p/[pid]/write/d/[docId])로 이동.

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'

import { createDocument } from '@/lib/actions/asset'

export function DocumentCreateModal({ projectId }: { projectId: string }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function openDialog() {
    setTitle('')
    setTitleError(null)
    setFormError(null)
    dialogRef.current?.showModal()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTitleError(null)
    setFormError(null)

    startTransition(async () => {
      const result = await createDocument({ title, projectId })
      if (!result.ok) {
        setTitleError(result.error.fields?.title?.[0] ?? null)
        setFormError(result.error.message ?? null)
        return
      }
      dialogRef.current?.close()
      router.push(`/p/${projectId}/write/d/${result.data.id}`)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="h-9 rounded-md bg-primary px-3 text-[13px] font-medium text-text-primary hover:opacity-90"
      >
        + 새 Document
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close()
        }}
        className="fixed inset-0 m-auto h-fit w-[400px] max-w-[90vw] rounded-dialog border border-border-subtle bg-bg-primary p-0 text-text-primary shadow-dialog backdrop:bg-black/60"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <h2 className="text-[20px] font-semibold">새 Document</h2>

          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-text-secondary">
              제목 <span className="text-text-tertiary">*</span>
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoFocus
              placeholder="Document 제목"
              aria-invalid={titleError ? true : undefined}
              className="h-[52px] rounded-md bg-bg-badge px-3 text-[15px] text-text-primary placeholder:text-text-tertiary"
            />
            {titleError ? (
              <span className="text-[13px] text-error">{titleError}</span>
            ) : null}
          </label>

          {formError ? (
            <p className="text-[13px] text-error" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => dialogRef.current?.close()}
              className="h-10 w-20 rounded-md border border-border-normal text-[13px] text-text-primary hover:bg-bg-hover disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-10 w-20 rounded-md bg-primary text-[13px] font-medium text-text-primary hover:opacity-90 disabled:opacity-60"
            >
              {pending ? '만드는 중…' : '만들기'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
