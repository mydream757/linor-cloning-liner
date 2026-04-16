'use client'

// 중앙 집중 editingId를 보유하는 ProjectList의 클라이언트 래퍼. ADR-0010 결정 3.
// 한 번에 하나의 Project만 rename 모드가 될 수 있다.
// D7 검증: usePathname()으로 현재 view segment를 추출해 ProjectItem에 전달.
// Project 전환 시 현재 뷰를 유지한다 (성공 기준 4번).

import type { Project } from '@prisma/client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { ProjectItem } from '@/components/app-shell/project-item'

const VIEW_SEGMENTS = ['liner', 'write', 'scholar'] as const

function extractView(pathname: string): string {
  for (const v of VIEW_SEGMENTS) {
    if (pathname.endsWith(`/${v}`)) return v
  }
  return 'liner'
}

export function ProjectListClient({
  projects,
  currentProjectId,
}: {
  projects: Project[]
  currentProjectId: string
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const pathname = usePathname()
  const currentView = extractView(pathname)

  return (
    <ul className="flex flex-col">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectItem
            project={project}
            currentView={currentView}
            isActive={project.id === currentProjectId}
            isEditing={editingId === project.id}
            onStartEdit={() => setEditingId(project.id)}
            onStopEdit={() => setEditingId(null)}
          />
        </li>
      ))}
    </ul>
  )
}
