// SSE 이벤트 타입 — 서버·클라이언트 양쪽에서 공유.
// CLAUDE.md: "시작/종료/에러 신호를 명시적으로 구분한다."

export type SSEEvent =
  | { type: 'stream_start'; chatId: string; messageId: string }
  | { type: 'text_delta'; text: string }
  | { type: 'stream_end'; messageId: string; content: string; citations: Citation[] }
  | { type: 'stream_error'; error: string; retryable: boolean }

export interface Citation {
  index: number
  title: string
  url?: string
  snippet?: string
}
