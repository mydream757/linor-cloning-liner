// 클라이언트 측 Message 표현 — Prisma Message에서 system 제외하고 직렬화 가능한 최소 shape.
// RSC 경계를 넘어 Client Component에 전달될 때 이 타입을 사용한다.

import type { Citation } from './sse-types'

export interface ClientMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  // 이 메시지가 생성한 Document Asset ID (시나리오 5-b 포워딩 결과).
  // null/undefined면 아직 Document로 내보내지지 않음. UI는 이 값으로 "내보내기"
  // 버튼 vs "이미 내보내짐 · Document 보기" 링크를 분기한다.
  generatedAssetId?: string | null
}
