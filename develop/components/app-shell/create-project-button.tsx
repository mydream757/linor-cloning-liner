'use client'

// "새 Project 만들기" 버튼 + 모달. D6에서 인라인 NewProjectForm을 대체한다.
// EmptyState와 Sidebar 양쪽에서 공유 사용.
// HTML <dialog>로 모달 구현 (ADR-0010 하이브리드 원칙: dialog는 native).

import { useActionState, useRef } from 'react'

import { createProject } from '@/lib/actions/project'
import type { ActionResult } from '@/lib/actions/types'

type State = ActionResult<{ id: string }> | null

export function CreateProjectButton({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const [state, formAction, pending] = useActionState<State, FormData>(createProject, null)

  const nameError =
    state && !state.ok ? state.error.fields?.name?.[0] ?? state.error.message : undefined

  function openDialog() {
    // 열기 전 form 초기화 (이전 입력·에러 잔존 방지)
    formRef.current?.reset()
    dialogRef.current?.showModal()
  }

  return (
    <>
      <button type="button" onClick={openDialog} className={className}>
        {children ?? '+ 새 Project'}
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            dialogRef.current.close()
          }
        }}
        className="fixed inset-0 m-auto h-fit w-fit max-w-sm rounded-md border border-border-default bg-bg-secondary p-0 text-text-primary shadow-2xl backdrop:bg-black/60"
      >
        <form ref={formRef} action={formAction} className="flex flex-col gap-4 p-4">
          <h2 className="text-sm font-semibold text-text-primary">
            새 Project 만들기
          </h2>

          <div className="flex flex-col gap-2">
            <input
              type="text"
              name="name"
              placeholder="Project 이름"
              maxLength={100}
              autoFocus
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? 'create-project-error' : undefined}
              className="h-9 w-full rounded-md bg-surface-overlay px-3 text-sm text-text-primary placeholder:text-text-tertiary"
            />
            {nameError ? (
              <p id="create-project-error" className="text-xs text-text-secondary">
                {nameError}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => dialogRef.current?.close()}
              className="h-8 rounded-md px-3 text-[13px] text-text-secondary hover:bg-bg-hover disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-8 rounded-md bg-bg-active-strong px-3 text-[13px] text-text-primary disabled:opacity-60"
            >
              {pending ? '만드는 중…' : '만들기'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
