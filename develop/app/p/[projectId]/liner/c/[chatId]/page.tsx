// Liner 뷰의 특정 Chat 대화 화면.
// 소유권: 상위 layout이 Project를 검증, 여기서 Chat의 userId + projectId 일치를 추가 검증.

import { notFound } from 'next/navigation'

import { ChatView } from '@/components/chat/chat-view'
import { getRequiredSession } from '@/lib/auth-session'
import type { ClientMessage } from '@/lib/chat/message-types'
import type { Citation } from '@/lib/chat/sse-types'
import { getChatWithMessages } from '@/lib/queries/chat'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ projectId: string; chatId: string }>
}) {
  const { projectId, chatId } = await params
  const { user } = await getRequiredSession()

  const chat = await getChatWithMessages(chatId)
  if (!chat || chat.userId !== user.id || chat.projectId !== projectId) {
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

  return <ChatView chatId={chatId} initialMessages={initialMessages} />
}
