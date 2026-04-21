'use client'

// 빈 상태 (Chat 0개) 전용 composer.
// 제출 시 createChat Server Action → chatId 확보 → pending 메시지 저장 → 새 Chat 라우트로 이동.
// 새 라우트의 ChatView가 sessionStorage에서 pending을 한 번 fire 후 정리한다.

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { createChat } from '@/lib/actions/chat'

import { ChatComposer } from './chat-composer'

interface Props {
  // 미할당 Chat 생성 시 null. Project 스코프일 때만 ID 전달.
  projectId: string | null
}

export function EmptyComposer({ projectId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSend = (content: string) => {
    setError(null)
    startTransition(async () => {
      const title = content.slice(0, 30).trim()
      const result = await createChat({
        projectId: projectId ?? undefined,
        title,
      })
      if (!result.ok) {
        setError(result.error.message ?? '대화를 시작할 수 없습니다')
        return
      }
      const { id: chatId, projectId: createdProjectId } = result.data
      try {
        sessionStorage.setItem(`pending:${chatId}`, content)
      } catch {
        // sessionStorage 접근 불가 — 메시지는 유실되지만 Chat은 생성됨
      }
      const nextUrl = createdProjectId
        ? `/p/${createdProjectId}/liner/c/${chatId}`
        : `/liner/c/${chatId}`
      router.push(nextUrl)
    })
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <h1 className="text-heading-1 mb-20 text-text-primary">무엇이든 물어보세요</h1>
      <div className="w-full max-w-180">
        {error && <p className="text-body mb-3 text-text-secondary">{error}</p>}
        <ChatComposer onSend={handleSend} disabled={isPending} autoFocus />
      </div>
    </div>
  )
}
