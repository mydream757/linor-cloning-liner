---
feature: 통합 앱 셸 + Project 생성/전환
version: 0.3
last_updated: 2026-04-15
source: 라이너 원본 서비스 Liner Scholar (scholar.liner.com)
captured_at: 2026-04-15
---

# 디자인 레퍼런스 — 기능 1 (통합 앱 셸 + Project 생성/전환)

이 문서는 기능 1의 **기능 고유** 디자인 실측값만 담는다. 색·폰트·radius 같은 재사용 토큰은 이 파일에 두지 말고 `../../design-tokens.md`에 정의한 뒤 이 파일에서는 **이름으로 참조**한다.

확신 없는 값은 빈칸 또는 `(미확인)`으로 둔다. 추측값이 굳지 않도록 주의.

**출처 범례**: `devtools` / `추정` / `카탈로그` / `결정`

## 스크린샷 인덱스 (포인팅 포함)

| # | 파일 | 상태 | 주요 포인팅 요소 |
|---|---|---|---|
| 01 | screenshots/01-empty-state.jpeg | 새 채팅 (빈 상태) | ①사이드바 / ②새 프로젝트 버튼 / ③프로젝트 리스트 / ④메인 헤더 / ⑤빈 콘텐츠 영역 / ⑥뷰 전환 토글 |
| 02 | screenshots/02-liner-selected.jpeg | Project 선택 + 채팅 뷰 | ①사이드바 / ②사이드바 헤더 / ③새 프로젝트 버튼 / ④프로젝트 섹션 헤더 / ⑤프로젝트 리스트 / ⑥메인 패널 / ⑦메인 헤더 / ⑧뷰 전환 토글 |
| 03 | screenshots/03-sidebar-collapsed.jpeg | 사이드바 접힘 | ①사이드바(48px 접힘) / ②사이드바 열기 버튼(햄버거) / ③메인 헤더 / ④뷰 전환 토글 |

---

## 레이아웃 치수

### 사이드바

| 속성 | 값 | 출처 |
|---|---|---|
| 폭 (펼친 상태) | **260px** | devtools — `w-[260px]` |
| 폭 (접힌 상태) | **48px** | devtools — `w-[48px]` |
| 접힘 애니메이션 duration | **150ms (0.15s), ease** | devtools — `duration-150`, `transition-width` |
| 좌우 padding (내부 컨테이너) | **좌 8px / 우 8px** | devtools — `px-component-200 = 8px` |
| 상하 padding (내부 컨테이너) | **상 12px / 하 12px** | devtools — `py-component-300 = 12px` |
| 사이드바 헤더 높이 (로고 + 토글 버튼) | **약 50px** | devtools — "새 프로젝트" 버튼 `top: 50px` 기준 추정 |
| 배경색 | `#272729` (`rgb(39,39,41)`) | devtools — `bg-neutral-container-low` |

### 메인 패널

| 속성 | 값 | 출처 |
|---|---|---|
| 좌우 padding | **0px** (패널 자체 padding 없음) | devtools |
| 채팅 콘텐츠 좌우 padding | **24px** | devtools — `px-[24px]` |
| 상단 헤더 높이 | **48px** | devtools — `h-12`, `border-b` |
| 배경색 | `#1E1E1F` (`rgb(30,30,31)`) | devtools — `bg-neutral-container-lowest` |
| 헤더 하단 구분선 색 | `rgba(233,233,235,0.20)` | devtools — `border-neutral-border-overlay-subtle` |

### Project 항목 (사이드바 내 리스트 행)

| 속성 | 값 | 출처 |
|---|---|---|
| 항목 높이 | **30px** | devtools — `h-[30px]` |
| 좌우 padding | **좌 8px / 우 8px** | devtools — `px-2` |
| 아이콘-라벨 gap | **8px** | devtools — `gap-2` |
| 항목 간 gap | **0px** (인접 배치) | devtools — 실측: 첫째 top 114, 둘째 top 144, height 30 → gap=0 |
| 활성 항목 배경 | `rgba(0,0,0,0)` 위에 Tailwind hover 클래스로 처리 | devtools |
| hover 배경색 | `rgba(109,109,112,0.12)` | devtools — `hover:bg-neutral-fill-overlay-lowest-hover` |
| 폰트 크기 | **13px** | devtools |
| 텍스트 색 | `#ffffff` (white) | devtools — `text-neutral-label-primary` |

### 뷰 전환 토글 (파일 / 편집 / 채팅)

| 속성 | 값 | 출처 |
|---|---|---|
| 토글 컨테이너 크기 | **151 × 37px** | devtools |
| 토글 컨테이너 padding | **4px** | devtools — `p-component-100 = 4px` |
| 토글 컨테이너 배경 | `rgba(109,109,112,0.16)` | devtools — `bg-neutral-fill-overlay-mid` |
| 토글 컨테이너 border-radius | **10px** | devtools — `rounded-m` |
| 개별 버튼 크기 | **약 45 × 28px** | devtools |
| 버튼 좌우 padding | **12px / 12px** | devtools — `px-component-300` |
| 버튼 간 gap | **4px** | devtools — `gap-positive-100` |
| 버튼 border-radius | **8px** | devtools — `rounded-[8px]` |
| 활성 버튼 배경 | `rgba(233,233,235,0.24)` (dark mode) | devtools — `dark:bg-[rgba(233,233,235,0.24)]` |
| 활성 버튼 텍스트 색 | `#ffffff` | devtools — `text-neutral-label-primary` |
| 비활성 버튼 배경 | `rgba(0,0,0,0)` (투명) | devtools |
| 비활성 버튼 텍스트 색 | `rgba(233,233,235,0.32)` | devtools — `text-neutral-label-tertiary` |
| 활성/비활성 구분 방식 | 배경색 + drop shadow (`shadow-normal`) | devtools |

---

## 사용하는 전역 토큰

이 표는 기능 1이 참조하는 전역 토큰 이름만 나열한다. **값은 [`../../design-tokens.md`](../../design-tokens.md)의 단일 진실 소스를 따른다.** 여기에 값을 복붙하지 않는 이유: 원본 값이 바뀔 때 두 곳을 동시에 고쳐야 하는 함정을 피하기 위함.

| 요소 | 속성 | 전역 토큰 |
|---|---|---|
| 메인 패널 배경 | background | `color-bg-primary` |
| 사이드바 배경 | background | `color-bg-secondary` |
| 뷰 전환 토글 컨테이너 | background | `color-surface-overlay` |
| 사이드바 구분선 | border | `color-border-default` |
| 메인 헤더 하단 구분선 | border-bottom | `color-border-subtle` |
| Project 항목 기본 | background | (없음 — 투명) |
| Project 항목 hover | background | `color-bg-hover` |
| Project 항목 active (선택) | background | `color-bg-active-subtle` |
| 뷰 전환 토글 활성 버튼 | background | `color-bg-active-strong` |
| 뷰 전환 토글 활성 버튼 | drop shadow | `shadow-md` (값 미확인, 토큰만 참조) |
| 본문 텍스트 (primary) | color | `color-text-primary` |
| 보조 텍스트 (secondary) | color | `color-text-secondary` |
| 3차 텍스트 (비활성 탭 라벨) | color | `color-text-tertiary` |
| 사이드바 좌우 padding | padding-x | `space-sm` (8px) |
| 사이드바 상하 padding | padding-y | `space-md` (12px) |
| Project 항목 좌우 padding | padding-x | `space-sm` (8px) |
| 아이콘–라벨 간격 | gap | `space-sm` (8px) |
| pill 컨테이너 padding | padding | `space-xs` (4px) |
| pill 버튼 간 gap | gap | `space-xs` (4px) |
| pill 버튼 좌우 padding | padding-x | `space-md` (12px) |
| 메인 콘텐츠 좌우 padding | padding-x | `space-lg` (24px) |
| pill 컨테이너 radius | border-radius | `radius-lg` (10px) |
| pill 버튼 radius | border-radius | `radius-md` (8px) |
| 사이드바 접힘 애니메이션 | transition | `motion-medium` (150ms ease) |
| Project 항목 라벨 | font-size | `text-caption` (13px) |

---

## 인터랙션 노트

- **사이드바 접힘 애니메이션:** `transition-width`, duration `150ms`, timing `ease`. 260px → 48px로 width만 변경, 내용은 `overflow: hidden`으로 자동 숨김.
- **사이드바 접힘 트리거:** 펼친 상태에서는 사이드바 우상단의 `h-8 w-8` 토글 아이콘 버튼(visibility: hidden → hover 시 표시 추정). 접힌 상태에서는 좌상단 햄버거 아이콘(`_l_18jjn_19`, 40×40px) 버튼으로 재열기.
- **뷰 전환 토글:** 파일/편집/채팅 3개 버튼이 하나의 pill container 안에 있음. 탭 선택은 독립적이며 토글 방식(같은 탭 재클릭 시 패널 닫힘). 파일·편집 탭은 사이드바 좌측에 별도 패널(260px)로 오버레이됨.
- **파일 패널 구조:** 채팅 탭 선택 상태에서 파일 탭 클릭 시, 파일 패널(260px)이 사이드바 우측에 슬라이드로 나타남. 파일 패널 내부 padding: 좌우 12px, 상하 8px.
- **Project 항목 rename:** (미확인 — 더블클릭 또는 우클릭 메뉴 추정)
- **마지막 Project 삭제 후 전환:** (미확인)
- **"더보기" 버튼:** 프로젝트가 3개 이상일 때 노출, 높이 30px, padding 좌우 8px.

---

## 열린 관찰

- 사이드바 접힘 상태(48px)에서 아이콘만 노출되는 mini-nav 패턴이 아니라 내용이 완전히 숨겨지는 방식. 접힘 상태에서 각 기능(알림, 에이전트 등) 접근성 확인 필요 — PRD에서 접힘 상태 UX 정의 필요.
- 뷰 전환 토글의 파일/편집/채팅이 상단 중앙에 위치 (글로벌 헤더). 이 토글이 "현재 프로젝트에 종속"인지 "앱 전역"인지 PRD 명확화 필요.
- 사이드바 프로젝트 항목의 active 상태 강조가 스크린샷에서 시각적으로 명확하지 않음 (배경색 차이가 미묘). 선택된 프로젝트 강조 방식 재검토 가치 있음.
- "더보기" 패턴 — 현재 3개 프로젝트까지만 표시 후 더보기. 최대 표시 개수 및 더보기 동작 방식 PRD 정의 필요.

---

## Changelog

- 0.1 (2026-04-15): 템플릿 생성.
- 0.2 (2026-04-15): DevTools 실측 완료. 사이드바(펼침 260px / 접힘 48px / padding 8px·12px), 메인 패널(헤더 48px / 콘텐츠 padding 24px), Project 항목(높이 30px / gap 0px / 아이콘-라벨 gap 8px), 뷰 전환 토글(컨테이너 151×37px / 버튼 45×28px / 버튼 gap 4px), 색상 토큰 7종 실측. 포인팅 스크린샷 3종 촬영.
- 0.3 (2026-04-15): 프런트매터 복구(표준 문서 형식), 스크린샷 파일명 교정(`02-linear-selected.jpeg` → `02-liner-selected.jpeg`), "사용하는 전역 토큰" 섹션을 프로젝트 시맨틱 토큰 이름(`color-bg-primary` 등)으로 연결 — 값은 `../../design-tokens.md` 참조로 전환.

---

## 포인팅 스크린샷 요약

아래는 실제로 촬영된 화면 상태별 포인팅 설명입니다. (빨간 박스 = 주요 측정 영역)

**01-empty-state (새 채팅 빈 상태):**
- ① 빨간 테두리: 사이드바 전체 영역 (260px 폭)
- ② 빨간 테두리: "새 프로젝트" 버튼 (height 32px, padding 8px)
- ③ 빨간 테두리: 프로젝트 리스트 (항목 height 30px × 3개, gap 0px)
- ④ 파란 테두리: 메인 헤더 (height 48px)
- ⑤ 파란 테두리: 메인 콘텐츠 빈 상태 (Liner Scholar 로고 + 빠른 시작 버튼)
- ⑥ 주황 테두리: 뷰 전환 토글 (파일/편집/채팅, 151×37px)

**02-liner-selected (Project 선택 + 채팅 뷰):**
- ① 빨간 테두리: 사이드바 전체 (260px)
- ② 빨간 테두리: 사이드바 헤더 영역 (Liner Scholar 로고 + 접기 버튼, ~50px)
- ③ 빨간 테두리: "새 프로젝트" 버튼
- ④ 빨간 테두리: "프로젝트" 섹션 헤더 행
- ⑤ 빨간 테두리: 프로젝트 리스트 (3개 항목, 총 높이 120px)
- ⑥ 파란 테두리: 메인 패널 (711px 폭)
- ⑦ 민트 테두리: 메인 헤더 (48px)
- ⑧ 주황 테두리: 뷰 전환 토글

**03-sidebar-collapsed (사이드바 접힌 상태):**
- ① 빨간 테두리: 사이드바 (48px 폭으로 축소)
- ② 빨간 테두리: 햄버거 아이콘 버튼 (40×40px, 사이드바 재열기)
- ③ 파란 테두리: 메인 헤더 (사이드바 접힘으로 더 넓어진 영역)
- ④ 주황 테두리: 뷰 전환 토글