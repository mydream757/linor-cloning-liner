---
adr: 0011
title: 인증 세션 전략과 보호 라우트 패턴
status: Accepted
date: 2026-04-16
---

# ADR-0011: 인증 세션 전략과 보호 라우트 패턴

## Status

Accepted

## Context

기능 2(인증 NextAuth + 데이터 소유권)를 구현하면서 세 가지 기술 결정이 필요하다:

1. **세션 전략**: NextAuth는 JWT(stateless)와 DB 세션(stateful) 두 가지를 지원한다.
2. **보호 라우트 패턴**: 미인증 사용자의 접근을 어디서 차단할 것인가 — Middleware, Next.js 16의 `unauthorized()`, layout 레벨 redirect 중 선택.
3. **로그인 후 원래 페이지 복귀(callbackUrl)**: 직접 구현할지 NextAuth 기본 기능을 쓸지.

이 결정들은 기능 3~6의 모든 Server Action / Server Component / Route Handler에서 "현재 user를 어떻게 얻는가"의 기본 패턴을 확정하므로, 기능 2 Developer 단계 착수 전에 합의한다.

## Decision

### 1. 세션 전략: JWT

NextAuth의 `session: { strategy: "jwt" }` 설정을 사용한다.

**비교**:

| 축 | JWT | DB 세션 |
|---|---|---|
| 추가 테이블 | Account만 (OAuth 링크) | Account + Session + VerificationToken |
| 매 요청 비용 | 토큰 복호화만 (DB 조회 없음) | 세션 테이블 DB 조회 |
| 즉시 무효화 | 불가 (만료까지 유효) | 가능 (DB에서 세션 삭제) |
| Middleware 호환 | ✅ Edge Runtime에서 토큰 파싱 가능 | ❌ Edge Runtime에서 DB 조회 불가 |
| 복잡도 | 낮음 | 중간 (Prisma adapter 의존 증가) |

**채택 근거**:
- 1인 학습 프로젝트라 즉시 무효화가 필요한 시나리오(관리자가 특정 세션 강제 종료 등)가 없다.
- JWT는 Middleware와 자연스럽게 결합되어 Edge Runtime 제약을 우회한다 (보호 라우트 결정 2와 연동).
- Prisma adapter는 User/Account 저장용으로만 사용하고, Session 테이블 오버헤드를 피한다.
- DB 세션의 학습 가치(세션 테이블 관리)는 이 프로젝트의 핵심 학습 목표(SSE 스트리밍, 에디터 통합 등)와 거리가 있다.

### 2. 보호 라우트: Middleware(전역) + layout(소유권 검증) 조합

두 계층을 조합한다:

**Middleware** (`middleware.ts`):
- **역할**: "세션(JWT 토큰)이 존재하는가?" 확인
- **실행 시점**: 요청이 서버에 도달하기 전 (Edge Runtime)
- **불통과 시**: `/login`으로 redirect (callbackUrl 보존)
- **통과 시**: 요청을 그대로 통과

**layout** (`app/p/[projectId]/layout.tsx`):
- **역할**: "이 Project가 현재 user 소유인가?" 검증
- **실행 시점**: RSC 렌더 중 (Node.js Runtime, Prisma 사용 가능)
- **불통과 시**: `notFound()` (기존 기능 1 패턴 유지)

```
요청 → [Middleware: 토큰 있나?]
              │
              ├── 없음 → redirect /login?callbackUrl=...
              │
              └── 있음 → [layout: 이 Project 소유자인가?]
                              │
                              ├── 아님 → notFound()
                              │
                              └── 맞음 → 정상 렌더
```

**고려한 세 가지 안**:

#### 안 A: Middleware(전역) + layout(소유권) 조합 — 채택

Middleware에서 JWT 토큰 존재 여부만 확인하고, layout에서 DB 기반 소유권 검증을 수행한다.

| 축 | 평가 |
|---|---|
| 전역 보호 | ✅ Middleware 한 곳에서 모든 라우트를 보호. 새 라우트 추가 시 누락 위험 없음 |
| 안정성 | ✅ Middleware는 Next.js 12부터 안정화된 기능. production-ready |
| Edge Runtime 호환 | ✅ JWT는 토큰 복호화만 하면 되므로 DB 조회 없이 동작 |
| 기존 코드 변경량 | ✅ layout의 `getDevUser()` → session 헬퍼 교체만. 소유권 검증 패턴(`notFound()`) 유지 |
| 인증·인가 분리 | ✅ 인증(Middleware: "누구인가?")과 인가(layout: "권한이 있는가?")가 명확히 분리 |
| 복잡도 | 🟡 두 곳에서 인증을 다루므로 책임이 분산. 하지만 역할이 다르다(존재 vs 소유) |
| matcher 관리 | 🟡 Middleware의 `config.matcher`에 보호 대상 경로 패턴을 명시해야 함. `/login`, `/_next`, `/api/auth` 등을 제외해야 하므로 matcher가 복잡해질 수 있음 |
| 디버깅 | 🟡 인증 실패가 Middleware에서 발생한 건지 layout에서 발생한 건지 추적 필요 |

#### 안 B: `unauthorized()` + `unauthorized.tsx` 단독

Next.js 16의 실험적 API를 사용. Server Component / Server Action / Route Handler에서 세션이 없으면 `unauthorized()`를 호출하면 `unauthorized.tsx` 파일이 렌더된다.

```ts
// 사용 예
import { unauthorized } from 'next/navigation'

export default async function ProjectLayout({ params }) {
  const session = await getSession()
  if (!session) unauthorized()  // → unauthorized.tsx 렌더 (로그인 UI)
  // ...소유권 검증
}
```

| 축 | 평가 |
|---|---|
| 코드 일관성 | ✅ `notFound()`와 동일한 멘탈 모델. 파일 컨벤션(`unauthorized.tsx`)으로 UI 분리 |
| 단일 위치 판단 | ✅ layout에서 인증 + 인가를 한 곳에서 처리. Middleware 불필요 |
| 학습 가치 | ✅ Next.js 16 신규 API 직접 경험 |
| 안정성 | ❌ `experimental` 상태. `next.config.ts`에 `experimental: { authInterrupts: true }` 필요. 차기 버전에서 API 변경·제거 가능 |
| 전역 보호 보장 | ❌ 각 layout/page에서 `unauthorized()`를 호출해야 함. 새 라우트 추가 시 호출을 빼먹으면 보호되지 않음 |
| RSC 렌더 비용 | 🟡 Middleware 없이 layout까지 도달해야 인증 판단이 이뤄짐. 미인증 요청도 RSC 트리를 타고 들어오므로 불필요한 서버 리소스 사용 |
| root layout 제약 | ❌ Next.js 문서에 명시: "`unauthorized()` cannot be called in the root layout." root에서 보호하려면 결국 다른 방법 병행 필요 |

**기각 이유**: experimental 불안정성 + root layout 제약 + 전역 보호 보장 없음. 세 가지 단점이 동시에 걸린다. 안정화 이후 Middleware를 제거하고 이쪽으로 단순화하는 마이그레이션 경로는 열어둔다.

#### 안 C: layout redirect 단독

Middleware 없이, 보호가 필요한 layout마다 세션을 확인하고 `redirect('/login')`을 호출한다.

```ts
// 각 layout에서
export default async function ProjectLayout({ params }) {
  const session = await getSession()
  if (!session) redirect('/login')
  // ...소유권 검증
}
```

| 축 | 평가 |
|---|---|
| 안정성 | ✅ `redirect()`는 오래된 안정 API. 실험적 요소 없음 |
| 단순함 | ✅ Middleware 파일 없음. 모든 로직이 layout에 집중 |
| DB 접근 | ✅ Node.js Runtime이라 Prisma 자유롭게 사용 가능 |
| 전역 보호 보장 | ❌ 각 layout에 세션 체크를 넣어야 함. 새 라우트나 새 layout 추가 시 누락 위험 |
| RSC 렌더 비용 | 🟡 안 B와 동일 — 미인증 요청도 layout까지 도달해야 판단 |
| 코드 중복 | ❌ 보호할 layout이 늘어나면 동일한 `if (!session) redirect('/login')` 패턴이 반복됨. 공통 wrapper를 만들면 해결 가능하나 추상화 증가 |
| callbackUrl 관리 | 🟡 직접 구현 필요. redirect 시 현재 URL을 쿼리 파라미터로 수동 조립해야 함 |

**기각 이유**: 전역 보호 보장 없음 + 코드 중복. 라우트가 기능 3~6으로 늘어날수록 누락 위험과 중복이 커진다. 현재는 `/p/[projectId]` 하나지만, 향후 API Route Handler 등이 추가되면 관리 부담이 증가.

**채택 근거 (안 A)**:
- Middleware가 전역 보호를 한 곳에서 처리하므로 라우트 추가 시 누락 위험이 없다.
- JWT 선택(결정 1)으로 Edge Runtime에서 토큰 확인이 가능해져 Middleware 사용이 자연스럽다.
- 소유권 검증은 DB 조회가 필수라 Middleware에서 할 수 없고, layout이 적절하다.
- 이 조합은 기존 기능 1의 layout 패턴(`getDevUser()` → `notFound()`)에서 `getDevUser()`만 session으로 교체하면 되는 최소 변경 경로다.
- 안 B(unauthorized)가 안정화되면 Middleware를 제거하고 layout 단독으로 단순화하는 마이그레이션이 가능. 현재는 안정성을 우선한다.

### 3. callbackUrl: NextAuth 기본 기능 사용

NextAuth의 `signIn()` 함수가 `callbackUrl` 파라미터를 기본 지원한다. Middleware에서 redirect 시 쿼리 파라미터로 원래 URL을 전달하면, NextAuth가 로그인 성공 후 해당 URL로 복귀시킨다. 별도 구현 불필요.

## 결과

### Pros
- **JWT + Middleware 조합이 Edge Runtime 제약을 자연스럽게 우회**. DB 조회 없이 토큰만 확인하므로 Middleware에서 빠르게 판단 가능.
- **기존 코드 최소 변경**. layout의 소유권 검증 패턴은 `getDevUser()` → session 헬퍼로 교체만 하면 됨.
- **후속 기능 영향 없음**. 기능 3~6은 session 헬퍼를 통해 `user.id`를 얻고, Middleware가 인증을 보장하므로 개별 인증 코드 불필요.

### Cons
- **JWT 즉시 무효화 불가**. 세션 탈취 시 토큰 만료까지 유효. 1인 사용이라 실질적 위험은 낮지만, 다중 사용자 확장 시 DB 세션으로 전환을 고려해야 함.
- **Middleware + layout 이중 체크**. 두 곳에서 인증을 다루므로 책임이 분산. 다만 역할이 명확히 다르다(존재 vs 소유).
- **`unauthorized()` 채택 보류**. Next.js의 실험적 API를 쓰지 않아 해당 학습 기회는 놓침. 안정화되면 재평가.

## 연관 결정

- [ADR-0006: 개발용 임시 user 시드 전략](0006-dev-user-seeding-strategy.md) — 이 ADR의 결정으로 `lib/dev-user.ts`가 삭제되고 session 기반 헬퍼로 교체됨
- [ADR-0004: 마지막 위치 cookie 저장](0004-last-location-via-cookie.md) — 로그인 후 진입점 결정에 동일 cookie 패턴 활용
- [plan/features/2-auth.md](../../plan/features/2-auth.md) — 기능 2 PRD의 열린 질문 Q1~Q3이 이 ADR로 해소됨
