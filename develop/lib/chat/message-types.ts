// 클라이언트 측 Message 표현 — Prisma Message에서 system 제외하고 직렬화 가능한 최소 shape.
// RSC 경계를 넘어 Client Component에 전달될 때 이 타입을 사용한다.

import type { Citation } from './sse-types'

export interface ClientMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}
