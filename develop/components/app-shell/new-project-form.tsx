'use client'

// 새 Project 생성 폼 (Client Component — useActionState 필요).
// EmptyState와 Sidebar의 "+ 새 Project" 버튼에서 공유 사용.
// 성공 시 createProject가 server-side redirect를 수행.

import { useActionState } from 'react'

import { createProject } from '@/lib/actions/project'
import type { ActionResult } from '@/lib/actions/types'

type State = ActionResult<{ id: string }> | null

export function NewProjectForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const [state, formAction, pending] = useActionState<State, FormData>(createProject, null)

  const nameError =
    state && !state.ok ? state.error.fields?.name?.[0] ?? state.error.message : undefined

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="name"
          placeholder="Project 이름"
          maxLength={100}
          autoFocus={autoFocus}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? 'new-project-error' : undefined}
          className="h-9 flex-1 min-w-0 rounded-md bg-surface-overlay px-3 text-sm text-text-primary placeholder:text-text-tertiary"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-9 shrink-0 rounded-md bg-bg-active-strong px-3 text-sm text-text-primary disabled:opacity-60"
        >
          {pending ? '만드는 중…' : '만들기'}
        </button>
      </div>
      {nameError ? (
        <p id="new-project-error" className="text-xs text-text-secondary">
          {nameError}
        </p>
      ) : null}
    </form>
  )
}
