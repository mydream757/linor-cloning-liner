---
adr: 0006
title: 개발용 임시 user 시드 전략
status: Accepted
date: 2026-04-15
---

# ADR-0006: 개발용 임시 user 시드 전략

## Status

Accepted

## Context

MVP 1단계(기능 1)는 **인증 없이 단일 임시 user**를 전제로 동작한다. NextAuth는 기능 2에서 도입된다 ([plan/features/1-app-shell.md](../../plan/features/1-app-shell.md) 섹션 5 임시 단일 user 참조). 하지만 도메인 모델([architecture/domain-model.md](../domain-model.md) v0.3)은 모든 엔티티가 `user_id`를 필수로 가지도록 정의되어 있어, 기능 1 구현 시에도 Project·(향후) Chat·Asset이 참조할 수 있는 **유효한 User 레코드 1개가 DB에 존재**해야 한다.

이 임시 user를 어떻게 생성하고 애플리케이션 코드에서 어떻게 식별할지 결정이 필요하다. 결정이 후속 기능에 직접 영향을 주는 포인트:

- **기능 2(NextAuth) 통합 시 교체 경로의 복잡도**: 임시 user를 찾는 방식이 단순할수록 교체 지점이 적다.
- **seed 재실행 안전성**: `pnpm prisma migrate dev`는 seed를 자동으로 실행한다. 여러 번 돌려도 side effect 없어야 한다.
- **마이그레이션 이력 오염 방지**: seed 데이터가 마이그레이션 SQL에 섞이면 환경마다 재적용이 어렵다.

## Decision

**고정 email(`dev@local`) 기반 `upsert`로 임시 user를 시드한다.**

- 시드 파일: `develop/prisma/seed.ts` (ADR-0005가 확정한 위치)
- 시드 코드:
  ```ts
  await prisma.user.upsert({
    where: { email: 'dev@local' },
    update: {},
    create: { email: 'dev@local', name: 'Dev User' },
  })
  ```
- `package.json`의 `prisma.seed` 항목으로 `pnpm prisma migrate dev` 시 자동 실행
- 애플리케이션 코드에서 임시 user를 가져올 때는 동일한 email로 조회:
  ```ts
  const user = await prisma.user.findUniqueOrThrow({ where: { email: 'dev@local' } })
  ```
- 이 email 상수는 `develop/lib/dev-user.ts` (또는 동등) 한 곳에 상수로 둬서 기능 2 교체 시 **이 한 파일만 제거**하면 되도록 한다

## 고려한 대안

세 가지 안을 비교했다.

### 안 A: 고정 ID 문자열 (예: `'dev-single-user'`)

```ts
await prisma.user.upsert({
  where: { id: 'dev-single-user' },
  update: {},
  create: { id: 'dev-single-user', email: 'dev@local' },
})
```

| 축 | 평가 |
|---|---|
| 재실행 안전성 | ✅ upsert로 처리 |
| 기능 2 교체 용이성 | 🟡 ID가 애플리케이션 코드에 하드코딩되면 교체 범위가 넓어짐 |
| 도메인 일관성 | ❌ 다른 모든 ID가 cuid 포맷인데 이것만 다름. "진짜 user"처럼 보이지 않아 코드 읽을 때 혼란 |
| 테스트 시 발견 쉬움 | 🟡 grep으로 찾을 수 있지만, 기능 2 전환 시 누락 위험 |

**기각 이유**: 도메인 일관성이 깨진다. `projectId`는 cuid인데 `userId`는 `'dev-single-user'` 같은 평범한 문자열이면, Prisma 관계 조회 시나 로그 출력 시 이질감이 크다. 이 프로젝트는 "cuid 규약"을 공통 컨벤션으로 박아두었는데 첫 번째 user가 그 규약을 어기는 것은 후속 작업자(미래의 나)에게 혼란을 준다.

### 안 B: cuid 자동 생성 후 `.env.local`에 저장

```bash
# .env.local
DEV_USER_ID=cluxfg9s0000abcdef123456
```

```ts
// seed.ts
const user = await prisma.user.create({
  data: { email: 'dev@local', name: 'Dev User' },
})
console.log(`Set DEV_USER_ID=${user.id} in .env.local`)
```

| 축 | 평가 |
|---|---|
| 재실행 안전성 | ❌ `create`는 재실행 시 unique constraint 위반. `upsert`로 바꾸려면 `where`에 또 다른 식별자가 필요해져 결국 안 C와 합쳐짐 |
| 도메인 일관성 | ✅ 진짜 cuid |
| 기능 2 교체 용이성 | ❌ `.env.local`에 한 줄 + seed script에 출력 로직 + 애플리케이션 코드에서 `process.env.DEV_USER_ID` 참조 — 교체할 지점이 세 곳 |
| 인프라 복잡도 | ❌ 환경변수 추가. `.env.example`에도 주석으로 반영 필요 |
| 개발자 작업 흐름 | ❌ 최초 seed 실행 후 사용자가 `.env.local`을 수동으로 수정해야 함. 자동화하려면 fs 쓰기가 끼어들어 더 복잡해짐 |

**기각 이유**: 재실행 안전성과 작업 흐름 두 측면에서 모두 약하다. 환경변수를 하나 더 들이는 비용이 얻는 이득을 넘어선다.

### 안 C: 고정 email 기반 upsert (채택)

```ts
await prisma.user.upsert({
  where: { email: 'dev@local' },
  update: {},
  create: { email: 'dev@local', name: 'Dev User' },
})
```

| 축 | 평가 |
|---|---|
| 재실행 안전성 | ✅ email이 `@unique`라 upsert가 자연스럽게 성립 |
| 도메인 일관성 | ✅ User의 id는 Prisma가 cuid로 생성. 다른 모든 엔티티와 동일 규약 |
| 기능 2 교체 용이성 | ✅ 애플리케이션 코드는 email로 user를 찾으므로, NextAuth 도입 시 "session.user.email 또는 session.user.id" 기반 lookup으로 교체 — 변경 경로가 명확 |
| 인프라 복잡도 | ✅ 환경변수 없음. 상수 한 곳(`lib/dev-user.ts`)만 유지 |
| 개발자 작업 흐름 | ✅ `pnpm prisma migrate dev`만 실행하면 끝 |
| 테스트 격리 | 🟡 테스트 DB에서도 동일 email을 쓰면 격리가 약해짐. MVP 1단계에는 테스트 격리 요구가 없어 수용 가능 |

**채택 이유**: 세 축(도메인 일관성, 재실행 안전성, 교체 용이성)이 모두 녹색이고, 추가 인프라가 필요 없다.

## 결과

### Pros
- **단 한 파일(`lib/dev-user.ts`)이 "임시 user"의 유일한 흔적**. 기능 2 도입 시 이 파일을 삭제하고 session 기반 lookup 헬퍼로 교체하면 전환이 끝난다.
- **Prisma seed 관례와 정렬**. Next.js + Prisma 예제들의 표준 시드 패턴과 동일해 외부 자료를 그대로 참조 가능.
- **마이그레이션은 깨끗**. seed는 마이그레이션 SQL과 분리되어 있어 배포 환경·테스트 환경에서도 재사용 가능(현재는 로컬 전용이지만 규약은 유지).
- **도메인 모델 규약 준수**. User id가 cuid이므로 전체 스키마의 ID 형식 일관성이 깨지지 않는다.

### Cons
- **테스트 DB에서도 같은 email이 쓰일 수 있어 격리가 약함**. 지금은 테스트가 없고, 도입 시 별도 email(`test@local`)로 분기하면 해결됨.
- **"개발 전용"이라는 의도가 코드에 명시적으로 표시되지 않음**. `lib/dev-user.ts` 파일명과 ADR-0006 참조 주석으로 드러내되, 기능 2 전환 시 제거를 잊지 않기 위해 [기술 부채 레지스터](../tech-debt.md)에 등록할지는 선택. 이 ADR 자체가 해소 트리거를 명시하므로 별도 등록은 생략.
- **여러 임시 user가 필요해지면 패턴 수정 필요**. 지금은 단일 user 가정이 명확해 수용.

## 연관 결정

- [ADR-0005: Prisma 파일 위치와 Client 싱글톤](0005-prisma-infrastructure.md) — 이 ADR의 `seed.ts` 경로와 client import 패턴의 전제
- [architecture/domain-model.md](../domain-model.md) v0.3 — User 엔티티의 email unique 제약, MVP 1단계 임시 user 정책
- [plan/features/1-app-shell.md](../../plan/features/1-app-shell.md) Q4 (임시 user 시드 방식) — 이 ADR로 해소됨. 시드 **방식**은 확정, 실제 **구현 디테일**은 Developer 재량에 두지만 이 ADR이 방향성을 고정

## References

- https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding
- `develop/prisma/seed.ts` (생성 예정)
