// LLM 프로바이더 공통 인터페이스.
// SSE 레이어(Route Handler)와 LLM 호출을 분리하는 최소 추상화.
// 프로바이더가 달라져도 Route Handler의 SSE 변환 로직은 변경 없음.

export interface LLMMessage {
  role: 'user' | 'assistant'
  content: string
}

export type LLMStreamChunk =
  | { type: 'text'; text: string }
  | { type: 'done' }

export interface LLMStreamOptions {
  /** 외부에서 스트림을 취소하기 위한 AbortSignal. 프로바이더 SDK에 그대로 전달된다. */
  signal?: AbortSignal
}

export interface LLMProvider {
  /** 스트리밍 응답을 AsyncIterable로 반환 */
  stream(
    messages: LLMMessage[],
    systemPrompt: string,
    options?: LLMStreamOptions,
  ): AsyncIterable<LLMStreamChunk>
}
