---
adr: 0007
title: Layout·page 공유 서버 쿼리를 React.cache로 중복 제거
status: Accepted
date: 2026-04-15
---

# ADR-0007: Layout·page 공유 서버 쿼리를 React.cache로 중복 제거

## Status

Accepted

## Context

Next.js 16 App Router에서는 같은 요청 안에서 layout과 그 하위 page가 동일한 데이터를 각각 참조하는 경우가 흔하다. 기능 1이 전형이다.

- `app/p/[projectId]/layout.tsx`는 사이드바 강조·헤더 표시·Project 존재 검증을 위해 현재 Project 레코드가 필요
- `app/p/[projectId]/liner/page.tsx`(그리고 write/scholar)도 동일 Project의 name·메타데이터가 필요할 수 있음

Pages Router의 `getServerSideProps` 같은 단일 진입점이 없기 때문에, layout 합성이 깊어질수록 **같은 요청 내 중복 쿼리가 자연스럽게 발생**한다. 이를 어떻게 처리할지 결정한다.

## Decision

**`React.cache`로 래핑된 쿼리 유틸을 `develop/lib/queries/`에 엔티티별 파일로 둔다.**

- `lib/queries/project.ts` → `getProject(projectId: string)`, 필요 시 `listProjectsByUser(userId: string)`
- 구현 개요:
  ```ts
  import { cache } from 'react'
  import { prisma } from '@/lib/prisma'

  export const getProject = cache(async (projectId: string) => {
    return prisma.project.findUniqueOrThrow({ where: { id: projectId } })
  })
  ```
- 호출 규칙:
  - layout과 page가 각자 `getProject(projectId)`를 호출해도 됨
  - React.cache가 **같은 요청(render) 안에서 arguments가 같으면 동일 Promise를 공유**하므로 DB 왕복은 1회
  - 새로운 요청에는 새 캐시. 요청 간 persistence는 **없음** — 요청 경계를 넘는 캐시가 필요하면 `unstable_cache`(요청 간)나 외부 캐시로 별도 고려

## 고려한 대안

### 안 A: 중복 쿼리 허용 (각자 수동 호출)
- Pros: 가장 단순하고 명시적
- Cons: DB 왕복이 layout 합성 깊이에 비례해 증가. 기능 1의 Project 같은 경량 쿼리는 체감이 없지만, 기능 3·6에서 Chat·Message·Asset 조합 쿼리로 확장되면 비용이 비선형 증가

### 안 B: layout에서 fetch → Context Provider로 하위에 전달
- Pros: 실행 경로가 명확
- Cons: **React Server Components 간 Context는 작동하지 않는다.** Context Provider는 클라이언트 경계에서만 유효하다. 사용하려면 전체 subtree를 client로 끌어내려야 하는데, 이는 "서버에서 가능한 건 서버에서" 원칙 위반. 기각

### 안 C: React Query 도입 (클라이언트 fetch)
- Pros: 캐시·invalidation·낙관적 업데이트가 강력. 기능 3 이후에는 어차피 도입 예정
- Cons: 기능 1 단계에서는 서버 상태를 클라이언트로 끌어내릴 필요가 없다. 지금 도입하면 Server Component의 자연스러운 데이터 흐름 위에 클라이언트 레이어를 덧씌우는 꼴. 기능 3에서 스트리밍·낙관적 업데이트가 필요해질 때 도입

### 안 D: React.cache 래핑 (채택)
- Pros: 서버에서 완결, 평범한 async function API, 요청 단위 자동 dedupe, 타입 안전
- Cons: **캐시 scope 이해 필요** (요청 단위이지 런타임 전역이 아님), **arguments 참조 동등성**에 의존 (원시 타입 OK, 객체 인자는 참조 안정성 필요)

## 결과

### Pros
- **서버 측 해결**로 원칙 일관성 확보 (server-first RSC boundary)
- **추가 의존성 0**. React 19가 기본 제공하는 기능
- **점진적 확장**이 자연스러움. `getProject` 하나로 시작, 필요 시 `getUser`, `listProjectsByUser` 추가
- **타입 추론이 평범한 함수와 동일** — 호출부에서 `Awaited<ReturnType<typeof getProject>>` 사용 가능

### Cons
- **요청 단위 캐시의 semantic을 모르면 의외의 miss/hit 발생**. 원리는 [`architecture/notes/react-cache-for-rsc-dedup.md`](../notes/react-cache-for-rsc-dedup.md)에 별도 기록
- **invalidation 수동**. Server Action에서 데이터를 바꾼 뒤 `revalidatePath`/`revalidateTag`를 호출하지 않으면 같은 요청 안에선 stale. 이는 RSC 전반의 특성이고 React.cache 탓은 아니지만 함께 주의해야 함
- **복잡 인자 주의**. 객체를 인자로 받으면 참조가 바뀔 때마다 miss. 단일 ID·문자열 기반 조회에 우선 적용하고 복잡 조회는 설계 시 참조 안정성을 고려

## 연관 결정

- [ADR-0005: Prisma 파일 위치와 Client 싱글톤](0005-prisma-infrastructure.md) — 이 유틸들은 `lib/prisma.ts`의 싱글톤을 사용
- [architecture/notes/react-cache-for-rsc-dedup.md](../notes/react-cache-for-rsc-dedup.md) — 원리·언제 효과적인가·주의점
- `develop/CLAUDE.md`의 "서버/클라이언트 경계" 섹션 — 서버 우선 원칙이 이 ADR의 전제

## References

- React 공식 문서: `cache` API (React 19+)
