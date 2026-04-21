'use client'

// "+ 새 Document" 버튼 + 통합 모달 (Composition 모델, ADR-0016).
// design/features/4-asset.md §2-8 준수. ADR-0010 하이브리드: 모달은 native <dialog>.
//
// 재료 Chat 0개 선택 → 빈 Document (시나리오 5-a)
// 재료 Chat N개 선택 → 재료 concat Document (시나리오 5-c)
// 생성 성공 시 Write 뷰 편집 경로(/p/[pid]/write/d/[docId])로 이동.

import type { Chat } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState, useTransition } from 'react'

import { createDocument } from '@/lib/actions/asset'

interface Props {
  projectId: string
  // Project 스코프 Chat 목록. 재료 선택 섹션에서 체크박스로 표시.
  chats: Chat[]
}

export function DocumentCreateModal({ projectId, chats }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [query, setQuery] = useState('')
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([])
  const [titleError, setTitleError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return chats
    return chats.filter((c) => c.title.toLowerCase().includes(q))
  }, [chats, query])

  function openDialog() {
    setTitle('')
    setQuery('')
    setSelectedChatIds([])
    setTitleError(null)
    setFormError(null)
    dialogRef.current?.showModal()
  }

  function toggleChat(id: string) {
    setSelectedChatIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTitleError(null)
    setFormError(null)

    startTransition(async () => {
      const result = await createDocument({
        title,
        projectId,
        sourceChatIds: selectedChatIds.length > 0 ? selectedChatIds : undefined,
      })
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
        className="fixed inset-0 m-auto h-fit w-[480px] max-w-[90vw] rounded-dialog border border-border-subtle bg-bg-primary p-0 text-text-primary shadow-dialog backdrop:bg-black/60"
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

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-text-secondary">재료 Chat 선택 (선택)</span>
              <span className="text-caption text-text-secondary">
                {selectedChatIds.length > 0 ? `${selectedChatIds.length}개 선택됨` : '없으면 빈 Document'}
              </span>
            </div>
            {chats.length === 0 ? (
              <p className="rounded-md bg-bg-secondary px-3 py-4 text-caption text-text-tertiary">
                이 Project에 Chat이 없습니다. 먼저 Liner 뷰에서 대화를 시작해보세요.
              </p>
            ) : (
              <>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Chat 제목 검색"
                  className="h-9 rounded-md border border-border-normal bg-bg-primary px-3 text-[13px] text-text-primary placeholder:text-text-tertiary"
                />
                <ul className="flex max-h-[200px] flex-col overflow-y-auto rounded-md border border-border-subtle bg-bg-secondary">
                  {filteredChats.length === 0 ? (
                    <li className="px-3 py-2 text-caption text-text-tertiary">
                      일치하는 Chat이 없습니다
                    </li>
                  ) : (
                    filteredChats.map((chat) => {
                      const checked = selectedChatIds.includes(chat.id)
                      return (
                        <li key={chat.id}>
                          <label
                            className={`flex h-9 cursor-pointer items-center gap-2 px-3 text-[13px] text-text-primary hover:bg-bg-hover ${
                              checked ? 'bg-bg-active-subtle' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleChat(chat.id)}
                              className="h-4 w-4"
                            />
                            <span className="truncate">{chat.title}</span>
                          </label>
                        </li>
                      )
                    })
                  )}
                </ul>
              </>
            )}
          </div>

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
