// SSE 이벤트 타입 — 서버·클라이언트 양쪽에서 공유.
// CLAUDE.md: "시작/종료/에러 신호를 명시적으로 구분한다."

export type SSEEvent =
  // stream_start: 서버가 user 메시지 + 빈 assistant 메시지 DB 레코드를 확정한 직후 발사.
  //   - messageId: 이번에 만든 assistant 메시지 ID
  //   - userMessageId: 이 요청의 user 메시지 ID (재시도 시 client가 retryUserMessageId로 재사용 — T-004)
  | { type: 'stream_start'; chatId: string; messageId: string; userMessageId: string }
  | { type: 'text_delta'; text: string }
  | { type: 'stream_end'; messageId: string; content: string; citations: Citation[] }
  | { type: 'stream_error'; error: string; retryable: boolean }

export interface Citation {
  index: number
  title: string
  url?: string
  snippet?: string
}
