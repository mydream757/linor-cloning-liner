// Project 스코프 Reference 목록 (기능 4 D2 임시 검증 페이지).
// D4에서 미할당 버전(/references)이 추가되고, 최종 UX는 D6에서 Liner 뷰 내부 선택
// UI로 통합된다. 이 페이지는 Server Action + 목록 렌더 + 삭제 동작을 실제 플로우로
// 확인하기 위한 진입점.

import { notFound } from 'next/navigation'

import { ReferenceAddModal } from '@/components/asset/reference-add-modal'
import { ReferenceList } from '@/components/asset/reference-list'
import { getRequiredSession } from '@/lib/auth-session'
import { getProject } from '@/lib/queries/project'
import { listReferencesByProject } from '@/lib/queries/asset'

export default async function ReferencesPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { user } = await getRequiredSession()

  // layout에서 이미 소유권을 검증하지만, 여기서도 한 번 더 확인 (defence in depth).
  const project = await getProject(projectId)
  if (!project || project.userId !== user.id) {
    notFound()
  }

  const references = await listReferencesByProject(user.id, projectId)

  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-2">자료</h1>
          <p className="text-caption text-text-secondary">
            {project.name} · {references.length}개의 자료
          </p>
        </div>
        <ReferenceAddModal projectId={projectId} />
      </header>

      <ReferenceList references={references} />
    </section>
  )
}
