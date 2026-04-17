// session 헬퍼. getDevUser()를 대체한다 (ADR-0006 → ADR-0011).
// Server Component / Server Action / Route Handler에서 사용.

import { getServerSession as _getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

export async function getServerSession() {
  return _getServerSession(authOptions)
}

export async function getRequiredSession() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    throw new Error('Unauthorized: no active session')
  }
  return session
}
