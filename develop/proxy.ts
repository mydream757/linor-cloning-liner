// 전역 인증 게이트 (ADR-0011).
// Next.js 16에서 middleware.ts → proxy.ts로 rename됨.
// JWT 토큰 존재 여부만 확인. 소유권 검증은 layout에서 수행.

import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request })

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 제외 경로:
     * - /login          로그인 페이지 자체
     * - /api/auth        NextAuth API 라우트 (로그인/콜백/CSRF 등)
     * - /_next           Next.js 내부 에셋 (static, image optimization 등)
     * - /favicon.ico     파비콘
     */
    '/((?!login|api/auth|_next|favicon\\.ico).*)',
  ],
}
