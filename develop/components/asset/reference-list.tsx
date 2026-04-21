// Reference 목록 — Server Component.
// design/features/4-asset.md §2-5 + §2-13(빈 상태) 준수.
// D2 검증 페이지(/p/[projectId]/references)에서 사용.

import type { Asset } from '@prisma/client'

import { ReferenceListItem } from './reference-list-item'

export function ReferenceList({ references }: { references: Asset[] }) {
  if (references.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-[15px] text-text-primary">아직 저장된 자료가 없습니다.</p>
        <p className="text-caption text-text-secondary">
          자료를 추가하면 대화할 때 참조할 수 있어요.
        </p>
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
