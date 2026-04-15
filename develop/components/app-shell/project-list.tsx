// Project 목록 (Server Component).
// - listProjectsByUser는 React.cache 래핑. layout/page에서 다시 불러도 dedupe (ADR-0007).
// - 항목 라벨은 Next.js <Link>로. 클릭 시 해당 Project의 현재 뷰(D2에선 /liner 고정)로 이동.
// - rename 인라인 편집·컨텍스트 메뉴·삭제는 D4·D7에서 도입.

import Link from 'next/link'

import { getDevUser } from '@/lib/dev-user'
import { listProjectsByUser } from '@/lib/queries/project'

export async function ProjectList({ currentProjectId }: { currentProjectId: string }) {
  const devUser = await getDevUser()
  const projects = await listProjectsByUser(devUser.id)

  if (projects.length === 0) {
    return (
      <p className="px-2 py-2 text-xs text-text-tertiary">
        아직 Project가 없어요
      </p>
    )
  }

  return (
    <ul className="flex flex-col">
      {projects.map((project) => {
        const isActive = project.id === currentProjectId
        return (
          <li key={project.id}>
            <Link
              href={`/p/${project.id}/liner`}
              aria-current={isActive ? 'page' : undefined}
              title={project.name}
              className={`flex h-[30px] items-center gap-2 rounded-[var(--radius-md)] px-2 text-[13px] text-text-primary hover:bg-bg-hover ${
                isActive ? 'bg-bg-active-subtle font-medium' : ''
              }`}
            >
              <span className="truncate">{project.name}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
