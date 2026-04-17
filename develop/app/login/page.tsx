// 로그인 페이지. 디자인 명세: design/features/2-auth.md 섹션 "1. 로그인 페이지"
// 앱 셸(사이드바+헤더) 없이 독립 렌더.
// - Google OAuth 버튼 (GOOGLE_CLIENT_ID 설정 시)
// - 개발용 Credentials 폼 (NODE_ENV=development 시)

import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth-session'
import { LoginForm } from '@/components/auth/login-form'

export default async function LoginPage() {
  const session = await getServerSession()
  if (session) redirect('/')

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-primary">
      <div className="w-[480px] rounded-[20px] border border-border-normal p-10">
        {/* 로고 placeholder — 추후 실제 로고 에셋으로 교체 */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-overlay text-lg font-bold text-text-primary">
            L
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            리노와 함께 리서치를 시작하세요
          </h1>
        </div>

        <div className="mt-[25px]">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
