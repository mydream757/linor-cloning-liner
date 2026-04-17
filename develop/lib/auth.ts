// NextAuth 설정. ADR-0011, ADR-0012 참조.
// - JWT 세션 전략 (stateless)
// - Google OAuth (기본) + 개발용 Credentials (NODE_ENV=development에서만)
// - Prisma adapter (User/Account 저장용)

import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { compareSync } from 'bcryptjs'
import type { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

import { prisma } from '@/lib/prisma'

const providers: AuthOptions['providers'] = []

// Google OAuth — GOOGLE_CLIENT_ID가 설정된 경우에만 활성화.
// 개발 환경에서 Google Cloud 설정 없이도 Credentials로 로그인 가능 (ADR-0012).
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  )
}

// 개발용 Credentials — 개발 환경에서만 활성화.
// seed 계정(dev@local / dev-password)으로 즉시 로그인 가능.
if (process.env.NODE_ENV === 'development') {
  providers.push(
    CredentialsProvider({
      name: '개발용 로그인',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user?.hashedPassword) return null

        const isValid = compareSync(credentials.password, user.hashedPassword)
        if (!isValid) return null

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  )
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // JWT에 user.id를 포함시켜 session에서 접근 가능하게 한다.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    // session 객체에 user.id를 노출한다.
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
