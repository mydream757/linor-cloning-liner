'use client'

// Project 트리의 클라이언트 래퍼. 중앙에서 editingId(한 번에 하나의 rename)와
// expandedIds(펼쳐진 Project들) 상태를 보유.
// - 현재 Project는 기본 펼침 (디자인 §2-6 트리 상태 규칙)
// - Project 전환 시 새 현재 Project를 자동 펼침 (세션 내 상태 지속은 없음)

import type { Chat, Project } from '@prisma/client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ProjectItem } from '@/components/app-shell/project-item'

const VIEW_SEGMENTS = ['liner', 'write', 'scholar'] as const

function extractView(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const view = segments[2]
  for (const v of VIEW_SEGMENTS) {
    if (view === v) return v
  }
  return 'liner'
}

type ProjectWithChats = Project & { chats: Chat[] }

export function ProjectListClient({
  projects,
  currentProjectId,
}: {
  projects: ProjectWithChats[]
  currentProjectId: string
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set([currentProjectId]),
  )
  const pathname = usePathname()
  const currentView = extractView(pathname)

  // 현재 Project가 바뀌면 자동 펼침 (기존 펼침 상태는 유지).
  // setState는 effect body가 아닌 마이크로태스크에서 호출 (React 19 규칙 회피).
  useEffect(() => {
    queueMicrotask(() =>
      setExpandedIds((prev) => {
        if (prev.has(currentProjectId)) return prev
        const next = new Set(prev)
        next.add(currentProjectId)
        return next
      }),
    )
  }, [currentProjectId])

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <ul className="flex flex-col gap-1">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectItem
            project={project}
            chats={project.chats}
            currentView={currentView}
            isActive={project.id === currentProjectId}
            isEditing={editingId === project.id}
            isExpanded={expandedIds.has(project.id)}
            onStartEdit={() => setEditingId(project.id)}
            onStopEdit={() => setEditingId(null)}
            onToggleExpand={() => toggleExpand(project.id)}
          />
        </li>
      ))}
    </ul>
  )
}
