// POST /api/chat/[chatId]/messages — 메시지 전송 + SSE 스트리밍 응답.
// LLM 프로바이더(Anthropic/Gemini) → Web Streams API → SSE 이벤트로 변환.
// 고수준 추상화(AI SDK) 없이 저수준 직접 구현 (학습 핵심).

import type { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { getServerSession } from '@/lib/auth-session'
import type { Citation, SSEEvent } from '@/lib/chat/sse-types'
import type { LLMMessage } from '@/lib/llm/types'
import { getLLMProvider } from '@/lib/llm/provider'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  ctx: RouteContext<'/api/chat/[chatId]/messages'>,
) {
  // 1. 인증 — 미인증은 401 JSON (throw로 500이 되지 않도록 Route Handler 전용 처리).
  const session = await getServerSession()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  // 2. 입력 검증
  const { chatId } = await ctx.params
  const body = (await request.json()) as { content?: unknown }
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  if (!content) {
    return Response.json({ error: '메시지 내용이 비어있습니다' }, { status: 400 })
  }

  // 3. Chat 소유권 검증 + 히스토리 로드
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!chat || chat.userId !== userId) {
    return Response.json({ error: 'Chat을 찾을 수 없습니다' }, { status: 404 })
  }

  // 4. 사용자 메시지 저장 + 어시스턴트 메시지 레코드 (빈 content, 스트림 완료/중단 시 갱신).
  //    Project 항목의 "+" 버튼으로 생성된 blank Chat("새 대화")은 첫 user 메시지 시 제목 자동 갱신.
  const isFirstMessage = chat.messages.length === 0
  const isDefaultTitle = chat.title === '새 대화'

  await prisma.message.create({
    data: { chatId, role: 'user', content },
  })

  if (isFirstMessage && isDefaultTitle) {
    await prisma.chat.update({
      where: { id: chatId },
      data: { title: content.slice(0, 30).trim() || '새 대화' },
    })
  }

  // 사이드바(Project 트리 + 최근 기록)는 project-scoped layout 캐시를 공유.
  // 제목 자동 갱신이 있었거나, updatedAt이 바뀌어 "최근 기록" 순서가 변해야 하므로 매번 revalidate.
  if (chat.projectId) {
    revalidatePath(`/p/${chat.projectId}`, 'layout')
  }

  const assistantMessage = await prisma.message.create({
    data: { chatId, role: 'assistant', content: '' },
  })

  // 5. LLM API용 메시지 히스토리 구성 (이전 메시지 + 방금 저장한 user 메시지)
  const apiMessages: LLMMessage[] = [
    ...chat.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content },
  ]

  // 6. SSE 스트림 생성
  const stream = createSSEStream(chatId, assistantMessage.id, apiMessages)

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// SSE 이벤트를 문자열로 인코딩
function encodeSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

// LLM 스트림 → SSE ReadableStream 변환
function createSSEStream(
  chatId: string,
  messageId: string,
  messages: LLMMessage[],
): ReadableStream {
  const encoder = new TextEncoder()
  // 클라이언트 중단(ReadableStream.cancel)을 LLM SDK 호출까지 전파하기 위한
  // 내부 AbortController. 중단·에러 경로에서 공통 신호로 쓴다.
  const abortController = new AbortController()
  let fullContent = ''

  return new ReadableStream({
    async start(controller) {
      const safeEnqueue = (event: SSEEvent) => {
        if (abortController.signal.aborted) return
        try {
          controller.enqueue(encoder.encode(encodeSSE(event)))
        } catch {
          // 컨트롤러가 이미 닫힘 — 무시
        }
      }

      try {
        safeEnqueue({ type: 'stream_start', chatId, messageId })

        const provider = getLLMProvider()
        const llmStream = provider.stream(messages, SYSTEM_PROMPT, {
          signal: abortController.signal,
        })

        for await (const chunk of llmStream) {
          if (abortController.signal.aborted) break
          if (chunk.type === 'text') {
            fullContent += chunk.text
            safeEnqueue({ type: 'text_delta', text: chunk.text })
          }
        }

        if (abortController.signal.aborted) {
          // 클라이언트 중단: 받은 만큼 저장(없으면 빈 레코드 정리). stream_end는 보내지 않음.
          await persistPartialOrCleanup(messageId, fullContent)
        } else {
          // 정상 완료: 전체 저장 + stream_end
          const citations = parseCitations(fullContent)
          await prisma.message.update({
            where: { id: messageId },
            data: {
              content: fullContent,
              citations:
                citations.length > 0 ? (citations as unknown as Prisma.InputJsonValue) : undefined,
            },
          })
          safeEnqueue({
            type: 'stream_end',
            messageId,
            content: fullContent,
            citations,
          })
        }
      } catch (err) {
        // 에러 경로: 부분 수신분은 저장, 빈 레코드면 삭제. 중단으로 인한 AbortError도 여기로 올 수 있다.
        await persistPartialOrCleanup(messageId, fullContent)

        if (!abortController.signal.aborted) {
          safeEnqueue({
            type: 'stream_error',
            error: classifyError(err),
            retryable: isRetryableError(err),
          })
        }
      } finally {
        try {
          controller.close()
        } catch {
          // 이미 닫힘
        }
      }
    },

    cancel() {
      // 클라이언트가 연결을 끊으면 LLM SDK 호출까지 abort 전파.
      abortController.abort()
    },
  })
}

// 부분 수신분이 있으면 저장, 없으면 빈 assistant 레코드 삭제.
// 에러·중단 경로에서 공통으로 호출된다 (Blocker 3 대응).
async function persistPartialOrCleanup(messageId: string, partial: string) {
  try {
    if (partial.length > 0) {
      const citations = parseCitations(partial)
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: partial,
          citations:
            citations.length > 0 ? (citations as unknown as Prisma.InputJsonValue) : undefined,
        },
      })
    } else {
      await prisma.message.delete({ where: { id: messageId } })
    }
  } catch {
    // DB 정리 실패는 삼킨다 — 이미 스트림 응답 경로에서 처리됨
  }
}

// 응답 본문에서 [n] 패턴을 파싱하여 Citation 배열 생성.
// 기능 3에서는 stub — 실제 Reference 데이터 연결은 기능 4.
function parseCitations(content: string): Citation[] {
  const pattern = /\[(\d+)\]/g
  const indices = new Set<number>()
  let match

  while ((match = pattern.exec(content)) !== null) {
    indices.add(parseInt(match[1], 10))
  }

  return Array.from(indices)
    .sort((a, b) => a - b)
    .map((index) => ({
      index,
      title: `출처 ${index}`,
      snippet: `출처 ${index}에 대한 stub 정보입니다.`,
    }))
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    return msg.includes('rate limit') || msg.includes('overloaded') || msg.includes('529')
  }
  return false
}

function classifyError(err: unknown): string {
  if (!(err instanceof Error)) return '알 수 없는 오류가 발생했습니다.'

  const msg = err.message.toLowerCase()
  if (msg.includes('authentication') || msg.includes('401') || msg.includes('api key')) {
    return 'API 키가 유효하지 않습니다. 설정을 확인해주세요.'
  }
  if (msg.includes('rate limit') || msg.includes('429')) {
    return '요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.'
  }
  if (msg.includes('overloaded') || msg.includes('529')) {
    return 'AI 서비스가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.'
  }
  if (msg.includes('500') || msg.includes('server')) {
    return 'AI 서비스에 일시적 문제가 발생했습니다.'
  }
  return `오류가 발생했습니다: ${err.message}`
}

// 시스템 프롬프트 — 출처 배지 지시 포함.
// 기능 3에서는 stub Reference 기반. 기능 4에서 실제 Reference 주입 시 확장.
const SYSTEM_PROMPT = `당신은 리노(Linor)라는 AI 리서치 어시스턴트입니다.
사용자의 질문에 정확하고 유용한 답변을 제공합니다.

답변 시 다음 규칙을 따르세요:
- 명확하고 구조화된 답변을 작성합니다.
- 적절한 경우 제목(##)과 목록을 사용합니다.
- 주장이나 사실에 대해 출처가 있다면 [1], [2] 형식으로 인라인 출처 번호를 표기합니다.
- 한국어로 답변합니다.`
