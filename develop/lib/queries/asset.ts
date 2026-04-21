// Asset 조회 유틸. React.cache로 같은 요청 안 중복 호출을 dedupe한다 (ADR-0007).
//
// 호출 지점 예시:
// - app/p/[projectId]/references/page.tsx: Project 스코프 Reference 목록
// - (D4 이후) app/references/page.tsx: 미할당 Reference 목록
// - (D6 이후) Chat 입력창 Reference 선택 팝오버

import { cache } from 'react'

import { prisma } from '@/lib/prisma'

// Project 스코프 Reference 목록. 최신순.
export const listReferencesByProject = cache(
  async (userId: string, projectId: string) => {
    return prisma.asset.findMany({
      where: { userId, projectId, type: 'reference' },
      orderBy: { createdAt: 'desc' },
    })
  },
)

// 미할당 Reference 목록 (project_id IS NULL). 최신순. D4에서 진입점이 추가되지만
// Server Action 검증을 위해 D2에서 미리 준비.
export const listUnassignedReferencesByUser = cache(async (userId: string) => {
  return prisma.asset.findMany({
    where: { userId, projectId: null, type: 'reference' },
    orderBy: { createdAt: 'desc' },
  })
})

// 단일 Asset 조회 (소유권은 호출부에서 검증).
export const getAsset = cache(async (assetId: string) => {
  return prisma.asset.findUnique({ where: { id: assetId } })
})
