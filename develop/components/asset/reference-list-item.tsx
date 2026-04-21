'use client'

// 단일 Reference 목록 항목. design/features/4-asset.md §2-5 준수.
// hover 시 우측 삭제 버튼 노출 → 클릭 시 confirm 다이얼로그 (§2-12).

import type { Asset } from '@prisma/client'
import { useActionState, useEffect, useRef } from 'react'

import { deleteAsset } from '@/lib/actions/asset'
import type { ActionResult } from '@/lib/actions/types'

type Props = {
  asset: Asset
}

export function ReferenceListItem({ asset }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(deleteAsset, null)

  const errorMessage =
    state && !state.ok ? state.error.message ?? state.error.fields?.id?.[0] : undefined

  // 성공 시 다이얼로그 닫기. revalidatePath로 곧 언마운트되지만 그 사이 잔상을 막는다.
  useEffect(() => {
    if (state?.ok && dialogRef.current?.open) {
      dialogRef.current.close()
    }
  }, [state])

  const isUrl = asset.referenceKind === 'url'
  const dateLabel = new Intl.DateTimeFormat('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).format(asset.createdAt)

  return (
    <div className="group flex h-[60px] items-center gap-3 border-b border-border-subtle px-1.5">
      {/* kind 배지 */}
      <span className="flex h-6 w-10 shrink-0 items-center justify-center rounded-sm bg-bg-badge text-[11px] font-medium text-text-secondary">
        {isUrl ? 'URL' : 'TEXT'}
      </span>

      {/* 제목 + 부가 정보 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] font-[350] text-text-primary" title={asset.title}>
          {asset.title}
        </span>
        {isUrl && asset.referenceUrl ? (
          <span
            className="truncate text-caption text-text-secondary"
            title={asset.referenceUrl}
          >
            {asset.referenceUrl}
          </span>
        ) : null}
      </div>

      {/* 날짜 */}
      <span className="shrink-0 text-caption text-text-secondary">{dateLabel}</span>

      {/* 삭제 버튼 (hover 노출) */}
      <button
        type="button"
        aria-label={`${asset.title} 삭제`}
        onClick={() => dialogRef.current?.showModal()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary opacity-0 hover:bg-bg-hover focus-visible:opacity-100 group-hover:opacity-100"
      >
        ✕
      </button>

      {/* 삭제 confirm 다이얼로그 */}
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close()
        }}
        className="fixed inset-0 m-auto h-fit w-[400px] max-w-[90vw] rounded-dialog border border-border-subtle bg-bg-primary p-0 text-text-primary shadow-dialog backdrop:bg-black/60"
      >
        <form action={formAction} className="flex flex-col gap-4 p-6">
          <input type="hidden" name="id" value={asset.id} />
          <h3 className="text-[20px] font-semibold">Reference를 삭제할까요?</h3>
          <p className="text-[15px] text-text-primary">
            &ldquo;{asset.title}&rdquo;을(를) 삭제합니다. 이 자료를 인용한 대화의 출처 배지는
            비활성 상태가 됩니다. 되돌릴 수 없습니다.
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
