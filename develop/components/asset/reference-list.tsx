// Reference 목록 — Server Component.
// design/features/4-asset.md §2-5 + §2-13(빈 상태 2버튼 CTA) 준수.
// Project 스코프 / 미할당 스코프에서 모두 사용. 빈 상태의 추가 진입은 projectId를
// 그대로 ReferenceAddModal에 전달한다 (null이면 미할당 Asset 생성).

import type { Asset } from '@prisma/client'

import { ReferenceAddModal } from './reference-add-modal'
import { ReferenceListItem } from './reference-list-item'

type Props = {
  references: Asset[]
  projectId: string | null
}

export function ReferenceList({ references, projectId }: Props) {
  if (references.length === 0) {
    const emptyTriggerClassName =
      'h-11 w-40 rounded-md border border-border-normal text-[14px] font-medium text-text-primary hover:bg-bg-hover'
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="flex flex-col gap-2">
          <p className="text-[17px] font-semibold text-text-primary">
            아직 저장된 자료가 없습니다.
          </p>
          <p className="text-[16px] text-text-secondary">
            자료를 추가하면 대화할 때 참조할 수 있어요.
          </p>
        </div>
        <div className="flex gap-3">
          <ReferenceAddModal
            projectId={projectId}
            triggerLabel="URL 입력"
            triggerClassName={emptyTriggerClassName}
            initialKind="url"
          />
          <ReferenceAddModal
            projectId={projectId}
            triggerLabel="텍스트 입력"
            triggerClassName={emptyTriggerClassName}
            initialKind="text"
          />
        </div>
      </div>
    )
  }

  return (
    <ul className="flex flex-col">
      {references.map((ref) => (
        <li key={ref.id}>
          <ReferenceListItem asset={ref} />
        </li>
      ))}
    </ul>
  )
}
