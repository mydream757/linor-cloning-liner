'use client'

// 사이드바의 단일 Project 항목. ADR-0010 설계 결정을 따른다.
// - Radix DropdownMenu (⋯)
// - HTML <dialog>로 삭제 confirm
// - 부모 <ProjectListClient />의 중앙 editingId로 rename 편집 모드 전환
// - Pessimistic update (스피너 + 대기, 실패 시 인라인 에러)
//
// 두 가지 렌더 분기:
//   isEditing=true  → <RenameMode /> (form + input)
//   isEditing=false → <DisplayMode /> (Link + 메뉴 + 삭제 다이얼로그)

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { Project } from '@prisma/client'
import Link from 'next/link'
import { useActionState, useEffect, useRef } from 'react'

import { deleteProject, renameProject } from '@/lib/actions/project'
import type { ActionResult } from '@/lib/actions/types'

type Props = {
  project: Project
  isActive: boolean
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
}

export function ProjectItem(props: Props) {
  return props.isEditing ? (
    <RenameMode project={props.project} onDone={props.onStopEdit} />
  ) : (
    <DisplayMode
      project={props.project}
      isActive={props.isActive}
      onStartEdit={props.onStartEdit}
    />
  )
}

// ---------- Display mode ----------

function DisplayMode({
  project,
  isActive,
  onStartEdit,
}: {
  project: Project
  isActive: boolean
  onStartEdit: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  return (
    <div
      className={`group relative flex h-7.5 items-center rounded-md pr-1 text-[13px] text-text-primary hover:bg-bg-hover ${
        isActive ? 'bg-bg-active-subtle font-medium' : ''
      }`}
    >
      <Link
        href={`/p/${project.id}/liner`}
        aria-current={isActive ? 'page' : undefined}
        title={project.name}
        onDoubleClick={(e) => {
          e.preventDefault()
          onStartEdit()
        }}
        className="flex min-w-0 flex-1 items-center px-2 truncate"
      >
        {project.name}
      </Link>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={`${project.name} 옵션`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-secondary opacity-0 hover:bg-bg-hover focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            ⋯
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-35 rounded-md border border-border-default bg-bg-secondary p-1 text-[13px] text-text-primary shadow-lg"
          >
            <DropdownMenu.Item
              onSelect={onStartEdit}
              className="flex h-7 cursor-default items-center rounded px-2 outline-none data-highlighted:bg-bg-hover"
            >
              이름 변경
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => {
                // Radix가 메뉴를 자연스럽게 닫도록 preventDefault 생략.
                // setTimeout(0)으로 현재 tick에서 메뉴 close·focus 복귀가 끝난
                // 뒤 다음 tick에 dialog.showModal을 호출한다. 동시에 호출하면
                // Radix의 dismissable-layer가 dialog backdrop 클릭을 먼저
                // 소비해 사용자가 backdrop을 두 번 클릭해야 닫히는 버그가
                // 재현된다.
                setTimeout(() => dialogRef.current?.showModal(), 0)
              }}
              className="flex h-7 cursor-default items-center rounded px-2 outline-none data-highlighted:bg-bg-hover"
            >
              삭제
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <DeleteDialog
        project={project}
        isActive={isActive}
        dialogRef={dialogRef}
      />
    </div>
  )
}

// ---------- Rename mode ----------

function RenameMode({ project, onDone }: { project: Project; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(renameProject, null)

  useEffect(() => {
    if (state?.ok) {
      onDone()
    }
  }, [state, onDone])

  const error =
    state && !state.ok
      ? state.error.fields?.name?.[0] ?? state.error.message
      : undefined

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="id" value={project.id} />
      <div className="flex h-7.5 items-center px-2">
        <input
          type="text"
          name="name"
          defaultValue={project.name}
          maxLength={100}
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              onDone()
            }
          }}
          onBlur={(e) => {
            if (pending) return
            e.currentTarget.form?.requestSubmit()
          }}
          disabled={pending}
          aria-invalid={error ? true : undefined}
          className="min-w-0 flex-1 rounded-sm bg-surface-overlay px-1 text-[13px] text-text-primary outline-none disabled:opacity-60"
        />
      </div>
      {error ? (
        <p className="px-2 text-xs text-text-secondary">{error}</p>
      ) : null}
    </form>
  )
}

// ---------- Delete dialog ----------

function DeleteDialog({
  project,
  isActive,
  dialogRef,
}: {
  project: Project
  isActive: boolean
  dialogRef: React.RefObject<HTMLDialogElement | null>
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(deleteProject, null)

  useEffect(() => {
    if (state?.ok) {
      dialogRef.current?.close()
    }
  }, [state, dialogRef])

  const error = state && !state.ok ? state.error.message ?? '삭제에 실패했어요' : undefined

  return (
    <dialog
      ref={dialogRef}
      // 센터링: fixed inset-0 + m-auto + h-fit w-fit 조합은 브라우저 기본
      // `dialog[open] { margin: auto }`를 명시적으로 재현해 Tailwind preflight와
      // 무관하게 안정적으로 중앙 정렬된다.
      // 백드롭 클릭 닫힘: ::backdrop에서 발생한 click은 dialog element로
      // bubble up되어 target === dialog가 된다. 내부 컨텐츠 클릭은 자식 요소가
      // target이라 구분 가능.
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          dialogRef.current.close()
        }
      }}
      className="fixed inset-0 m-auto h-fit w-fit max-w-sm rounded-md border border-border-default bg-bg-secondary p-0 text-text-primary shadow-2xl backdrop:bg-black/60"
    >
      <form action={formAction} className="flex flex-col gap-4 p-4">
        <input type="hidden" name="id" value={project.id} />
        {/* 현재 보고 있는 Project를 삭제할 때는 action이 redirect 처리하도록 flag 전달. */}
        {isActive ? <input type="hidden" name="deleteCurrent" value="1" /> : null}

        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-text-primary">
            &apos;{project.name}&apos;을 삭제할까요?
          </h2>
          <p className="text-xs text-text-secondary">
            이 안의 채팅·자료는 남습니다.
          </p>
        </div>

        {error ? (
          <p className="text-xs text-text-secondary">{error}</p>
        ) : null}

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
            {pending ? '삭제 중…' : '삭제'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
