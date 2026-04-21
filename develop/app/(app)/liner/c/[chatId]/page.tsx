// 미할당 Liner 뷰의 특정 Chat 대화 화면 (/liner/c/[chatId]).
// 소유권: chat.userId === user.id 확인. chat.projectId는 null이어야 미할당 라우트.
//   - projectId가 있으면 /p/[pid]/liner/c/[chatId]가 올바른 경로이므로 404.
// design/features/4-asset.md §2-2.

import { notFound } from 'next/navigation'

import { ChatView } from '@/components/chat/chat-view'
import { getRequiredSession } from '@/lib/auth-session'
import type { ClientMessage } from '@/lib/chat/message-types'
import type { Citation } from '@/lib/chat/sse-types'
import { getChatWithMessages } from '@/lib/queries/chat'

export default async function UnassignedChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { chatId } = await params
  const { user } = await getRequiredSession()

  const chat = await getChatWithMessages(chatId)
  if (!chat || chat.userId !== user.id || chat.projectId !== null) {
    notFound()
  }

  const initialMessages: ClientMessage[] = chat.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      citations: m.citations ? (m.citations as unknown as Citation[]) : undefined,
    }))

  return <ChatView chatId={chatId} projectId={null} initialMessages={initialMessages} />
}
