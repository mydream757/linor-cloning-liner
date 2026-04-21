---
feature: Asset 관리 (Reference + Document) + 미할당 Chat
version: 0.1
last_updated: 2026-04-21
source: 라이너 원본 서비스 (Liner / Liner Write / Liner Scholar)
captured_at: (사용자 스크린샷 촬영 후 기입)
---

# 디자인 레퍼런스 — 기능 4 (Asset 관리 + 미할당 Chat)

이 문서는 기능 4의 **기능 고유** 디자인 실측값만 담는다. 색·폰트·radius 같은 재사용 토큰은 이 파일에 두지 말고 `../../design-tokens.md`에 정의한 뒤 이 파일에서는 **이름으로 참조**한다.

확신 없는 값은 빈칸 또는 `(미확인)`으로 둔다. 스크린샷 촬영 이전 단계이므로 모든 실측값 칸은 **비워둔다**.

**출처 범례**: `devtools` / `추정` / `카탈로그` / `결정`

---

## 스크린샷 인덱스

아래 표에서 `(원본 없음 — 독자 설계)` 표기는 라이너 원본 서비스에 유사 UI가 없거나 불명확하여 우리 프로젝트가 독자적으로 설계해야 하는 화면을 의미한다.

| # | 파일 | 상태 | 주요 포인팅 요소 | 원본 출처 |
|---|------|------|-----------------|----------|
| 01 | screenshots/01-reference-add-url.png | Reference 추가 — URL 입력 모달/폼 | URL 입력 필드, 제목 입력 필드, 발췌 입력 필드(선택), 저장 버튼 | Liner Scholar — Space 내 Reference 추가 UI |
| 02 | screenshots/02-reference-add-text.png | Reference 추가 — 텍스트 스니펫 | 텍스트 영역, 제목 입력(선택), 저장 버튼 | Liner Scholar — 텍스트 저장 UI (있으면) |
| 03 | screenshots/03-reference-list-project.png | Reference 목록 — Project 스코프 | 목록 컨테이너, 항목 카드(제목/URL/kind 배지), 삭제 버튼, 빈 상태 | Liner Scholar — Space 내 Reference 목록 |
| 04 | screenshots/04-reference-list-unassigned.png | Reference 목록 — 미할당 (`/liner`) | 목록 컨테이너, 빈 상태 CTA | (원본 없음 — 독자 설계) |
| 05 | screenshots/05-document-create.png | Document 생성 UI | 제목 입력 필드, Project 할당 선택, 생성 버튼 | Liner Write — 새 문서 생성 다이얼로그 (있으면) |
| 06 | screenshots/06-document-list-project.png | Document 목록 — Project 스코프 (`/p/[pid]/write`) | 목록 컨테이너, 항목 카드(제목/날짜), 삭제 버튼, 빈 상태 | Liner Write — Space 내 문서 목록 |
| 07 | screenshots/07-document-list-unassigned.png | Document 목록 — 미할당 (`/write`) | 목록 컨테이너, 빈 상태 CTA, 새 Document 버튼 | (원본 없음 — 독자 설계) |
| 08 | screenshots/08-liner-unassigned-empty.png | 미할당 Liner 뷰 빈 상태 (`/liner`) | CTA 텍스트, 입력카드, "+ 새 대화" 진입점 | (원본 없음 — 독자 설계) |
| 09 | screenshots/09-liner-unassigned-chat.png | 미할당 특정 Chat (`/liner/c/[chatId]`) | 상단 Project 배지 없음, 메시지 영역, 입력창 — 기능 3 Chat UI와의 차이 확인 | (원본 없음 — 독자 설계) |
| 10 | screenshots/10-sidebar-new-chat-button.png | 사이드바 전역 "+ 새 대화" 버튼 위치 | 버튼 위치·크기, Project 트리와의 레이아웃 관계 | Liner — 사이드바 상단 "새 질문" 버튼 (기능 3 실측 06번 참조) |
| 11 | screenshots/11-chat-move-dialog.png | Chat → Project 이동 다이얼로그 | Project 선택 목록, "Asset 동반 이동" 체크박스(기본 off), 동반 대상 범위 표시 | (원본 없음 — 독자 설계) |
| 12 | screenshots/12-reference-select-chip.png | Reference 선택 UI — 입력창 하단 첨부 영역 | "Reference 선택" 버튼, 선택된 Reference 칩(chip), 칩 제거(×) 버튼, 검색 UI | (원본 없음 — 독자 설계) |
| 13 | screenshots/13-citation-panel-real.png | 출처 패널 — 실 Reference 데이터 표시 | 제목, URL 링크(url kind), 텍스트 발췌(text kind), 외부 링크 버튼 | Liner — 출처 상세 패널 (기능 3 실측 05번과 비교) |
| 14 | screenshots/14-asset-delete-dialog.png | Asset 삭제 확인 다이얼로그 | 다이얼로그 제목, 경고 문구, 취소/삭제 버튼 | Liner Write / Scholar — 삭제 확인 다이얼로그 (있으면) |
| 15 | screenshots/15-empty-state-asset.png | Asset 빈 상태 | "아직 저장된 Asset이 없습니다" 안내, 첫 Asset 만들기 CTA | Liner Scholar / Write — 빈 상태 화면 |
| 16 | screenshots/16-loading-error-states.png | 로딩·에러·삭제된 출처 배지 | 로딩 인디케이터, 저장 실패 인라인 에러, 삭제된 Asset 참조 배지 graceful degradation | Liner — 에러 처리 화면 (있으면) |

---

## 레이아웃 치수

### Reference 추가 UI (URL / 텍스트 공통)

| 속성 | 값 | 출처 |
|------|---|------|
| UI 형태 (모달 / 슬라이드 / 인라인 폼) | | |
| 모달/폼 너비 | | |
| 모달/폼 border-radius | | |
| 배경색 | | |
| 입력 필드 높이 | | |
| 입력 필드 border | | |
| 입력 필드 border-radius | | |
| 텍스트 영역 최소 높이 (text kind) | | |
| 제목 레이블 폰트 크기 / 웨이트 | | |
| 저장 버튼 높이 | | |
| 저장 버튼 border-radius | | |
| 저장 버튼 배경색 (활성) | | |
| 취소/닫기 버튼 스타일 | | |
| 폼 내부 padding | | |
| 필드 간 gap | | |

### Reference 목록 (Project 스코프 / 미할당)

| 속성 | 값 | 출처 |
|------|---|------|
| 목록 컨테이너 배경색 | | |
| 항목 카드 배경색 | | |
| 항목 카드 border | | |
| 항목 카드 border-radius | | |
| 항목 카드 padding | | |
| 항목 카드 간 gap | | |
| 항목 제목 폰트 크기 / 웨이트 | | |
| 항목 URL 텍스트 폰트 크기 / 색 | | |
| 항목 발췌 텍스트 폰트 크기 | | |
| `url` / `text` kind 배지 크기·색 | | |
| kind 배지 border-radius | | |
| 삭제 버튼 위치 / 크기 (hover 시 표시 or 항상 표시) | | |
| 목록 전체 최대 너비 | | |
| 목록 상하 padding | | |

### Document 생성 UI

| 속성 | 값 | 출처 |
|------|---|------|
| UI 형태 (모달 / 인라인 폼) | | |
| 모달/폼 너비 | | |
| 제목 입력 필드 높이 | | |
| Project 선택 드롭다운 높이 | | |
| Project 선택 드롭다운 border-radius | | |
| 생성 버튼 높이 | | |
| 생성 버튼 배경색 (활성) | | |
| 폼 내부 padding | | |
| 필드 간 gap | | |

### Document 목록 (Write 뷰 내부)

| 속성 | 값 | 출처 |
|------|---|------|
| 목록 레이아웃 (리스트 / 그리드) | | |
| 항목 카드 배경색 | | |
| 항목 카드 border | | |
| 항목 카드 border-radius | | |
| 항목 카드 padding | | |
| 항목 카드 간 gap | | |
| 항목 제목 폰트 크기 / 웨이트 | | |
| 항목 날짜 텍스트 폰트 크기 / 색 | | |
| 삭제 버튼 위치 / 크기 | | |
| "새 Document" 버튼 위치 | | |
| "새 Document" 버튼 크기 / 스타일 | | |
| 목록 전체 최대 너비 | | |

### 미할당 Liner 뷰 빈 상태 (`/liner`)

| 속성 | 값 | 출처 |
|------|---|------|
| CTA 텍스트 내용 | | |
| CTA 폰트 크기 / 웨이트 | | |
| CTA 위치 (세로 중앙 / 상단 오프셋 등) | | |
| 입력카드 너비 (기능 3 빈 상태 720px와 동일 여부) | | |
| Project 배지 또는 "미할당" 표시 유무 / 위치 | | |
| "+ 새 대화" 버튼 연결 방식 (CTA 내 or 사이드바 전역 버튼) | | |

### 미할당 Chat UI (`/liner/c/[chatId]`)

| 속성 | 값 | 출처 |
|------|---|------|
| 기능 3 Chat UI 대비 차이 항목 | | |
| Project 귀속 표시 방식 (상단 헤더 배지 등) | | |
| "Project에 할당" CTA 위치 / 크기 | | |
| 헤더 영역 높이 (Project 없음 상태) | | |

### 사이드바 전역 "+ 새 대화" 버튼

기능 3 D4에서 제거됐다가 기능 4에서 복귀하는 버튼. 기능 3 `measurements.md` 실측값(Chat 목록 항목 높이 32px / 사이드바 너비 260px)을 기반으로 위치를 결정한다.

| 속성 | 값 | 출처 |
|------|---|------|
| 버튼 위치 (사이드바 내 위치 — 최상단 / Project 트리 상단 / 최하단) | | |
| 버튼 너비 / 높이 | | |
| 버튼 border-radius | | |
| 버튼 배경색 (기본 / hover) | | |
| 버튼 텍스트 / 아이콘 조합 | | |
| 버튼과 Project 트리의 간격 | | |

### Chat → Project 이동 다이얼로그

| 속성 | 값 | 출처 |
|------|---|------|
| 다이얼로그 너비 | | |
| 다이얼로그 border-radius | | |
| 다이얼로그 배경색 | | |
| 다이얼로그 padding | | |
| 헤더 폰트 크기 / 웨이트 | | |
| Project 선택 목록 항목 높이 | | |
| Project 선택 목록 항목 간 gap | | |
| 선택 상태 배경색 | | |
| "Asset 동반 이동" 체크박스 위치 (폼 하단 구분선 아래) | | |
| 체크박스 크기 | | |
| 동반 대상 범위 표시 텍스트 폰트 크기 | | |
| 확인 / 취소 버튼 배치 (우측 정렬 / 전체 너비) | | |
| 확인 버튼 배경색 (활성) | | |

### Reference 선택 UI (입력창 하단 첨부 영역)

기능 3 입력창 카드(카드 배경 `color-bg-primary`, border-radius 28px, 하단 고정 20px)와 연속되는 영역. 파일 첨부 UX와 유사.

| 속성 | 값 | 출처 |
|------|---|------|
| 첨부 영역 위치 (입력 필드 바로 아래 / 입력 카드 내부 상단) | | |
| 첨부 영역 최소 높이 (Reference 없을 때) | | |
| "Reference 선택(+)" 버튼 크기 | | |
| "Reference 선택(+)" 버튼 border-radius | | |
| "Reference 선택(+)" 버튼 border | | |
| Reference 칩(chip) 높이 | | |
| Reference 칩 border-radius | | |
| Reference 칩 배경색 | | |
| Reference 칩 텍스트 폰트 크기 / 웨이트 | | |
| 칩 제거(×) 버튼 크기 | | |
| 칩 간 gap | | |
| 검색 UI 형태 (인라인 텍스트 필터 / 드롭다운 / 팝오버) | | |
| 검색 팝오버 너비 / 최대 높이 | | |
| 검색 결과 항목 높이 | | |
| 검색 결과 항목 간 gap | | |

### 출처 패널 — 실 Reference 데이터 표시

기능 3에서 측정한 패널 너비 399px, 배경 `color-bg-primary`(rgb(30,30,31))를 그대로 재사용. 이 섹션은 **실 Reference 데이터 형상**이 기능 3 stub과 다를 수 있는 부분만 측정.

| 속성 | 값 | 출처 |
|------|---|------|
| URL kind: 외부 링크 버튼 위치 / 크기 | | |
| URL kind: URL 텍스트 줄임 처리 방식 (truncate / wrap) | | |
| text kind: 발췌 텍스트 최대 줄 수 / 접기 버튼 여부 | | |
| kind 구분 표시 (배지 or 레이블) 위치 | | |
| 삭제된 Asset 참조 배지 graceful degradation 표시 방식 | | |

### Asset 삭제 확인 다이얼로그

| 속성 | 값 | 출처 |
|------|---|------|
| 다이얼로그 너비 | | |
| 다이얼로그 border-radius | | |
| 다이얼로그 배경색 | | |
| 헤더 폰트 크기 / 웨이트 | | |
| 경고 문구 폰트 크기 / 색 | | |
| 삭제 버튼 배경색 (`color-error` 계열) | | |
| 취소 버튼 스타일 | | |
| 버튼 높이 | | |
| 버튼 간 gap | | |

### 빈 상태 — Asset 0개

| 속성 | 값 | 출처 |
|------|---|------|
| 빈 상태 아이콘 유무 / 크기 | | |
| 안내 텍스트 폰트 크기 / 웨이트 | | |
| CTA 버튼 크기 / 스타일 | | |
| 빈 상태 컨테이너 세로 정렬 방식 | | |

### 로딩 인디케이터 (Asset 목록)

| 속성 | 값 | 출처 |
|------|---|------|
| 로딩 인디케이터 형태 (스피너 / 스켈레톤 카드) | | |
| 스켈레톤 카드 높이 (사용 시) | | |
| 스피너 크기 (사용 시) | | |

---

## 사용하는 전역 토큰

이 표는 기능 4가 참조하는 전역 토큰 이름만 나열한다. **값은 [`../../design-tokens.md`](../../design-tokens.md)의 단일 진실 소스를 따른다.**

### 재사용 (design-tokens.md에 이미 있음)

| 요소 | 속성 | 전역 토큰 |
|------|------|----------|
| 다이얼로그·모달 배경 | background-color | `color-bg-primary` |
| 목록 항목 카드 배경 | background-color | `color-bg-primary` |
| 사이드바 배경 | background-color | `color-bg-secondary` |
| 항목 카드 border | border-color | `color-border-subtle` |
| 본문 텍스트 | color | `color-text-primary` |
| 보조 텍스트 (URL, 날짜) | color | `color-text-secondary` |
| 힌트·비활성 텍스트 | color | `color-text-tertiary` |
| 저장·생성·확인 버튼 활성 | background-color | `color-primary` |
| 선택 상태 배경 | background-color | `color-bg-active-subtle` |
| hover 배경 | background-color | `color-bg-hover` |
| 목록 항목 border-radius | border-radius | `radius-sm` |
| 버튼 border-radius | border-radius | `radius-md` |
| 카드 border-radius | border-radius | `radius-lg` |
| 패널 슬라이드 | transition | `motion-medium` |
| kind 배지 배경 | background-color | `color-bg-badge` |
| 보조 텍스트 (URL) | border-color | `color-border-normal` |

### 신규 필요 (Step B/C에서 확정)

기능 4에서 새로 나올 가능성이 높은 토큰 후보. 실측 후 `design-tokens.md`에 추가.

| 후보 토큰명 | 예상 용도 | 현재 상태 |
|------------|----------|----------|
| `color-error` | 삭제 확인 버튼, 에러 인라인 메시지 | `design-tokens.md`에 (미확인) 상태. T-001 해소 시 확정 필요 |
| `color-chip-bg` | Reference 선택 칩 배경 | 신규 후보. `color-surface-overlay`(= rgba(109,109,112,0.16)) 재사용 가능성 있음 — 실측 후 결정 |
| `color-kind-url-bg` | URL kind 배지 배경 (초록계열 가능성) | 신규 후보. `color-primary` 계열 또는 별도 토큰 여부 실측 필요 |
| `color-kind-text-bg` | text kind 배지 배경 | 신규 후보 |
| `radius-dialog` | 다이얼로그 모서리 | 신규 후보. `radius-lg`(10px) 재사용 가능성 있음 |
| `shadow-dialog` | 다이얼로그 그림자 | 신규 후보. `shadow-lg` (현재 미확인) 와 통합 가능 |

---

## 인터랙션 노트

(Step B 실측 및 스크린샷 촬영 중 관찰 기록 예정)

- Reference 추가 폼: URL 입력 후 저장 시 입력 필드 유효성 검사 피드백 방식 확인 필요
- Reference 선택 칩: 여러 Reference 선택 시 입력 카드 높이 변화 방식 확인 (동적 확장 vs 스크롤)
- Chat → Project 이동: "Asset 동반 이동" 체크박스 체크 시 동반 대상 범위 표시 방식 (숫자 표시 vs 목록 미리보기)
- 출처 패널 (실 Reference): URL kind와 text kind의 패널 내부 레이아웃 차이 확인
- 사이드바 "+ 새 대화" 버튼: 클릭 후 미할당 Chat 생성 → URL 전환 트랜지션 방식

---

## 열린 관찰

(Step B 스크린샷 촬영·실측 중 발견 사항 기록 예정)

### 독자 설계 필요 항목의 설계 기준

아래 항목은 원본 라이너에 유사 UI가 없어 우리가 독자적으로 설계해야 한다. 스크린샷 촬영 시 참조 화면이 없으므로 아래 설계 기준을 열린 관찰로 미리 기록해 둔다.

**미할당 Liner 뷰 빈 상태 (`/liner`)**
- 기능 3 빈 상태 CTA(중앙 정렬, 32px h1, 입력카드 720px)와 동일 구조를 기준으로 한다 (`measurements.md` v0.2 "빈 상태" 섹션 참조).
- "Project 없이 즉시 대화 시작"이라는 의도를 CTA 텍스트로 드러내야 한다.
- "🎓 학술 연구 AI", "✍️ 글쓰기 AI" 빠른시작 버튼은 현재 외부 서비스로의 링크이므로 이 프로젝트에서는 대체 CTA가 필요하다.

**미할당 Chat UI (`/liner/c/[chatId]`)**
- 기능 3 Chat UI와 레이아웃·컴포넌트 대부분 동일. 차이는 Project 귀속 표시 없음.
- "이 대화를 Project에 할당하기" CTA를 어디에 위치시킬지가 핵심 설계 포인트. 후보: (a) 헤더 영역 우측 뱃지, (b) 사이드바 Chat 항목 컨텍스트 메뉴.
- 도메인 모델상 미할당은 "Project 없는 정상 상태"이므로 강제 할당 유도가 아닌 선택적 CTA여야 한다.

**Reference 선택 칩 UI**
- 파일 첨부 UX 레퍼런스: GitHub, Notion 등의 파일 첨부 칩 패턴을 참고한다.
- 기능 3 입력카드의 border-radius(28px), padding(10px)과 시각적으로 일체화되어야 한다.
- 기능 3 첨부(+) 버튼(40×40px, border-radius 200px, border 1px solid `color-border-normal`)과 유사한 "Reference 선택" 버튼을 추가하거나 해당 버튼을 재사용하는 방향을 검토한다.

**Chat → Project 이동 다이얼로그**
- PM 명세 §3에서 "기본값 off" + "체크박스"로 결정됨. Designer는 체크박스 위치·동반 대상 범위 표시 세부 UX를 확정해야 한다.
- Project 선택 목록: 기능 1·2의 Project 목록 UI (사이드바 트리)와 일관성 유지 필요.
- 이동 완료 후 URL 리다이렉트(ADR-0015 §5 리다이렉트 정책)가 UX 흐름에 미치는 영향 설계 필요.

**사이드바 전역 "+ 새 대화" 버튼**
- 기능 3 D4에서 제거됐던 위치로 복귀. 기능 3 `measurements.md` v0.2 Chat 목록 섹션에서 "새 질문" 버튼 위치가 "사이드바 상단, 전체 너비 244px, 높이 32px"로 측정됨 — 이를 기준 복귀 위치로 삼는다.
- 클릭 시 `project_id=null`인 Chat 생성 → `/liner/c/[chatId]`로 이동하는 흐름이므로, 버튼이 "Project 트리 외부(전역)"에 위치해야 의미론적으로 올바르다.

---

## Changelog

- 0.1 (2026-04-21): 템플릿 생성. 스크린샷 수집 대상 16종 정의 (원본 촬영 가능 7종, 독자 설계 필요 9종). 빈 실측 테이블 12종 생성 (Reference 추가 UI / Reference 목록 / Document 생성 UI / Document 목록 / 미할당 Liner 빈 상태 / 미할당 Chat UI / 사이드바 "+ 새 대화" 버튼 / Chat-Project 이동 다이얼로그 / Reference 선택 칩 UI / 출처 패널 실 Reference / Asset 삭제 다이얼로그 / 빈 상태·로딩). 전역 토큰 재사용 16종, 신규 후보 6종 정의. 독자 설계 5항목의 설계 기준 열린 관찰로 선기록.
