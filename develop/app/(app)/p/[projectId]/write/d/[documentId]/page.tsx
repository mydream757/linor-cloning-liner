// Document 편집 placeholder. 기능 5(Write 뷰: TipTap + AI 수정 제안)에서 본체 구현.
// D3에서는 소유권 검증 + 제목 표시 + 안내 문구만.

import { notFound } from 'next/navigation'
import Link from 'next/link'

import { getRequiredSession } from '@/lib/auth-session'
import { getAsset } from '@/lib/queries/asset'

export default async function DocumentEditPage({
  params,
}: {
  params: Promise<{ projectId: string; documentId: string }>
}) {
  const { projectId, documentId } = await params
  const { user } = await getRequiredSession()

  const asset = await getAsset(documentId)
  if (
    !asset ||
    asset.userId !== user.id ||
    asset.type !== 'document' ||
    asset.projectId !== projectId
  ) {
    notFound()
  }

  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-6 py-8">
      <Link
        href={`/p/${projectId}/write`}
        className="self-start text-caption text-text-secondary hover:text-text-primary"
      >
        ← Documents
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-heading-2">{asset.title}</h1>
        {asset.sourceChatIds.length > 0 ? (
          <p className="text-caption text-text-secondary">
            {asset.sourceChatIds.length}개의 Chat을 재료로 만든 Document
          </p>
        ) : null}
      </header>

      <div className="rounded-lg border border-border-subtle bg-bg-secondary p-6">
        <p className="text-[15px] text-text-primary">
          Document 편집은 기능 5(Write 뷰)에서 TipTap 에디터로 구현됩니다.
        </p>
        <p className="mt-2 text-caption text-text-secondary">
          현재는 Document의 생성·삭제·포워딩 플로우만 동작합니다.
        </p>
      </div>
    </section>
  )
}
