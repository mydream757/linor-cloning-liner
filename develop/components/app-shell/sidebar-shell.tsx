'use client'

// 사이드바의 접힘/펼침 상태를 관리하는 클라이언트 래퍼.
// Sidebar(Server)가 이 컴포넌트에 children을 넘겨 server-first 원칙을 유지한다.
// 접힘 state는 useState로만 관리 — 새로고침 시 펼침 복귀 (D2-5 합의).

import { useState } from 'react'

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-border-default bg-bg-secondary transition-[width] duration-150 ease ${
        collapsed ? 'w-12' : 'w-65'
      }`}
      aria-label="앱 사이드바"
    >
      {collapsed ? (
        <div className="flex h-12 items-center justify-center">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-expanded={false}
            aria-controls="sidebar-content"
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover"
            aria-label="사이드바 열기"
          >
            <HamburgerIcon />
          </button>
        </div>
      ) : (
        <div id="sidebar-content" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-12 items-center justify-between px-2">
            <span className="px-2 text-sm font-semibold text-text-primary">
              linor
            </span>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-expanded={true}
              aria-controls="sidebar-content"
              className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover"
              aria-label="사이드바 접기"
            >
              <CollapseIcon />
            </button>
          </div>
          {children}
        </div>
      )}
    </aside>
  )
}

function HamburgerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  )
}

function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M11 3L6 8l5 5" />
    </svg>
  )
}
