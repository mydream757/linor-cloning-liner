// Project 스코프 Reference 목록.
// 미할당 버전은 develop/app/(app)/references/page.tsx에 같은 컴포넌트 구조로 존재한다.
// 사이드바 진입점(자료 노드)은 D7에서 추가됐다 (design §2-15).

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

      <ReferenceList references={references} projectId={projectId} />
    </section>
  )
}
