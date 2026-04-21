---
adr: 0015
title: 미할당 상태 라우트 구조 — 뷰 segment 원칙의 공간 확장
status: Accepted
date: 2026-04-21
---

# ADR-0015: 미할당 상태 라우트 구조 — 뷰 segment 원칙의 공간 확장

## Status

Accepted

## Context

기능 4(Asset + 미할당 Chat)는 도메인 모델의 **Project 미할당 상태**를 UI에서 실체화한다. 도메인 모델 v0.3은 `project_id=null`인 Chat·Asset을 허용하지만, 기능 1~3은 `/p/[projectId]/...` 경로에만 뷰를 두어 미할당 상태가 접근 불가능했다.

기능 4에서 "Project 없이 즉시 대화 시작" / "미할당 Document 생성·목록" 같은 흐름을 가능하게 하려면 **projectId-less 라우트**가 필요하다. 이 라우트의 구조 설계가 이번 ADR의 주제다.

### 기존 결정과의 관계

[ADR-0003](./0003-view-switching-via-url-segment.md)이 **뷰 전환을 URL segment로 구현**한다고 결정했다.

```
app/p/[projectId]/
  layout.tsx          ← 사이드바 + 뷰 토글
  liner/page.tsx      ← Liner 뷰
  write/page.tsx      ← Write 뷰
  scholar/page.tsx    ← Scholar 뷰
```

원칙 요약: **segment = 뷰 이름(liner/write/scholar)**. URL만으로 "어떤 Project에서 어떤 뷰를 보는가"가 일관된다.

미할당 상태 라우트는 이 원칙을 깨지 않아야 한다. 그렇지 않으면 URL 축이 두 개가 되어 "새로고침·뒤로가기·링크 공유"가 복잡해지고, 사이드바·layout 공유 구조가 일관되지 않는다.

### 어느 Asset을 어디에 귀속시킬 것인가

Asset 전용 top-level 라우트(`/assets`)를 두는 대안과, 각 Asset 타입을 주로 다루는 뷰에 귀속시키는 대안이 있다. 기획 단계에서 Q7로 분리되었다가 Q2와 연동해 함께 결정하는 것으로 합의됨.

## Decision

### 1. 뷰 segment를 유지, `projectId` 부분만 제거

미할당 상태에서도 **뷰 segment는 존재한다**. 단지 `/p/[projectId]/` 접두어가 빠질 뿐이다.

```
할당 상태                         미할당 상태
/p/[projectId]/liner          →  /liner
/p/[projectId]/liner/c/[id]   →  /liner/c/[id]
/p/[projectId]/write          →  /write
/p/[projectId]/write/d/[id]   →  /write/d/[id]
/p/[projectId]/scholar        →  (없음 — Scholar는 Project 스코프 필수)
```

`[projectId]`가 빠진 것 외에는 URL 구조가 **완전히 대칭**이다. 사용자가 URL을 보면 "Project가 있다 / 없다"와 "어떤 뷰다"를 한눈에 읽는다.

### 2. Scholar 뷰는 미할당 라우트 없음

Scholar 뷰는 3패널(Assets / Document / Chat)을 **현재 Project 스코프**로 조합하는 것이 본질이다. 미할당 Asset을 여기서 보려면 "미할당"이 별도의 가상 Project처럼 동작해야 하는데, 이는 도메인 모델(`project_id=null`이 그룹이 아님)을 왜곡한다. 필요해지면 2차 후보(features.md)에서 별도 설계.

### 3. Asset 전용 top-level 라우트 미도입

`/assets`, `/references`, `/documents` 같은 Asset 전용 라우트는 **도입하지 않는다**. 대신:

- **Reference Asset은 Liner 뷰에 귀속** — Liner 뷰가 Reference를 "Chat 컨텍스트"로 사용하는 주 소비자이므로, Reference 목록·선택 UI는 Liner 뷰 내부(입력창 하단 첨부 영역 등).
- **Document Asset은 Write 뷰에 귀속** — Write 뷰가 Document 편집 대상. Document 목록·생성·삭제는 Write 뷰 내부(`/p/[projectId]/write` 및 `/write`).

이로써 "뷰 segment = 주 소비 뷰"라는 축이 유지된다.

### 4. 파일 구조

```
app/
  p/[projectId]/
    layout.tsx          ← 기존 (사이드바 + 뷰 토글 + Project 소유권 검증)
    liner/
      page.tsx
      c/[chatId]/page.tsx
    write/
      page.tsx
      d/[documentId]/page.tsx
    scholar/
      page.tsx
  (unassigned)/
    layout.tsx          ← 신규 (사이드바 + 뷰 토글, Project 컨텍스트 없음)
    liner/
      page.tsx
      c/[chatId]/page.tsx
    write/
      page.tsx
      d/[documentId]/page.tsx
```

`(unassigned)` 부분은 Route Group(App Router의 `(folder)` 문법) 또는 별도 segment로 구현 — 실제 표기는 Developer D4에서 확정(예: `app/(unassigned)/liner/page.tsx` → URL은 `/liner`).

레이아웃은 두 layout이 **사이드바를 공유**해야 한다. 공유 방법 2가지 — 공통 컴포넌트를 두 layout이 import하거나, 더 상위 `app/layout.tsx`에 사이드바를 올리고 하위 layout은 메인 패널만 책임지거나. Developer D4에서 구체화.

### 5. 리다이렉트 정책

- `/` 접근 시 기존 로직(마지막 Project·뷰 복원 — ADR-0004) 유지. 단, 마지막 위치가 미할당 Chat이었다면 미할당 라우트로도 복원되어야 함.
- 미할당 Chat이 Project로 이동되면 URL도 `/liner/c/[chatId]` → `/p/[newProjectId]/liner/c/[chatId]`로 리다이렉트. 기능 4 D5에서 구현.
- 존재하지 않거나 소유권 없는 `chatId`/`documentId` 접근 시 404 (기능 2 보호 라우트 패턴 계승).

## 고려한 대안

### 대안 A: `/chat`(엔티티 이름 기반)

```
/chat                → 미할당 Chat 목록 또는 신규 진입
/chat/[chatId]       → 미할당 특정 Chat
/document            → 미할당 Document 목록
/document/[id]       → 미할당 특정 Document
```

#### Pros
- "대화"·"문서"라는 의도가 직관적
- 짧고 기억하기 쉬움

#### Cons
- **ADR-0003의 "segment = 뷰 이름" 원칙과 충돌.** `/p/[projectId]/liner`(뷰명) ↔ `/chat`(엔티티명) 혼용.
- **Write·Scholar의 미할당 URL이 어떻게 돼야 하는지 불명확해진다.** `/document`? 그럼 뷰-엔티티 축이 섞여 URL 독해 난이도 상승.
- **미할당 ↔ 할당 전환 시 URL이 구조적으로 달라진다.** `/chat/[id]` → `/p/[pid]/liner/c/[id]`는 segment 재구성이 필요한 워프. 리다이렉트 로직·링크 공유 일관성이 깨짐.
- **사이드바의 "+ 새 대화" 버튼 의도**를 URL에 실어 나를 필요 없음. 버튼 레이블·아이콘만으로 충분.

### 대안 B: `/l` (짧은 축약)

#### Pros
- URL이 짧음

#### Cons
- 축약의 이득이 실질적이지 않다. `/liner`는 이미 5글자.
- "Liner"라는 브랜드 인식을 URL에서 희석시킨다. 학습 프로젝트의 맥락상 뷰명은 명시적인 편이 나음.

### 대안 C: 쿼리 파라미터 `/liner?unassigned=true` 같은 형태

#### Cons
- App Router의 중첩 layout 이점을 전혀 활용하지 못함. projectId 유무에 따라 layout이 달라져야 하는데 쿼리 파라미터로는 layout 분기 불가.
- ADR-0003이 이미 쿼리 방식을 기각한 근거(layout 분리 약화)와 동일한 이유로 기각.

### 대안 D: `/assets` 전용 라우트 추가 (Q7)

미할당 Asset을 모아 보는 전용 페이지를 두는 방식.

#### Pros
- "미할당 Asset들을 한눈에" 수요를 직접 충족
- Liner·Write 뷰와 독립된 탐색 진입점

#### Cons
- **축이 두 개**가 된다: "뷰 segment(liner/write/scholar)" + "Asset segment(assets)". 사용자가 "어디로 가야 하지?"를 두 축에서 고민.
- Reference는 Liner에서, Document는 Write에서 쓰는 게 자연스러운데, `/assets`에서 선택하고 다른 뷰로 이동하는 클릭 수가 오히려 증가.
- **Scholar 뷰가 이미 "통합 조감" 역할**을 수행(Project 스코프 한정이지만). 미할당 버전이 필요해지면 미래 "미할당 Scholar"로 대응 가능하고, 현 MVP는 그 수요가 검증되지 않았음.

## 결과

### Pros

- **ADR-0003 원칙의 공간 확장.** "segment = 뷰"가 projectId 유무와 독립적으로 유지됨. URL 독해 규칙이 하나로 수렴.
- **리다이렉트·링크 공유가 대칭적.** `/liner/c/[id]` ↔ `/p/[pid]/liner/c/[id]`는 접두어만 다를 뿐 구조가 동일 — 전환 로직이 단순.
- **사이드바·layout 공유가 자연스럽다.** 뷰 segment가 동일한 레벨이라 UI 공통부가 그대로 재사용.
- **Asset 전용 라우트 없음으로 축이 하나만 남는다.** Reference는 Liner, Document는 Write — 사용자 멘탈 모델이 단순.
- **Scholar 제외를 명시적 규칙으로.** 도메인 모델상 Project 스코프 필수라는 본질을 URL에서도 반영.

### Cons

- **"미할당 Asset 전체 조감" 진입점이 없다.** 미할당 Reference는 `/liner`에서, 미할당 Document는 `/write`에서 따로 봐야 한다. 이 불편이 실사용에서 크게 드러나면 2차 후보로 "미할당 Scholar" 또는 Asset 허브 페이지 도입 재평가.
- **Route Group 구조가 두 벌(`/p/[projectId]/...`과 `(unassigned)/...`)이 되어 코드 중복 가능성.** 공통 컴포넌트·data fetching 훅을 잘 분리해 중복 최소화. Developer D4에서 구체화.

## 연관 결정

- **[ADR-0003](./0003-view-switching-via-url-segment.md)** — 이 ADR이 확장하는 원칙. ADR-0003을 개정하지 않고, 공간 축을 추가하는 형태로 일관성 유지.
- **[ADR-0004](./0004-last-location-via-cookie.md)** — 마지막 위치 복원 로직이 미할당 라우트도 포함하도록 확장 필요. D4에서 반영.
- **[ADR-0011](./0011-auth-session-and-route-protection.md)** — Proxy 전역 인증 + layout 소유권 검증 패턴. 미할당 layout에서는 Project 소유권 검증이 빠지지만 session 검증은 동일하게 적용.
- **기능 4 D4 (미할당 라우트 도입 + 사이드바 전역 "+ 새 대화" + T-004 해소)** — 이 ADR의 실제 구현 단계.

## References

- `architecture/domain-model.md` v0.3 §행동 규칙 - Project 미할당 상태
- `plan/features/4-asset.md` §3 포함, §5 결정 요약
- `develop/node_modules/next/dist/docs/` App Router · Route Groups · Nested Layouts 가이드
