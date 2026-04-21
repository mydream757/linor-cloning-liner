// Document 목록 — Server Component. Write 뷰 메인 패널과 (D3-B 이후) 사이드바 "최근 기록"에서 사용.
// design/features/4-asset.md §2-10 준수. 편집 진입은 기능 5에서 구현.

import type { Asset } from '@prisma/client'

import { DocumentListItem } from './document-list-item'

type Props = {
  documents: Asset[]
  editHrefFor: (asset: Asset) => string
}

export function DocumentList({ documents, editHrefFor }: Props) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-[15px] text-text-primary">아직 저장된 Document가 없습니다.</p>
        <p className="text-caption text-text-secondary">
          Liner에서 AI와 나눈 대화를 Document로 내보내거나, 새 Document를 직접 만들어보세요.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col">
      {documents.map((doc) => (
        <li key={doc.id}>
          <DocumentListItem asset={doc} editHref={editHrefFor(doc)} />
        </li>
      ))}
    </ul>
  )
}
