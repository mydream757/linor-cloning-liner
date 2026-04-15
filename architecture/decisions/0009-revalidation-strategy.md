---
adr: 0009
title: Revalidation 전략 — path-based 지금, tag-based 나중
status: Accepted
date: 2026-04-15
---

# ADR-0009: Revalidation 전략 — path-based 지금, tag-based 나중

## Status

Accepted

## Context

Server Action이 DB를 변경한 뒤, Next.js의 Data Cache와 Full Route Cache에 남아있는 stale 데이터를 어떻게 무효화할지 결정한다. 이 선택은 실제 mutation의 사용자 체감 정확성(새 Project가 사이드바에 즉시 뜨는가)과 성능(얼마나 많이 다시 렌더하는가)을 직접 좌우한다.

두 방식이 있다.

- **path-based**: `revalidatePath(path, type?)` — 경로 하나(혹은 layout 전체)를 통째로 무효화
- **tag-based**: 데이터에 태그를 붙여 두고 `revalidateTag(tag)`로 해당 태그에 연결된 모든 캐시를 선택적으로 무효화

두 방식은 서로 배타적이지 않다. 공존할 수 있지만 프로젝트 일관성을 위해 "기본"을 하나 정해둔다. 이 ADR은 **현재 페이즈와 미래 페이즈를 모두 담는다** — 기능 1~2는 path-based로 충분하고, 기능 3(SSE 스트리밍) 이후에는 tag-based가 필요할 것으로 예상되기 때문이다. 미래 마이그레이션 시 참조할 코드 예시까지 포함한다.

## Decision

### Phase 1 (현재): `revalidatePath('/', 'layout')` 기본

기능 1~2 범위에서는 모든 mutation Server Action이 성공 직후 **`revalidatePath('/', 'layout')`**를 호출한다. 루트 layout 전체를 재검증하므로 사이드바·Project 목록·현재 Project 메타데이터 등 **모든 UI가 새 DB 상태를 반영**한다.

```ts
// lib/actions/project.ts (Phase 1)
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getDevUser } from '@/lib/dev-user'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/lib/actions/types'

const schema = z.object({
  name: z.string().trim().min(1).max(100),
})

export async function createProject(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = schema.safeParse({ name: formData.get('name') })
  if (!parsed.success) {
    return { ok: false, error: { fields: parsed.error.flatten().fieldErrors } }
  }

  const devUser = await getDevUser()
  const project = await prisma.project.create({
    data: { userId: devUser.id, name: parsed.data.name },
  })

  revalidatePath('/', 'layout')
  redirect(`/p/${project.id}/liner`)
}
```

### Phase 2 (미래): `revalidateTag`로 세분화

기능 3(Liner 뷰의 SSE 스트리밍)과 기능 6(Scholar 3패널) 이후에는 **"Chat 메시지 하나가 바뀌었다고 사이드바 전체가 다시 렌더되는"** 것이 실제 체감 성능에 영향을 주기 시작한다. 이 시점에 tag-based로 점진 마이그레이션한다.

마이그레이션 설계:

1. **쿼리 계층에 태그 부착** — `lib/queries/*.ts`에서 `unstable_cache(fn, keys, { tags: [...] })` 또는 `fetch(url, { next: { tags: [...] } })`의 래퍼로 결과를 캐싱
2. **Server Action은 해당 엔티티의 태그만 무효화** — `revalidateTag('project-list:userId')` 같은 식으로 스코프를 좁힘
3. **태그 네이밍 규약**: `<entity>-<scope>[:scopeId]` 형태. 예: `project-list:userA`, `project:abc`, `chat-messages:chatId`

```ts
// Phase 2 — lib/queries/project.ts
import { unstable_cache } from 'next/cache'

import { prisma } from '@/lib/prisma'

export const listProjectsByUser = (userId: string) =>
  unstable_cache(
    async () =>
      prisma.project.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
    ['listProjectsByUser', userId],
    { tags: [`project-list:${userId}`] },
  )()

export const getProject = (projectId: string) =>
  unstable_cache(
    async () => prisma.project.findUnique({ where: { id: projectId } }),
    ['getProject', projectId],
    { tags: [`project:${projectId}`] },
  )()
```

```ts
// Phase 2 — lib/actions/project.ts
'use server'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
// ...

export async function createProject(/* ... */): Promise<ActionResult<{ id: string }>> {
  // ... zod 검증 ...

  const devUser = await getDevUser()
  const project = await prisma.project.create({
    data: { userId: devUser.id, name: parsed.data.name },
  })

  // 해당 user의 project 목록만 무효화 — 다른 user·다른 캐시는 건드리지 않음
  revalidateTag(`project-list:${devUser.id}`)
  redirect(`/p/${project.id}/liner`)
}

export async function renameProject(/* ... */) {
  // ... 검증 + 소유자 확인 ...
  await prisma.project.update({ where: { id }, data: { name } })

  // 목록 순서·이름이 바뀌었으므로 둘 다 무효화
  revalidateTag(`project-list:${devUser.id}`)
  revalidateTag(`project:${id}`)

  return { ok: true, data: { id } }
}

export async function deleteProject(/* ... */) {
  // ... 검증 ...
  await prisma.project.delete({ where: { id } })

  revalidateTag(`project-list:${devUser.id}`)
  revalidateTag(`project:${id}`)

  return { ok: true, data: { id } }
}
```

### Phase 1 → Phase 2 마이그레이션 트리거

다음 신호가 **하나 이상** 나타나면 Phase 2로 이동한다.

- **실제 체감**: Chat 메시지 스트리밍 중 사이드바가 깜빡이거나 무관한 데이터가 다시 fetch됨
- **측정값**: 하나의 mutation 이후 `revalidatePath` 한 번이 N개 이상의 쿼리를 다시 실행 (N의 기준선은 기능 3 완료 시 재평가, 잠정 10개 이상)
- **무관한 state loss**: mutation 이후 다른 영역의 로컬 UI 상태가 의도치 않게 리셋
- **기능 3 완료 직후 의무 재검토**: SSE 스트리밍이 돌기 시작하면 cache pressure가 달라지므로 이 시점에 반드시 이 ADR을 다시 읽고 마이그레이션 여부 판단

마이그레이션은 **한 번에 전부 바꾸지 않는다**. 기능 3의 hot path(Chat 메시지 fetch·mutation)만 먼저 tag 기반으로 전환하고, 나머지는 path-based를 유지하는 **하이브리드 과도기**를 거친다.

## 고려한 대안

### 안 A: 처음부터 tag-based

Pros: 처음부터 일관된 전략. 미래 전환 비용 0.
Cons: 기능 1~2에서 체감 이득이 없는데 **쿼리 계층에 캐싱 래퍼**(`unstable_cache`)를 도입해야 한다. `unstable_cache`는 이름 그대로 API가 아직 완전히 안정화되지 않았고, React Server Component의 자연스러운 데이터 흐름 위에 한 층을 더 얹는 모양이라 초기 학습·디버깅 비용이 있다. 이득 대비 비용이 맞지 않음 — 기각.

### 안 B: 처음부터 path-based, 끝까지 path-based

Pros: 가장 단순. 규칙 하나만 기억.
Cons: 기능 3 이후 cache pressure가 실제로 올라올 때 과도한 재검증이 UX를 해친다. 이 프로젝트의 핵심 가치 2번(실시간 UX 완성도)과 충돌. 기각.

### 안 C (채택): Phase 1 path-based, Phase 2에서 필요 시 tag-based로 점진 마이그레이션

Pros: 현재 복잡도 최소, 미래 확장 여지 보존, 마이그레이션 지점이 명확
Cons: 마이그레이션 시 쿼리 계층과 action 계층 양쪽에 손을 대야 함. 이 ADR이 미리 예시 코드를 담아 충격을 줄임.

## 결과

### Pros
- **지금 단순**: 기능 1~2에서는 `revalidatePath('/', 'layout')` 한 줄이면 충분
- **미래 대비**: tag 네이밍 규약과 마이그레이션 코드가 이 문서에 박혀 있어 Phase 2 시점에 "어떻게 시작할지" 망설임 없음
- **점진 이동 가능**: 일괄 교체가 아니라 hot path부터 하이브리드로 전환
- **학습 가치**: `unstable_cache`, `revalidateTag` 같은 Next.js App Router의 고급 cache 기능을 실사용 근거로 접할 기회

### Cons
- **Phase 2 진입 기준이 주관적**: "느껴진다"에 기대는 부분이 있음. 기능 3 완료 후 의무 재검토로 보완
- **두 방식이 섞이는 기간이 생김**: 과도기엔 일부 action이 path-based, 일부가 tag-based인 상태. 혼동을 막기 위해 action 파일 상단 주석으로 어느 방식을 쓰는지 명시
- **`unstable_cache`의 API 안정성**: 이름대로 experimental. 실제 마이그레이션 시점에 API가 안정화됐는지 재확인 필요

## 연관 결정

- [ADR-0007: Layout·page 공유 쿼리를 React.cache로 dedup](0007-react-cache-for-layout-page-shared-queries.md) — `React.cache`는 **요청 내** dedup, `unstable_cache`/`revalidateTag`는 **요청 간** 캐싱. 두 층은 독립적으로 공존 가능
- [ADR-0008: Server Action 기본 패턴](0008-server-action-pattern.md) — 이 ADR의 revalidation 호출 지점은 Server Action 내부
- architecture/notes/react-cache-for-rsc-dedup.md — 요청 내 vs 요청 간 캐시의 구분 설명

## References

- Next.js 공식 문서: `revalidatePath`, `revalidateTag`, `unstable_cache`
- React 19 Server Actions
