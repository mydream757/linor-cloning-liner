'use client'

// 중앙 집중 editingId를 보유하는 ProjectList의 클라이언트 래퍼. ADR-0010 결정 3.
// 한 번에 하나의 Project만 rename 모드가 될 수 있다.

import type { Project } from '@prisma/client'
import { useState } from 'react'

import { ProjectItem } from '@/components/app-shell/project-item'

export function ProjectListClient({
  projects,
  currentProjectId,
}: {
  projects: Project[]
  currentProjectId: string
}) {
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <ul className="flex flex-col">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectItem
            project={project}
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
