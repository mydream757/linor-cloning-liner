// Liner 뷰 진입점.
// - Chat이 있으면 가장 최근 Chat 라우트로 redirect.
// - Chat이 없으면 빈 상태(EmptyComposer) 렌더.

import { redirect } from 'next/navigation'

import { EmptyComposer } from '@/components/chat/empty-composer'
import { getLatestChatIdByProject } from '@/lib/queries/chat'

export default async function LinerPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const latestChatId = await getLatestChatIdByProject(projectId)
  if (latestChatId) {
    redirect(`/p/${projectId}/liner/c/${latestChatId}`)
  }

  return <EmptyComposer projectId={projectId} />
}
