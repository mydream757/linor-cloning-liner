'use client'

// 로그인 폼. 디자인 명세: design/features/2-auth.md
// - Google 버튼 (GOOGLE_CLIENT_ID 설정 시 서버에서 props로 전달)
// - 개발용 Credentials 폼 (NODE_ENV=development 시 서버에서 props로 전달)
//
// signIn()은 클라이언트에서만 호출 가능하므로 'use client'.

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export function LoginForm() {
  return (
    <div className="flex flex-col gap-2">
      <GoogleButton />
      {process.env.NODE_ENV === 'development' && <DevCredentialsForm />}
    </div>
  )
}

function GoogleButton() {
  const [loading, setLoading] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        setLoading(true)
        signIn('google', { callbackUrl: '/' })
      }}
      disabled={loading}
      className="flex h-12 w-full items-center rounded-lg border border-border-normal bg-bg-secondary text-base font-semibold text-text-primary transition-colors hover:bg-bg-hover disabled:opacity-70"
    >
      <span className="flex w-12 items-center justify-center">
        <GoogleIcon />
      </span>
      <span className="flex-1 text-center pr-12">
        {loading ? '이동 중...' : 'Google로 계속하기'}
      </span>
    </button>
  )
}

function DevCredentialsForm() {
  const [email, setEmail] = useState('dev@local')
  const [password, setPassword] = useState('dev-password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다')
      setLoading(false)
    } else {
      window.location.href = '/'
    }
  }

  return (
    <>
      <div className="my-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-border-normal" />
        <span className="text-xs text-text-secondary">개발용 로그인</span>
        <div className="h-px flex-1 bg-border-normal" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="h-12 rounded-lg border border-border-normal bg-bg-primary px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="h-12 rounded-lg border border-border-normal bg-bg-primary px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
        {error && (
          <p className="text-sm text-text-secondary">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-lg bg-text-primary text-base font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-70"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
