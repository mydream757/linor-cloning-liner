// 미할당 Reference 목록 (기능 4 D7).
// Project 스코프 페이지(/p/[projectId]/references)와 같은 컴포넌트 구조를 재사용한다.
// listUnassignedReferencesByUser 쿼리는 D2에서 선행 정의됨.

import { ReferenceAddModal } from '@/components/asset/reference-add-modal'
import { ReferenceList } from '@/components/asset/reference-list'
import { getRequiredSession } from '@/lib/auth-session'
import { listUnassignedReferencesByUser } from '@/lib/queries/asset'

export default async function UnassignedReferencesPage() {
  const { user } = await getRequiredSession()
  const references = await listUnassignedReferencesByUser(user.id)

  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-2">자료</h1>
          <p className="text-caption text-text-secondary">
            미할당 · {references.length}개의 자료
          </p>
        </div>
        <ReferenceAddModal projectId={null} />
      </header>

      <ReferenceList references={references} projectId={null} />
    </section>
  )
}
