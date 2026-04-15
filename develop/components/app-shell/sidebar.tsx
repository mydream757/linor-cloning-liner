// 사이드바 (Server Component).
// - 260px 고정폭. 접힘 인터랙션은 D5에서 도입 (client 토글).
// - 상단: 앱 라벨, "새 Project" 버튼(정적, D3에서 활성화)
// - 본문: Project 목록 (별도 ProjectList로 분리, ADR-0007 React.cache 패턴과 정렬)
// - 디자인: design/features/1-app-shell.md

import { ProjectList } from '@/components/app-shell/project-list'

export function Sidebar({ currentProjectId }: { currentProjectId: string }) {
  return (
    <aside
      className="flex w-[260px] shrink-0 flex-col gap-3 border-r border-border-default bg-bg-secondary px-2 py-3"
      aria-label="앱 사이드바"
    >
      <div className="px-2 py-1 text-sm font-semibold text-text-primary">
        linor-cloning-liner
      </div>

      <button
        type="button"
        disabled
        className="mx-2 rounded-[var(--radius-md)] bg-surface-overlay px-2 py-2 text-left text-sm text-text-primary disabled:opacity-60"
        title="Project 생성은 기능 1 D3에서 구현됩니다"
      >
        + 새 Project
      </button>

      <div className="flex flex-col gap-1">
        <div className="px-2 py-1 text-xs uppercase tracking-wide text-text-secondary">
          프로젝트
        </div>
        <ProjectList currentProjectId={currentProjectId} />
      </div>
    </aside>
  )
}
