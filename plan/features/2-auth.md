---
feature: 인증 (NextAuth) + 데이터 소유권
version: 0.1
last_updated: 2026-04-16
---

# 기능 2: 인증 (NextAuth) + 데이터 소유권

이 문서는 MVP 1차 기능 중 두 번째인 "인증 (NextAuth) + 데이터 소유권"의 기획 명세다. 기능 1이 만든 앱 셸 위에 사용자 식별 계층을 올려서, 후속 기능(3~6)이 "누구의 데이터인가"를 전제할 수 있게 만드는 것이 이 기능의 존재 이유다.

## 1. 문제 정의

### (a) 사용자 식별 부재

기능 1은 임시 dev user(`dev@local`)로 모든 데이터를 소유시켰다. 이 상태에서는:
- 누가 만든 Project/Chat/Asset인지 구분이 불가능하다
- URL을 알면 누구나 다른 사람의 데이터에 접근할 수 있다 (보안 경계 없음)
- 후속 기능이 `user_id` 기반 데이터 격리를 전제하는데, 그 전제가 충족되지 않는다

> **주의**: 이 프로젝트는 1인 학습용이라 실사용 시나리오에서 다중 사용자가 생길 일은 없다. 그러나 도메인 모델이 `user_id`를 모든 엔티티의 필수 필드로 정의하고 있고, NextAuth 학습 자체가 목표이므로 인증은 반드시 필요하다.

### (b) 학습 가치

NextAuth(OAuth 흐름, 세션 관리, 미들웨어 보호)는 실무 Next.js 프로젝트에서 거의 필수적으로 마주치는 영역이다. 이 기능을 통해:
- OAuth 2.0 인가 코드 흐름을 직접 경험한다
- JWT vs DB 세션 전략의 트레이드오프를 판단한다
- Next.js 16의 `unauthorized()` / `unauthorized.tsx` 패턴을 적용한다
- Server Component / Server Action / Middleware 각 계층에서 세션을 다루는 방법을 익힌다

## 2. 사용자 시나리오

### 시나리오 1: 최초 진입 (미인증)
1. 사용자가 앱 루트(`/`)로 진입
2. 인증되지 않은 상태이므로 로그인 페이지를 본다
3. "Google로 로그인" 버튼을 클릭
4. Google OAuth 동의 화면 → 승인
5. 앱으로 돌아와 자동 로그인 완료
6. Project가 없으므로 빈 상태 화면을 본다 (기능 1의 EmptyState)

### 시나리오 2: 돌아온 사용자 (세션 유효)
1. 어제 로그인한 상태로 브라우저를 닫았다
2. 오늘 앱 루트(`/`)로 진입
3. 세션이 유효하므로 로그인 페이지 없이 곧장 마지막 위치로 이동 (기능 1의 cookie 기반 redirect)

### 시나리오 3: 세션 만료
1. 오랫동안 앱을 사용하지 않아 세션이 만료됨
2. 앱에 접근하면 로그인 페이지로 이동
3. 다시 로그인하면 이전 데이터(Project 등)가 그대로 남아 있다

### 시나리오 4: 로그아웃
1. 사이드바 하단의 사용자 프로필 영역에서 로그아웃 클릭
2. 세션 정리 후 로그인 페이지로 이동

### 시나리오 5: 보호된 경로 직접 접근 (미인증)
1. 미인증 상태에서 `/p/abc123/liner` 같은 URL을 직접 입력
2. 로그인 페이지로 리다이렉트
3. 로그인 후 원래 가려던 페이지로 이동

### 시나리오 6: 다른 사용자의 데이터 접근 시도
1. 로그인된 상태에서 다른 사용자의 Project URL을 직접 입력
2. 404 페이지를 본다 (소유권 검증 실패 = "존재하지 않음"으로 처리, 정보 노출 방지)

## 3. 1차 스코프

### 포함

- **NextAuth 설정**
  - Google OAuth 프로바이더 단일 구성
  - 세션 전략: [열린 질문 Q1] JWT vs DB 세션 — Developer 단계에서 결정
  - NextAuth가 요구하는 DB 테이블 (Account, Session 등) 추가
- **로그인 페이지**
  - 별도 페이지(`/login` 또는 NextAuth 기본 경로)
  - "Google로 로그인" 버튼 1개
  - 앱 로고/이름 + 간단한 안내 문구
  - 다크 모드 테마 일관성 유지
- **로그아웃**
  - 사이드바 하단 사용자 프로필 영역에 로그아웃 동선 배치
  - 프로필 표시: Google에서 받은 이름 + 프로필 이미지 (있으면)
- **보호 라우트**
  - 미인증 상태에서 앱의 모든 경로 접근 시 로그인 페이지로 리다이렉트
  - Next.js 16의 `unauthorized()` + `unauthorized.tsx` 패턴 활용 [미검증: experimental 안정성]
  - 또는 Middleware 기반 보호 — Developer 단계에서 결정
- **기존 코드 마이그레이션**
  - `lib/dev-user.ts` 삭제 → session 기반 user 조회 헬퍼로 교체
  - 모든 Server Action에서 `getDevUser()` → session 기반 소유권 검증으로 교체
  - `app/page.tsx`, `app/p/[projectId]/layout.tsx`의 dev user 참조 제거
  - Prisma seed 정리 (dev@local user 시드 제거 또는 조건부 유지)
- **데이터 리셋**
  - 기능 2 완료 후 `prisma migrate reset`으로 dev@local 데이터 초기화
  - 실제 Google 로그인 유저로 새로 시작

### 제외 (비-스코프)

| 제외 항목 | 제외 이유 |
|---|---|
| 복수 OAuth 프로바이더 (GitHub, Kakao 등) | 학습 가치 대비 추가 비용이 낮음. Google 하나로 OAuth 흐름 전체를 경험 가능. 필요 시 프로바이더 배열에 추가만 하면 됨 |
| 이메일/비밀번호 인증 (Credentials) | 비밀번호 해싱, 이메일 인증, 비밀번호 찾기 등 부수 작업이 크고 OAuth 대비 학습 가치가 다른 영역 |
| RBAC / 권한 레벨 | 1인 사용 전제. 모든 데이터는 소유자만 접근 가능하면 충분 |
| 소셜 프로필 자동 동기화 | Google 프로필 변경 시 자동 반영은 과도. 최초 로그인 시 받은 값 사용 |
| 회원 탈퇴 / 계정 삭제 | MVP에서 불필요. 필요 시 DB 직접 삭제로 충분 |
| 다중 디바이스 세션 관리 | 1인 학습 프로젝트 범위 밖 |

## 4. 성공 기준 (Acceptance Criteria)

### 기능 요구
1. 미인증 상태에서 앱의 어떤 경로에 접근해도 로그인 페이지가 표시된다.
2. "Google로 로그인" 버튼을 클릭하면 Google OAuth 동의 화면으로 이동하고, 승인 후 앱으로 돌아온다.
3. 로그인 후 최초 진입이면 빈 상태(EmptyState), 기존 데이터가 있으면 마지막 위치(cookie 기반)로 이동한다.
4. 사이드바에 로그인한 사용자의 이름(또는 이메일)과 프로필 이미지가 표시된다.
5. 로그아웃하면 세션이 정리되고 로그인 페이지로 이동한다.
6. 다른 사용자의 Project URL에 직접 접근하면 404가 표시된다 (기존 동작 유지, 소유권 검증).
7. 기존 기능 1의 모든 동작(Project CRUD, 뷰 전환, cookie 영속)이 session 기반에서도 정상 동작한다.

### 기술·품질 요구
8. `lib/dev-user.ts`가 삭제되고, `getDevUser()` 호출이 코드베이스에 남아있지 않다.
9. 모든 Server Action이 session에서 `user.id`를 얻어 소유권을 검증한다.
10. 타입 체크(`pnpm typecheck`)·린트(`pnpm lint`) 통과.
11. NextAuth 관련 시크릿(`NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)은 `.env.local`에만 존재하고 클라이언트 번들에 노출되지 않는다.

## 5. 도메인·기술 결정 요약

| 결정 | 내용 | 근거 |
|---|---|---|
| OAuth 프로바이더 | Google 단일 | 원본 라이너가 Google 포함 5종 지원. 학습 목적으로 1종이면 충분하고 추가는 설정만으로 가능 |
| 인증 라이브러리 | NextAuth v4.24.13 (이미 설치됨) | Next.js 16 peer dependency 호환 확인됨 (`next: ^16`) |
| User 모델 | 기존 User 스키마 유지 (email, name, image) | 도메인 모델과 일치. NextAuth의 Account/Session 테이블만 추가 |
| 데이터 리셋 | 기능 2 완료 후 `prisma migrate reset` | dev@local 데이터는 기능 1 검증 완료로 의미 소멸 |
| 세션 전략 | JWT (stateless) | [ADR-0011](../../architecture/decisions/0011-auth-session-and-route-protection.md) |
| 보호 라우트 방식 | Middleware(전역 JWT 확인) + layout(소유권 DB 검증) 조합 | [ADR-0011](../../architecture/decisions/0011-auth-session-and-route-protection.md) |
| callbackUrl | NextAuth 기본 기능 사용 (별도 구현 불필요) | [ADR-0011](../../architecture/decisions/0011-auth-session-and-route-protection.md) |
| 로그아웃 UI | 사이드바 하단 프로필 → 인라인 expand 메뉴 → 로그아웃 항목 | [design/features/2-auth.md](../../design/features/2-auth.md) Q4 해소 |

## 6. 의존·후속 영향

### 이 기능의 전제 (기능 1에서 받는 것)
- 앱 셸 레이아웃 (사이드바 + 메인 패널)
- Project CRUD Server Action
- cookie 기반 마지막 위치 복원 패턴
- User/Project Prisma 스키마

### 이 기능이 만드는 것 (후속 기능이 재사용)
- **session 기반 user 식별 헬퍼** — 기능 3~6의 모든 Server Action / Server Component가 이 헬퍼로 현재 user를 얻는다
- **보호 라우트 패턴** — 한 번 확립되면 후속 기능은 별도 인증 코드 없이 패턴을 따르기만 하면 됨
- **NextAuth Account/Session 테이블** — 기능 3(Chat)이 message의 user 귀속에 사용

### 기능 3(Liner 뷰) 도입 시 추가로 고려할 것
- SSE 스트리밍 중 세션 만료 시 처리 (기능 3 범위)
- Chat/Message에 `user_id` 연결 (기능 3 Prisma 마이그레이션에서)

## 7. 열린 질문

| # | 질문 | 미룬 이유 | 결정 시점 | 결정 주체 |
|---|---|---|---|---|
| Q1 | ~~세션 전략: JWT vs DB 세션~~ | → **JWT 채택** | [ADR-0011](../../architecture/decisions/0011-auth-session-and-route-protection.md) | Developer |
| Q2 | ~~보호 라우트 구현 방식~~ | → **Middleware + layout 조합 채택** | [ADR-0011](../../architecture/decisions/0011-auth-session-and-route-protection.md) | Developer |
| Q3 | ~~callbackUrl 구현 방식~~ | → **NextAuth 기본 기능 사용** | [ADR-0011](../../architecture/decisions/0011-auth-session-and-route-protection.md) | Developer |
| Q4 | ~~로그아웃 UI 위치~~ | → **사이드바 하단 프로필 인라인 expand** | [design/features/2-auth.md](../../design/features/2-auth.md) | Designer |

## 8. 구현 단계 (D-stages)

이 섹션은 기능 2를 Developer가 어떤 순서로 구현할지에 대한 로드맵이다. 각 단계는 **구현 전 합의 → 구현 → 결정 문서화 → 커밋**의 공통 사이클을 따른다.

| # | 단계 | 목표 | 포함 | 제외 (이후 단계) |
|---|---|---|---|---|
| D1 | NextAuth 설정 + Prisma 스키마 | 인증 인프라 바닥 | `@next-auth/prisma-adapter` 설치 (Prisma 7 호환 확인), Account 모델 추가, authOptions 설정 (JWT + Google), route handler (`app/api/auth/[...nextauth]/route.ts`), Google OAuth 환경변수 | UI, 기존 코드 수정 |
| D2 | 로그인 페이지 UI | 미인증 사용자의 첫 화면 | 디자인 명세 기반 로그인 페이지, Google 버튼, OAuth 에러 처리, 별도 layout (앱 셸 없음) | 사이드바 프로필 |
| D3 | 보호 라우트 + 기존 코드 마이그레이션 | getDevUser → session 전환 | Middleware 작성 (JWT 토큰 확인), session 헬퍼 생성, Server Action·layout·page의 `getDevUser()` 전면 교체, `lib/dev-user.ts` 삭제 | 사이드바 프로필 UI |
| D4 | 사이드바 프로필 + 로그아웃 | 로그인 후 사용자 식별·로그아웃 동선 | 사이드바 하단 프로필 버튼, 인라인 expand 메뉴 (이메일 + 로그아웃), 로그아웃 기능 | — |
| D5 | 종합 검증 + 데이터 리셋 | 기능 2 전체 검증과 완료 표기 | Golden path + 엣지 케이스 수동 검증, `prisma migrate reset`, 기능 1 회귀 테스트, 타입체크/린트, `features.md` 상태 갱신 | — |

### 순서 근거

D1(인프라) → D2(로그인 UI: D1의 OAuth 설정이 있어야 동작) → D3(기존 코드 전환: D1의 session이 있어야 교체 가능) → D4(프로필 UI: D3에서 session이 활성화되어야 표시할 데이터 있음) → D5(전체 검증).

D2와 D3는 독립적으로 보일 수 있으나, D2에서 로그인이 실제로 동작하는 것을 확인한 뒤 D3에서 기존 코드를 전환하는 것이 안전하다. D3에서 한꺼번에 기존 코드를 바꾸면서 로그인이 안 되면 원인 추적이 어려워진다.

### 변경 규율

이 섹션의 **모든 변경은 반드시 Changelog 엔트리와 근거를 수반**한다. 기능 1에서 확립한 원칙을 동일하게 적용한다.

## Changelog
- 0.2 (2026-04-16): "5. 도메인·기술 결정 요약"에 ADR-0011 결정(JWT, Middleware+layout, callbackUrl) 및 디자인 Q4 해소 결과 반영. "7. 열린 질문" Q1~Q4 전체 해소 완료 표기. "8. 구현 단계 (D-stages)" 섹션 신설 — D1~D5 로드맵과 순서 근거 정의.
- 0.1 (2026-04-16): 초안 작성. Google OAuth 단일 프로바이더, 기존 dev-user 교체, 보호 라우트, 로그인/로그아웃 UX 범위 정의.
