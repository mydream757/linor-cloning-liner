---
adr: 0005
title: Prisma 파일 위치와 Client 싱글톤 패턴
status: Accepted
date: 2026-04-15
---

# ADR-0005: Prisma 파일 위치와 Client 싱글톤 패턴

## Status

Accepted

## Context

기능 1의 Developer 단계에서 Prisma를 처음 도입한다. 두 가지 작은 결정이 필요하다.

1. **Prisma 파일이 어디에 위치하는가** — `develop/prisma/` vs 리포지토리 루트 `prisma/`
2. **Prisma Client 인스턴스를 어떻게 생성하는가** — 매 import마다 `new PrismaClient()` vs `globalThis` 기반 싱글톤

둘 다 "관례"에 가까운 결정이지만, 되돌릴 때 스키마·마이그레이션 히스토리와 클라이언트 import 경로를 동시에 건드려야 해서 첫 설정 시점에 확정해 둔다.

## Decision

**1. Prisma 파일 위치**: `develop/prisma/schema.prisma` (Next.js 앱과 동일 디렉터리 구조)

- 스키마: `develop/prisma/schema.prisma`
- 마이그레이션: `develop/prisma/migrations/`
- 시드: `develop/prisma/seed.ts`
- 커맨드는 모두 `develop/` 디렉터리에서 `pnpm prisma ...`로 실행

**2. Prisma Client 싱글톤**: `develop/lib/prisma.ts`에 `globalThis` 기반 싱글톤 패턴을 구현. 모든 Server Component·Server Action·Route Handler는 이 파일에서 client를 import.

```ts
// develop/lib/prisma.ts (대략)
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## 고려한 대안

### 파일 위치

| 안 | 내용 | 평가 |
|---|---|---|
| **A. develop/prisma/ (채택)** | Next.js 앱과 같은 디렉터리에 prisma 디렉터리를 둔다 | Next.js + Prisma 공식 예제 100%가 이 구조. `.env.local`이 `develop/`에 있어 DATABASE_URL 참조가 자연스러움. `pnpm prisma` 명령이 바로 동작. |
| B. 리포 루트 prisma/ | 리포 최상위에 prisma 디렉터리 | `develop/`가 Next.js 앱 루트라는 CLAUDE.md 원칙과 충돌. `.env.local`을 루트에서 읽으려면 `--schema` 플래그를 매번 지정하거나 dotenv-cli 같은 추가 툴링 필요. 이득 없음. |

### Client 생성 패턴

| 안 | 내용 | 평가 |
|---|---|---|
| **A. globalThis 싱글톤 (채택)** | 개발 환경에서 전역에 client를 캐싱 | Next.js hot reload 환경에서 PrismaClient가 다중 생성되며 DB 연결 풀을 소진하는 [공식 문서가 경고하는 함정](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices) 회피. 1줄짜리 관례적 패턴 |
| B. 매 import마다 `new PrismaClient()` | 파일마다 직접 생성 | 개발 중 hot reload 시 프로세스당 수십~수백 개 client 누적. 경고 로그 도배. 비권장. |
| C. 외부 DI 컨테이너 (tsyringe 등) | 의존성 주입 프레임워크 도입 | 1인 프로젝트에 오버엔지니어링. 이 규모에선 import 기반 싱글톤으로 충분. |

## 결과

### Pros
- **공식 관례와 일치.** Next.js + Prisma 공식 문서·예제·블로그 포스트의 거의 100%가 이 구조이며, 이탈해서 얻을 것이 없다.
- **hot reload 안정성.** 개발 중 코드 저장 시마다 client가 중복 생성되는 함정을 원천 차단.
- **경로 단순함.** 모든 DB 접근이 `@/lib/prisma`를 import하는 단일 경로로 귀결되어 grep·리팩터가 쉽다.

### Cons
- **테스트 격리의 약간의 어려움.** 전역 싱글톤이라 단위 테스트에서 client를 mock하기가 약간 번거롭다. 이 프로젝트는 통합 테스트 위주라 실질적 부담은 없다.
- **멀티 DB 연결이 필요해지면 패턴 수정 필요.** 당장 필요 없음.

## 연관 결정

- [ADR-0001: pnpm 패키지 매니저 채택](0001-package-manager-pnpm.md) — `develop/`에서 `pnpm prisma` 커맨드를 실행하는 전제
- [ADR-0002: PostgreSQL을 Docker Compose로 구동](0002-postgresql-via-docker.md) — `develop/docker-compose.yml`의 DB에 이 schema가 연결됨
- [ADR-0006: 개발용 임시 user 시드 전략](0006-dev-user-seeding-strategy.md) — 이 ADR이 확정한 `develop/prisma/seed.ts` 파일에서 구현됨
- [architecture/domain-model.md](../domain-model.md) v0.3 — ID 형식·타임스탬프·hard delete 등 공통 컨벤션이 이 스키마의 기반

## References

- https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
- 리포 내 `architecture/notes/prisma-client-singleton-in-nextjs.md` — 싱글톤 패턴의 원리·이유
