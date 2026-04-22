'use client'

// Chat → Project 이동 다이얼로그.
// design/features/4-asset.md §2-11 준수. 400px, radius-dialog 12px, shadow-dialog.
// "이 Chat만을 유일 재료로 쓰는 Asset 동반 이동" 체크박스 기본 off (PM Q4).
// Composition 모델(ADR-0016): 동반 대상은 sourceChatIds=[thisChatId] Asset만.

import type { Chat, Project } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

import { moveChatToProject } from '@/lib/actions/chat'
import { listUserProjectsAction } from '@/lib/actions/project'

interface Props {
  chat: Chat
  // 부모가 dialog open/close 제어할 수 있도록 ref를 외부로 노출
  dialogRef: React.RefObject<HTMLDialogElement | null>
}

export function ChatMoveDialog({ chat, dialogRef }: Props) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[] | null>(null)
  // null = 미할당, string = Project ID
  const [selectedTarget, setSelectedTarget] = useState<string | null>(chat.projectId)
  const [moveSourcedAssets, setMoveSourcedAssets] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const closeDialog = () => {
    dialogRef.current?.close()
  }

  // Project 목록 lazy fetch — 컴포넌트 mount 시 한 번만. ref 플래그로 중복 호출 방지
  // (React 19: setState-in-effect 회피).
  const fetchStartedRef = useRef(false)
  useEffect(() => {
    if (fetchStartedRef.current) return
    fetchStartedRef.current = true
    listUserProjectsAction()
      .then((result) => {
        if (result.ok) setProjects(result.data)
        else setError(result.error.message ?? 'Project 목록을 불러올 수 없습니다')
      })
      .catch(() => setError('Project 목록을 불러올 수 없습니다'))
  }, [])

  // 자기 자신(현재 소속) 선택 시 "이동" 버튼 비활성
  const canSubmit = selectedTarget !== chat.projectId && !pending

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (selectedTarget === chat.projectId) {
      setError('이미 해당 Project에 있습니다')
      return
    }
    startTransition(async () => {
      const result = await moveChatToProject({
        chatId: chat.id,
        targetProjectId: selectedTarget,
        moveSourcedAssets,
      })
      if (!result.ok) {
        setError(result.error.message ?? '이동에 실패했습니다')
        return
      }
      closeDialog()
      // 현재 라우트가 이전 projectId 기반이면 새 경로로 이동.
      // 예: /p/[prev]/liner/c/[chatId] → /p/[new]/liner/c/[chatId] or /liner/c/[chatId]
      const newChatUrl = result.data.projectId
        ? `/p/${result.data.projectId}/liner/c/${chat.id}`
        : `/liner/c/${chat.id}`
      router.push(newChatUrl)
    })
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) closeDialog()
      }}
      className="fixed inset-0 m-auto h-fit w-[400px] max-w-[90vw] rounded-dialog border border-border-subtle bg-bg-primary p-0 text-text-primary shadow-dialog backdrop:bg-black/60"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <h3 className="text-[20px] font-semibold">Project로 이동</h3>

        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-text-secondary">
            &ldquo;{chat.title}&rdquo;을(를) 이동할 Project를 선택하세요
          </span>
          <ul className="mt-1 flex max-h-[240px] flex-col overflow-y-auto rounded-md border border-border-subtle bg-bg-secondary">
            <li>
              <TargetItem
                label="(미할당)"
                selected={selectedTarget === null}
                disabled={chat.projectId === null}
                onSelect={() => setSelectedTarget(null)}
              />
            </li>
            {projects === null ? (
              <li className="px-3 py-2 text-caption text-text-tertiary">
                Project 목록을 불러오는 중…
              </li>
            ) : (
              projects.map((project) => (
                <li key={project.id}>
                  <TargetItem
                    label={project.name}
                    selected={selectedTarget === project.id}
                    disabled={chat.projectId === project.id}
                    onSelect={() => setSelectedTarget(project.id)}
                  />
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="border-t border-border-subtle pt-3">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={moveSourcedAssets}
              onChange={(e) => setMoveSourcedAssets(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-text-primary">이 Chat의 전용 Asset도 함께 이동</span>
              <span className="text-caption text-text-secondary">
                이 Chat만을 재료로 만든 Document가 선택한 Project로 함께 이동합니다.
                다른 Chat과 재료를 공유하는 Asset은 영향받지 않습니다.
              </span>
            </div>
          </label>
        </div>

        {error ? (
          <p className="text-caption text-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            autoFocus
            onClick={closeDialog}
            className="h-10 w-20 rounded-md border border-border-normal text-[13px] text-text-primary hover:bg-bg-hover disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-10 w-20 rounded-md bg-primary text-[13px] font-medium text-text-primary hover:opacity-90 disabled:opacity-60"
          >
            {pending ? '이동 중…' : '이동'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

function TargetItem({
  label,
  selected,
  disabled,
  onSelect,
}: {
  label: string
  selected: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex h-[42px] w-full items-center px-3 text-left text-[13px] transition-colors ${
        disabled
          ? 'cursor-not-allowed text-text-tertiary opacity-60'
          : selected
            ? 'bg-bg-active-subtle text-text-primary font-semibold'
            : 'text-text-primary hover:bg-bg-hover'
      }`}
    >
      {label}
      {disabled ? <span className="ml-auto text-caption">현재 위치</span> : null}
    </button>
  )
}
