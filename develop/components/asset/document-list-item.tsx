'use client'

// 단일 Document 목록 항목. Reference 목록 항목과 유사하되:
//  - 제목 클릭 시 편집 라우트(/p/[pid]/write/d/[docId])로 이동 (Link)
//  - 부제는 업데이트 시각 (Reference는 URL)
//  - 포워딩 출처(originChatId 존재) 힌트 작게 표시

import type { Asset } from '@prisma/client'
import Link from 'next/link'
import { useActionState, useEffect, useRef } from 'react'

import { deleteAsset } from '@/lib/actions/asset'
import type { ActionResult } from '@/lib/actions/types'

type Props = {
  asset: Asset
  editHref: string
}

export function DocumentListItem({ asset, editHref }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(deleteAsset, null)

  const errorMessage =
    state && !state.ok ? state.error.message ?? state.error.fields?.id?.[0] : undefined

  useEffect(() => {
    if (state?.ok && dialogRef.current?.open) {
      dialogRef.current.close()
    }
  }, [state])

  const updatedLabel = new Intl.DateTimeFormat('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(asset.updatedAt)

  const isForwarded = asset.sourceChatIds.length > 0

  return (
    <div className="group flex h-[60px] items-center gap-3 border-b border-border-subtle px-1.5">
      <Link
        href={editHref}
        className="flex min-w-0 flex-1 flex-col py-2"
        title={asset.title}
      >
        <span className="truncate text-[14px] font-[350] text-text-primary">
          {asset.title}
        </span>
        <span className="flex items-center gap-2 text-caption text-text-secondary">
          <span>{updatedLabel}</span>
          {isForwarded ? (
            <span className="rounded-sm bg-bg-badge px-1.5 py-0.5 text-[11px] text-text-secondary">
              대화에서 생성
            </span>
          ) : null}
        </span>
      </Link>

      <button
        type="button"
        aria-label={`${asset.title} 삭제`}
        onClick={() => dialogRef.current?.showModal()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary opacity-0 hover:bg-bg-hover focus-visible:opacity-100 group-hover:opacity-100"
      >
        ✕
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close()
        }}
        className="fixed inset-0 m-auto h-fit w-[400px] max-w-[90vw] rounded-dialog border border-border-subtle bg-bg-primary p-0 text-text-primary shadow-dialog backdrop:bg-black/60"
      >
        <form action={formAction} className="flex flex-col gap-4 p-6">
          <input type="hidden" name="id" value={asset.id} />
          <h3 className="text-[20px] font-semibold">Document를 삭제할까요?</h3>
          <p className="text-[15px] text-text-primary">
            &ldquo;{asset.title}&rdquo;을(를) 삭제합니다. 되돌릴 수 없습니다.
          </p>

          {errorMessage ? (
            <p className="text-[13px] text-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="h-10 w-20 rounded-md border border-border-normal text-[13px] text-text-primary hover:bg-bg-hover disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-10 w-20 rounded-md bg-error text-[13px] font-medium text-text-primary hover:opacity-90 disabled:opacity-60"
            >
              {pending ? '삭제 중…' : '삭제'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
