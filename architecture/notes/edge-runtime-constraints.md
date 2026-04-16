---
title: Edge Runtime 제약과 Middleware에서의 DB 접근 불가 이유
date: 2026-04-16
related_adr: 0011
---

# Edge Runtime 제약과 Middleware에서의 DB 접근 불가 이유

## Edge Runtime이란

Next.js의 Middleware는 **Edge Runtime**에서 실행된다. 이는 CDN 엣지에서 돌아가는 경량 런타임으로, 일반 Node.js 서버 런타임과 사용 가능한 API가 다르다.

## 사용 가능 / 불가능 API

| 구분 | 예시 | Edge Runtime |
|---|---|---|
| Web API | `fetch`, `Request`, `Response`, `crypto.subtle`, `TextEncoder` | ✅ |
| Node.js 네이티브 | `fs`, `path`, `child_process`, `net`, `node:crypto` | ❌ |
| TCP 소켓 기반 DB 클라이언트 | Prisma, `pg`, `mysql2`, TypeORM | ❌ |
| HTTP 기반 DB 클라이언트 | Planetscale serverless, Neon serverless, Supabase REST, Turso HTTP | ✅ |

## 왜 Prisma가 Edge에서 안 되는가

전통적인 DB 클라이언트(Prisma 포함)는 **TCP 소켓**으로 PostgreSQL/MySQL에 직접 연결한다. TCP 소켓은 Node.js의 `net` 모듈이 필요한데, Edge Runtime에는 이 모듈이 없다.

```
[Prisma Client] → TCP 소켓(net 모듈) → [PostgreSQL]
     ❌ Edge Runtime에서 net 모듈 사용 불가

[Neon Serverless] → HTTP fetch() → [Neon HTTP Proxy] → [PostgreSQL]
     ✅ Edge Runtime에서 fetch() 사용 가능
```

> Prisma도 "Prisma Accelerate"라는 HTTP 프록시 서비스를 통해 Edge에서 동작하는 옵션을 제공하지만, 별도 서비스 의존이 생긴다.

## 실용적 함의: Middleware 설계

이 제약은 **Middleware에서 무엇을 할 수 있는가**를 결정한다:

- ✅ **JWT 토큰 확인** — 쿠키에서 토큰을 읽고 복호화하는 것은 Web Crypto API로 가능
- ✅ **redirect / rewrite** — 요청 경로를 변경하는 것은 Web API
- ❌ **DB 조회** — "이 세션이 유효한가?" "이 user가 이 Project의 소유자인가?" 같은 질문은 DB가 필요

따라서 인증 아키텍처에서 역할이 자연스럽게 분담된다:

| 계층 | 런타임 | 할 수 있는 것 | 우리 프로젝트에서의 역할 |
|---|---|---|---|
| **Middleware** | Edge | JWT 토큰 존재 여부 확인 | "로그인했나?" 전역 게이트 |
| **layout / Server Component** | Node.js | DB 조회, Prisma 사용 | "이 데이터의 주인인가?" 소유권 검증 |

## 세션 전략과의 관계

| 세션 전략 | Middleware에서 세션 확인 | 이유 |
|---|---|---|
| **JWT** | ✅ 가능 | 토큰이 쿠키에 자체 포함되어 있어 DB 조회 불필요 |
| **DB 세션** | ❌ 불가 | 세션 ID로 DB를 조회해야 유효성 확인 가능, 그런데 DB 접근 불가 |

이것이 ADR-0011에서 JWT + Middleware 조합을 채택한 기술적 근거 중 하나다.
