---
adr: 0012
title: 개발용 Credentials 프로바이더 추가
status: Accepted
date: 2026-04-16
---

# ADR-0012: 개발용 Credentials 프로바이더 추가

## Status

Accepted

## Context

기능 2의 인증은 Google OAuth 단일 프로바이더로 설계되었다(PRD v0.1). 그런데 이 레포지토리를 클론해서 실행해보려는 사람(미래의 자신 포함)에게 Google OAuth는 진입 장벽이 된다:

1. Google Cloud Console에서 프로젝트를 생성해야 한다
2. OAuth 2.0 클라이언트를 만들고 redirect URI를 설정해야 한다
3. `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET`을 `.env.local`에 넣어야 한다

이 과정은 약 5분이지만, "코드를 클론하고 즉시 실행해볼 수 있는가?"의 관점에서는 불필요한 마찰이다. 특히 학습용 프로젝트에서 인증 설정이 첫 번째 벽이 되는 것은 바람직하지 않다.

## Decision

**개발 환경(`NODE_ENV === 'development'`)에서만 활성화되는 Credentials(이메일/비밀번호) 프로바이더를 추가한다.**

### 설계

- **활성 조건**: `process.env.NODE_ENV === 'development'`일 때만 providers 배열에 포함
- **자격증명**: Prisma seed에 생성되는 개발용 user의 고정 이메일/비밀번호 (`dev@local` / `dev-password`)
- **검증 방식**: `authorize` 콜백에서 이메일로 DB 조회 + bcrypt 비밀번호 비교
- **User 모델 변경**: `hashedPassword` nullable 필드 추가. Google OAuth 사용자는 이 필드가 null
- **로그인 UI**: 개발 모드에서만 이메일/비밀번호 입력 폼을 Google 버튼 아래에 표시
- **프로덕션**: Credentials 프로바이더 미포함, Google OAuth만 동작

### 범위 한정

이 결정은 **프로덕션 수준의 Credentials 인증이 아니다**. 아래 항목은 명시적으로 포함하지 않는다:

| 제외 항목 | 이유 |
|---|---|
| 회원가입 UI | seed 계정으로 충분 |
| 비밀번호 찾기 | 개발 환경이라 DB 직접 수정 가능 |
| 이메일 인증 | 개발 환경이라 불필요 |
| 비밀번호 변경 UI | 동일 |

## 고려한 대안

### 안 A: Google OAuth만 + 설정 가이드

| 축 | 평가 |
|---|---|
| 구현 복잡도 | ✅ 추가 코드 없음 |
| 레포 클론 편의성 | ❌ Google Cloud 설정 필수 |
| PRD 변경 | ✅ 없음 |

**기각 이유**: 학습용 프로젝트에서 외부 서비스 설정이 첫 진입 장벽이 되는 것은 과도한 마찰.

### 안 C: 개발 모드 자동 로그인 바이패스

환경변수 `AUTH_BYPASS=true`이면 NextAuth 흐름을 우회하고 seed user로 자동 세션을 생성.

| 축 | 평가 |
|---|---|
| 구현 복잡도 | 🟡 Middleware/layout에 바이패스 분기 추가 |
| 레포 클론 편의성 | ✅ 설정 없이 즉시 사용 |
| 학습 가치 | ❌ NextAuth의 정상 흐름(로그인 페이지 → 세션 생성)을 완전히 우회. 인증 관련 코드가 실행되지 않으므로 학습 효과 감소 |
| 보안 위험 | 🟡 바이패스 환경변수가 프로덕션에 실수로 설정될 위험 |

**기각 이유**: NextAuth 학습이 기능 2의 핵심 목표인데, 흐름 자체를 우회하면 목적에 반한다.

### 안 B: Google OAuth + 개발용 Credentials (채택)

| 축 | 평가 |
|---|---|
| 구현 복잡도 | 🟡 Credentials provider + bcrypt + seed 수정. 범위가 한정적이라 작음 |
| 레포 클론 편의성 | ✅ seed 계정으로 즉시 로그인 가능 |
| 학습 가치 | ✅ NextAuth의 정상 흐름을 그대로 탐. Credentials와 OAuth 두 방식을 한 프로젝트에서 비교 가능 |
| 프로덕션 안전성 | ✅ `NODE_ENV` 조건부라 프로덕션에서 자동 비활성화 |
| PRD 변경 | 🟡 비-스코프에서 제외했던 항목의 축소 버전 도입. 변경 근거와 범위 한정 문서화 필요 |

**채택 이유**: 학습 가치를 유지하면서 레포 클론 편의성을 확보. 범위를 "개발용 최소 Credentials"로 한정하여 PRD에서 우려한 부수 작업(회원가입/비밀번호 찾기/이메일 인증)을 모두 제외.

## 결과

### Pros
- **클론 즉시 실행**: `docker compose up -d && pnpm prisma migrate dev && pnpm dev` 후 seed 계정으로 바로 로그인
- **Google OAuth 없이도 전체 기능 검증 가능**: Google Cloud 설정은 선택사항으로 격하
- **NextAuth 학습 가치 유지**: Credentials provider의 `authorize` 콜백 흐름도 학습 대상

### Cons
- **User 모델에 `hashedPassword` 필드 추가**: OAuth 전용 사용자에게는 null. 스키마가 약간 복잡해짐
- **bcrypt 의존성 추가**: 패키지 하나 증가
- **개발/프로덕션 분기**: providers 배열이 환경에 따라 달라져 코드 경로가 갈림

## 연관 결정

- [ADR-0011: 인증 세션 전략과 보호 라우트 패턴](0011-auth-session-and-route-protection.md) — Credentials에서도 동일한 JWT 세션 전략 적용
- [ADR-0006: 개발용 임시 user 시드 전략](0006-dev-user-seeding-strategy.md) — 기존 `dev@local` seed를 비밀번호 포함으로 확장
