---
version: 0.3
last_updated: 2026-04-15
source: 라이너 원본 서비스 Liner Scholar (scholar.liner.com)
---

# 디자인 토큰

이 문서는 **전역 디자인 토큰의 단일 진실 소스**다. 기능 명세는 이 파일의 토큰을 **이름으로 참조**하며, 값을 복붙하지 않는다. 확신 없는 값은 빈칸 또는 `(미확인)`으로 둔다.

**테마**: 이 프로젝트는 **다크 모드 단일**을 기본으로 한다 (기능 1 PRD 섹션 3 참조).

**출처 범례**: `devtools` — 브라우저 devtools 직접 측정 / `추정` — 스크린샷 눈대중 / `카탈로그` — 공식 가이드라인 / `결정` — 원본에 없거나 불분명해 우리가 결정

**원본 클래스 병기**: 출처 컬럼에 라이너 원본의 Tailwind 클래스명을 함께 기록한다 (예: `devtools — neutral-container-low`). 네이밍은 우리 프로젝트의 시맨틱 체계를 따르되, 원본 추적성은 출처로 확보.

## 색상

### 브랜드 색상

| 토큰명 | 값 | 출처 | 용도 |
|--------|---|---|------|
| color-primary | `rgb(35,102,56)` | devtools — Liner 전송 버튼 활성 `_primary` variant | 주요 액션 (전송 버튼 활성 등) |
| color-secondary | (미확인) | | 보조 요소 |
| color-accent | (미확인) | | 강조 |

### 시맨틱 색상

| 토큰명 | 값 | 출처 | 용도 |
|--------|---|---|------|
| color-success | (미확인) | | 성공 상태 |
| color-warning | (미확인) | | 경고 상태 |
| color-error | (미확인) | | 에러 상태 |
| color-info | (미확인) | | 정보 안내 |

### 배경/표면

| 토큰명 | 값 | 출처 | 용도 |
|--------|---|---|------|
| color-bg-primary | `#1E1E1F` | devtools — `neutral-container-lowest` | 메인 패널 배경 (가장 어두운 베이스) |
| color-bg-secondary | `#272729` | devtools — `neutral-container-low` | 사이드바 배경 (한 단계 밝은 표면) |
| color-surface-overlay | `rgba(109,109,112,0.16)` | devtools — `neutral-fill-overlay-mid` | 반투명 오버레이 컨테이너 (pill 토글, 사용자 메시지 버블 등) |
| color-bg-badge | `rgb(49,49,51)` | devtools — `neutral-container-high` | 출처 배지 배경 |

### 상태 오버레이

이 그룹은 요소 자체의 배경이 아니라 **상태 표현을 위해 덮어쓰는 반투명 오버레이**다. 밝은 표면 위에 쓸 때와 어두운 표면 위에 쓸 때 모두 자연스럽도록 rgba로 정의.

| 토큰명 | 값 | 출처 | 용도 |
|--------|---|---|------|
| color-bg-hover | `rgba(109,109,112,0.12)` | devtools — `neutral-fill-overlay-lowest-hover` | hover 상태 일반 |
| color-bg-active-subtle | `rgba(255,255,255,0.07)` | 결정 (v0.3, 사용자 피드백) | 사이드바 내 선택 상태 (주변 배경 위 7% 흰색 오버레이) |
| color-bg-active-strong | `rgba(233,233,235,0.24)` | devtools — pill 활성 버튼 | 명확한 선택 강조 (pill 활성 버튼) |

### 텍스트

| 토큰명 | 값 | 출처 | 용도 |
|--------|---|---|------|
| color-text-primary | `#ffffff` | devtools — `neutral-label-primary` | 본문·제목 |
| color-text-secondary | `rgba(233,233,235,0.64)` | devtools — `neutral-label-secondary` | 보조 설명 |
| color-text-tertiary | `rgba(233,233,235,0.32)` | devtools — `neutral-label-tertiary` | 비활성·힌트 (예: 비활성 뷰 탭 라벨) |

### 테두리

| 토큰명 | 값 | 출처 | 용도 |
|--------|---|---|------|
| color-border-default | `#39393B` | devtools — `neutral-border-opaque-subtle` | 사이드바·카드 구분선 |
| color-border-normal | `rgba(233,233,235,0.28)` | devtools — `neutral-border-overlay-normal` | 버튼 테두리, 메뉴 구분선 (default보다 약하고 subtle보다 강한 중간 단계) |
| color-border-subtle | `rgba(233,233,235,0.20)` | devtools — `neutral-border-overlay-subtle` | 반투명 구분선 (메인 헤더 하단) |

### Focus ring

키보드 포커스 표시. 원본 Liner Scholar는 focus ring을 커스터마이즈하지 않아 측정 불가 → **우리가 자체 결정**. 접근성 필수이며 어떤 interactive 요소도 focus 상태에서 이 ring을 쓴다.

| 토큰명 | 값 | 출처 | 용도 |
|--------|---|---|------|
| color-focus-ring | `rgba(255,255,255,0.6)` | 결정 | 모든 interactive 요소의 키보드 포커스 링 |

**기하**: 두께 `2px`, offset `2px`, `box-shadow: 0 0 0 2px <color-focus-ring>` 형태로 구현(outline 대신 box-shadow를 쓰면 border-radius를 자연스럽게 따라감). 두께·offset은 단일 값이라 별도 토큰으로 올리지 않는다 — 반복 재사용되거나 변형이 생기면 그때 스케일 토큰으로 승격.

**명도 근거**: 0.6은 `color-bg-primary`(#1E1E1F) 위에서 WCAG 3:1 대비를 안정적으로 넘긴다. 0.5 이하는 어두운 표면에서 흐려지고, 0.8 이상은 과하다. 브랜드 색 결정 후 그때 `color-focus-ring`을 브랜드 색 계열로 교체할지 재평가한다.

## 타이포그래피

| 토큰명 | 크기 | 두께 | 행간 | 출처 | 용도 |
|--------|------|------|------|---|------|
| text-heading-1 | 32px | 500 | (미확인) | devtools — Liner 빈 상태 CTA | 페이지 제목 |
| text-heading-2 | 22px | 600 | (미확인) | devtools — AI 응답 H3 제목 | 섹션 제목 |
| text-heading-3 | 17px | 600 | (미확인) | devtools — 출처 패널 헤더 | 소제목 |
| text-body | 16px | 350 | 25.6px | devtools — 메시지 본문 | 본문 |
| text-caption | 13px | 400 | (미확인) | devtools — Project 항목 | 사이드바 리스트 항목·보조 텍스트 |

### 폰트 패밀리

| 토큰명 | 값 | 출처 | 용도 |
|--------|---|---|------|
| font-family-sans | (미확인) | | 본문 전반 |
| font-family-mono | (미확인) | | 코드·숫자 |

## 간격

측정값이 Tailwind의 `component-*` 토큰 스케일을 따르고 있어 그 구조를 반영했다.

| 토큰명 | 값 | 출처 | 용도 |
|--------|---|---|------|
| space-xs | 4px | devtools — `p-component-100` | 최소 간격 (pill 컨테이너 padding, pill 버튼 gap) |
| space-sm | 8px | devtools — `px-component-200` | 관련 요소 간 (아이콘-라벨 gap, 사이드바 좌우 padding, Project 항목 좌우 padding) |
| space-md | 12px | devtools — `py-component-300`, `px-component-300` | 그룹 간 (사이드바 상하 padding, pill 버튼 좌우 padding) |
| space-lg | 24px | devtools — `px-[24px]` | 섹션 간 (메인 콘텐츠 좌우 padding) |
| space-xl | (미확인) | | 주요 레이아웃 |

## 모서리 둥글기

| 토큰명 | 값 | 출처 | 용도 |
|--------|---|---|------|
| radius-sm | 6px | devtools — Chat 목록 항목, 출처 카드 | 작은 요소 (리스트 항목, 카드) |
| radius-md | 8px | devtools — pill 개별 버튼 (`rounded-[8px]`), 출처 배지 | 버튼, 입력 필드, 배지 |
| radius-lg | 10px | devtools — pill 컨테이너 (`rounded-m`) | 카드, 모달 |
| radius-xl | 20px | devtools — 사용자 메시지 버블 | 메시지 버블 |
| radius-full | 28px+ | devtools — 입력카드(28px), 원형 버튼(200px) | 둥근 카드, 원형 요소 |

## 그림자

| 토큰명 | 값 | 출처 | 용도 |
|--------|---|---|------|
| shadow-sm | (미확인) | | 미세한 분리감 |
| shadow-md | (미확인 — Tailwind `shadow-normal` 클래스만 확인) | devtools — pill 활성 버튼 drop shadow | 활성 상태 강조 (pill 활성 버튼 등) |
| shadow-lg | (미확인) | | 모달, 팝오버 |

## 모션

| 토큰명 | 값 | 출처 | 용도 |
|--------|---|---|------|
| motion-fast | (미확인) | | 즉각 피드백 (hover, focus) |
| motion-medium | 150ms ease | devtools — `duration-150`, `transition-width` | 사이드바 접힘, 패널 슬라이드 |
| motion-slow | (미확인) | | 강조된 애니메이션 |

## Changelog

- 0.5 (2026-04-17): 기능 3 실측 반영. `color-primary` rgb(35,102,56) 확정 (전송 버튼 활성). `color-bg-badge` rgb(49,49,51) 추가 (출처 배지). 타이포그래피 `text-heading-1`(32px/500), `text-heading-2`(22px/600), `text-heading-3`(17px/600), `text-body`(16px/350/25.6px) 실측 확정. `radius-sm`(6px) 확정, `radius-xl`(20px), `radius-full`(28px+) 추가.
- 0.4 (2026-04-16): `color-border-normal` (`rgba(233,233,235,0.28)`) 추가. 기능 2 실측에서 로그인 프로바이더 버튼 border + 프로필 메뉴 구분선에 동일 값이 반복 사용됨을 확인. 기존 `color-border-subtle`(0.20)과 `color-border-default`(불투명 #39393B) 사이의 중간 단계.
- 0.3 (2026-04-15): `color-bg-active-subtle`을 `#272729` → `rgba(255,255,255,0.07)`로 재결정. 기존 값은 `color-bg-secondary`(사이드바 배경)와 완전히 동일해 사이드바 내 선택 상태가 시각적으로 드러나지 않았다(기능 1 D3 브라우저 검증 중 사용자 피드백). 7% 흰색 오버레이로 가독 가능한 수준의 강조를 확보. 출처는 `추정` → `결정`으로 승격. 상세 근거는 `architecture/tech-debt.md` T-001 관련 관찰 참조.
- 0.2 (2026-04-15): `color-focus-ring` 추가. 원본이 focus ring을 커스터마이즈하지 않아 측정 불가 → `결정` 출처로 `rgba(255,255,255,0.6)` 확정(WCAG 3:1 대비 기준). 기하는 2px width / 2px offset / box-shadow 구현으로 인라인 명시.
- 0.1 (2026-04-15): 초안 작성. 기능 1 디자인 레퍼런스 수집(Liner Scholar 다크 모드)에서 실측한 값을 기준으로 배경·상태 오버레이·텍스트·테두리·간격·radius·모션 카테고리의 첫 토큰을 정의. 브랜드 색상·타이포그래피(heading/body/font-family)·그림자 세부값·space-xl·radius-sm은 (미확인). 후속 기능 작업 중 필요할 때 채운다.
