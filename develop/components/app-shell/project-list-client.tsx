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

function extractRoute(pathname: string): { projectId: string | null; view: string } {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] === 'p' && segments[1]) {
    const view = segments[2]
    const matched = VIEW_SEGMENTS.find((v) => v === view) ?? 'liner'
    return { projectId: segments[1], view: matched }
  }
  // 미할당 — /[view]/... 또는 기타
  const view = segments[0]
  const matched = VIEW_SEGMENTS.find((v) => v === view) ?? 'liner'
  return { projectId: null, view: matched }
}

type ProjectWithChats = Project & { chats: Chat[] }

export function ProjectListClient({ projects }: { projects: ProjectWithChats[] }) {
  const pathname = usePathname()
  const { projectId: currentProjectId, view: currentView } = extractRoute(pathname)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(currentProjectId ? [currentProjectId] : []),
  )

  // 현재 Project가 바뀌면 자동 펼침 (기존 펼침 상태는 유지).
  // 미할당 라우트(currentProjectId=null)에서는 아무 것도 펼치지 않는다.
  useEffect(() => {
    if (!currentProjectId) return
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
