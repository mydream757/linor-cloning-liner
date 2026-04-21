---
feature: Asset 관리 (Reference + Document) + 미할당 Chat
version: 0.3
last_updated: 2026-04-21
source: 라이너 원본 서비스 (Liner / Liner Write / Liner Scholar)
captured_at: 2026-04-21 (DevTools 실측 완료 + 사용자 추가 관찰)
---

# 디자인 레퍼런스 — 기능 4 (Asset 관리 + 미할당 Chat)

이 문서는 기능 4의 **기능 고유** 디자인 실측값만 담는다. 색·폰트·radius 같은 재사용 토큰은 이 파일에 두지 말고 [`../../design-tokens.md`](../../design-tokens.md)에 정의한 뒤 이 파일에서는 **이름으로 참조**한다.

확신 없는 값은 `(미확인)`으로 표시한다. DevTools 실측 완료 기준으로 모든 칸을 채운다.

**출처 범례**: `devtools` / `추정` / `카탈로그` / `결정`

---

## 스크린샷 인덱스

### 촬영 완료 (10장)

| # | 파일 | 상태 | 주요 포인팅 요소 | 원본 출처 |
|---|------|------|-----------------|----------|
| 01 | screenshots/01-reference-add-url.png | Reference 추가 — URL 입력 모달 | URL 입력 필드, 취소/추가 버튼 | Liner — 소스 컬렉션 자료 추가 → URL 입력 |
| 02 | screenshots/02-reference-add-text.png | Reference 추가 — 텍스트 스니펫 | 텍스트 영역, 취소/추가 버튼 | Liner — 소스 컬렉션 자료 추가 → 텍스트 입력 |
| 03 | screenshots/03-reference-list-project.png | Reference 목록 — Collection 스코프 (간이) | 목록 행(제목/날짜), 삭제 버튼 | Liner — 소스 컬렉션 내 목록 |
| 04 | screenshots/04-liner-unassigned-empty.png | 미할당 Liner 뷰 빈 상태 **+ 사이드바 "+ 새 질문" 버튼** | CTA 텍스트, 입력카드, 사이드바 상단 버튼 (동일 이미지에서 사이드바까지 함께 캡처됨) | Liner — 메인 홈 (app.liner.com/ko) |
| 05 | screenshots/05-liner-chat.png | Chat UI | 상단 헤더, 메시지 영역, 입력창 | Liner — 대화 화면 |
| 06 | screenshots/06-citation-panel-real.png | 출처 패널 — 실 데이터 표시 | 패널 헤더, 출처 제목/도메인/날짜, 인용 텍스트 | Liner — 인용된 출처 패널 |
| 07 | screenshots/07-asset-delete-dialog.png | Asset 삭제 확인 다이얼로그 | 다이얼로그 제목, 경고 문구, 취소/삭제 버튼 | Liner — 소스 컬렉션 자료 삭제 확인 |
| 08 | screenshots/08-reference-list-detail.png | Reference 목록 — Collection 상세 (전체 뷰) | 상단 컬렉션명·설정·공유·"+ 추가", "N개의 소스" 카운트, 파일명/날짜 테이블, 하단 "이 컬렉션 자료로 질문하기" CTA, 사이드바 **"최근 기록" 섹션**(미할당 Chat 노출 위치 관찰) | Liner — 소스 컬렉션 상세 화면 |
| 09 | screenshots/09-liner-write-document-home.png | Liner Write 초기 화면 **(참조 전용 — 우리 방향은 다름)** | "어떤 글을 쓰고 싶으세요?" h1, 빠른 시작 버튼 5종, 하단 입력창. **원본은 Chat-like 진입 플로우지만 우리는 "포워딩" 방식으로 커스텀 — 열린 관찰 참조** | Liner Write (write.liner.com) — 외부 도메인이지만 참조 가능 |
| 10 | screenshots/10-asset-empty-original.png | Asset 빈 상태 — 원본 (파일 업로드 포함) | "애셋" 타이틀 + 설정, 중앙 점선 박스(파일 드래그 영역) "파일 선택/드래그", 하단 "URL 입력" + "텍스트 입력" 버튼 2종 | Liner — 애셋 빈 상태 화면. **우리는 파일 업로드 제외이므로 URL/텍스트 2버튼만 차용** |

### 미촬영 (사유별 분류)

| 항목 | 사유 | 후속 처리 |
|------|------|----------|
| Reference 목록 — 미할당 (`/liner`) | 원본에 미할당 개념 없음 (원본은 "최근 기록"에 통합) | 독자 설계 (스코프 필터 빼고 `08` Collection 상세 패턴 준용) |
| Document 생성 UI | 원본 플로우와 우리 방향이 다름 | **독자 설계 (포워딩 방식)** — 열린 관찰 참조 |
| Document 목록 — Project 스코프 (`/p/[pid]/write`) | 동상 | **사이드바 "최근 기록" 섹션 재사용 방향** — 전용 리스트 UI 최소화 (열린 관찰 참조) |
| Document 목록 — 미할당 (`/write`) | 동상 | 동상 |
| 미할당 특정 Chat (`/liner/c/[chatId]`) | 원본에 미할당 개념 없음 ("최근 기록"에 그냥 노출) | 독자 설계 — `05` Chat UI 기준에서 Project 배지만 제거, 사이드바 "최근 기록" 섹션에도 노출 |
| Chat → Project 이동 다이얼로그 | 원본 없음 | 독자 설계 (삭제 다이얼로그 `07` 패턴 준용) |
| Reference 선택 칩 UI (입력창 하단 첨부 영역) | 원본 없음 | 독자 설계 (기존 `+` 버튼 재사용 + 칩 추가) |
| 로딩·에러·삭제된 출처 배지 graceful degradation | 원본에서 관찰 불가 (사용자 확인) | 독자 설계 — Step C에서 설계 기준 결정 |

---

## 레이아웃 치수

### Reference 추가 UI (URL / 텍스트 공통)

| 속성 | 값 | 출처 |
|------|---|------|
| UI 형태 (모달 / 슬라이드 / 인라인 폼) | 모달 (중앙 오버레이) | devtools |
| 모달/폼 너비 | 560px (자료 추가 초기), 480px (URL 입력), 560px (텍스트 입력) | devtools |
| 모달/폼 border-radius | 14px (URL/텍스트 입력), 10px (자료 추가 초기) | devtools |
| 배경색 | rgb(30, 30, 31) — `color-bg-primary` | devtools |
| 입력 필드 높이 | 52px (URL input), 200px min (텍스트 textarea) | devtools |
| 입력 필드 border (포커스) | 1px solid rgb(255, 255, 255) | devtools |
| 입력 필드 border-radius | 10px (URL input), 6px (텍스트 textarea) | devtools |
| 텍스트 영역 최소 높이 (text kind) | 200px, `resize: none` | devtools |
| 제목 레이블 폰트 크기 / 웨이트 | 20px / 600 | devtools |
| 저장 버튼 높이 | 40px | devtools |
| 저장 버튼 border-radius | 8px | devtools |
| 저장 버튼 배경색 (활성) | `color-primary` (비활성 시 rgba(109,109,112,0.16)) | devtools |
| 취소/닫기 버튼 스타일 | 80×40px, border: 1px solid rgba(233,233,235,0.28), border-radius: 8px | devtools |
| 폼 내부 padding | 24px (모달 전체), 12px 24px (입력 영역) | devtools |
| 필드 간 gap | 16px | devtools |

### Reference 목록 (Collection 스코프 / 미할당)

| 속성 | 값 | 출처 |
|------|---|------|
| 목록 컨테이너 배경색 | rgb(30, 30, 31) — `color-bg-primary` | devtools |
| 항목 카드 배경색 | rgba(0, 0, 0, 0) (투명, 하단 border로 구분) | devtools |
| 항목 카드 border | border-bottom: 1px solid rgba(233, 233, 235, 0.2) | devtools |
| 항목 카드 border-radius | 0px (리스트 행 형태) | devtools |
| 항목 카드 padding | 12px 6px (상하 12px, 좌우 6px) | devtools |
| 항목 카드 간 gap | 16px (flex gap) | devtools |
| 항목 제목 폰트 크기 / 웨이트 | 14px / 350 | devtools |
| 항목 날짜 텍스트 폰트 크기 / 색 | 13px / rgba(233, 233, 235, 0.64) — `color-text-secondary` | devtools |
| 항목 발췌 텍스트 폰트 크기 | (미확인 — 목록 뷰에 발췌 미표시) | 추정 |
| url / text kind 구분 | 24×24px 아이콘 (종류 별 아이콘으로 구분, 별도 배지 없음) | devtools |
| 삭제 버튼 접근 방식 | `...` 버튼 → 컨텍스트 메뉴 → 삭제 항목 | devtools |
| 목록 전체 최대 너비 | 720px (`min-m:max-w-[720px]`) | devtools |
| 목록 상하 padding | (컨테이너 내부 padding 없음, 항목 padding으로 제어) | devtools |

### Document 생성 UI (우리 방향: "포워딩")

**원본 vs 우리 방향 차이**: Liner Write 원본(스크린샷 `09`)은 "어떤 글을 쓰고 싶으세요?"라는 Chat-like 입력 + 빠른 시작 버튼(블로그/사업계획서/이력서 등) 방식으로, **문서의 초안을 LLM에 바로 요청하는 진입 플로우**다. 우리 프로젝트의 방향은 다르다:

- **주 플로우는 "포워딩"**: Liner(기본 탐색 뷰)에서 대화·조사를 거친 결과물(메시지의 `generated_asset_id`) 또는 사용자가 명시적으로 선택한 Reference들을 **Document Asset으로 내보내는** 방식
- **빈 Document 직접 생성은 보조 플로우**: "새 Document" 버튼으로 제목만 입력해 빈 Document 생성 가능 (PM 명세 §2 시나리오 5). 이건 편집 대상이 먼저 필요할 때의 최소 진입점
- **포워딩 액션의 구체적 UI**: Chat 메시지의 어시스턴트 응답 하단 액션바에 "Document로 내보내기" 버튼, 또는 출처 패널 하단 "선택 Reference로 Document 생성" CTA 등. 구체 위치는 Step C에서 결정

| 속성 | 값 | 출처 |
|------|---|------|
| 빈 Document 생성 — UI 형태 | 미니 모달 (제목 입력 + Project 선택 + 생성 버튼) 추정 | 추정 |
| 빈 Document 생성 — 모달 너비 | 400px (삭제 다이얼로그 `07` 패턴 준용) | 추정 |
| 빈 Document 생성 — 제목 입력 필드 높이 | 52px (`01` URL input 준용) | 추정 |
| 빈 Document 생성 — Project 선택 드롭다운 | 40px 높이, 8px border-radius | 추정 |
| 빈 Document 생성 — 생성 버튼 | 40px 높이, `color-primary` 활성 | 추정 |
| 빈 Document 생성 — 폼 padding | 24px | 추정 |
| **포워딩 — "Document로 내보내기" 액션 위치** | Chat 어시스턴트 응답 하단 액션바 (기능 3 T-005의 복사·좋아요 옆) 후보 | 결정 (Step C 확정) |
| **포워딩 — 생성 시 자동 채움 내용** | 어시스턴트 응답 텍스트를 Document 초안으로, 참조된 Reference들을 Document 메타데이터에 기록 | 결정 (Step C 확정) |
| **포워딩 — 생성 직후 이동 동작** | Write 뷰(`/p/[pid]/write/d/[docId]` 또는 `/write/d/[docId]`)로 자동 이동 후 편집 | 결정 (Step C 확정) |

### Document 목록 (사이드바 "최근 기록" 재사용 방향)

**원본 관찰 (스크린샷 `09`)**: Liner Write는 사이드바에 "새 문서" 버튼 + "최근 기록" 섹션(Document 목록)만 있고, 메인 패널의 전용 Document 리스트 UI가 **없다**. 사용자는 사이드바 "최근 기록"에서 Document를 고르거나 "새 문서"로 진입한다.

**우리 방향**: Liner 뷰(기능 3) 사이드바가 이미 "최근 기록"(cross-project recent Chat)을 갖고 있다. Write 뷰에서는 이 섹션을 **Document 기반으로 치환**하거나, **통합 "최근 기록"에 Document도 포함**시키는 두 선택지. Step C에서 결정.

| 속성 | 값 | 출처 |
|------|---|------|
| Document 목록 진입점 | 사이드바 "최근 기록" 섹션 내 항목 클릭 (전용 목록 라우트 최소화) | 추정 (원본 패턴 준용) |
| 사이드바 "새 문서" 버튼 크기 / 스타일 | 244×40px 추정 (기능 3 "새 질문" 버튼 244×32px보다 약간 큼 — 원본 실측) | 추정 |
| 사이드바 "새 문서" 버튼 border-radius | 6px | 추정 |
| 사이드바 "새 문서" 버튼 테두리 | 1px solid rgba(233, 233, 235, 0.2) | 추정 |
| "최근 기록" 항목 높이 | 32px (기능 3 Chat 목록과 동일 패턴) | 추정 |
| "최근 기록" 항목 제목 폰트 | 13px / 350 (비활성) / 600 (활성) | 추정 |
| 사이드바 검색 필드 (상단) | `09`의 "Search" 입력. 우리 MVP는 미도입(2차 후보) | 결정 |
| 전용 Document 목록 라우트 (`/p/[pid]/write`, `/write`) 메인 패널 | 사이드바로 충분하면 placeholder (빈 상태 CTA "새 Document") | 결정 (Step C 확정) |

### 미할당 Liner 뷰 빈 상태 (`/liner`)

| 속성 | 값 | 출처 |
|------|---|------|
| CTA 텍스트 내용 | "모든 검색을 정확하게" (h1) | devtools |
| CTA 폰트 크기 / 웨이트 | 32px / 500 | devtools |
| CTA 위치 (세로 중앙 / 상단 오프셋 등) | 수직 중앙 정렬 (flexbox center) | devtools |
| 입력카드 너비 | 720px (메인 화면) | devtools |
| Project 배지 또는 "미할당" 표시 유무 / 위치 | 없음 (미할당이 기본 상태) | devtools |
| "+ 새 대화" 버튼 연결 방식 | 사이드바 "새 질문" 버튼 (전역 위치) + 입력카드 직접 입력 방식 | devtools |

### 미할당 Chat UI (`/liner/c/[chatId]`)

**원본 관찰 (스크린샷 `08`)**: 원본 Liner는 "미할당" 개념이 없고 **Project-less Chat을 사이드바 "최근 기록" 섹션에 그냥 시간순으로 노출**한다. 소스 컬렉션(=Project)에 속한 Chat은 별도로 없고, "+ 새 질문"으로 만든 모든 Chat이 "최근 기록"에 쌓인다. 우리는 ADR-0015에 따라 `/liner/c/[chatId]` 미할당 라우트를 명시 도입하되, **사이드바 UI는 원본 패턴을 수렴**하여 "최근 기록" 섹션에 미할당 Chat을 노출한다 (이미 기능 3 D4에서 cross-project recent로 구현됨 — 기능 4에서 미할당까지 포함).

| 속성 | 값 | 출처 |
|------|---|------|
| 기능 3 Chat UI 대비 차이 항목 | Project 귀속 배지 없음, 헤더 우측 즐겨찾기/설정/공유 버튼만 존재 | devtools |
| Project 귀속 표시 방식 (상단 헤더 배지 등) | 없음 (미할당 상태에서 별도 배지 미표시) | devtools |
| "Project에 할당" CTA 위치 / 크기 | 독자 설계 — 헤더 우측 액션 영역에 "Project에 할당" 아이콘 버튼 또는 `...` 메뉴 내 항목으로 | 결정 (Step C 확정) |
| 헤더 영역 높이 (Project 없음 상태) | 64px | devtools |
| 사이드바 "최근 기록" 섹션 내 노출 | 미할당 Chat도 할당된 Chat과 함께 시간순 정렬. Project 소속 표시는 Chat 항목 우측에 Project 뱃지 또는 들여쓰기로 구분 (Step C 확정) | 결정 |

### 사이드바 전역 "+ 새 질문" 버튼

| 속성 | 값 | 출처 |
|------|---|------|
| 버튼 위치 (사이드바 내 위치 — 최상단 / Project 트리 상단 / 최하단) | 최상단 (사이드바 `top: 54px` 위치) | devtools |
| 버튼 너비 / 높이 | 244px / 32px | devtools |
| 버튼 border-radius | 6px | devtools |
| 버튼 배경색 (기본 / hover) | transparent / rgba(109,109,112,0.12) | devtools |
| 버튼 텍스트 / 아이콘 조합 | `+` 아이콘 + "새 질문" 텍스트, gap: 8px | devtools |
| 버튼과 Project 트리의 간격 | 사이드바 최상단에 위치, 아래에 소스 컬렉션·즐겨찾기 등 메뉴 | devtools |

### Chat → Project 이동 다이얼로그

원본에 해당 UI 없음. 삭제 다이얼로그(`07`) 패턴을 준용한 설계 기준 추정.

| 속성 | 값 | 출처 |
|------|---|------|
| 다이얼로그 너비 | 400px (`07` 삭제 다이얼로그와 동일) | 추정 |
| 다이얼로그 border-radius | 12px (`07` 실측 준용) | 추정 |
| 다이얼로그 배경색 | rgb(30, 30, 31) — `color-bg-primary` | 추정 |
| 다이얼로그 padding | 24px | 추정 |
| 헤더 폰트 크기 / 웨이트 | 20px / 600 (`07` 준용) | 추정 |
| Project 선택 목록 항목 높이 | 42px (Reference 목록 항목 참조) | 추정 |
| Project 선택 목록 항목 간 gap | 0px (border-bottom 방식) | 추정 |
| 선택 상태 배경색 | `color-bg-active-subtle` | 추정 |
| "Asset 동반 이동" 체크박스 위치 | 하단 구분선 아래 (독자 설계) | 결정 |
| 체크박스 크기 | 16px | 추정 |
| 동반 대상 범위 표시 텍스트 폰트 크기 | 13px | 추정 |
| 확인 / 취소 버튼 배치 | 우측 정렬 (`07` 패턴) | 추정 |
| 확인 버튼 배경색 (활성) | rgb(35, 102, 56) — `color-primary` | devtools |

### Reference 선택 UI (입력창 하단 첨부 영역)

원본에 해당 UI 없음. 기존 입력카드의 첨부(`+`) 버튼 재사용 + 칩 추가 방향으로 설계 기준 추정.

| 속성 | 값 | 출처 |
|------|---|------|
| 첨부 영역 위치 | 입력 카드 내부 (독자 설계) | 결정 |
| 첨부 영역 최소 높이 (Reference 없을 때) | 0px (버튼만 표시 시) | 추정 |
| "Reference 선택(+)" 버튼 크기 | 40×40px (기능 3 기존 `+` 버튼 재사용) | devtools |
| "Reference 선택(+)" 버튼 border-radius | 200px (기존 `+` 버튼과 동일) | devtools |
| "Reference 선택(+)" 버튼 border | 1px solid rgba(233, 233, 235, 0.28) | devtools |
| Reference 칩(chip) 높이 | 28px (`rounded-xxl` 패턴) | 추정 |
| Reference 칩 border-radius | 200px (`rounded-xxl`) | 추정 |
| Reference 칩 배경색 | rgba(109, 109, 112, 0.16) — `color-bg-badge` 재사용 | 추정 |
| Reference 칩 텍스트 폰트 크기 / 웨이트 | 13px / 500 | 추정 |
| 칩 제거(`×`) 버튼 크기 | 16×16px | 추정 |
| 칩 간 gap | 8px | 추정 |
| 검색 UI 형태 | 팝오버 (독자 설계) | 결정 |
| 검색 팝오버 너비 / 최대 높이 | 320px / 300px | 추정 |
| 검색 결과 항목 높이 | 42px | 추정 |
| 검색 결과 항목 간 gap | 0px (border-bottom 방식) | 추정 |

### 출처 패널 — 실 Reference 데이터 표시

| 속성 | 값 | 출처 |
|------|---|------|
| 패널 너비 | 400px (aside 실측) | devtools |
| 패널 배경색 | rgb(30, 30, 31) — `color-bg-primary` | devtools |
| 패널 border-left | 1px solid rgba(233, 233, 235, 0.2) — `color-border-subtle` | devtools |
| 패널 헤더 높이 | 52px | devtools |
| 패널 헤더 padding | 20px 20px 0px 24px | devtools |
| 패널 헤더 제목 폰트 | 17px / 600 | devtools |
| 항목 padding | 16px 24px 20px | devtools |
| 항목 배경색 | rgb(30, 30, 31) — `color-bg-primary` | devtools |
| 항목 border-bottom | 1px solid rgba(233, 233, 235, 0.2) | devtools |
| 출처 제목 폰트 | 15px / 500 | devtools |
| 출처 도메인/날짜 폰트 | 13px (도메인), 12px (날짜) / rgba(233,233,235,0.64) | devtools |
| 인용 번호 배지 | 20×20px, border-radius: 200px, bg: rgba(109,109,112,0.16), font: 11px | devtools |
| 인용 텍스트 폰트 | 14px / 400 / line-height: 19.6px | devtools |
| 인용 텍스트 색상 | rgb(194, 229, 200) — `color-citation-text` (신규) | devtools |
| 인용 텍스트 컨테이너 배경 | `bg-neutral-fill-overlay-low` (rgba(109,109,112,0.08)) | devtools |
| 인용 텍스트 컨테이너 border-radius | `rounded-xxs` (4px 추정) | devtools |
| URL kind: 외부 링크 버튼 위치 / 크기 | 우측 상단 액션 영역 (32×32px 아이콘 버튼) | devtools |
| URL kind: URL 텍스트 줄임 처리 방식 | `truncate` (text-overflow: ellipsis) | 추정 |
| text kind: 발췌 텍스트 최대 줄 수 / 접기 버튼 여부 | 제한 없음 (스크롤 방식), 접기 없음 | devtools |
| kind 구분 표시 위치 | 도메인 옆 (favicon 형태) | devtools |
| 삭제된 Asset 참조 배지 graceful degradation | (미확인 — 원본에서 관찰 불가) | 미확인 |

### Asset 삭제 확인 다이얼로그

| 속성 | 값 | 출처 |
|------|---|------|
| 다이얼로그 너비 | 400px | devtools |
| 다이얼로그 border-radius | 12px | devtools |
| 다이얼로그 배경색 | rgb(30, 30, 31) — `color-bg-primary` | devtools |
| 다이얼로그 padding | 24px | devtools |
| 다이얼로그 gap (요소 간) | 16px | devtools |
| 헤더 폰트 크기 / 웨이트 | 20px / 600 | devtools |
| 경고 문구 폰트 크기 / 색 | 15px / rgb(255, 255, 255) | devtools |
| 삭제 버튼 배경색 (color-error 계열) | rgb(219, 35, 35) — `color-error` (신규) | devtools |
| 삭제 버튼 크기 | 80×40px | devtools |
| 취소 버튼 스타일 | 80×40px, bg: rgb(30,30,31), border: 1px solid rgba(233,233,235,0.28), border-radius: 8px | devtools |
| 버튼 높이 | 40px | devtools |
| 버튼 gap | 우측 정렬, gap: 8px | devtools |
| box-shadow | `0px 0px 1px rgba(0,0,0,0.22), 0px 1px 8px rgba(0,0,0,0.22), 0px 2px 16px rgba(0,0,0,0.26)` — `shadow-dialog` (신규) | devtools |

### 빈 상태 — Asset 0개 (스크린샷 `10` 기반 + 우리 커스텀)

**원본 관찰**: 상단 "애셋" 타이틀 + 설정(⚙) + 공유 + "+ 추가" 버튼. 중앙에 큰 점선 박스(파일 드래그 영역) + 하단에 "URL 입력" / "텍스트 입력" 버튼 2개. **우리는 파일 업로드 제외**이므로 중앙 점선 박스 제거 + URL/텍스트 2버튼을 빈 상태 CTA로 차용.

| 속성 | 값 | 출처 |
|------|---|------|
| 상단 타이틀 폰트 크기 / 웨이트 | 24px / 600 (추정 — "애셋" 원본 관찰) | 추정 |
| 우상단 액션 그룹 (공유, "+ 추가") | "+ 추가" 버튼은 `color-primary` 배경, 40×40px 아이콘 버튼 또는 텍스트+아이콘 혼합 | devtools (`10` 관찰) |
| 원본 중앙 "파일 드래그" 점선 박스 | 점선 border rgba(233,235,255,0.2~), 최소 높이 ~600px, border-radius 약 10px | devtools (`10` 관찰) — **우리는 미사용** |
| 원본 중앙 본문 폰트 ("파일을 선택하거나 드래그하세요") | 15px / 500 추정 | 추정 |
| 원본 중앙 보조 폰트 ("지원 파일: PDF, DOCX, HWP, TXT ...") | 13px / 350, `color-text-secondary` | 추정 |
| 원본 하단 "URL 입력" / "텍스트 입력" 버튼 | 2버튼 나란히, 각각 약 48~52px 높이, `radius-md` 8px, border 1px solid rgba(233,233,235,0.2) | devtools (`10` 관찰) |
| **우리 빈 상태 레이아웃** | 중앙에 간결 안내 텍스트 + **"URL 입력" / "텍스트 입력" 2버튼**만 배치 (파일 드래그 영역 제거) | 결정 |
| 우리 안내 텍스트 | "아직 저장된 Reference가 없습니다" / "아직 저장된 Document가 없습니다" 등 맥락별 | 결정 (Step C 문구 확정) |
| 빈 상태 컨테이너 세로 정렬 방식 | 수직 중앙 정렬 (`10` 관찰) | devtools |

### 로딩 인디케이터 (Asset 목록)

| 속성 | 값 | 출처 |
|------|---|------|
| 로딩 인디케이터 형태 (스피너 / 스켈레톤 카드) | (미확인) | 미확인 |
| 스켈레톤 카드 높이 (사용 시) | (미확인) | 미확인 |
| 스피너 크기 (사용 시) | (미확인) | 미확인 |

---

## 사용하는 전역 토큰

### 재사용 (`design-tokens.md`에 이미 있음)

| 요소 | 속성 | 전역 토큰 | 실측 RGB |
|------|------|----------|---------|
| 다이얼로그·모달 배경 | background-color | `color-bg-primary` | rgb(30, 30, 31) |
| 목록 항목 카드 배경 | background-color | `color-bg-primary` | rgb(30, 30, 31) |
| 사이드바 배경 | background-color | `color-bg-secondary` | rgb(39, 39, 41) |
| 항목 카드 border | border-color | `color-border-subtle` | rgba(233, 233, 235, 0.2) |
| 본문 텍스트 | color | `color-text-primary` | rgb(255, 255, 255) |
| 보조 텍스트 (URL, 날짜) | color | `color-text-secondary` | rgba(233, 233, 235, 0.64) |
| 힌트·비활성 텍스트 | color | `color-text-tertiary` | rgba(233, 233, 235, 0.32) |
| 저장·생성·확인 버튼 활성 | background-color | `color-primary` | rgb(35, 102, 56) |
| 선택 상태 배경 | background-color | `color-bg-active-subtle` | (미확인) |
| hover 배경 | background-color | `color-bg-hover` | rgba(109, 109, 112, 0.12) |
| 목록 항목 border-radius | border-radius | `radius-sm` | 6px |
| 버튼 border-radius | border-radius | `radius-md` | 8px |
| 카드 border-radius | border-radius | `radius-lg` | 10–12px |
| 패널 슬라이드 | transition | `motion-medium` | (미확인) |
| kind 배지 배경 | background-color | `color-bg-badge` | rgba(109, 109, 112, 0.16) |
| 보조 border | border-color | `color-border-normal` | rgba(233, 233, 235, 0.28) |

### 신규 필요 (Step B/C에서 `design-tokens.md`로 승격)

| 후보 토큰명 | 실측값 | 예상 용도 | 현재 상태 |
|------------|--------|----------|----------|
| `color-error` | rgb(219, 35, 35) | 삭제 확인 버튼, 에러 상태 | **실측 확정** (T-001 해소 근거) |
| `color-citation-text` | rgb(194, 229, 200) | 인용 텍스트 색상 (브랜드 그린 계열) | **실측 확정** |
| `shadow-dialog` | `0px 0px 1px rgba(0,0,0,0.22), 0px 1px 8px rgba(0,0,0,0.22), 0px 2px 16px rgba(0,0,0,0.26)` | 다이얼로그 그림자 | **실측 확정** |
| `radius-dialog` | 12px (삭제), 14px (입력 모달) | 다이얼로그 모서리 | **실측 확정 — 기본 12px, 입력 모달 14px는 변형** |
| `color-chip-bg` | rgba(109, 109, 112, 0.16) | Reference 선택 칩 배경 | **기존 `color-bg-badge`와 동일 값 — 재사용** |

#### T-001(color-primary / color-error 토큰 미정) 해소 준비

- `color-primary` = rgb(35, 102, 56) — 기능 3 실측에서 이미 확정 (전송 버튼 활성 배경)
- `color-error` = rgb(219, 35, 35) — **이 단계에서 확정** (삭제 확인 버튼 배경)
- Step C에서 `design-tokens.md`에 정식 등록 → T-001 Resolved 처리

---

## 인터랙션 노트

- **Reference 추가 폼**: 초기 모달(자료 추가)에서 URL 입력 / 텍스트 입력 / 파일 드래그드롭 3가지 방식 지원. URL·텍스트는 서브 모달로 분기. 추가 버튼은 입력 없을 때 비활성 (`rgba(109,109,112,0.16)` bg). 파일 드래그드롭은 우리 프로젝트 1차 범위 밖 (PM 명세 "파일 업로드/파싱 제외").
- **Reference 목록 항목 삭제**: hover 시 `...` 버튼 표시 → 컨텍스트 메뉴("이름 변경", "삭제") → 삭제 클릭 시 확인 다이얼로그 표시.
- **인용된 출처 패널**: citation 번호 클릭 시 오른쪽에서 슬라이드인 (width: 400px). 패널이 열리면 채팅 영역이 축소됨.
- **"더 많은 출처 보기" 토글**: 패널 내 상단에 위치. bg: rgba(109,109,112,0.32), border-radius: 10px, height: 54px. 토글 스위치 포함.
- **채팅 입력창 (관련해서 질문하기)**: 너비 640px, border: 1px solid rgba(233,233,235,0.2), border-radius: 28px.
- **미할당 → Project 할당 전환**: URL이 `/liner/c/[chatId]` → `/p/[newProjectId]/liner/c/[chatId]`로 리다이렉트 (ADR-0015). 전환 애니메이션은 Step C에서 결정.

---

## 열린 관찰

### 실측 과정 발견 사항

**Liner 원본 디자인 토큰 실측 정리 (dark mode 기준)**
- body background: rgb(30, 30, 31)
- sidebar background: rgb(39, 39, 41)
- input card border: rgba(233, 233, 235, 0.28) → rgba(233, 233, 235, 0.2) (화면별 상이)
- primary button: rgb(35, 102, 56) (브랜드 그린)
- error/delete button: rgb(219, 35, 35)
- text primary: rgb(255, 255, 255)
- text secondary: rgba(233, 233, 235, 0.64)
- text disabled/hint: rgba(233, 233, 235, 0.32)
- overlay low: rgba(109, 109, 112, 0.08)
- overlay mid: rgba(109, 109, 112, 0.16)
- overlay high: rgba(109, 109, 112, 0.32)

### Liner Write/Scholar 외부 도메인 관찰

- `write.liner.com`, `scholar.liner.com`은 별도 도메인으로 DevTools 실측은 제한적. 단, Liner Write 초기 화면(`09`)은 참조용으로 관찰 성공
- 세부 레이아웃 치수 실측은 기능 5(Write 뷰) 착수 시점에 Liner Write 접근 가능한 환경에서 재측정하여 **measurements v0.4 이후**로 미룸
- 현재 v0.3의 Document 관련 추정값은 "포워딩 방식" 커스텀을 전제로 작성됐으므로 원본 실측이 반드시 필요한 것은 아님

### 🔑 원본의 "미할당 = 최근 기록" 매핑 — 아키텍처 수렴

**발견**: 원본 Liner는 "미할당(Project-less)" 개념을 별도 라우트나 섹션으로 노출하지 않는다. 대신 **"+ 새 질문"으로 만든 모든 Chat이 사이드바 "최근 기록" 섹션에 시간순으로 쌓이고**, 그 중 일부가 소스 컬렉션(Project)에 수동 할당되는 구조다. 즉 원본의 UI 기본 가정은 "미할당이 디폴트, 할당은 사용자 선택".

**우리 프로젝트와의 관계**:
- ADR-0015에서 `/liner/c/[chatId]` 미할당 라우트를 명시 도입 — 여전히 유효. URL 축으로 미할당 상태를 식별 가능.
- 사이드바 UI는 기능 3 D4에서 이미 "최근 기록"(cross-project recent) 섹션을 구현했고, 기능 4에서 **여기에 미할당 Chat도 포함**시키는 것이 원본과 자연스럽게 수렴.
- 결과적으로 **URL은 우리 도메인 모델에 충실 / UI는 원본의 "시간순 최근 기록" 패턴을 계승** — 둘이 충돌 없이 양립.

### 🔑 Document "포워딩" 아키텍처 방향

**발견**: 원본 Liner Write(`09`)는 Chat-like 입력 + 빠른 시작 버튼(블로그/사업계획서/이력서 등)으로 **"문서 초안을 LLM에 바로 요청"하는 진입 플로우**를 제공한다. 즉 원본 Write 뷰는 독립 Chat의 변형이다.

**우리 프로젝트 방향 (사용자 지정)**: 주 플로우는 **"포워딩"** — Liner(기본 탐색)에서 대화·조사를 거쳐 얻은 결과(어시스턴트 응답 + 참조된 Reference들)를 Document Asset으로 내보내는 흐름.

**UI 영향**:
- Document 생성 진입점이 "빈 Document"(소규모) + "Chat 결과에서 포워딩"(주 플로우) 이원화
- Chat 메시지 응답 하단 액션바에 "Document로 내보내기" CTA 추가 — T-005(stub 아이콘)의 액션바 구조와 충돌하지 않도록 Step C에서 조율
- 포워딩 시 Document의 `origin_chat_id`가 Chat ID로 설정되고, 메시지의 `generated_asset_id`가 새 Document를 가리킴 — **도메인 모델의 참조 메타데이터가 자연스럽게 채워짐**
- **PM 명세 v0.3에 반영 완료** — 시나리오 5를 5-a(빈 Document, 보조) + 5-b(Chat 포워딩, 주)로 분리. §3/§4/§5/§8 보강. [plan/features/4-asset.md](../../../plan/features/4-asset.md) 참조

### 독자 설계 항목 설계 가이드라인 (원본 없음)

- **미할당 Chat UI**: 기능 3 Chat UI와 동일 구조, Project 배지만 제거. 사이드바 "최근 기록" 섹션에도 Project 소속 구분 뱃지와 함께 노출.
- **Reference 선택 칩 UI**: 기존 `+` 버튼(40×40, border-radius: 200px) 재사용 + 칩 추가. 파일 업로드는 2차에서 도입 시 같은 버튼의 팝오버 내 탭으로 분기.
- **Chat → Project 이동 다이얼로그**: 삭제 다이얼로그(400px, border-radius: 12px, padding: 24px, `shadow-dialog`) 패턴 준용. "Asset 동반 이동" 체크박스 기본값 off (PM 명세 Q4 해소).
- **Reference 목록 / Document 목록 — 미할당**: 각 뷰(Liner/Write)의 사이드바 "최근 기록" 섹션 재사용 또는 뷰 내부 패널. ADR-0015에 따라 Asset 전용 top-level 라우트(`/assets`)는 도입하지 않음.
- **Asset 빈 상태**: 원본의 파일 업로드 중앙 박스 제거 + URL/텍스트 2버튼만 차용. 맥락별(Reference / Document) 안내 문구 차별화.
- **로딩·에러·삭제된 출처 배지 graceful degradation**: 원본 관찰 불가 — 기능 3 에러 처리(네트워크 오류 + "다시 시도" 버튼) 패턴 준용. 삭제된 출처 배지는 배지를 회색(`color-text-tertiary`)으로 흐리고 클릭 시 "삭제된 출처입니다" 토스트.

---

## Changelog

- 0.3 (2026-04-21): 사용자 추가 관찰 반영 (스크린샷 `08`~`10`, 총 10장).
  - (1) **`08` Reference 목록 상세** — 컬렉션명·카운트·CTA·사이드바 "최근 기록" 확인. Collection 스코프 Reference 목록의 전체 뷰 실측.
  - (2) **`09` Liner Write 초기 화면** — 원본은 Chat-like 진입(빠른 시작 버튼) 플로우인데, **우리 프로젝트는 "포워딩" 방식**(Liner 탐색 결과 → Document Asset 내보내기)으로 커스텀하는 방향 결정. Document 생성 UI 섹션을 이 방향에 맞게 재작성. Document 목록은 사이드바 "최근 기록" 재사용.
  - (3) **`10` Asset 빈 상태** — 원본의 파일 드래그 중앙 박스 + 하단 "URL 입력" / "텍스트 입력" 2버튼 구조. 우리는 파일 업로드 제외이므로 중앙 박스 제거 + 2버튼만 차용. 빈 상태 섹션 실측값 채움.
  - (4) **🔑 원본의 "미할당 = 최근 기록" 매핑 발견** — ADR-0015 미할당 라우트(URL 축) + 기능 3의 "최근 기록" 섹션(UI 축)이 자연스럽게 수렴. 미할당 Chat UI 섹션 보강.
  - (5) 로딩·에러·삭제된 출처 배지는 원본 관찰 불가로 확정 (사용자 확인) — 독자 설계로 전환, "미촬영" 표에서 후속 처리를 "독자 설계"로 변경.
  - 스코프 영향: **PM 명세 v0.3에 반영 완료** — 시나리오 5-a/5-b 분리, §3 Document CRUD 이원화, §4 수용 기준 보강, §5 결정 요약 2행 추가, §8 D3 stage 포워딩 포함.
- 0.2 (2026-04-21): DevTools 실측 완료. 원본 접근 가능 화면 7종 실측값 채움. 스크린샷 파일명을 순차 재명명(01~07)하고 중복 `10` 제거. 신규 전역 토큰 후보 3종(`color-error`, `color-citation-text`, `shadow-dialog`) 실측 확정 — T-001 해소 준비.
- 0.1 (2026-04-21): 템플릿 생성. 스크린샷 수집 대상 16종 정의. 빈 실측 테이블 생성.
