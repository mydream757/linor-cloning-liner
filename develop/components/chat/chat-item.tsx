'use client'

// 단일 Chat 항목. ProjectItem의 구조를 그대로 따른다 (ADR-0010 설계 결정 재사용).
// - Radix DropdownMenu (⋯)
// - HTML <dialog>로 삭제 confirm
// - 부모 <ChatListClient />의 중앙 editingId로 rename 편집 모드 전환
// - 활성 Chat 삭제 시 deleteCurrent flag로 서버에서 다른 Chat/빈 상태로 redirect
// - chat.projectId에서 링크 생성 — Project 트리와 "최근 기록" 양쪽에서 재사용 가능.

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { Chat } from '@prisma/client'
import Link from 'next/link'
import { useActionState, useEffect, useRef } from 'react'

import { deleteChat, renameChat } from '@/lib/actions/chat'
import type { ActionResult } from '@/lib/actions/types'

type Props = {
  chat: Chat
  isActive: boolean
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
}

export function ChatItem(props: Props) {
  // Chat은 Project 귀속(MVP). projectId null인 Chat은 사이드바 어디에도 링크 못 걸어 렌더 스킵.
  if (!props.chat.projectId) return null

  return props.isEditing ? (
    <RenameMode chat={props.chat} onDone={props.onStopEdit} />
  ) : (
    <DisplayMode
      chat={props.chat}
      isActive={props.isActive}
      onStartEdit={props.onStartEdit}
    />
  )
}

// ---------- Display mode ----------

function DisplayMode({
  chat,
  isActive,
  onStartEdit,
}: {
  chat: Chat
  isActive: boolean
  onStartEdit: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  return (
    <div
      className={`group relative flex h-8 items-center rounded-md pr-1 text-[13px] text-text-primary hover:bg-bg-hover ${
        isActive ? 'bg-bg-active-subtle font-semibold' : ''
      }`}
    >
      <Link
        href={`/p/${chat.projectId}/liner/c/${chat.id}`}
        aria-current={isActive ? 'page' : undefined}
        title={chat.title}
        onDoubleClick={(e) => {
          e.preventDefault()
          onStartEdit()
        }}
        className="flex min-w-0 flex-1 items-center px-2 truncate"
      >
        {chat.title}
      </Link>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={`${chat.title} 옵션`}
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
                // ProjectItem과 동일한 타이밍 조정 — Radix close · focus 복귀 뒤 dialog 오픈.
                setTimeout(() => dialogRef.current?.showModal(), 0)
              }}
              className="flex h-7 cursor-default items-center rounded px-2 outline-none data-highlighted:bg-bg-hover"
            >
              삭제
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <DeleteDialog chat={chat} isActive={isActive} dialogRef={dialogRef} />
    </div>
  )
}

// ---------- Rename mode ----------

function RenameMode({ chat, onDone }: { chat: Chat; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(renameChat, null)

  useEffect(() => {
    if (state?.ok) {
      onDone()
    }
  }, [state, onDone])

  const error =
    state && !state.ok
      ? state.error.fields?.title?.[0] ?? state.error.message
      : undefined

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="id" value={chat.id} />
      <div className="flex h-8 items-center px-2">
        <input
          type="text"
          name="title"
          defaultValue={chat.title}
          maxLength={200}
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
  chat,
  isActive,
  dialogRef,
}: {
  chat: Chat
  isActive: boolean
  dialogRef: React.RefObject<HTMLDialogElement | null>
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(deleteChat, null)

  useEffect(() => {
    if (state?.ok) {
      dialogRef.current?.close()
    }
  }, [state, dialogRef])

  const error = state && !state.ok ? state.error.message ?? '삭제에 실패했어요' : undefined

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          dialogRef.current.close()
        }
      }}
      className="fixed inset-0 m-auto h-fit w-fit max-w-sm rounded-md border border-border-default bg-bg-secondary p-0 text-text-primary shadow-2xl backdrop:bg-black/60"
    >
      <form action={formAction} className="flex flex-col gap-4 p-4">
        <input type="hidden" name="id" value={chat.id} />
        {isActive ? <input type="hidden" name="deleteCurrent" value="1" /> : null}

        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-text-primary">
            &apos;{chat.title}&apos;을 삭제할까요?
          </h2>
          <p className="text-xs text-text-secondary">
            이 채팅의 메시지가 모두 삭제됩니다.
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
