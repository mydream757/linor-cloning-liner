---
adr: 0003
title: 통합 앱 셸의 뷰 전환을 URL Segment 기반으로 구현
status: Accepted
date: 2026-04-14
---

# ADR-0003: 통합 앱 셸의 뷰 전환을 URL Segment 기반으로 구현

## Status

Accepted

## Context

이 프로젝트는 라이너의 세 서비스(Liner / Liner Write / Liner Scholar)를 **하나의 Next.js 앱 안의 세 개 뷰**로 통합한다 (`features.md` 기능 1). 사용자는 사이드바에서 Project를 고르고, 메인 패널의 뷰 토글로 세 뷰 사이를 전환한다.

뷰 전환을 어떻게 구현할지에 대한 결정이 필요하다. 핵심 질문은 "뷰는 URL의 일부인가, 클라이언트 상태인가"이다.

대안:
1. **URL Segment** — `/p/[projectId]/(liner|write|scholar)` 형태로 뷰를 라우트 segment로 표현
2. **클라이언트 상태(useState/Context)** — URL은 `/p/[projectId]` 까지만 두고, 뷰는 React 상태로 토글
3. **URL Query string** — `/p/[projectId]?view=liner` 형태로 쿼리 파라미터에 뷰를 둠

## Decision

**URL Segment** 방식으로 구현한다. 디렉터리 구조는 다음과 같다.

```
app/
  p/[projectId]/
    layout.tsx          ← 사이드바 + 뷰 토글 (한 번만 마운트)
    liner/page.tsx
    write/page.tsx
    scholar/page.tsx
```

공통 `layout.tsx`가 사이드바와 뷰 토글을 보유하며, 뷰 본문(`page.tsx`)만 segment에 따라 교체된다.

## 고려한 대안

처음에는 "URL이라면 페이지 이동마다 전체 로딩이 발생하는 것 아니냐"는 우려가 있었다. 이는 Next.js Pages Router 시대의 직관에서 비롯되며, **App Router에서는 해당하지 않는다**. App Router는 같은 layout 하위 segment로의 이동을 클라이언트 라우터가 가로채서 full reload 없이 처리하고, 공유 layout은 언마운트되지 않는다. 따라서 이 우려는 기각되었다.

세 가지 대안의 트레이드오프:

| 축 | URL Segment | 클라이언트 상태 | URL Query |
|---|---|---|---|
| 새로고침 후 같은 뷰 복원 | ✅ | ❌ | ✅ |
| 브라우저 뒤로/앞으로 가기 | ✅ | ❌ | ✅ |
| 링크 공유 (특정 뷰로 진입) | ✅ | ❌ | ✅ |
| 사이드바·Project 상태 유지 | ✅ (공유 layout) | ✅ | ✅ |
| 뷰 본문 컴포넌트 로컬 상태 유지 | ❌ (page 언마운트) | ✅ | ❌ |
| layout 분리에 따른 코드 구조 명확성 | ✅ | △ (단일 page에서 분기) | △ |
| Next.js App Router 학습 가치 | ✅ (핵심 기능) | ❌ | △ |

**뷰 본문 로컬 상태가 사라지는 문제**는 URL Segment 방식의 유일한 실질적 단점이다. 시나리오: "Liner에서 Chat 입력 중 → Write 잠깐 보러 감 → 돌아왔는데 입력값 사라짐". 이 문제는 다음 두 가지 처방으로 충분히 흡수된다.

- **Chat 초안 자동 저장**: sessionStorage 또는 DB에 자동 저장. 라이너 원본의 동작과 일치한다.
- **에디터 본문**: TipTap의 Document Asset은 어차피 DB에 저장되므로 로컬 상태 손실 영향 없음.

URL Query 방식은 segment의 장점은 거의 다 가지면서도 layout 분리가 약해진다. `page.tsx` 한 개 안에서 `searchParams.view` 분기로 뷰를 갈아끼우는 형태가 되어, App Router의 layout 합성·중첩 학습 가치가 사라진다. 이 프로젝트는 학습 가치가 핵심 이유이므로 기각.

## 결과

### Pros
- **새로고침·뒤로가기·링크 공유가 무료로 동작.** 추가 코드 없음.
- **사이드바·Project 상태는 공유 layout에서 유지.** 사용자가 우려한 "전체 로딩"은 발생하지 않는다.
- **뷰별 코드가 디렉터리로 명확히 분리**되어 후속 기능(3·5·6) 작업 시 충돌이 줄어든다.
- **App Router의 핵심 기능(중첩 layout·동적 segment)을 정공법으로 학습**한다. 이 프로젝트의 학습 가치 축과 정렬.

### Cons
- **뷰 본문의 컴포넌트 로컬 상태는 segment 이동 시 사라진다.** 위 "자동 저장" 패턴으로 흡수.
- **뷰 전환에 라우터 호출이 끼어든다.** 클라이언트 상태 토글보다 미세하게 느릴 수 있으나, App Router의 prefetch와 클라이언트 라우팅으로 사실상 체감 차이 없음.

## 연관 결정

- **현재 Project도 URL에 표현**한다 (`[projectId]` 동적 segment). 새로고침·공유·뒤로가기에서 같은 일관성을 얻기 위함.
- **루트 진입 시 리다이렉트 정책**: 사용자가 `/`에 접근하면 마지막에 본 Project가 있으면 그 Project의 마지막 뷰로 리다이렉트, 없으면 빈 상태 화면(첫 Project를 만들도록 유도)을 보여준다. 마지막 위치는 cookie 또는 localStorage로 기억한다 (기능 1 구현 단계에서 결정).
- **인증(기능 2) 통합 시점**: `[projectId]` segment에서 현재 사용자의 소유 여부를 검증하는 로직이 들어간다. 1단계에서는 임시 단일 user, 2단계에서 NextAuth로 교체.

## References

- 리포 내 `develop/node_modules/next/dist/docs/` 의 App Router · Layouts · Dynamic Routes 가이드
- `features.md` 기능 1: 통합 앱 셸 + Project 생성/전환
- `architecture/domain-model.md` (Project 엔티티)
