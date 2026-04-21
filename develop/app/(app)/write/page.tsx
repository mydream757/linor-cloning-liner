// 미할당 Write 뷰 진입점 (/write).
// - "+ 새 Document" 버튼 + 미할당 Document 목록
// - 재료 Chat 선택 시 user의 미할당 Chat만 노출 (composition 스코프 일관성)
// design/features/4-asset.md §2-10.

import { DocumentCreateModal } from '@/components/asset/document-create-modal'
import { DocumentList } from '@/components/asset/document-list'
import { getRequiredSession } from '@/lib/auth-session'
import { listUnassignedDocumentsByUser } from '@/lib/queries/asset'
import { listUnassignedChatsByUser } from '@/lib/queries/chat'

export default async function UnassignedWritePage() {
  const { user } = await getRequiredSession()

  const [documents, chats] = await Promise.all([
    listUnassignedDocumentsByUser(user.id),
    listUnassignedChatsByUser(user.id),
  ])

  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-2">Documents</h1>
          <p className="text-caption text-text-secondary">
            미할당 · {documents.length}개의 문서
          </p>
        </div>
        <DocumentCreateModal projectId={null} chats={chats} />
      </header>

      <DocumentList
        documents={documents}
        editHrefFor={(doc) => `/write/d/${doc.id}`}
      />
    </section>
  )
}
