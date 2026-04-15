---
feature: 통합 앱 셸 + Project 생성/전환
version: 0.2
last_updated: 2026-04-15
---

# 통합 앱 셸 + Project 생성/전환 — 화면 설계

> 참조
> - 기능 명세: [`plan/features/1-app-shell.md`](../../plan/features/1-app-shell.md)
> - 전역 토큰: [`../design-tokens.md`](../design-tokens.md)
> - 실측·스크린샷: [`../references/1-app-shell/`](../references/1-app-shell/)

이 문서는 기능 1의 **화면 구조·상태·인터랙션·토큰 매핑**을 정의한다. 값(픽셀·컬러)은 [`design-tokens.md`](../design-tokens.md)와 [`references/1-app-shell/measurements.md`](../references/1-app-shell/measurements.md)의 단일 진실 소스를 따르며, 여기서는 **토큰 이름과 구조 결정**만 담는다.

## 사용자 흐름

```
[/ 진입]
    │
    ├── cookie(last-project)가 있고 해당 Project가 존재
    │       └─→ redirect /p/[id]/[view]
    │
    ├── cookie가 없음
    │       └─→ / (EmptyState 렌더)
    │             └─→ "새 Project" 클릭
    │                   └─→ 이름 입력 모달
    │                         └─→ 생성 → redirect /p/[id]/liner
    │
    └── cookie가 있지만 Project 삭제됨
            └─→ cookie 정리 → / (EmptyState 렌더)

[/p/[id]/[view] 상태]
    │
    ├── 뷰 전환 (pill 토글 클릭) → /p/[id]/[newview] (사이드바 유지)
    ├── Project 전환 (사이드바 항목 클릭) → /p/[newid]/[view] (뷰 유지)
    ├── Project rename (인라인 편집) → 서버 저장 → 사이드바 반영
    ├── Project 삭제 (컨텍스트 메뉴 → confirm) → 목록에서 제거
    │       └── 마지막 Project 삭제 시 → / (EmptyState 렌더)
    ├── 사이드바 접기 (헤더 토글 버튼) → 48px 축소 (animation 150ms)
    └── 사이드바 펼치기 (햄버거 클릭) → 260px 복원
```

### 흐름 설명 (정상 경로)

| 단계 | 화면 | 사용자 행동 | 시스템 반응 |
|---|---|---|---|
| 1 | `/` | 루트 접근 | 서버가 cookie 확인 → 마지막 위치로 redirect 또는 `/`에서 EmptyState 렌더 |
| 2 | `/` (빈 상태) | "새 Project" 클릭 | 이름 입력 모달 표시 (autofocus) |
| 3 | 이름 입력 모달 | 이름 입력 + Enter | Server Action으로 Project 생성 → `/p/[id]/liner`로 redirect |
| 4 | `/p/[id]/liner` | 뷰 토글에서 Write 클릭 | `/p/[id]/write`로 push — 사이드바·Project 선택 유지, 메인 패널만 placeholder 교체 |
| 5 | 동일 | 사이드바에서 다른 Project 클릭 | `/p/[newid]/write`로 push — 현재 뷰(Write) 유지, Project만 교체 |
| 6 | 동일 | 사이드바 헤더의 접기 버튼 클릭 | width 260px → 48px로 150ms ease transition. 내용 overflow hidden으로 숨김 |

### 예외·에러 흐름

| 조건 | 처리 방식 |
|---|---|
| cookie `last-project`가 존재하지만 해당 Project가 DB에 없음 | 서버 컴포넌트에서 DB 검증 실패 → cookie 2종(`last-project`, `last-view`) 정리 → `/`에서 EmptyState 렌더. 사용자에게 별도 에러 메시지는 표시하지 않음 (일상적 상태) |
| Project 생성 중 서버 에러 (DB 실패 등) | 이름 입력 모달 안에 인라인 에러 메시지. 버튼은 재시도 가능 상태로 복구 |
| Project 이름이 빈 문자열 또는 공백만 | 저장 버튼 비활성화 (클라이언트 검증) |
| Project 삭제 중 서버 에러 | confirm 다이얼로그 안에 인라인 에러 메시지. 목록 상태는 변경 없음 |
| 네트워크 단절 상태에서 조작 | 각 Server Action은 실패 토스트(간단)로 피드백. 이 기능은 오프라인 큐잉을 고려하지 않는다 |
| 뷰 segment가 유효하지 않음 (`/p/[id]/unknown`) | Next.js `notFound()` → 기본 뷰(`liner`)로 redirect |

## 화면 구조

### 1. 정상 상태 (`/p/[id]/liner` 기본)

```
┌──────────────────────────────────────────────────────────────────┐
│                         상단 헤더 (48px)                            │
│  ┌─────┐                  ┌─ 뷰 전환 토글 (pill 151×37) ──┐        │
│  │햄버거│                  │ [Liner] [Write] [Scholar]  │        │
│  └─────┘                  └────────────────────────────┘        │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│   사이드바     │                  메인 패널                         │
│   (260px)    │                                                   │
│              │     (뷰별 placeholder — "Liner 뷰 — 추후 구현")      │
│  ┌────────┐  │                                                   │
│  │+ 새 Proj│  │                                                   │
│  └────────┘  │                                                   │
│              │                                                   │
│  프로젝트       │                                                   │
│  ● Project A │                                                   │
│    Project B │                                                   │
│    Project C │                                                   │
│    더보기       │                                                   │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

**구성 요소**:

| 영역 | 요소 | 유형 | 토큰 | 비고 |
|---|---|---|---|---|
| 상단 헤더 | 컨테이너 | — | `color-bg-primary` + `color-border-subtle` 하단 | 높이 `48px` |
| 상단 헤더 | 뷰 전환 토글 | pill 그룹 | `color-surface-overlay` + `radius-lg` | 중앙 배치 |
| 상단 헤더 | 사이드바 펼치기(햄버거) | 아이콘 버튼 | — | 접힘 상태에서만 표시 |
| 사이드바 | 컨테이너 | — | `color-bg-secondary` + `color-border-default` 우측 | 폭 `260px`, padding `space-sm`(좌우) / `space-md`(상하) |
| 사이드바 | 접기 버튼 | 아이콘 버튼 | — | 사이드바 상단 우측 모서리 |
| 사이드바 | "새 프로젝트" | primary 버튼 | (브랜드 색 미확인, 임시로 `color-surface-overlay`) | 사이드바 상단 |
| 사이드바 | "프로젝트" 섹션 헤더 | label | `color-text-secondary` + `text-caption` | 정적 라벨 |
| 사이드바 | Project 항목 | 리스트 행 | 기본: 투명 / hover: `color-bg-hover` / 선택: `color-bg-active-subtle` | 높이 `30px`, padding `space-sm` 좌우, 아이콘–라벨 gap `space-sm` |
| 사이드바 | "더보기" | 리스트 행 | `color-text-secondary` + `text-caption` | N개 이상일 때 노출 (N은 실측 기준 3, PRD에서 디자인 단계 확정으로 표기) |
| 메인 패널 | 컨테이너 | — | `color-bg-primary` | padding `space-lg` 좌우 |
| 메인 패널 | placeholder 본문 | text | `color-text-secondary` | "Liner 뷰 — 추후 구현" 등 |
| 뷰 토글 | 개별 버튼 (활성) | pill | `color-bg-active-strong` + `radius-md` + `shadow-md` + `color-text-primary` | padding `space-md` 좌우 |
| 뷰 토글 | 개별 버튼 (비활성) | pill | 투명 + `color-text-tertiary` | 호버 시 `color-bg-hover` |

### 2. 빈 상태 (`/`에서 EmptyState 렌더)

Project가 0개이거나 cookie가 가리키는 Project가 없을 때.

```
┌──────────────────────────────────────────────────────────────────┐
│                         상단 헤더 (48px)                            │
│                            [뷰 토글]                               │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│   사이드바     │                                                   │
│              │               첫 Project를 만들어보세요              │
│  ┌────────┐  │          프로젝트 안에 대화와 자료를 모을 수 있어요         │
│  │+ 새 Proj│  │                                                   │
│  └────────┘  │              [ + 새 Project ]                      │
│              │                                                   │
│  프로젝트       │                                                   │
│  (비어있음)    │                                                   │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

- 사이드바 자체는 정상 상태와 동일하지만 Project 목록 영역에 "(비어있음)" 대신 **어떤 행도 렌더하지 않고**, 섹션 헤더 아래 여백만 둔다. 별도 텍스트 안내는 사이드바에 두지 않는다(공간 낭비).
- 메인 패널이 안내를 담당한다: 중앙 정렬, `color-text-primary` 제목 + `color-text-secondary` 부연 + CTA 버튼.
- 뷰 토글은 빈 상태에서도 상단에 표시하되 **비활성 + `color-text-tertiary`** (클릭해도 Project가 없어 유효한 target이 없음). 호버 시 "먼저 Project를 만들어주세요" 툴팁.

### 3. 사이드바 접힘 상태

```
┌──────────────────────────────────────────────────────────────────┐
│                         상단 헤더 (48px)                            │
│  [햄버거]                     [뷰 토글]                            │
├────┬─────────────────────────────────────────────────────────────┤
│    │                                                             │
│ 48 │                     메인 패널 (확장됨)                          │
│ px │                                                             │
│    │                                                             │
│    │                                                             │
└────┴─────────────────────────────────────────────────────────────┘
```

- 사이드바 내부 내용은 **완전히 숨김** (overflow hidden). 아이콘 미니 네비게이션을 노출하지 않는 이유: 원본이 그렇게 동작하고 있고, 혼합 모드(일부 아이콘만 남기는 방식)는 구현·유지 비용 대비 가치가 낮음. 접힘 상태는 "잠시 메인에 집중"의 짧은 모드로 설계.
- 햄버거 버튼은 **상단 헤더 좌측**에 나타난다. 사이드바를 가리지 않는다.
- 전환: `motion-medium` (150ms ease), width만 변경.

### 4. Project rename 중 (인라인 편집)

열린 질문 Q1에 대한 **디자인 답**: **인라인 더블클릭 편집**으로 한다.

- 사이드바 Project 항목을 **더블클릭**하면 해당 행의 라벨이 input으로 변환 (행 높이·padding 그대로 유지)
- input은 자동 포커스 + 현재 값 전체 선택 상태
- 저장 트리거: **Enter** 또는 **blur (포커스 이탈)**
- 취소 트리거: **Escape** → 원래 값 복원
- 저장 중에는 input을 유지하되 우측에 작은 스피너 (`color-text-tertiary`)

**이 방식을 고른 이유**: 모달은 맥락 전환 비용이 크고, 컨텍스트 메뉴는 1단계(rename)에 비해 진입 비용이 높다. 인라인 편집은 "사이드바에서 눈을 떼지 않는" 조작으로 핵심 가치(맥락 전환 최소화)와 정렬된다. 더블클릭이 macOS Finder·VSCode 등에서 파일 rename의 관용 패턴이라 학습 비용도 낮다.

### 5. Project 삭제 confirm

- **컨텍스트 메뉴**: Project 항목 우측 끝에 hover 시 나타나는 `⋯` 버튼 → 클릭 시 드롭다운에 "이름 변경", "삭제" 항목
- **삭제 confirm**: 단순 다이얼로그. "‘{프로젝트명}’을 삭제할까요? 이 안의 채팅·자료는 남습니다." + [취소] [삭제]
  - 본문의 "채팅·자료는 남습니다" 문구는 도메인 모델의 "Project 삭제 시 소속 Chat/Asset은 `project_id=null`로 복귀" 규칙을 사용자에게 드러내는 역할. 기능 1에선 아직 Chat/Asset이 없지만, 문구는 처음부터 이 정책을 반영해 둔다 (후속 기능 도입 시 문구 재수정 비용 회피).
- 삭제 버튼 색: 브랜드 색 미확인이라 임시로 `color-text-primary` on `color-bg-active-strong`. 기능 4 이후 `color-error` 토큰이 채워지면 교체.

## 인터랙션 정의

| 트리거 | 동작 | 피드백 |
|---|---|---|
| 사이드바 Project 항목 hover | 배경 `color-bg-hover` 적용 | 즉시 |
| Project 항목 클릭 | 해당 Project의 현재 뷰로 URL segment 이동 | 클라이언트 라우팅 (페이지 전체 리로드 없음) |
| Project 항목 더블클릭 | 인라인 rename 모드 진입 | input autofocus + select-all |
| Project 항목 hover → `⋯` 버튼 hover | 드롭다운 메뉴 열림 | `motion-fast` (값 미확인이라 즉시로 대체) |
| 뷰 토글 pill 클릭 (비활성) | 해당 뷰로 URL segment 이동 | 활성 상태 이동 (150ms 미만, 인스턴트) |
| 뷰 토글 pill 클릭 (활성 상태 재클릭) | **동작 없음** (원본 Scholar의 "패널 닫힘" 동작은 차용하지 않음 — 우리는 항상 뷰가 하나 표시) | — |
| 사이드바 접기 버튼 | width 260→48 transition | `motion-medium` (150ms ease) |
| 햄버거 클릭 (접힘 상태) | width 48→260 transition | `motion-medium` (150ms ease) |
| "새 프로젝트" 버튼 클릭 | 이름 입력 모달 | 모달 autofocus |
| 모달에서 Enter | Server Action 호출 → 생성 → redirect | 버튼 로딩 상태 (스피너) |
| 모달에서 Escape | 모달 닫기 | — |
| 뷰 segment 변경 | URL 변경 + 클라이언트에서 Server Action으로 cookie `last-view` 갱신 (fire-and-forget) | UI 반응 없음 (cookie는 백그라운드) |
| Project segment 변경 | 동일하게 cookie `last-project` 갱신 | 동일 |

## 상태 매트릭스

| 화면/요소 | default | hover | active(선택) | focus | disabled | loading |
|---|---|---|---|---|---|---|
| Project 리스트 항목 | 투명 + `color-text-primary` | `color-bg-hover` | `color-bg-active-subtle` | `color-focus-ring` (2px, offset 2px) | — | rename 중: 우측 스피너 |
| 뷰 토글 pill | 투명 + `color-text-tertiary` | `color-bg-hover` + `color-text-secondary` | `color-bg-active-strong` + `color-text-primary` + `shadow-md` | `color-focus-ring` | 빈 상태: `color-text-tertiary` + cursor-not-allowed | — |
| "새 프로젝트" 버튼 | (브랜드 색 미확인) | 한 톤 진하게 | — | `color-focus-ring` | — | 생성 중: 스피너 |
| 삭제 confirm 버튼 | (`color-error` 미확인, 임시 `color-bg-active-strong`) | 한 톤 진하게 | — | `color-focus-ring` | — | 삭제 중: 스피너 |

## 디자인 결정 근거

| 결정 | 대안 | 선택 근거 |
|---|---|---|
| 상위 뷰 토글을 원본 Scholar의 pill 스타일로 차용 | 탭, 세그먼트 컨트롤, 사이드바 내 버튼 | 원본 Scholar의 pill이 이미 3분할 토글에 최적화된 시각 언어. 별도 발명보다 일관성·학습 비용이 낫다. PRD의 "우리 발명이지만 스타일은 차용" 결정과 정렬 |
| 상위 뷰 토글을 **상단 헤더**에 배치 | 사이드바 상단 | 사이드바는 Project 컨텍스트, 상단 헤더는 전역 컨텍스트. 뷰(모드)는 Project와 독립적으로 전환되므로 전역 위치가 맞다 |
| Project rename: **인라인 더블클릭 편집** | 모달, 컨텍스트 메뉴 → 모달 | 맥락 전환 비용 최소화. Finder·VSCode 관용 패턴과 일치 |
| 삭제는 컨텍스트 메뉴(`⋯`)에서 | 각 항목에 항상 노출되는 삭제 아이콘 | 시각적 노이즈 최소화. 사이드바는 Project 전환이 주 용도이고, 삭제는 낮은 빈도 |
| 접힘 상태에서 **사이드바 내용 완전 숨김** | 일부 아이콘 미니 네비 노출 | 원본이 그렇게 동작. 미니 네비 구현 비용 대비 가치 낮음. 접힘은 "잠깐 메인 집중" 모드 |
| 빈 상태에서 뷰 토글 **비활성 + 툴팁** | 뷰 토글 숨김 | 학습 가능성 확보. 사용자는 "이런 토글이 있구나"를 인지한 상태로 Project를 만든다 |
| 빈 상태를 `/`에서 EmptyState 컴포넌트로 렌더 | `/p/new` 같은 별도 segment로 분리 | ADR-0004와 일치. `new`가 projectId로 오해될 여지 제거. 추가 segment 없이 `/`의 서버 컴포넌트에서 조건 분기로 해결 가능 |
| 삭제 confirm에 "채팅·자료는 남습니다" 문구 | 기능 1에선 불필요한 문구 생략 | 후속 기능 도입 시 재수정 비용 회피. 도메인 모델의 소유-참조 분리 규칙을 UX에서 일관 적용 |
| 삭제 confirm 버튼 임시 `color-bg-active-strong` | `color-error` 신규 측정·채움 | 이 기능에서 `color-error`가 필요한 곳이 한 곳뿐이고, 에러 색은 토스트 등 다른 곳에서 반드시 재사용됨. 기능 4(Asset 삭제 등) 작업 시 한꺼번에 채우는 게 경제적 |

## 열린 질문 해소 결과

기능 명세([`plan/features/1-app-shell.md`](../../plan/features/1-app-shell.md))의 열린 질문 중 디자인 단계에서 답할 수 있는 것.

| # | 원래 질문 | 이 문서의 답 |
|---|---|---|
| Q1 | Project rename UX: 인라인 편집 vs 컨텍스트 메뉴 → 모달 | **인라인 더블클릭 편집** (이 문서 "4. Project rename 중" 섹션) |
| Q2 | 사이드바 폭 260px과 접힘 애니메이션 세부 | 폭 `260px` (measurements), 접힘 `48px`, 전환 `motion-medium` = 150ms ease, width만 변경, 내용은 overflow hidden |
| Q3 | 빈 상태 일러스트/카피 톤 | **일러스트 없이 텍스트 + CTA만**. 카피: "첫 Project를 만들어보세요" / "프로젝트 안에 대화와 자료를 모을 수 있어요". 이유: 일러스트는 MVP 학습 가치와 무관하고, 추가 에셋 제작·관리 비용 발생. 카피의 "대화와 자료" 표현이 후속 기능(Chat/Asset)으로의 자연스러운 기대감을 심는다 |

Q4(임시 user 시드 방식), Q5(Project 삭제 카피)는 구현/후속 기능 단계에 속하므로 이 문서에서 답하지 않는다.

## 구현자 참고사항

- 뷰 토글은 `<nav>` 요소로 마크업하고 개별 버튼은 `<a>` + Next.js `<Link>`로. 활성 상태는 `aria-current="page"` 병행.
- Project 리스트 역시 `<nav>` + `<Link>`. rename 중에는 `<Link>` 안에 `<input>`을 얹는 방식보다 **행 전체를 버튼 ↔ input으로 토글**하는 방식이 접근성 측면에서 안전하다.
- 사이드바 접힘 토글은 `aria-expanded` + `aria-controls` 속성. screen reader에서 상태 변경이 드러나도록.
- 빈 상태의 "뷰 토글 비활성 툴팁"은 `<button disabled>` + `title` 조합이 아니라 **wrapper로 툴팁을 붙이는 방식**을 권장 (disabled 요소는 기본 `title`이 표시되지 않는 브라우저가 있음).
- 모션(`150ms ease`)은 Tailwind의 `transition-[width] duration-150 ease` 또는 `@theme` 토큰으로 매핑.

## Changelog

- 0.2 (2026-04-15): 빈 상태 URL을 `/p/new` → `/`로 수정(ADR-0004 일치, `new`가 projectId로 오해될 여지 제거). focus ring을 `color-focus-ring` 자체 결정 토큰으로 확정(2px width, 2px offset, box-shadow 구현).
- 0.1 (2026-04-15): 초안 작성. 5개 화면 상태(정상/빈/접힘/rename/삭제), 인터랙션 12종, 상태 매트릭스, 디자인 결정 근거 9종, 열린 질문 Q1~Q3 해소 결과 정의.
