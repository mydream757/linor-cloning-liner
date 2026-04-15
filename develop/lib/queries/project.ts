// Project 조회 유틸. React.cache로 래핑해 같은 요청 안에서의 중복 호출을
// 자동 dedupe한다. ADR-0007 참조.
//
// 호출 지점 예시:
// - app/p/[projectId]/layout.tsx: 현재 Project 검증 + 사이드바 강조
// - 사이드바의 ProjectList: 전체 목록
// - 뷰 page들: 필요 시 현재 Project 메타데이터

import { cache } from 'react'

import { prisma } from '@/lib/prisma'

export const getProject = cache(async (projectId: string) => {
  return prisma.project.findUnique({ where: { id: projectId } })
})

export const listProjectsByUser = cache(async (userId: string) => {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
})
