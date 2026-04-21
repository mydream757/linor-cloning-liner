// Liner 뷰 진입점.
// - ?new=1: redirect 건너뛰고 EmptyComposer 강제 — 사이드바 "새 대화" 버튼용 동선.
// - 아니면 최근 Chat이 있을 때 redirect, 없으면 EmptyComposer.

import { redirect } from 'next/navigation'

import { EmptyComposer } from '@/components/chat/empty-composer'
import { getLatestChatIdByProject } from '@/lib/queries/chat'

export default async function LinerPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ new?: string }>
}) {
  const { projectId } = await params
  const sp = await searchParams

  if (sp.new !== '1') {
    const latestChatId = await getLatestChatIdByProject(projectId)
    if (latestChatId) {
      redirect(`/p/${projectId}/liner/c/${latestChatId}`)
    }
  }

  return <EmptyComposer projectId={projectId} />
}
