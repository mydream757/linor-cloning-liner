'use client'

// 사이드바 하단 프로필 영역 (Client Component).
// 디자인 명세: design/features/2-auth.md "2. 사이드바 프로필 영역", "3. 프로필 메뉴"
// - 프로필 버튼: 아바타 + 이름 + chevron
// - 인라인 expand 메뉴: 이메일 표시 + 로그아웃

import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { useState } from 'react'

interface ProfileSectionProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-border-default p-2">
      {/* 인라인 expand 메뉴 */}
      {open && (
        <div className="mb-1 rounded-md bg-bg-primary">
          {/* 이메일 표시 */}
          <div className="px-2 py-2 text-xs text-text-secondary truncate">
            {user.email}
          </div>

          <div className="mx-1 h-px bg-border-normal" />

          {/* 로그아웃 */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex h-8 w-full items-center rounded-md px-2 text-sm text-text-primary hover:bg-bg-hover"
          >
            로그아웃
          </button>
        </div>
      )}

      {/* 프로필 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex h-8 w-full items-center gap-2 rounded-md px-1 hover:bg-bg-hover"
      >
        {/* 아바타 */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-overlay">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={22}
              height={22}
              className="rounded-full"
            />
          ) : (
            <span className="text-xs font-medium text-text-primary">
              {(user.name ?? user.email ?? '?')[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* 이름 */}
        <span className="min-w-0 flex-1 truncate text-left text-sm text-text-primary">
          {user.name ?? user.email}
        </span>

        {/* Chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
