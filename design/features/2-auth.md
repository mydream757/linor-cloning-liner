---
feature: 인증 (NextAuth) + 데이터 소유권
version: 0.1
last_updated: 2026-04-16
---

# 인증 (NextAuth) + 데이터 소유권 — 화면 설계

> 참조
> - 기능 명세: [`plan/features/2-auth.md`](../../plan/features/2-auth.md)
> - 전역 토큰: [`../design-tokens.md`](../design-tokens.md)
> - 실측·스크린샷: [`../references/2-auth/`](../references/2-auth/)

이 문서는 기능 2의 **화면 구조·상태·인터랙션·토큰 매핑**을 정의한다. 값(픽셀·컬러)은 [`design-tokens.md`](../design-tokens.md)와 [`references/2-auth/measurements.md`](../references/2-auth/measurements.md)의 단일 진실 소스를 따르며, 여기서는 **토큰 이름과 구조 결정**만 담는다.

## 사용자 흐름

```
[/ 진입 (미인증)]
    │
    └─→ 로그인 페이지 표시
          │
          ├── "Google로 계속하기" 클릭
          │       └─→ Google OAuth 팝업 → 승인
          │             └─→ 콜백 처리 → 세션 생성
          │                   └─→ / (기존 기능 1 흐름: cookie 확인 → redirect 또는 EmptyState)
          │
          └── (미래: 다른 프로바이더 추가 시 여기에 버튼 추가)

[/p/[id]/[view] 진입 (미인증)]
    │
    └─→ 로그인 페이지로 redirect (callbackUrl 보존)
          └─→ 로그인 성공 후 원래 URL로 복귀

[로그인 상태에서의 흐름]
    │
    ├── 사이드바 하단 프로필 버튼 클릭
    │       └─→ 프로필 메뉴 열림 (인라인 expand)
    │             ├── 이메일 표시 (읽기 전용)
    │             └── "로그아웃" 클릭
    │                   └─→ 세션 정리 → 로그인 페이지로 이동
    │
    └── 기존 기능 1 흐름 전부 유지
          (Project CRUD, 뷰 전환, cookie 영속)
```

### 흐름 설명 (정상 경로)

| 단계 | 화면 | 사용자 행동 | 시스템 반응 |
|---|---|---|---|
| 1 | 로그인 페이지 | 페이지 접근 (미인증) | 로그인 UI 렌더 |
| 2 | 로그인 페이지 | "Google로 계속하기" 클릭 | Google OAuth 팝업 또는 redirect |
| 3 | Google 동의 화면 | 계정 선택 + 승인 | NextAuth 콜백 처리 → 세션 생성 |
| 4 | `/` | 자동 이동 | 기능 1 흐름: cookie 확인 → 마지막 위치 또는 EmptyState |
| 5 | `/p/[id]/[view]` | 사이드바 하단 프로필 클릭 | 프로필 메뉴 열림 |
| 6 | 프로필 메뉴 | "로그아웃" 클릭 | 세션 정리 → 로그인 페이지로 이동 |

### 예외·에러 흐름

| 조건 | 처리 방식 |
|---|---|
| Google OAuth 거부 (사용자가 동의 화면에서 취소) | 로그인 페이지로 복귀, 에러 메시지 없음 (일상적 상태) |
| Google OAuth 실패 (네트워크/서버 오류) | 로그인 페이지에 인라인 에러 메시지: "로그인에 실패했습니다. 다시 시도해주세요." |
| 세션 만료 상태에서 페이지 접근 | 로그인 페이지로 redirect (callbackUrl 보존) |
| 세션 만료 상태에서 Server Action 호출 | 에러 응답 → 로그인 페이지로 redirect |

## 화면 구조

### 1. 로그인 페이지

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│                       color-bg-primary 배경                        │
│                                                                   │
│            ┌──────────────────────────────┐                       │
│            │                              │                       │
│            │         [로고 36×36]          │                       │
│            │                              │                       │
│            │   리노와 함께 리서치를 시작하세요    │                       │
│            │                              │                       │
│            │   ┌──────────────────────┐   │                       │
│            │   │  G  Google로 계속하기  │   │                       │
│            │   └──────────────────────┘   │                       │
│            │                              │                       │
│            └──────────────────────────────┘                       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**원본과의 차이**: 원본은 카카오 우선 + "다른 방법으로 계속하기" 접힘 2단계 구조 + 이메일 로그인을 제공한다. 우리는 Google 단일 프로바이더이므로 **접힘 없이 단일 버튼**으로 단순화한다. 이메일 로그인은 제외(PRD 비-스코프).

**구성 요소**:

| 영역 | 요소 | 토큰 | 기능 고유 치수 | 비고 |
|---|---|---|---|---|
| 페이지 | 배경 | `color-bg-primary` | — | 원본과 동일 |
| 컨테이너 | 카드 | `color-bg-primary` + `color-border-normal` (1px border) | 폭 480px, padding 40px, radius 20px | 원본 실측 기반. 배경이 페이지와 동색이라 border로 영역 구분 |
| 로고 | SVG | — | 36×36px | 우리 앱 로고 (별도 에셋 필요) |
| 안내 문구 | 텍스트 | `color-text-primary` | font-size 24px, font-weight 600 | "리노와 함께 리서치를 시작하세요" |
| 로고→문구 간격 | — | — | 12px | 계산값 |
| 문구→버튼 간격 | — | — | 25px | 계산값 |
| Google 버튼 | 버튼 | `color-bg-secondary` bg + `color-border-normal` border + `color-text-primary` text | 폭 398px, 높이 48px, radius `radius-lg` (10px) | 아이콘 24×24, left: 12px absolute. font-size 16px, font-weight 600 |
| 에러 메시지 | 텍스트 | `color-text-secondary` | font-size 13px | OAuth 실패 시에만 표시. 버튼 하단에 배치 |

### 2. 사이드바 프로필 영역 (로그인 후)

기존 사이드바(기능 1) 하단에 프로필 버튼을 추가한다.

```
┌──────────────┐
│              │
│  사이드바      │
│  (기존 구조)   │
│              │
│  + 새 Project │
│  프로젝트       │
│  ● Project A │
│    Project B │
│              │
│──────────────│  ← color-border-default (1px)
│              │
│  Ⓜ 최준영  ⌄  │  ← 프로필 버튼 (아바타 + 이름 + chevron)
│              │
└──────────────┘
```

**원본과의 차이**: 원본은 "친구 초대 배너 + 프로필 + 앱 다운로드"로 하단 고정 영역이 155px이다. 우리는 프로필 버튼만 남기므로 높이가 대폭 축소된다. 플랜 배지("Free")도 제외.

**구성 요소**:

| 영역 | 요소 | 토큰 | 기능 고유 치수 | 비고 |
|---|---|---|---|---|
| 프로필 영역 | 컨테이너 | `color-bg-secondary` (사이드바와 동색) | padding `space-sm` (8px) | 사이드바 하단 고정 |
| 상단 구분선 | border-top | `color-border-default` | 1px | 프로필 영역과 Project 목록 구분 |
| 프로필 버튼 | 버튼 행 | hover: `color-bg-hover` | 높이 32px, 내부 gap `space-sm` (8px) | 클릭 시 메뉴 토글 |
| 아바타 | 이미지 | — | 24×24px 컨테이너, 22×22px 이미지, border-radius 완전 원형 | Google 프로필 이미지. 없으면 이니셜 fallback |
| 이름 | 텍스트 | `color-text-primary` | `text-caption` (13px), font-weight 350 | Google 계정 이름 |
| Chevron | 아이콘 | `color-text-secondary` | — | 메뉴 열림/닫힘 방향 표시 (⌄ ↔ ⌃) |

### 3. 프로필 메뉴 (인라인 expand)

프로필 버튼 클릭 시 사이드바 하단에서 **위쪽으로 expand**되는 인라인 메뉴.

```
┌──────────────┐
│              │
│  사이드바      │
│  (기존 구조)   │
│              │
│──────────────│
│              │
│  mydream757  │  ← 이메일 (읽기 전용, color-text-secondary)
│  @gmail.com  │
│──────────────│  ← 구분선
│  [→ 로그아웃  │  ← 메뉴 항목
│──────────────│
│  Ⓜ 최준영  ⌃  │  ← 프로필 버튼 (chevron 위로)
│              │
└──────────────┘
```

**원본과의 차이**: 원본은 이메일 → 개인 설정 → 테마 → 업그레이드 → 로그아웃 → 스페이스 변경 → 팀 플랜의 7항목 구성(303px). 우리는 **이메일 표시 + 로그아웃만** 남긴다. 개인 설정/테마/업그레이드/스페이스는 MVP 비-스코프.

**구성 요소**:

| 영역 | 요소 | 토큰 | 기능 고유 치수 | 비고 |
|---|---|---|---|---|
| 메뉴 컨테이너 | 영역 | `color-bg-primary` | radius `radius-md` (8px) | 사이드바 내 인라인 |
| 이메일 행 | 텍스트 | `color-text-secondary` | font-size 12px, 항목 높이 32px | 읽기 전용 표시 |
| 구분선 | border | `color-border-normal` | 1px | 이메일과 메뉴 항목 구분 |
| 로그아웃 항목 | 버튼 행 | `color-text-primary`, hover: `color-bg-hover` | 높이 32px, padding 좌 8px 우 4px, font-size 13px, radius 6px | 원본과 동일하게 텍스트 색 차별화 없음 |

### 4. 사이드바 접힘 상태에서의 프로필

사이드바가 접힌 상태(48px)에서는 **프로필 영역이 완전히 숨겨진다** (기능 1의 기존 overflow hidden 동작). 프로필 확인이나 로그아웃을 하려면 사이드바를 펼쳐야 한다. 이는 기능 1의 "접힘은 잠깐 메인 집중 모드" 설계 가정과 일관된다.

## 인터랙션 정의

| 트리거 | 동작 | 피드백 |
|---|---|---|
| 로그인 페이지: Google 버튼 클릭 | NextAuth signIn 호출 → OAuth 흐름 시작 | 버튼 로딩 상태 (스피너 또는 opacity 변경) |
| 로그인 페이지: OAuth 성공 콜백 | 세션 생성 → `/` 또는 callbackUrl로 redirect | 페이지 전환 |
| 로그인 페이지: OAuth 실패/취소 | 로그인 페이지 유지 | 실패 시 에러 메시지 표시, 취소 시 무반응 |
| 사이드바: 프로필 버튼 hover | `color-bg-hover` 배경 | 즉시 |
| 사이드바: 프로필 버튼 클릭 | 프로필 메뉴 토글 (열림 ↔ 닫힘) | chevron 방향 전환 (⌄ ↔ ⌃) |
| 프로필 메뉴: 로그아웃 항목 hover | `color-bg-hover` 배경 | 즉시 |
| 프로필 메뉴: 로그아웃 클릭 | NextAuth signOut 호출 → 세션 정리 → 로그인 페이지로 이동 | 즉시 (confirm 없음 — 로그아웃은 되돌릴 수 있는 행위) |
| 프로필 메뉴: 메뉴 외부 클릭 | 메뉴 닫힘 | chevron 복귀 |
| 보호 경로 직접 접근 (미인증) | 로그인 페이지로 redirect | callbackUrl 쿼리 파라미터에 원래 URL 보존 |

## 상태 매트릭스

| 화면/요소 | default | hover | active | focus | disabled | loading |
|---|---|---|---|---|---|---|
| Google 로그인 버튼 | `color-bg-secondary` + `color-border-normal` | 한 톤 밝게 | — | `color-focus-ring` | — | 스피너 + opacity 0.7 |
| 프로필 버튼 | 투명 | `color-bg-hover` | — | `color-focus-ring` | — | — |
| 프로필 메뉴 항목 (로그아웃) | 투명 + `color-text-primary` | `color-bg-hover` | — | `color-focus-ring` | — | — |

## 디자인 결정 근거

| 결정 | 대안 | 선택 근거 |
|---|---|---|
| 로그인 페이지를 **단일 버튼**으로 단순화 | 원본처럼 2단계 접힘 | 프로바이더가 Google 1개뿐이라 접힘 UX가 무의미. 단순 > 충실한 클론 |
| 프로필 메뉴를 **사이드바 내 인라인 expand**로 | Radix DropdownMenu 팝오버 | 원본이 인라인 expand 방식. 사이드바 맥락에서 눈을 떼지 않는 조작. 기능 1의 Project 항목 DropdownMenu와 다른 패턴이지만, 프로필은 사이드바의 일부이고 항목은 floating context menu라 맥락이 다름 |
| 프로필 메뉴 항목을 **이메일 + 로그아웃만**으로 축소 | 원본의 7항목 전부 | 개인 설정/테마/업그레이드/스페이스는 MVP 비-스코프. 필요 시 항목 추가만으로 확장 가능 |
| 로그아웃에 **confirm 없음** | confirm 다이얼로그 추가 | 로그아웃은 파괴적이지 않은 행위(다시 로그인하면 데이터 그대로). confirm은 과도한 마찰 |
| 접힘 상태에서 프로필 **완전 숨김** | 아바타 아이콘만 노출 | 기능 1의 "접힘 = overflow hidden, 내용 완전 숨김" 원칙과 일관. 접힘 전용 mini-nav 미도입 결정 유지 |
| 로그인 컨테이너 border 추가 | border 없음 (원본은 배경 동색 + border 없음도 가능) | 원본 실측에서 `color-border-normal` border를 확인. 페이지 배경과 컨테이너가 동색(`color-bg-primary`)이라 border 없으면 영역 구분 불가 |
| OAuth 실패 시 인라인 에러 (토스트 아님) | 토스트 알림 | 로그인 페이지의 단일 동선(버튼 1개)에서 토스트는 과도. 버튼 하단 텍스트로 충분 |
| 아바타 fallback으로 **이니셜** | 기본 아이콘, 빈 원 | Google 프로필 이미지가 없는 경우 대비. 이니셜은 사용자 식별에 더 유용 |

## 열린 질문 해소 결과

기능 명세([`plan/features/2-auth.md`](../../plan/features/2-auth.md))의 열린 질문 중 디자인 단계에서 답할 수 있는 것.

| # | 원래 질문 | 이 문서의 답 |
|---|---|---|
| Q4 | 로그아웃 UI 위치: 사이드바 하단 프로필 클릭 vs 드롭다운 vs 별도 설정 | **사이드바 하단 프로필 버튼 → 인라인 expand 메뉴 → 로그아웃 항목**. 원본이 이 패턴을 사용하고 있으며, 사이드바에서 눈을 떼지 않는 조작이 핵심 가치(맥락 전환 최소화)와 정렬 |

Q1(JWT vs DB 세션), Q2(보호 라우트 방식), Q3(callbackUrl)은 Developer 단계에 속하므로 이 문서에서 답하지 않는다.

## 구현자 참고사항

- **로그인 페이지는 별도 layout**으로 구현해야 한다. 기존 앱 셸(사이드바 + 헤더)이 표시되지 않아야 함. `/login` 라우트에 자체 layout을 두거나, root layout에서 세션 상태에 따라 분기.
- **프로필 메뉴의 인라인 expand**: 사이드바 하단에 고정된 영역이 토글로 확장/축소. CSS transition으로 높이 변경 가능. Radix Collapsible 또는 단순 state 토글 + overflow hidden.
- **아바타 이미지**: `next/image`의 `Image` 컴포넌트 사용 시 Google 프로필 URL의 도메인을 `next.config.ts`의 `images.remotePatterns`에 등록 필요 (`lh3.googleusercontent.com`).
- **접근성**: 프로필 버튼은 `aria-expanded` + `aria-controls`. 메뉴 항목은 `role="menuitem"`. 로그인 버튼은 충분한 contrast ratio 확보.
- **로고 에셋**: 원본은 Liner 전용 SVG 로고. 우리 앱("리노")의 로고 에셋이 아직 없으므로, 텍스트 로고 또는 placeholder로 시작하고 후속 작업에서 교체.

## Changelog

- 0.1 (2026-04-16): 초안 작성. 4개 화면 상태(로그인 페이지/사이드바 프로필/프로필 메뉴/접힘 상태), 인터랙션 8종, 상태 매트릭스, 디자인 결정 근거 8종, 열린 질문 Q4 해소 결과 정의. 원본 실측 기반으로 Google 단일 버튼 단순화, 프로필 메뉴 2항목 축소, 인라인 expand 패턴 채택.
