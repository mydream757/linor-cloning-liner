// 전역 인증 게이트 (ADR-0011).
// JWT 토큰 존재 여부만 확인. 소유권 검증은 layout에서 수행.
// Edge Runtime에서 실행되므로 DB 접근 불가 (notes/edge-runtime-constraints.md).

export { default } from 'next-auth/middleware'

export const config = {
  // 보호 대상: 앱의 모든 경로. 아래 경로만 제외.
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
