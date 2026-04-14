---
adr: 0004
title: "마지막에 본 위치"는 cookie에 저장한다
status: Accepted
date: 2026-04-14
---

# ADR-0004: "마지막에 본 위치"는 cookie에 저장한다

## Status

Accepted

## Context

ADR-0003에서 통합 앱 셸의 뷰 전환을 URL Segment 방식(`/p/[projectId]/(liner|write|scholar)`)으로 결정했다. 이 결정의 자연스러운 후속 질문은 "사용자가 `/`로 진입했을 때 어디로 보낼 것인가"이다.

요구사항:
- 사용자가 마지막으로 보던 Project와 뷰를 기억해서, `/` 진입 시 그곳으로 자동 이동한다
- **흰 화면 깜빡임이 없어야 한다** — 새로고침마다 잠깐 빈 화면이 보이면 마찰이 누적된다
- 처음 사용자(저장된 위치 없음)는 빈 상태 화면("첫 Project를 만들어보세요")을 본다

대안:
1. **cookie** — HTTP 요청에 자동 첨부, 서버 컴포넌트에서 즉시 읽고 redirect
2. **localStorage** — 클라이언트 전용 저장소, 마운트 후 useEffect에서 redirect
3. **DB의 user 테이블에 컬럼 추가** — 영속성은 가장 강하지만 매 페이지 진입마다 DB 조회
4. **URL search param** — `/?p=abc&view=liner` 형태. 이 ADR의 주제(영속 저장)와 결이 다름

## Decision

**cookie**에 저장한다. 이름·옵션은 다음과 같다.

| cookie | 값 | 옵션 |
|---|---|---|
| `last-project` | Project ID (string) | `path='/'`, `sameSite='lax'`, `maxAge=1년`, `httpOnly=true` |
| `last-view` | `'liner' \| 'write' \| 'scholar'` | 동일 |

`httpOnly=true`로 두는 이유는 클라이언트 자바스크립트에서 직접 읽을 일이 없고, XSS 방어 측면에서 기본 안전망을 가져가는 것이 비용 없이 얻는 이득이기 때문이다.

## 고려한 대안

| 축 | cookie | localStorage | DB 컬럼 |
|---|---|---|---|
| 서버에서 즉시 읽기 가능 | ✅ (요청에 자동 첨부) | ❌ (클라이언트 전용) | ✅ (DB 조회 필요) |
| 흰 화면 깜빡임 없음 | ✅ | ❌ (마운트 후 redirect) | ✅ |
| 추가 인프라 비용 | 없음 | 없음 | DB 스키마 + 쿼리 |
| 스토리지 한계 | ~4KB / 도메인, 모든 요청에 첨부 | ~5MB / 도메인, 클라이언트 전용 | 사실상 무제한 |
| 디바이스 간 동기화 | ❌ (브라우저별) | ❌ (브라우저별) | ✅ (user 단위 영속) |
| 학습 가치 (Next.js App Router 기준) | ✅ `cookies()` API | (없음) | (별건) |

**localStorage 기각 이유**: 흰 화면 깜빡임. `/` 진입 → 서버는 마지막 위치를 모르므로 빈 상태 페이지를 일단 응답 → 클라이언트 마운트 → useEffect에서 localStorage 읽고 `router.replace` → 사용자가 보는 화면이 한 번 깜빡인다. 사소해 보이지만 새로고침마다 누적되는 마찰이라 수용 불가.

**DB 컬럼 기각 이유**: "마지막 위치"는 디바이스/브라우저 단위 UX 상태이지 사용자 도메인 데이터가 아니다. user 테이블에 끼우면 매 페이지 진입마다 DB 한 번 더 + 1인 학습 프로젝트에서 실익이 없는 다중 디바이스 동기화에 의미가 묶인다. 이 가치가 중요해지면 그때 ADR을 추가해서 마이그레이션할 일이지, MVP 단계에서 미리 비용을 낼 일은 아니다.

**URL search param**은 영속 저장이 아니라 "현재 URL에 정보를 싣는다"는 다른 축의 결정이라 비교 대상이 아니다.

### 일반적인 선택인가

이 패턴(서버에서 알아야 하는 사용자 단위 UX 상태를 cookie로 저장)은 Linear, Notion, GitHub 등 현대 SaaS의 "마지막 워크스페이스/조직" 기억 같은 곳에서 표준적으로 쓰이는 방식이다. cookie의 자동 첨부 특성과 SSR/서버 컴포넌트가 결합된 환경에서 가장 마찰 없는 해결책이라서 일반적이다.

## Next.js 16의 제약과 동작 모델

이 ADR은 **Next.js 16의 `cookies()` API가 async이고, `.set()`/`.delete()`는 Server Component 렌더링 중에는 호출 불가**라는 제약 위에 설계되었다. 사실 확인은 `develop/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` 기준.

핵심 제약:
- `cookies()`는 async 함수이며 `await cookies()`로 호출해야 한다 (Next.js 15 RC 부터의 변경, 14 이하의 sync 시그니처는 deprecated)
- **읽기는 Server Component에서 자유롭게 가능**
- **쓰기(`.set`/`.delete`)는 Server Action 또는 Route Handler에서만 가능**. Server Component 렌더링 중에는 호출 불가 (HTTP가 streaming 시작 후 응답 헤더 변경을 허용하지 않기 때문)
- `cookies()`를 사용한 라우트는 자동으로 **dynamic rendering**으로 전환됨 (이 프로젝트에서는 어차피 사용자별 데이터를 다루므로 영향 없음)

### 동작 흐름

**읽기 (서버 컴포넌트, 동기적 redirect):**

```tsx
// app/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const cookieStore = await cookies()
  const lastProject = cookieStore.get('last-project')?.value
  const lastView = cookieStore.get('last-view')?.value ?? 'liner'
  if (lastProject) redirect(`/p/${lastProject}/${lastView}`)
  return <EmptyState />
}
```

사용자가 `/`로 진입하면 서버 컴포넌트가 cookie를 즉시 읽고, 값이 있으면 응답으로 redirect를 보낸다. 클라이언트 자바스크립트가 실행되기 전이라 흰 화면이 보이지 않는다.

**쓰기 (Server Action, 클라이언트에서 trigger):**

```tsx
// app/actions/last-location.ts
'use server'
import { cookies } from 'next/headers'

export async function setLastLocation(projectId: string, view: string) {
  const cookieStore = await cookies()
  cookieStore.set('last-project', projectId, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  })
  cookieStore.set('last-view', view, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  })
}
```

클라이언트 컴포넌트(예: `/p/[projectId]/[view]` 하위의 클라이언트 layout)에서 segment 변경을 감지해 fire-and-forget으로 호출한다. 이 호출이 응답에 `Set-Cookie` 헤더를 실어 보내고, 다음 요청부터 새 값이 반영된다.

```tsx
'use client'
import { useEffect } from 'react'
import { setLastLocation } from '@/app/actions/last-location'

export function LastLocationTracker({ projectId, view }: { projectId: string; view: string }) {
  useEffect(() => {
    void setLastLocation(projectId, view)
  }, [projectId, view])
  return null
}
```

이 컴포넌트를 `[view]/layout.tsx`에 mount해 두면 사용자가 segment를 옮길 때마다 자동으로 cookie가 갱신된다.

## 결과

### Pros
- **흰 화면 깜빡임 없음.** 서버에서 redirect가 끝나므로 사용자는 곧장 마지막 위치에 도착한다.
- **추가 인프라 비용 없음.** DB 스키마 변경, 클라이언트 라이브러리 추가 없이 Next.js 빌트인 API만으로 해결.
- **App Router의 `cookies()` API 학습 가치를 정공법으로 흡수**한다.
- **`httpOnly` 옵션으로 XSS 표면을 줄임**. 클라이언트에서 읽을 필요가 없는 데이터에 대한 합리적 기본값.
- **민감 정보 아님.** Project ID와 'liner|write|scholar' 문자열만 저장하므로 cookie 노출 위험이 거의 없다.

### Cons
- **디바이스/브라우저 간 동기화 불가.** 다른 기기에서 접속하면 빈 상태로 시작. 이 프로젝트는 1인 학습용이라 수용 가능.
- **cookie가 정적 자산 요청에까지 자동 첨부.** 페이로드 ~80바이트 수준이라 무시 가능.
- **`cookies()` 사용으로 dynamic rendering 강제.** 어차피 사용자별 화면이라 영향 없음.
- **쓰기 경로가 Server Action 한 번 거쳐야 함.** Server Component에서 직접 set이 안 되는 Next.js 16 제약 때문. 기능 1 구현 시 `LastLocationTracker` 클라이언트 컴포넌트로 흡수한다.

## 연관 결정

- ADR-0003: URL Segment 기반 뷰 전환 (이 ADR의 전제)
- 기능 1 (`features.md`): 통합 앱 셸 + Project 생성/전환에서 이 ADR을 구현 기준으로 삼는다
- 인증 도입(기능 2) 후에는 cookie의 사용자 매칭 검증이 필요해질 수 있다. `/p/[projectId]` 진입 시 현재 사용자가 해당 Project의 소유자인지 확인하는 로직과 함께 다룬다. 만약 cookie의 `last-project`가 다른 사용자 소유라면 무시하고 빈 상태로 보낸다.

## References

- `develop/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` — Next.js 16의 cookies API 시그니처와 제약
- ADR-0003 (`0003-view-switching-via-url-segment.md`)
- MDN: HTTP cookies — https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
