// 개발용 임시 user 식별자.
// ADR-0006 참조. 기능 2(NextAuth) 통합 시 이 파일은 삭제되고
// session 기반 lookup 헬퍼로 교체된다.

import { prisma } from './prisma'

export const DEV_USER_EMAIL = 'dev@local'

export async function getDevUser() {
  return prisma.user.findUniqueOrThrow({ where: { email: DEV_USER_EMAIL } })
}
