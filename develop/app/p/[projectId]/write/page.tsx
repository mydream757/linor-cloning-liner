// Project 스코프 Write 뷰 진입점 (기능 4 D3).
// - "+ 새 Document" 버튼 + Project 내 Document 목록
// - 편집은 /p/[projectId]/write/d/[documentId]에서 (기능 5에서 본체 구현)
// D4에서 미할당 버전(/write)이 별도 경로로 추가된다. 사이드바 "최근 기록" 섹션과
// 이 페이지는 같은 Document 데이터를 다른 각도로 보여주는 구조(D3-B 통합).

import { notFound } from 'next/navigation'

import { DocumentCreateModal } from '@/components/asset/document-create-modal'
import { DocumentList } from '@/components/asset/document-list'
import { getRequiredSession } from '@/lib/auth-session'
import { getProject } from '@/lib/queries/project'
import { listDocumentsByProject } from '@/lib/queries/asset'
import { listChatsByProject } from '@/lib/queries/chat'

export default async function WritePage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { user } = await getRequiredSession()

  // layout에서 소유권 검증하지만 defence in depth.
  const project = await getProject(projectId)
  if (!project || project.userId !== user.id) {
    notFound()
  }

  const [documents, chats] = await Promise.all([
    listDocumentsByProject(user.id, projectId),
    listChatsByProject(projectId),
  ])

  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-2">Documents</h1>
          <p className="text-caption text-text-secondary">
            {project.name} · {documents.length}개의 문서
          </p>
        </div>
        <DocumentCreateModal projectId={projectId} chats={chats} />
      </header>

      <DocumentList
        documents={documents}
        editHrefFor={(doc) => `/p/${projectId}/write/d/${doc.id}`}
      />
    </section>
  )
}
