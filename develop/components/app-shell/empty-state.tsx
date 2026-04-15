// 빈 상태: Project가 0개이거나 cookie의 last-project가 사라졌을 때 / 에서 표시.
// 디자인: design/features/1-app-shell.md "2. 빈 상태" 섹션.

import { NewProjectForm } from '@/components/app-shell/new-project-form'

export function EmptyState() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-text-primary">
          첫 Project를 만들어보세요
        </h1>
        <p className="text-sm text-text-secondary">
          프로젝트 안에 대화와 자료를 모을 수 있어요
        </p>
      </div>
      <div className="w-full max-w-xs">
        <NewProjectForm autoFocus />
      </div>
    </main>
  )
}
