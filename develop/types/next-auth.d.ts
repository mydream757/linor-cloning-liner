// NextAuth 타입 확장.
// session.user.id를 사용하기 위해 DefaultSession의 user를 확장한다.

import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
  }
}
