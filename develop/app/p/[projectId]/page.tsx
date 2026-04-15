// /p/[projectId] (뷰 미지정) 진입 시 기본 뷰(liner)로 safety-net redirect.
// 일반 사용 경로는 사이드바 <Link>가 이미 /p/[projectId]/[currentView]를 가리킨다.
// 이 page는 사용자가 /p/[id]만 직접 입력하거나 오래된 링크를 따라올 때의 보호막.

import { redirect } from 'next/navigation'

export default async function ProjectIndexPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  redirect(`/p/${projectId}/liner`)
}
