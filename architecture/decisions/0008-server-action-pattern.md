---
adr: 0008
title: Server Action 기본 패턴 (zod + result 객체 + lib/actions 위치)
status: Accepted
date: 2026-04-15
---

# ADR-0008: Server Action 기본 패턴 (zod + result 객체 + lib/actions 위치)

## Status

Accepted

## Context

기능 1 Developer 단계 D3에서 Next.js 16의 Server Actions를 처음 도입한다. Project CRUD(`createProject`, `renameProject`, `deleteProject`)를 시작으로 기능 3·4·5·6에서도 Chat·Message·Asset의 mutation을 Server Action으로 다룰 예정이다. 첫 도입 시점에 패턴을 확정해 두면 후속 기능 전반이 일관된 스타일을 따라가고, 리팩터 시 일괄 수정이 가능해진다.

결정 대상 세 가지:

1. **입력 검증 방식** — zod 같은 스키마 라이브러리 vs 수동 검증
2. **반환 형식** — `void` + redirect/throw vs result 객체 `{ ok, data | error }`
3. **파일 위치** — `app/actions/` vs `lib/actions/`

revalidation 전략은 범위가 넓고 미래 마이그레이션 경로까지 담아야 하므로 **별도 [ADR-0009](0009-revalidation-strategy.md)**로 분리했다.

## Decision

**1. 입력 검증은 `zod`로.** 모든 Server Action은 진입점에서 `schema.safeParse(input)`로 검증하고, 실패 시 result의 error로 반환한다.

**2. 반환은 result 객체** — `{ ok: true, data: T } | { ok: false, error: ActionError }`. 에러는 필드별 메시지를 포함한 구조화된 객체. client는 `useActionState`로 이 결과를 받아 form 아래 인라인 에러를 표시한다.

**3. 파일은 `develop/lib/actions/`에 엔티티별로 분리.** 예:
- `lib/actions/project.ts` — `createProject`, `renameProject`, `deleteProject`
- `lib/actions/last-location.ts` — `setLastLocation`
- `lib/actions/chat.ts` — (기능 3에서)
- `lib/actions/asset.ts` — (기능 4에서)

파일 최상단에 `'use server'` 디렉티브.

### 골격 예시

```ts
// lib/actions/project.ts
'use server'

import { z } from 'zod'

import { getDevUser } from '@/lib/dev-user'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/lib/actions/types'

const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project 이름을 입력해주세요').max(100, '100자 이하로 입력해주세요'),
})

export async function createProject(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createProjectSchema.safeParse({
    name: formData.get('name'),
  })
  if (!parsed.success) {
    return { ok: false, error: { fields: parsed.error.flatten().fieldErrors } }
  }

  const devUser = await getDevUser()
  const project = await prisma.project.create({
    data: { userId: devUser.id, name: parsed.data.name },
  })

  // revalidation은 ADR-0009 참조
  return { ok: true, data: { id: project.id } }
}
```

### 공용 타입

```ts
// lib/actions/types.ts
export type ActionError = {
  message?: string
  fields?: Record<string, string[] | undefined>
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError }
```

## 고려한 대안

### 1. 입력 검증: zod vs 수동

| 축 | zod (채택) | 수동 |
|---|---|---|
| 타입 추론 | `z.infer<typeof schema>`로 input·output 타입 동시 확보 | 수동 작성, 드리프트 위험 |
| 선언적 표현 | `z.string().trim().min(1).max(100)` 한 줄 | `if (!name || name.trim() === '' || name.length > 100) { ... }` |
| 에러 표현 | `flatten().fieldErrors`로 field-level 에러가 자동 구조화 | 수동 구조화 |
| 학습 곡선 | 새 devDep | 없음 |
| 번들 영향 | Server Action은 서버 전용이라 client 번들에 영향 없음 | — |
| 재사용 | Route Handler·Server Action·외부 API 검증에 동일 스키마 재사용 가능 | 재사용이 깨짐 |

수동 검증은 input이 1~2개 필드일 때는 충분히 간단하지만, 기능 3·4·5의 Chat/Message/Asset은 필드가 많고 nested 구조가 등장한다. 첫 단계에서 zod를 박아두는 편이 일관성 비용이 낮다.

### 2. 반환 형식: result 객체 vs void/throw/redirect

| 축 | result 객체 (채택) | void + redirect | throw |
|---|---|---|---|
| 에러 표시 | form 아래 인라인 | 어려움(redirect 후 에러 맥락 사라짐) | error boundary → 전체 화면 |
| `useActionState` 호환 | ✅ native | △ | ❌ |
| 성공 redirect | action 끝에 명시적 `redirect()` | 같음 | 같음 |
| 코드 소음 | 약간의 보일러플레이트 | 가장 가벼움 | 가장 가벼움 |

디자인 명세(design/features/1-app-shell.md)가 "생성/rename/삭제 실패 시 모달 또는 form 안에 인라인 에러 표시"를 요구한다. throw는 전체 화면 error boundary로 올라가 이 요구사항을 충족할 수 없다. void + redirect는 성공 시에만 유효하고 에러 표시가 까다롭다. result 객체가 가장 자연스럽다.

React 19의 `useActionState(action, initialState)` hook은 이 패턴의 native 지원이라, 클라이언트 폼 구현이 매우 간결해진다.

### 3. 위치: app/actions vs lib/actions

| 축 | lib/actions (채택) | app/actions |
|---|---|---|
| `lib/queries/`와의 대칭 | ✅ | ❌ |
| route 파일과의 혼동 | 없음 | `app/` 내부에 있어 page/layout과 섞임 |
| 재사용 가능성 | 같음 (Server Action은 경로에 묶이지 않음) | 같음 |
| create-next-app 관례와 일치 | 부분 | 부분 |

Server Action은 "특정 라우트의 핸들러"가 아니라 **어느 라우트에서든 import해 호출 가능한 서버 함수**다. 그래서 `lib/` 하위가 개념적으로 맞다. `lib/queries/`(조회) + `lib/actions/`(변경) 대칭도 유지된다.

## 결과

### Pros
- **타입 안전**: zod schema가 Server Action 함수 시그니처와 client 호출부의 타입을 자동으로 맞춤
- **일관된 에러 경로**: 모든 Server Action이 `ActionResult<T>`를 반환하므로 client 쪽에서 동일한 컴포넌트 패턴으로 에러 표시 가능
- **재사용성**: `lib/actions/`가 경로 독립이라 여러 page·컴포넌트에서 같은 action을 호출 가능
- **학습 가치**: Next.js 16 + React 19의 `useActionState` 정공법을 따라감
- **낮은 번들 영향**: zod는 server-only 코드에만 쓰이므로 client 번들에 포함되지 않음

### Cons
- **약간의 보일러플레이트**: `{ ok, data | error }` result 객체가 `void` 대비 줄 수가 늘어남. `ActionResult<T>` 타입 별칭으로 흡수.
- **zod 새 의존성**: devDep이 아니라 런타임 dep (Server Action 실행 시 사용). 4MB 정도.
- **schema 중복 가능성**: 같은 검증이 Route Handler·폼 client-side 검증 등 여러 곳에서 필요해지면 스키마를 재사용해야 함. 재사용은 자연스럽지만 "어디에 둘 것인가"가 후속 결정 대상이 될 수 있음 (잠재적 `lib/schemas/` 디렉터리).

## 연관 결정

- [ADR-0005: Prisma 파일 위치와 Client 싱글톤](0005-prisma-infrastructure.md) — Server Action은 `lib/prisma.ts`의 client를 사용
- [ADR-0007: React.cache로 layout·page 공유 쿼리 dedup](0007-react-cache-for-layout-page-shared-queries.md) — Server Action은 mutation, `React.cache`는 read. 둘이 보완 관계
- [ADR-0009: Revalidation 전략](0009-revalidation-strategy.md) — Server Action 이후 캐시 무효화는 이 문서에서 따로 다룸
- `develop/CLAUDE.md`의 "서버/클라이언트 경계 (핵심 원칙)" — Server Action은 server-first 원칙의 핵심 도구

## References

- React 19 `useActionState`: https://react.dev/reference/react/useActionState
- zod: https://zod.dev
