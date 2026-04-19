---
feature: Liner 뷰 — Chat 기반 AI 대화 (SSE 스트리밍) + 출처·인용 배지
version: 0.2
last_updated: 2026-04-17
source: 라이너 원본 서비스 Liner (liner.com)
captured_at: 2026-04-17
---

# 디자인 레퍼런스 — 기능 3 (Liner 뷰: Chat + SSE 스트리밍 + 출처 배지)

이 문서는 기능 3의 **기능 고유** 디자인 실측값만 담는다. 색·폰트·radius 같은 재사용 토큰은 이 파일에 두지 말고 `../../design-tokens.md`에 정의한 뒤 이 파일에서는 **이름으로 참조**한다.

확신 없는 값은 빈칸 또는 `(미확인)`으로 둔다. 추측값이 굳지 않도록 주의.

**출처 범례**: `devtools` / `추정` / `카탈로그` / `결정`

## 스크린샷 인덱스

| # | 파일 | 상태 | 주요 포인팅 요소 |
|---|------|------|-----------------|
| 01 | screenshots/01-empty-state.png | 빈 상태 | 중앙 h1, 입력카드, 학술/글쓰기 AI 빠른시작 버튼 |
| 02 | screenshots/02-conversation.png | 대화 진행 중 (멀티턴) | 사용자 버블(우측), AI 응답(좌측), 사이드바 목록 |
| 02b | screenshots/02-conversation-v2.png | 대화 진행 중 (사이드바 없음) | 사용자 버블, 추론 완료 검색 결과, 테이블 렌더링 |
| 03 | screenshots/03-streaming.png | 스트리밍 중 | 출처 배지 인라인, 입력카드 하단 고정 |
| 04 | screenshots/04-citation-badge.png | 출처 배지 + 테이블 | 인라인 숫자 배지, 테이블 내 `{{n}}` 미처리 마커, 하단 액션바 |
| 04b | screenshots/04-citation-badge_2.png | 출처 배지 (목표 섹션) | 초록색 텍스트 링크, 인라인 배지 |
| 05 | screenshots/05-citation-detail.png | 출처 상세 패널 | 우측 패널(399px), 탭(전체/웹문서/논문/컬렉션), 출처 카드 목록 |
| 06 | screenshots/06-chat-list.png | 채팅 목록 | 사이드바 "최근 기록" 섹션 |
| 07 | screenshots/07-input-area.png | 입력창 기본 상태 | 입력카드, placeholder, Liner 드롭다운, 마이크 버튼 |
| 07b | screenshots/07-input-area-active.png | 입력창 활성 상태 | 전송 버튼 녹색 활성화 상태 |

---

## 레이아웃 치수

### 메시지 영역 (대화 스크롤 영역)

| 속성 | 값 | 출처 |
|------|---|------|
| 메시지 영역 최대 너비 | 720px | devtools |
| 메시지 영역 좌우 padding | 80px (10%) | devtools |
| 메시지 간 gap (같은 화자) | 12px | devtools |
| 메시지 간 gap (화자 전환) | 24px (사용자 버블 mb-[24px]) | devtools |
| 메시지 영역 상단 padding | 32px (pt-section-200) | devtools |
| 메시지 영역 하단 padding (입력창 위) | sticky bottom 20px | devtools |

### 사용자 메시지 버블

| 속성 | 값 | 출처 |
|------|---|------|
| 배경색 | rgba(109, 109, 112, 0.16) — `bg-neutral-fill-overlay-mid` | devtools |
| 텍스트 색 | rgb(255, 255, 255) | devtools |
| padding (상하 / 좌우) | 10px / 16px | devtools |
| border-radius | 20px 0px 20px 20px (우상단만 0) | devtools |
| 최대 너비 | 70% | devtools |
| 폰트 크기 | 16px | devtools |
| 폰트 웨이트 | 350 | devtools |
| line-height | 25.6px | devtools |
| 정렬 | 우측 (justify-end) | devtools |

### 어시스턴트 메시지

| 속성 | 값 | 출처 |
|------|---|------|
| 배경색 | 없음 (투명) — 배경 없이 텍스트만 | devtools |
| 텍스트 색 | rgb(255, 255, 255) | devtools |
| padding (상하 / 좌우) | 없음 (0px) | devtools |
| border-radius | 없음 | devtools |
| 최대 너비 | 720px (메시지 영역 전체) | devtools |
| 폰트 크기 | 16px (본문 p 태그) | devtools |
| 폰트 웨이트 | 350 | devtools |
| line-height | 26.56px | devtools |
| 정렬 | 좌측 | devtools |
| 아바타/아이콘 유무 | 없음 | 추정 |
| 제목(H3) 폰트 크기 | 22px / fontWeight 600 | devtools |

### 출처 배지 (`[n]`)

| 속성 | 값 | 출처 |
|------|---|------|
| 배지 크기 (w × h) | 가변 × 16px (숫자 1자리: ~16px, 2자리: ~18–22px) | devtools |
| 배지 배경색 | rgb(49, 49, 51) — `bg-neutral-container-high` | devtools |
| 배지 텍스트 색 | rgba(233, 233, 235, 0.64) — `text-neutral-label-secondary` | devtools |
| 배지 border-radius | 8px | devtools |
| 배지 폰트 크기 | 11px | devtools |
| 배지 폰트 웨이트 | 500 | devtools |
| 배지 padding | 상하 0px / 좌우 4px | devtools |
| 배지 간 gap | 인라인 텍스트 흐름 (inline) | 추정 |
| 배지 위치 | 인라인 (문장 내 텍스트 사이) | devtools |

### 출처 상세 (배지/출처 버튼 클릭 시)

| 속성 | 값 | 출처 |
|------|---|------|
| UI 형태 | 우측 패널 (슬라이드-인) | 추정 |
| 너비 | 399px | devtools |
| 배경색 | rgb(30, 30, 31) — `bg-neutral-container-lowest` | devtools |
| border-radius | 없음 (0px) | devtools |
| 패널 헤더 폰트 크기 | 17px / fontWeight 600 | devtools |
| 탭 텍스트 폰트 크기 | 13px (caption1-normal-medium) | devtools |
| 출처 카드 배경 | rgb(30, 30, 31) / border: 1px solid rgba(233,233,235,0.2) | devtools |
| 출처 카드 border-radius | 6px | devtools |
| 출처 카드 padding | 상 16px / 우 24px / 하 20px / 좌 24px | devtools |
| 출처 카드 gap | 20px | devtools |
| 출처 제목 폰트 크기 | 15px / fontWeight 500 | devtools |
| 출처 URL 폰트 크기 | 13px / fontWeight 350 / color rgba(233,233,235,0.64) | devtools |
| 출처 발췌 폰트 크기 | 13px / fontWeight 350 | devtools |

### 입력 영역 (하단 고정)

| 속성 | 값 | 출처 |
|------|---|------|
| 전체 영역 높이 (기본) | 160px | devtools |
| 최대 너비 | 720px (sticky max-w-[720px]) | devtools |
| sticky 위치 | bottom: 20px | devtools |
| 좌우 padding (카드 내부) | 10px | devtools |
| 상하 padding (카드 내부) | 10px | devtools |
| 입력 필드 배경색 | rgba(0, 0, 0, 0) (투명, 카드 배경 상속) | devtools |
| 카드 배경색 | rgb(30, 30, 31) — `bg-neutral-container-lowest` | devtools |
| 카드 border | 1px solid rgba(233, 233, 235, 0.2) | devtools |
| 카드 border-radius | 28px | devtools |
| 입력 필드 padding (내부) | 0px (Quill 에디터 직접 0) | devtools |
| placeholder 텍스트 | "무엇이든 물어보세요" / "관련해서 질문하기" | devtools |
| placeholder 색 | rgba(233, 233, 235, 0.32) | devtools |
| 입력 폰트 크기 | 16px | devtools |
| 입력 line-height | 25.6px | devtools |
| 전송 버튼 크기 | 40×40px | devtools |
| 전송 버튼 아이콘 크기 | 20×20px (SVG) | devtools |
| 전송 버튼 배경색 (비활성) | rgba(109, 109, 112, 0) (투명) | devtools |
| 전송 버튼 배경색 (활성) | rgb(35, 102, 56) (녹색) — `_primary` variant | devtools |
| 전송 버튼 border-radius | 200px (완전 원형) | devtools |
| 첨부(+) 버튼 크기 | 40×40px | devtools |
| 첨부 버튼 border | 1px solid rgba(233, 233, 235, 0.28) | devtools |
| 첨부 버튼 border-radius | 200px | devtools |

### 스트리밍 상태 UI

| 속성 | 값 | 출처 |
|------|---|------|
| 중단 버튼 위치 | 입력카드 우측 하단 (전송 버튼 위치) | 추정/캡처 |
| 중단 버튼 크기 | 40×40px | devtools |
| 중단 버튼 스타일 | 흰색 ■ 사각형 아이콘, border-radius 200px (원형) | 추정 |
| 중단 버튼 배경 | rgba(109, 109, 112, 0) — `_quaternary` variant | devtools |
| 타이핑 인디케이터 | 없음 (텍스트가 직접 스트리밍됨, 별도 커서 없음) | 추정/캡처 |
| 스트리밍 중 공유 버튼 | 잠금(🔒) 아이콘으로 교체 | 캡처 |

### Chat 목록

| 속성 | 값 | 출처 |
|------|---|------|
| 목록 위치 | 좌측 사이드바 내 "최근 기록" 섹션 | 추정 |
| 목록 항목 높이 | 32px | devtools |
| 항목 간 gap | 0px (연속 배치, 항목 자체 높이로 구분) | devtools |
| 항목 padding (좌우) | 8px | devtools |
| 항목 제목 폰트 크기 | 13px | devtools |
| 항목 제목 폰트 웨이트 | 350 (비활성) / 600 (활성) | devtools |
| 항목 텍스트 색 | rgb(255, 255, 255) | devtools |
| 활성 항목 배경색 | rgba(109, 109, 112, 0.08) | devtools |
| 비활성 항목 배경색 | rgba(0, 0, 0, 0) (투명) | devtools |
| hover 배경색 | (미확인) | |
| 항목 border-radius | 6px | devtools |
| 사이드바 너비 | 260px | devtools |
| "새 질문" 버튼 위치 | 사이드바 상단, 전체 너비 244px, 높이 32px | devtools |

### 빈 상태 (Chat 없음)

| 속성 | 값 | 출처 |
|------|---|------|
| CTA 텍스트 | "모든 검색을 정확하게" | 캡처 |
| CTA 폰트 크기 | 32px | devtools |
| CTA 폰트 웨이트 | 500 | devtools |
| CTA 위치 | 세로 중앙 (flex column, mb-[80px]) | devtools |
| CTA 텍스트 색 | rgb(255, 255, 255) | devtools |
| 빠른 시작 버튼 유무 | 있음 — "🎓 학술 연구 AI", "✍️ 글쓰기 AI" | 캡처 |
| 빠른 시작 버튼 href | scholar.liner.com, write.liner.com | devtools |
| 입력카드 너비 | 720px max (빈 상태에서도 동일) | devtools |
| 입력카드 배경 | rgb(30, 30, 31) | devtools |
| 입력카드 border | 1px solid rgba(233, 233, 235, 0.2) | devtools |
| 입력카드 border-radius | 28px | devtools |

---

## 사용하는 전역 토큰

이 표는 기능 3이 참조하는 전역 토큰 이름만 나열한다. **값은 [`../../design-tokens.md`](../../design-tokens.md)의 단일 진실 소스를 따른다.**

| 요소 | 속성 | 전역 토큰 |
|------|------|----------|
| 배경 (전체/카드) | background-color | `color-bg-primary` (= rgb(30,30,31)) |
| 사용자 버블 | background-color | `color-surface-overlay` 계열 (= rgba(109,109,112,0.16)) |
| 출처 배지 | background-color | 신규 필요: `color-bg-badge` (= rgb(49,49,51)) |
| 출처 배지 텍스트 | color | `color-text-secondary` (= rgba(233,233,235,0.64)) |
| 입력카드 border | border-color | `color-border-subtle` 계열 (= rgba(233,233,235,0.2)) |
| placeholder | color | `color-text-tertiary` (= rgba(233,233,235,0.32)) |
| 텍스트 (본문) | color | `color-text-primary` (= rgb(255,255,255)) |
| 전송 버튼 활성 | background-color | 신규 필요: `color-accent-primary` (= rgb(35,102,56)) |
| 활성 채팅 항목 | background-color | 기존 `color-bg-active-subtle` 또는 신규 (= rgba(109,109,112,0.08)) |
| Chat 목록 항목 | border-radius | `radius-sm` (= 6px) |

---

## 인터랙션 노트

- **스트리밍 애니메이션**: 텍스트가 실시간으로 직접 렌더링됨. 별도의 타이핑 커서나 점 애니메이션 없음. 스트리밍 중 공유 버튼이 잠금 아이콘(🔒)으로 교체됨.
- **메시지 전송 시 스크롤 동작**: 전송 후 새 대화 페이지로 URL 변경(search/s/.../t/...) 및 즉시 AI 응답 스트리밍 시작. 스크롤 컨테이너 `overflow-y: auto`.
- **출처 배지 클릭 인터랙션**: 인라인 숫자 배지([n]) 자체 클릭은 (미확인 — 개별 배지 클릭 반응 없었음). "N개의 출처" 버튼 클릭 시 우측 패널(width 399px)이 열림. 패널 닫기는 우상단 ✕ 버튼.
- **입력 필드 자동 높이 조절**: Quill 에디터(contenteditable) 사용. 기본 26px → 텍스트 증가 시 자동 확장 (미확인 최대 높이).
- **Chat 전환 트랜지션**: 새 대화 시 `animate-fade-in` 클래스 적용. 부드러운 페이드인 효과.
- **Liner 드롭다운**: 입력카드 우하단에 "Liner ▾" 버튼으로 AI 모델/모드 선택 가능 (MVP에서는 제외).
- **중단 버튼**: 스트리밍 중 전송 버튼 위치가 중단(■) 버튼으로 교체됨. 스트리밍 완료 시 다시 전송 버튼으로 복귀.

---

## 열린 관찰

- 출처 배지는 두 가지 형태로 존재: ① 인라인 `<span class="bg-neutral-container-high">` (16px 높이, 8px border-radius) — 텍스트 내 직접 삽입 ② "N개의 출처" 요약 버튼 — 응답 하단 액션바.
- 어시스턴트 응답에는 배경 버블이 없고 텍스트가 바로 렌더링됨 (vs. 사용자 버블은 rgba 배경 있음).
- 스트리밍 중 헤더 공유 버튼이 잠금(🔒) 아이콘으로 변경되어 스트리밍 완료 전 공유 불가를 시각적으로 표시.
- 입력 에디터는 Quill.js 사용 (`ql-editor`, `ql-container`). 우리 프로젝트에서는 textarea 또는 contenteditable div로 대체.
- 응답 내 텍스트 링크(초록색)는 `rgb(72, 187, 120)` 계열 추정 (Liner/Liner Write/Liner Scholar 이름 강조에 사용).
- 테이블 내 `{{n}}` 형태의 미처리 출처 표기가 보임 — 테이블 렌더러가 인라인 배지를 지원하지 않는 것으로 보임.
- 사용자 버블의 border-radius가 비대칭 (20px 0px 20px 20px) — 우상단만 직각으로 "말풍선 꼬리" 효과.
- "추론 완료" 섹션이 대화 응답 시작 전에 표시됨 (검색 완료 / 웹 문서 N개 > 링크 목록). MVP에서 이 "추론 과정" 표시 여부는 별도 결정 필요.

---

## Changelog

- 0.2 (2026-04-17): DevTools 실측 완료. 스크린샷 10장 촬영 (빈 상태 / 대화 2종 / 스트리밍 / 출처 배지 2종 / 출처 상세 / Chat 목록 / 입력창 2종). 레이아웃 치수 10종 실측 (메시지 영역 / 사용자 버블 / 어시스턴트 메시지 / 출처 배지 / 출처 상세 / 입력 영역 / 스트리밍 UI / Chat 목록 / 빈 상태). 전역 토큰 매핑 10종, 인터랙션 노트 7항목, 열린 관찰 7항목 기록.
- 0.1 (2026-04-17): 템플릿 생성. 스크린샷 수집 대상 7종 정의, 빈 실측 테이블 10종 생성.
