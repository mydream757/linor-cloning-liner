---
feature: Asset 관리 (Reference + Document) + 미할당 Chat
version: 0.4
last_updated: 2026-04-23
---

# Asset 관리 (Reference + Document) + 미할당 Chat — 화면 설계

> 참조
> - 기능 명세: [`plan/features/4-asset.md`](../../plan/features/4-asset.md) v0.6
> - 전역 토큰: [`../design-tokens.md`](../design-tokens.md) v0.6
> - 실측·스크린샷: [`../references/4-asset/measurements.md`](../references/4-asset/measurements.md) v0.3
> - 관련 ADR: [ADR-0014](../../architecture/decisions/0014-asset-schema-polymorphic-single-table.md), [ADR-0015](../../architecture/decisions/0015-unassigned-route-structure.md), [ADR-0016](../../architecture/decisions/0016-asset-chat-composition-model.md)

이 문서는 기능 4의 **화면 구조·상태·인터랙션·토큰 매핑**을 정의한다. 값(픽셀·컬러)은 [`design-tokens.md`](../design-tokens.md)와 [`references/4-asset/measurements.md`](../references/4-asset/measurements.md)의 단일 진실 소스를 따르며, 여기서는 **토큰 이름과 구조 결정**만 담는다.

---

## 1. 사용자 흐름

```
[사이드바 전역 "+ 새 대화" 버튼 클릭]
    │
    └─→ project_id=null Chat 생성 → /liner/c/[chatId] 이동
          │
          ├── 미할당 Liner 뷰 진입 (/liner)
          │       └─→ 빈 상태 CTA → 입력창 포커스
          │
          └── 미할당 Chat 대화 (/liner/c/[chatId])
                ├─→ 메시지 전송 → SSE 스트리밍 (기능 3 재사용)
                │       ├─→ [스트리밍 완료] 응답 확정 + 출처 배지 + "Document로 내보내기" 버튼 표시
                │       └─→ [에러] 인라인 에러 + "다시 시도" (T-004 해소 흐름)
                │
                ├─→ [Reference 첨부] "+" 버튼 → 팝오버 → Reference 선택 → 칩 표시
                │       └─→ 메시지 전송 시 Reference 내용 LLM 주입 → 실 출처 배지 연결
                │
                └─→ [Project 할당] 헤더 "Project에 할당" → 이동 다이얼로그

[미할당 Liner 뷰 /liner — Reference 추가]
    │
    ├── "URL 입력" 버튼 클릭 → Reference 추가 모달 (URL variant)
    │       └─→ URL + 제목(필수) + 발췌(선택) 입력 → 저장 → Reference 목록 갱신
    │
    └── "텍스트 입력" 버튼 클릭 → Reference 추가 모달 (텍스트 variant)
            └─→ 텍스트 + 제목(선택) 입력 → 저장 → Reference 목록 갱신

[Document 생성 — 시나리오 5-b: Chat 포워딩 (주 플로우)]
    │
    └─→ 어시스턴트 응답 하단 "Document로 내보내기" 버튼 클릭
            └─→ 미니 확인 폼 (제목 수정 + Project 할당 선택)
                    └─→ 생성 → Write 뷰 자동 이동 (/write/d/[docId] 또는 /p/[pid]/write/d/[docId])

[Document 생성 — 시나리오 5-a: 빈 Document (보조 플로우)]
    │
    └─→ 사이드바 "새 Document" 버튼 또는 Write 뷰 빈 상태 CTA
            └─→ 빈 Document 미니 모달 (제목 입력 + Project 선택)
                    └─→ 생성 → 사이드바 "최근 기록"에 노출

[Chat → Project 할당·이동]
    │
    └─→ 이동 다이얼로그
            ├─→ Project 선택 목록 → 확인
            │       └─→ URL 리다이렉트: /liner/c/[id] → /p/[pid]/liner/c/[id]
            └─→ "이 Chat의 전용 Asset도 함께 이동" 체크박스 (기본 off)
                    └─→ 체크 on: Chat + origin Asset의 project_id 일괄 업데이트
                        체크 off: Chat만 이동, Asset은 현 project_id 유지

[Asset 삭제]
    │
    ├── Reference 목록 항목 hover → "⋯" → "삭제" → 삭제 확인 다이얼로그
    └── Document 사이드바 항목 hover → "⋯" → "삭제" → 삭제 확인 다이얼로그
            └─→ 삭제 확정 → hard delete + Message 참조 정리 (도메인 모델 행동 규칙)
```

### 정상 흐름 표

| 단계 | 화면 | 사용자 행동 | 시스템 반응 |
|---|---|---|---|
| 1 | 사이드바 (어디서나) | "+ 새 대화" 클릭 | `project_id=null` Chat 생성 → `/liner/c/[chatId]`로 이동 |
| 2 | `/liner/c/[chatId]` | 입력창에 메시지 작성 + 전송 | SSE 스트리밍 시작 (기능 3 인프라 재사용) |
| 3 | 대화 화면 | "+" 버튼 클릭 → Reference 선택 팝오버에서 Reference 선택 | 입력창 하단에 Reference 칩 표시. 전송 시 LLM 주입 |
| 4 | 스트리밍 완료 | 응답 확정됨 | 응답 하단 액션바에 "N개의 출처" + "Document로 내보내기" 버튼 표시. 배지 클릭 시 실 Reference 데이터 패널 |
| 5 | 어시스턴트 응답 | "Document로 내보내기" 클릭 | 미니 확인 폼 등장. 제목·Project 수정 가능 |
| 6 | 미니 확인 폼 | 확인 클릭 | Document Asset 생성 (`origin_chat_id`, `generated_asset_id` 자동 연결) → Write 뷰로 자동 이동 |
| 7 | `/liner` 빈 상태 | "URL 입력" 버튼 클릭 | Reference 추가 모달(URL) 열림 |
| 8 | Reference 추가 모달 | URL + 제목 입력 → "추가" 버튼 | Reference Asset 생성 → 목록 갱신 |
| 9 | 미할당 Chat 헤더 | "Project에 할당" 클릭 | Chat 이동 다이얼로그 열림. Project 목록 표시 |
| 10 | Chat 이동 다이얼로그 | Project 선택 → "이동" 클릭 | Chat `project_id` 업데이트 → URL 리다이렉트 |

### 예외·에러 흐름

| 조건 | 처리 방식 |
|---|---|
| Reference 저장 실패 (서버 에러) | 모달 내 인라인 에러 메시지 + 재시도 가능. 모달 닫힘 없음 |
| Document 포워딩 생성 실패 | 미니 확인 폼에 인라인 에러. 재시도 버튼 제공 |
| Asset 삭제 중 서버 에러 | 삭제 다이얼로그 내 인라인 에러. 목록 상태 변경 없음 |
| Chat 이동 중 서버 에러 | 이동 다이얼로그 내 인라인 에러. URL 변경 없음 |
| 삭제된 Asset을 참조하는 출처 배지 클릭 | 출처 패널에서 해당 항목을 회색(`color-text-tertiary`)으로 흐리고 "삭제된 출처입니다" 표시 |
| SSE 에러 후 재시도 (T-004 해소) | "다시 시도" 클릭 시 기존 user 메시지 ID 재사용. assistant 응답만 새로 생성 (중복 user 메시지 방지) |
| Reference 추가 시 URL/텍스트 모두 비어있음 | 저장 버튼 비활성 유지. 제목 필수 (URL variant) |
| Asset이 0개인 Reference 목록 진입 | 빈 상태 화면 — 안내 문구 + "URL 입력" / "텍스트 입력" 2버튼 CTA |

---

## 2. 화면 구조

### 2-1. 미할당 Liner 뷰 빈 상태 (`/liner`) + 사이드바 전역 "+ 새 대화" 버튼

기능 3 §2-1 빈 상태와 동일한 레이아웃. Project 배지가 없고 사이드바 최상단에 전역 "+ 새 대화" 버튼이 복귀한다.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            상단 헤더 (48px)                                │
│                        [Liner] [Write] [Scholar]                         │
├──────────────┬───────────────────────────────────────────────────────────┤
│              │                                                           │
│  사이드바      │                                                           │
│  (260px)     │                                                           │
│              │              "모든 검색을 정확하게"                            │
│  ┌─────────┐ │               (text-heading-1, 32px/500)                  │
│  │+ 새 대화  │ │                                                           │
│  └─────────┘ │     ┌─────────────────────────────────────────┐           │
│  (244×32px)  │     │                                         │           │
│              │     │  무엇이든 물어보세요          [전송 버튼]   │           │
│  프로젝트      │     │                                         │           │
│  ▾ Proj A    │     └─────────────────────────────────────────┘           │
│    ▸ Proj B  │              입력카드 (max-w 720px, measurements 참조)       │
│              │                                                           │
│  최근 기록     │                                                           │
│  (미할당 Chat │                                                           │
│   포함)       │                                                           │
│              │                                                           │
│──────────────│                                                           │
│  프로필 영역   │                                                           │
└──────────────┴───────────────────────────────────────────────────────────┘
```

**구성 요소**:

| 영역 | 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|---|
| 사이드바 최상단 | "+ 새 대화" 버튼 | `color-text-primary` + 투명 bg | w 244px, h 32px, `radius-sm`(6px) | hover: `color-bg-hover`. 클릭 시 `project_id=null` Chat 생성 → `/liner/c/[chatId]` |
| 메인 패널 | CTA 텍스트 | `color-text-primary` + `text-heading-1` | 수직 중앙, measurements 참조 | "모든 검색을 정확하게" (원본 devtools 실측 문구) |
| 메인 패널 | 입력카드 | `color-bg-primary` + `color-border-subtle` | max-w 720px, `radius-full` | 기능 3 §2-1 입력카드 구조 계승 |
| 사이드바 | "최근 기록" 섹션 | `color-text-secondary` + `text-caption` | — | 미할당 Chat 포함 (기능 4 확장). 기능 3 §2-6 패턴 계승 |

**상태**:

| 상태 | 변화 |
|---|---|
| "+ 새 대화" default | 투명 배경, `color-text-primary` 텍스트 |
| "+ 새 대화" hover | `color-bg-hover` 배경 |
| "+ 새 대화" 생성 중 | 버튼 비활성 + 미니 스피너 |
| 입력카드 포커스 | `color-focus-ring` |

**전역 토큰 참조**: `color-bg-primary`, `color-text-primary`, `color-text-secondary`, `color-border-subtle`, `radius-sm`, `radius-full`, `color-bg-hover`, `color-focus-ring`, `text-heading-1`, `text-caption`

---

### 2-2. 미할당 Chat UI (`/liner/c/[chatId]`) — Project 배지 없는 variant

기능 3 §2-2 대화 화면과 동일 구조. 헤더 우측에 Project 귀속 배지 대신 "Project에 할당" 아이콘 버튼이 위치한다.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            상단 헤더 (48px)                                │
│                        [Liner] [Write] [Scholar]                         │
├──────────────┬───────────────────────────────────────────────────────────┤
│              │  ┌─ Chat 헤더 (64px) ────────────────────────────────────┐│
│  사이드바      │  │  (Project 배지 없음)        [📁 할당] [⋯]            ││
│  (260px)     │  └────────────────────────────────────────────────────────┘│
│              │  ┌─── 메시지 영역 (max-w 720px, 중앙) ──────────────────┐  │
│  ┌─────────┐ │  │                                                      │  │
│  │+ 새 대화  │ │  │   사용자 메시지 ──────────────────┐                  │  │
│  └─────────┘ │  │                      │ 질문 텍스트 │                  │  │
│              │  │                      └────────────┘                  │  │
│  프로젝트      │  │                                                      │  │
│  ▾ Proj A    │  │   어시스턴트 응답                                        │  │
│    ● 미할당   │  │   본문 텍스트... [1] [2] ...                            │  │
│    Chat X    │  │                                                      │  │
│              │  │   ┌──────────────────────────────────────────────┐   │  │
│  최근 기록     │  │   │ 📋  2개의 출처  [Document로 내보내기]          │   │  │
│  ● Chat X    │  │   └──────────────────────────────────────────────┘   │  │
│    Chat Y    │  └──────────────────────────────────────────────────────┘  │
│              │                                                           │
│              │  ┌──────────────────────────────────────────────────────┐  │
│              │  │ ┌─────────────────────────────────────────────────┐  │  │
│              │  │ │ [Reference 칩 A] [Reference 칩 B] ×              │  │  │
│              │  │ └─────────────────────────────────────────────────┘  │  │
│              │  │  무엇이든 물어보세요                      [+] [전송]    │  │
│──────────────│  └──────────────────────────────────────────────────────┘  │
│  프로필 영역   │        sticky bottom 20px, max-w 720px                     │
└──────────────┴───────────────────────────────────────────────────────────┘
```

**구성 요소 — Chat 헤더 (미할당 variant)**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 헤더 컨테이너 | `color-bg-primary` + `color-border-subtle` border-bottom | h 64px (measurements 참조) | Project 배지 없음 |
| "Project에 할당" 버튼 | `color-text-secondary` | 32×32px 아이콘 버튼 | 클릭 시 Chat 이동 다이얼로그(§2-11) 열림. 헤더 우측 액션 영역 |
| "⋯" 메뉴 버튼 | `color-text-secondary` | 32×32px | Chat 이름 변경·삭제 메뉴 |

**구성 요소 — 응답 액션바 (기능 4 확장)**:

기능 3 §2-2 응답 액션바 구조를 계승하되 "Document로 내보내기" 버튼을 추가한다.

| 요소 | 토큰 | 비고 |
|---|---|---|
| "N개의 출처" 버튼 | `color-text-secondary` | 클릭 시 출처 패널(§2-7) 열림. 기능 4에서 실 Reference 데이터 연결 |
| "Document로 내보내기" 버튼 | `color-text-secondary` | 클릭 시 포워딩 미니 확인 폼(§2-9) 등장 |
| 복사 버튼 | `color-text-secondary` | T-005 이후 구현 (현재 stub) |
| 좋아요/싫어요 버튼 | `color-text-secondary` | T-005 이후 구현 (현재 stub) |

**상태**:

| 상태 | 변화 |
|---|---|
| "Project에 할당" hover | `color-bg-hover` 배경 |
| "Document로 내보내기" hover | `color-bg-hover` 배경 |
| "Document로 내보내기" 스트리밍 중 | 비활성 (스트리밍 완료 후에만 표시) |

**전역 토큰 참조**: `color-bg-primary`, `color-border-subtle`, `color-text-secondary`, `color-bg-hover`, `color-focus-ring`, `space-sm`

---

### 2-3. Reference 추가 모달 — URL 입력

```
┌────────────────────────────────────────────────────────────────────────┐
│                          화면 전체 backdrop (반투명)                        │
│  ┌───────────────────────────────────────────┐                         │
│  │  URL로 자료 추가               [×]          │  ← 480px, radius-dialog  │
│  │                                           │    (14px, measurements)  │
│  │  URL                                      │                         │
│  │  ┌────────────────────────────────────┐   │                         │
│  │  │  https://example.com              │   │  ← h 52px, radius-dialog │
│  │  └────────────────────────────────────┘   │                         │
│  │                                           │                         │
│  │  제목 *                                    │                         │
│  │  ┌────────────────────────────────────┐   │                         │
│  │  │  자료 제목을 입력하세요               │   │  ← h 52px               │
│  │  └────────────────────────────────────┘   │                         │
│  │                                           │                         │
│  │  발췌 (선택)                               │                         │
│  │  ┌────────────────────────────────────┐   │                         │
│  │  │                                    │   │  ← h 80px(선택), resize X│
│  │  └────────────────────────────────────┘   │                         │
│  │                                           │                         │
│  │                          [취소] [추가]    │                         │
│  └───────────────────────────────────────────┘                         │
└────────────────────────────────────────────────────────────────────────┘
```

**구성 요소**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 모달 컨테이너 | `color-bg-primary` + `shadow-dialog` | w 480px, `radius-dialog`(14px, measurements 참조) | 중앙 오버레이 |
| 모달 내부 padding | — | 24px | measurements 참조 |
| 헤더 레이블 | `color-text-primary` | 20px / 600 | "URL로 자료 추가" |
| 닫기(×) 버튼 | `color-text-secondary` | 우상단 | `color-bg-hover` hover |
| URL 입력 필드 | `color-text-primary` + `color-border-normal` border (포커스 시 흰색 1px) | h 52px, `radius-dialog` | measurements 참조. 필수 |
| 제목 입력 필드 | `color-text-primary` + `color-border-normal` border | h 52px, `radius-md` | 필수. 비어있으면 "추가" 버튼 비활성 |
| 발췌 입력 필드 | `color-text-primary` + `color-border-normal` border | h 80px, `radius-sm`, `resize: none` | 선택. URL variant는 발췌 최소화 |
| 필드 간 gap | — | 16px | measurements 참조 |
| 취소 버튼 | `color-text-primary` + `color-border-normal` border | 80×40px, `radius-md` | 클릭 시 모달 닫힘 |
| "추가" 버튼 (활성) | `color-primary` bg + `color-text-primary` | 80×40px, `radius-md` | URL + 제목 입력 시 활성 |
| "추가" 버튼 (비활성) | `color-surface-overlay` bg | 80×40px, `radius-md` | URL 또는 제목 미입력 시 |

**상태**:

| 상태 | 변화 |
|---|---|
| 입력 필드 default | `color-border-normal` border (1px) |
| 입력 필드 포커스 | 흰색 1px border + `color-focus-ring` |
| "추가" 버튼 default (비활성) | `color-surface-overlay` 배경 |
| "추가" 버튼 활성 | `color-primary` 배경 |
| "추가" 버튼 저장 중 | 비활성 + 버튼 내 스피너 |
| 저장 실패 | 버튼 하단 인라인 에러 텍스트 (`color-text-secondary`) |

**전역 토큰 참조**: `color-bg-primary`, `color-text-primary`, `color-text-secondary`, `color-border-normal`, `color-primary`, `color-surface-overlay`, `radius-md`, `radius-sm`, `radius-dialog`, `shadow-dialog`, `color-bg-hover`, `color-focus-ring`

---

### 2-4. Reference 추가 모달 — 텍스트 스니펫 입력

URL variant와 동일한 모달 구조. 텍스트 영역이 주가 되고, URL 필드가 없다.

```
┌───────────────────────────────────────────┐
│  텍스트로 자료 추가              [×]          │  ← 560px, radius-dialog(14px)
│                                           │
│  텍스트 *                                  │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │  ← min-h 200px, resize: none
│  │  발췌하거나 메모할 텍스트를 붙여넣으세요  │   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
│                                           │
│  제목 (선택)                               │
│  ┌────────────────────────────────────┐   │
│  │  자료 제목을 입력하세요 (선택사항)     │   │  ← h 52px
│  └────────────────────────────────────┘   │
│                                           │
│                          [취소] [추가]    │
└───────────────────────────────────────────┘
```

**URL variant와 차이점**:

| 항목 | URL variant | 텍스트 variant |
|---|---|---|
| 모달 너비 | 480px | 560px |
| 텍스트 영역 높이 | 80px (발췌 선택) | 200px 최소, `resize: none` |
| 제목 필수 여부 | 필수 | 선택 |
| "추가" 버튼 활성 조건 | URL + 제목 모두 입력 시 | 텍스트 1자 이상 입력 시 |

**전역 토큰 참조**: URL variant와 동일. 너비·제목 필수 여부만 다름.

---

### 2-5. Reference 목록 (Project 스코프 + 미할당 공통 — 스코프 배지로 구분)

Reference는 Liner 뷰에 귀속된다(ADR-0015). Reference 목록은 Liner 뷰 내 패널 또는 메인 영역 일부로 표시된다.

```
┌────────────────────────────────────────────────────────────────────────┐
│  References                              [+ 추가]                       │
│  N개의 소스                                                               │
├────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🔗  자료 제목 A                                             [⋯] │  │
│  │      example.com · 2026-04-21                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  📄  텍스트 스니펫 B                                          [⋯] │  │
│  │      2026-04-20                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🔗  다른 Project의 자료 C          [Project A]             [⋯] │  │
│  │      another.com · 2026-04-19                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                         최대 너비 720px (measurements 참조)               │
└────────────────────────────────────────────────────────────────────────┘
```

**구성 요소**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 목록 컨테이너 배경 | `color-bg-primary` | max-w 720px | measurements 참조 |
| 항목 카드 배경 | 투명 | — | border-bottom으로 구분 |
| 항목 border-bottom | `color-border-subtle` (1px) | — | measurements 참조 |
| 항목 padding | — | 상하 12px, 좌우 6px (measurements) | — |
| 항목 간 gap | — | 16px (flex gap, measurements) | — |
| kind 아이콘 | — | 24×24px | url: 🔗 / text: 📄 (아이콘 라이브러리에서 대응) |
| 항목 제목 폰트 | `color-text-primary` | 14px / 350 (measurements) | — |
| 항목 날짜/도메인 | `color-text-secondary` + `text-caption` | 13px | measurements 참조 |
| 스코프 배지 (Project 소속) | `color-bg-badge` + `color-text-secondary` | `radius-sm`(6px) | 미할당 항목에는 배지 없음. Project 소속 항목은 Project명 배지 표시 |
| "⋯" 메뉴 버튼 | `color-text-secondary` | hover 시 표시 | "삭제" 항목 → 삭제 다이얼로그(§2-12) |
| "+ 추가" 버튼 | `color-primary` bg | 40×40px | 클릭 시 Reference 추가 초기 모달(URL/텍스트 선택) |

**상태**:

| 상태 | 변화 |
|---|---|
| 항목 default | 투명 배경 |
| 항목 hover | `color-bg-hover` 배경 + "⋯" 버튼 opacity 0→1 |
| 항목 없음 | 빈 상태 화면(§2-13)으로 대체 |
| 목록 로딩 중 | 스켈레톤 카드 (§2-14) |

**전역 토큰 참조**: `color-bg-primary`, `color-text-primary`, `color-text-secondary`, `color-border-subtle`, `color-bg-badge`, `color-bg-hover`, `radius-sm`, `text-caption`

---

### 2-6. 입력창 하단 Reference 선택 UI (첨부 버튼 재사용 + 칩 + 팝오버)

PM 명세 Q6에서 방향만 결정됐으며, 세부 인터랙션은 이 문서에서 확정한다.

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ [자료 A 칩 ×] [자료 B 칩 ×]                                  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│   무엇이든 물어보세요                                   [+] [전송]      │
└──────────────────────────────────────────────────────────────────────┘

"+" 버튼 클릭 시 팝오버:
┌──────────────────────────────────────┐
│  🔍  Reference 검색                   │  ← 팝오버 w 320px (measurements)
├──────────────────────────────────────┤
│  🔗 자료 제목 A                [선택됨] │  ← h 42px, border-bottom
│  📄 텍스트 스니펫 B                     │
│  🔗 자료 C                            │
│  ...                                 │  ← 최대 높이 300px (measurements), 스크롤
└──────────────────────────────────────┘
```

**팝오버 인터랙션 상세 (Q6 확정)**:

| 항목 | 결정 |
|---|---|
| 팝오버 열기 | 입력카드 내 "+" 버튼 클릭. 버튼의 `radius-full`(200px) 원형 버튼 재사용 — 기능 3에서의 `+` 버튼을 의미 확장 |
| 팝오버 위치 | 입력카드 "+" 버튼 위 방향(위로 펼침). 뷰포트 하단에서 잘리지 않도록 |
| 팝오버 닫기 | 팝오버 외부 클릭 시 닫힘 |
| 검색 필드 | 팝오버 최상단. 자동 포커스. `color-text-tertiary` placeholder "Reference 검색" |
| 검색 동작 | 입력 시 제목 기준 필터링 (로컬 필터. API 재요청 없음) |
| 항목 선택 | 클릭 시 즉시 칩으로 추가. 이미 선택된 항목은 "선택됨" 표시(체크 아이콘 또는 배경색 변경). 다시 클릭 시 선택 해제 |
| 중복 선택 | 불가. 이미 선택된 Reference는 선택됨 상태로만 표시 |
| 최대 선택 수 | 없음 (MVP). 여러 Reference 선택 가능 |
| 칩 제거 | 칩 우측 "×" 클릭 시 즉시 제거. 팝오버 내 선택됨 상태도 해제 |
| Reference가 없을 때 | 팝오버에 "아직 저장된 Reference가 없습니다. 먼저 자료를 추가해주세요." 안내 + Reference 추가 버튼 |

**구성 요소 — Reference 칩**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 칩 컨테이너 | `color-bg-badge` (= `rgba(109,109,112,0.16)`) + `color-text-primary` | h 28px, `radius-full`(200px), measurements 참조 | 기존 `color-bg-badge` 재사용 (동일 값) |
| 칩 텍스트 | `color-text-primary` | 13px / 500 | 제목 truncate |
| 칩 "×" 버튼 | `color-text-secondary` | 16×16px | 클릭 시 칩 제거 + 팝오버 선택 해제 |
| 칩 간 gap | — | 8px | measurements 참조 |

**구성 요소 — 팝오버 항목**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 항목 배경 default | 투명 | h 42px (measurements) | — |
| 항목 배경 hover | `color-bg-hover` | — | — |
| 항목 배경 선택됨 | `color-bg-active-subtle` | — | 체크 아이콘 우측 표시 |
| 항목 border-bottom | `color-border-subtle` | 1px | — |
| kind 아이콘 | — | 20×20px | url/text 구분 |
| 항목 제목 폰트 | `color-text-primary` + `text-caption` | 13px | truncate |

**전역 토큰 참조**: `color-bg-badge`, `color-text-primary`, `color-text-secondary`, `color-text-tertiary`, `color-bg-hover`, `color-bg-active-subtle`, `color-border-subtle`, `radius-full`, `radius-md`, `text-caption`, `color-focus-ring`

---

### 2-7. 출처 패널 — 실 Reference 데이터 연결

기능 3 §2-5 출처 패널 구조 계승. 기능 4에서 stub 데이터를 실 Reference Asset 데이터로 교체한다.

```
┌──────────────┬──────────────────────────────┬────────────────────────┐
│              │                              │                        │
│  사이드바      │      메시지 영역               │  출처 패널 (400px)       │
│  (260px)     │  (메인 너비 축소)               │                        │
│              │                              │  출처  ───────────── ✕ │
│              │                              │  패널 헤더 (52px)        │
│              │                              │                        │
│              │                              │  ┌──────────────────┐  │
│              │                              │  │ [인용번호] liner.com│  │
│              │                              │  │ 출처 제목 A         │  │
│              │                              │  │ 날짜                │  │
│              │                              │  │ ┌───────────────┐  │  │
│              │                              │  │ │ 인용 텍스트...   │  │  │
│              │                              │  │ └───────────────┘  │  │
│              │                              │  │        [🔗 링크]   │  │
│              │                              │  └──────────────────┘  │
│              │                              │                        │
│              │                              │  ┌──────────────────┐  │
│              │                              │  │ [2]  (텍스트 kind)│  │
│              │                              │  │ 제목 B              │  │
│              │                              │  │ ┌───────────────┐  │  │
│              │                              │  │ │ 발췌 텍스트...  │  │  │
│              │                              │  └──────────────────┘  │
└──────────────┴──────────────────────────────┴────────────────────────┘
```

**기능 3 대비 변경점**:

| 항목 | 기능 3 (stub) | 기능 4 (실 데이터) |
|---|---|---|
| 출처 데이터 | 하드코딩 더미 | 실 Reference Asset 데이터 (DB 조회) |
| 인용 번호 배지 | stub 번호 | Message의 `referencedAssetIds` 기반 실제 순서 |
| 출처 제목 | 더미 텍스트 | `asset.title` |
| 도메인/날짜 | 더미 | url kind: `asset.referenceUrl`에서 파싱, text kind: `asset.updatedAt` |
| 외부 링크 버튼 | 미구현 | url kind에만 표시. `asset.referenceUrl` 로 새 탭 이동 |
| 인용 텍스트 색상 | — | `color-citation-text` (신규 토큰. measurements 참조) |
| 삭제된 Asset 처리 | — | 회색(`color-text-tertiary`) + "삭제된 출처입니다" |

**구성 요소**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 패널 컨테이너 | `color-bg-primary` + `color-border-subtle` border-left | w 400px (measurements) | `motion-medium`으로 슬라이드-인 |
| 패널 헤더 | `color-text-primary` + `text-heading-3` | h 52px (measurements) | padding: measurements 참조 |
| 닫기(✕) 버튼 | `color-text-secondary` | — | `color-bg-hover` hover |
| 출처 항목 border-bottom | `color-border-subtle` | 1px | — |
| 항목 padding | — | 16px 24px 20px (measurements) | — |
| 출처 제목 폰트 | `color-text-primary` | 15px / 500 (measurements) | — |
| 도메인/날짜 폰트 | `color-text-secondary` | 13px/12px (measurements) | — |
| 인용 번호 배지 | `color-bg-badge` | 20×20px, `radius-full` (measurements) | font 11px |
| 인용 텍스트 | `color-citation-text` | 14px / 400 / line-height 19.6px (measurements) | 신규 토큰 |
| 인용 텍스트 컨테이너 | `rgba(109,109,112,0.08)` bg | `radius-sm` (4px 추정) | measurements 참조 |
| 외부 링크 버튼 (url kind) | `color-text-secondary` | 32×32px (measurements) | 우측 상단 액션 영역 |

**전역 토큰 참조**: `color-bg-primary`, `color-text-primary`, `color-text-secondary`, `color-text-tertiary`, `color-border-subtle`, `color-bg-badge`, `color-citation-text`, `radius-sm`, `radius-full`, `text-heading-3`, `motion-medium`, `color-bg-hover`

---

### 2-8. Document 생성 — 통합 모달 (시나리오 5-a + 5-c)

Write 뷰 메인 패널의 "+ 새 Document" 버튼에서 진입. 재료 Chat 선택을 **건너뛰면 5-a**, **체크하면 5-c**. 같은 UI가 두 시나리오를 커버한다 (composition 모델, [ADR-0016](../../architecture/decisions/0016-asset-chat-composition-model.md)).

```
┌────────────────────────────────────────────────────────────────────────┐
│                          화면 전체 backdrop                               │
│  ┌───────────────────────────────────────────────────┐                 │
│  │  새 Document                              [×]       │  ← 480px        │
│  │                                                   │                 │
│  │  제목 *                                            │                 │
│  │  ┌──────────────────────────────────────────┐     │                 │
│  │  │  Document 제목을 입력하세요                 │     │  ← h 52px       │
│  │  └──────────────────────────────────────────┘     │                 │
│  │                                                   │                 │
│  │  재료 Chat 선택 (선택)                              │                 │
│  │  ┌──────────────────────────────────────────┐     │                 │
│  │  │  🔍  Chat 검색                            │     │  ← h 36px       │
│  │  └──────────────────────────────────────────┘     │                 │
│  │  ┌──────────────────────────────────────────┐     │                 │
│  │  │  ☑  양자컴퓨팅 개요 질문                    │     │                 │
│  │  │  ☐  능력이란 무엇인가?                      │     │  ← 항목 h 36px  │
│  │  │  ☑  SSE vs WebSocket                      │     │     (scrollable) │
│  │  │  ☐  라이너 주요 기능                        │     │     max-h 200px  │
│  │  └──────────────────────────────────────────┘     │                 │
│  │  선택됨: 2개 Chat                                  │                 │
│  │                                                   │                 │
│  │                              [취소]  [만들기]      │                 │
│  └───────────────────────────────────────────────────┘                 │
└────────────────────────────────────────────────────────────────────────┘
```

**구성 요소**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 모달 컨테이너 | `color-bg-primary` + `shadow-dialog` | w 480px, `radius-dialog` | 치수는 재료 선택 섹션 수용 위해 기본 400px → 480px |
| 모달 내부 padding | — | 24px | — |
| 제목 입력 필드 | `color-text-primary` + `color-border-normal` | h 52px, `radius-md` | 필수. 비어있으면 "만들기" 비활성 |
| 검색 필드 | `color-text-primary` + `color-border-normal` | h 36px, `radius-md` | 로컬 필터 (API 재요청 없음). 빈 상태면 숨김 처리 가능 |
| Chat 목록 컨테이너 | `color-bg-secondary` + `color-border-subtle` | max-h 200px, scrollable | 현재 Project의 Chat 목록. 미할당 Project 시에는 cross-project recent 10개 |
| Chat 항목 (체크박스 + 제목) | `color-text-primary` | h 36px | hover `color-bg-hover`. 선택됨 항목은 `color-bg-active-subtle` |
| "선택됨: N개 Chat" 카운트 | `color-text-secondary` | text-caption | 실시간 갱신 |
| 취소 버튼 | `color-text-primary` + `color-border-normal` | 80×40px, `radius-md` | — |
| "만들기" 버튼 (활성) | `color-primary` bg | 80×40px, `radius-md` | 제목 입력 시 활성. 재료 선택 0개여도 활성 (빈 Document 허용) |
| "만들기" 버튼 (비활성) | `color-surface-overlay` bg | 80×40px, `radius-md` | — |

**동작**:

- 재료 0개 선택 → `createDocument({ title, projectId, sourceChatIds: [] })` → 빈 Document (시나리오 5-a)
- 재료 1~N개 선택 → `createDocument({ title, projectId, sourceChatIds: [...] })` → 재료 concat Document (시나리오 5-c). N=1도 가능하지만 UX 상 단일 재료는 주로 Chat 응답 지름길(§2-9)로 들어옴
- 같은 Chat을 여러 Document 만들기에 재사용 가능 — 체크박스에 "이미 다른 Document에 쓰임" 표시는 **하지 않는다** (composition 모델에서 제약 없음)

**상태**: Reference 추가 모달(§2-3)과 유사. 검색 필드 포커스는 모달 열릴 때 두 번째 탭 우선(제목 autoFocus 후 Tab → 검색 필드).

**전역 토큰 참조**: `color-bg-primary`, `color-bg-secondary`, `color-border-subtle`, `color-text-primary`, `color-text-secondary`, `color-border-normal`, `color-primary`, `color-surface-overlay`, `color-bg-hover`, `color-bg-active-subtle`, `radius-md`, `radius-dialog`, `shadow-dialog`

---

### 2-9. 단일 재료 지름길 — Chat 응답 "이 Chat을 재료로 새 Document" (시나리오 5-b)

어시스턴트 응답 하단 액션바의 **시각 강조 버튼**. 클릭 → 인라인 폼에서 제목 편집 → 생성. 같은 Chat이 이미 재료로 쓰여도 다시 쓸 수 있다 (composition 모델). "이미 내보냄" 분기 제거.

```
어시스턴트 응답 하단 액션바 (시각 강조 적용):
┌──────────────────────────────────────────────────────────────────────────┐
│  📋  2개의 출처   [ 📄 이 Chat을 재료로 새 Document ]                        │
│                   └─ `color-bg-badge` bg + `color-text-primary` text ─┘  │
│                   └─ hover 시 `color-bg-hover`                    ─┘     │
│                   └─ h 32px, padding 12px, radius-md              ─┘     │
└──────────────────────────────────────────────────────────────────────────┘

버튼 클릭 → 응답 아래 inline 폼:
┌──────────────────────────────────────────────────────────────────────────┐
│  어시스턴트 응답 텍스트 (위에 보임)                                             │
├──────────────────────────────────────────────────────────────────────────┤
│  Document 제목                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  응답 앞 60자 자동 채움 (수정 가능)                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                   [취소] [ Document 만들기 ]            │
│                                            └─ color-primary ─┘          │
└──────────────────────────────────────────────────────────────────────────┘
```

**구성 요소 — 버튼 (응답 하단)**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 버튼 bg | `color-bg-badge` | h 32px, radius-md | 기본 배경. "출처" 버튼보다 **시각적 무게 한 단계 위** — 주 CTA로 인지되도록 |
| 버튼 hover bg | `color-bg-hover` | — | 호버 시 살짝 밝아짐 |
| 버튼 텍스트 | `color-text-primary` | text-caption 500 | 흰색 풀텍스트 (vs 출처 버튼의 secondary) |
| 아이콘 | `color-text-primary` currentColor | 14×14 | Document 모양 SVG |
| padding | — | 좌우 12px | — |

**기존 v0.1 디자인 대비 변경점** (사용자 피드백 반영, 2026-04-21):
- 배경·테두리 없던 텍스트 버튼 → `color-bg-badge` 배경 + `color-text-primary` 풀텍스트 — **시각 강조**
- 레이블 "Document로 내보내기" → **"이 Chat을 재료로 새 Document"** — composition 모델 언어로 정정
- "이미 Document로 내보내졌습니다 · Document 보기 →" 분기 **제거** — 한 Chat이 여러 Document의 재료가 될 수 있으므로 "이미"라는 개념 없어짐

**구성 요소 — 인라인 폼**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 인라인 폼 컨테이너 | `color-bg-secondary` + `color-border-subtle` border | radius-md | 응답 바로 하단. 별도 모달 없음 |
| 폼 내부 padding | — | 12px | — |
| 제목 입력 필드 | `color-text-primary` + `color-bg-primary` bg | h 36px, `radius-md` | 초기값: 응답 본문 앞 60자 자동. 사용자 수정 가능 |
| 취소 버튼 | `color-text-secondary` | h 32px, text-caption | 폼 닫힘. 응답에 변화 없음 |
| "Document 만들기" 버튼 | `color-primary` bg + `color-text-primary` | h 32px, text-caption 500, `radius-md` | 클릭 시 `createDocument({ title, projectId: currentProjectId, sourceChatIds: [currentChatId] })` 호출 |
| 생성 중 | 버튼 비활성 + 라벨 "만드는 중…" | — | — |

**동작 — 도메인 모델 연결 (v0.4)**:
- `Asset.source_chat_ids = [currentChatId]` (composition 재료 1개)
- `Message.generated_asset_id`는 **사용하지 않음** (v0.4에서 폐지)
- 초기 `Asset.documentContent`: 해당 Chat의 어시스턴트 응답들 concat → TipTap doc 구조로 감쌈
- 생성 성공 → `/p/${projectId}/write/d/${newDocId}`로 router.push

**상태**:

| 상태 | 변화 |
|---|---|
| 버튼 기본 | 배경색 있는 시각 강조 버튼. "N개의 출처" 옆에 배치 |
| 폼 열림 | 응답 아래 inline 등장, 제목 60자 자동 입력 |
| 생성 중 | "Document 만들기" 비활성 + 라벨 변경 |
| 생성 완료 | Write 뷰 자동 이동 |
| 생성 실패 | 폼 내 인라인 에러 + 재시도 가능 |

**전역 토큰 참조**: `color-bg-badge`, `color-bg-hover`, `color-bg-secondary`, `color-bg-primary`, `color-border-subtle`, `color-text-primary`, `color-text-secondary`, `color-primary`, `radius-md`

---

### 2-10. Document 목록 (사이드바 "최근 기록" 재사용 + Write 뷰 메인 패널 경량)

원본 Liner Write 패턴(measurements §Document 목록 관찰) 준용. 사이드바에 "새 Document" 버튼 + "최근 기록"(Document 목록)만 있고, 전용 목록 라우트 UI는 최소화.

```
사이드바 (Write 뷰 활성 시):
┌────────────────────┐
│  + 새 Project       │
│  + 새 Document      │  ← 신규. 244×40px 추정, radius-sm(6px), border-normal
│                    │
│  프로젝트            │
│  ▾ Project A       │
│    ● Document X  ⋯ │  ← 현재 편집 중 (활성). 기능 5에서 클릭 시 편집 이동
│      Document Y  ⋯ │
│  ▸ Project B       │
│                    │
│  최근 기록          │  ← Write 뷰 활성 시만, cross-project Document 목록
│  ● Document X      │
│    Document Z      │
│                    │
│────────────────────│
│  프로필 영역         │
└────────────────────┘

Write 뷰 메인 패널 (/write 또는 /p/[pid]/write) — 경량 placeholder:
┌──────────────────────────────────────────────────────────────────────────┐
│                            상단 헤더 (48px)                                │
│                        [Liner] [Write] [Scholar]                         │
├──────────────┬───────────────────────────────────────────────────────────┤
│              │                                                           │
│  사이드바      │                                                           │
│  (새 Document│              "아직 저장된 Document가 없습니다."               │
│   버튼 포함)  │               (또는 "Document를 선택하거나 새로 만들어보세요") │
│              │                                                           │
│              │     ┌─────────────────────────────────────┐              │
│              │     │           [+ 새 Document]            │              │
│              │     └─────────────────────────────────────┘              │
│              │                                                           │
└──────────────┴───────────────────────────────────────────────────────────┘
```

**구성 요소 — 사이드바 "새 Document" 버튼**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 버튼 | `color-text-primary` + `color-border-subtle` border | w 244px, h 40px 추정, `radius-sm` | measurements §Document 목록 참조. 클릭 시 빈 Document 미니 모달(§2-8) |

**구성 요소 — 사이드바 Document 항목**:

기능 3 §2-6 Chat 항목 공통 컴포넌트 재사용. 차이점만 명시.

| 속성 | 기능 3 Chat 항목 | 기능 4 Document 항목 |
|---|---|---|
| 높이 | 32px | 32px (동일) |
| 제목 폰트 | `text-caption` 13px | `text-caption` 13px (동일) |
| 활성 | 현재 Chat | 현재 Document (기능 5에서 연결) |
| "⋯" 메뉴 항목 | "이름 변경", "삭제" | "이름 변경", "삭제" (동일) |

**전역 토큰 참조**: `color-text-primary`, `color-border-subtle`, `color-text-secondary`, `radius-sm`, `color-bg-hover`, `color-bg-active-subtle`, `text-caption`

---

### 2-11. Chat → Project 이동 다이얼로그 (Asset 동반 이동 옵션 기본 off)

독자 설계. 삭제 다이얼로그(§2-12) 패턴 준용. PM 명세 Q4 확정.

```
┌──────────────────────────────────────────────────────────────────────┐
│  화면 전체 backdrop                                                     │
│  ┌──────────────────────────────────────────────┐                    │
│  │  Chat을 Project로 이동            [×]          │  ← 400px          │
│  │                                              │    radius-dialog   │
│  │  어떤 Project로 이동할까요?                     │    shadow-dialog   │
│  │  ┌────────────────────────────────────────┐  │                    │
│  │  │ ▸ Project A                        [○] │  │  ← 선택 목록        │
│  │  │   Project B                        [●] │  │    h 42px/항목     │
│  │  │   Project C                        [○] │  │    border-bottom   │
│  │  └────────────────────────────────────────┘  │                    │
│  │                                              │                    │
│  │  ─────────────────────────────────────────   │  ← 구분선          │
│  │                                              │                    │
│  │  □ 이 Chat의 전용 Asset도 함께 이동            │  ← 체크박스 기본 off │
│  │    (origin_chat_id가 이 Chat인 Asset N개)     │    본문 하단 구분선 아래│
│  │                                              │                    │
│  │                         [취소] [이동]        │                    │
│  └──────────────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────────────┘
```

**"Asset 동반 이동" 체크박스 위치 결정 (Q4 확정)**:

다이얼로그 본문 하단, Project 선택 목록과 확인/취소 버튼 사이에 구분선을 두고 그 아래에 배치한다. 이유:
1. Project 선택(주요 액션)과 시각적으로 분리 — 별도 선택 사항임을 명확히 전달
2. 체크박스가 눈에 띄지만 강제되지 않는 위치 — 기본 off이므로 사용자가 의식적으로 찾아야 발견
3. 확인 버튼 직전에 배치 — 확인 직전 한 번 더 체크 유도. "몰랐다"는 상황 최소화

**구성 요소**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 다이얼로그 컨테이너 | `color-bg-primary` + `shadow-dialog` | w 400px, `radius-dialog` (measurements) | — |
| 내부 padding | — | 24px (measurements) | — |
| 헤더 | `color-text-primary` | 20px / 600 (measurements) | "Chat을 Project로 이동" |
| Project 선택 항목 | `color-text-primary` + `color-border-subtle` border-bottom | h 42px, gap 0px (measurements) | 클릭 시 선택. 선택 상태: `color-bg-active-subtle` |
| 구분선 | `color-border-subtle` | 1px | 선택 목록과 체크박스 구분 |
| 체크박스 | `color-text-primary` | 16×16px (measurements) | 기본 unchecked |
| 체크박스 라벨 | `color-text-secondary` + `text-caption` | 13px | "이 Chat의 전용 Asset도 함께 이동" + 대상 Asset 수 |
| 취소 버튼 | `color-text-primary` + `color-border-normal` | 80×40px, `radius-md` | — |
| "이동" 버튼 | `color-primary` bg | 80×40px, `radius-md` | Project 선택 후 활성 |
| 이동 중 상태 | 버튼 비활성 + 스피너 | — | — |

**상태**:

| 상태 | 변화 |
|---|---|
| Project 항목 hover | `color-bg-hover` |
| Project 항목 선택됨 | `color-bg-active-subtle` + 우측 선택 아이콘 |
| 체크박스 off (기본) | 빈 체크박스 |
| 체크박스 on | 체크 표시 + 라벨 강조 (`color-text-primary`) |
| "이동" 버튼 비활성 | Project 미선택 시. `color-surface-overlay` bg |
| 이동 중 | 버튼 비활성 + 스피너 |

**전역 토큰 참조**: `color-bg-primary`, `color-text-primary`, `color-text-secondary`, `color-border-subtle`, `color-border-normal`, `color-primary`, `color-surface-overlay`, `color-bg-hover`, `color-bg-active-subtle`, `radius-md`, `radius-dialog`, `shadow-dialog`, `text-caption`

---

### 2-12. Asset 삭제 확인 다이얼로그 (Reference / Document 공통)

원본 Liner 삭제 다이얼로그 실측 기반 (measurements §Asset 삭제 확인 다이얼로그). Reference·Document 모두 동일한 컴포넌트를 재사용하고 내용(이름, 경고 문구)만 다르다.

```
┌────────────────────────────────────────────────────────────────────────┐
│  화면 전체 backdrop                                                       │
│  ┌────────────────────────────────────┐                                 │
│  │  '[자료 제목]'을 삭제할까요?           │  ← 400px, radius-dialog(12px)  │
│  │                                    │    shadow-dialog               │
│  │  삭제하면 이 자료를 참조하던 대화의      │                                 │
│  │  출처도 함께 제거됩니다.               │  ← 경고 문구 (15px, measurements)│
│  │  이 작업은 되돌릴 수 없습니다.         │                                 │
│  │                                    │                                 │
│  │                   [취소] [삭제]     │  ← 우측 정렬, gap: 8px          │
│  └────────────────────────────────────┘                                 │
└────────────────────────────────────────────────────────────────────────┘
```

**Document 삭제 시 경고 문구 variant**:
"삭제하면 이 Document를 생성한 대화의 연결이 끊어집니다. 이 작업은 되돌릴 수 없습니다."

**구성 요소**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 다이얼로그 컨테이너 | `color-bg-primary` + `shadow-dialog` | w 400px, `radius-dialog`(12px), padding 24px (measurements) | — |
| 요소 간 gap | — | 16px (measurements) | — |
| 헤더 | `color-text-primary` | 20px / 600 (measurements) | Asset 이름을 따옴표로 강조 |
| 경고 문구 | `color-text-primary` | 15px / 400 (measurements) | 도메인 모델 삭제 동작 설명 (Message 참조 제거) |
| 취소 버튼 | `color-text-primary` bg + `color-border-normal` | 80×40px, `radius-md` (measurements) | — |
| "삭제" 버튼 | `color-error` bg + `color-text-primary` | 80×40px, `radius-md` (measurements) | 클릭 시 hard delete |
| 삭제 중 상태 | "삭제" 버튼 비활성 + 스피너 | — | — |
| 삭제 에러 | 버튼 하단 인라인 에러 + 재시도 | — | — |

**상태**:

| 상태 | 변화 |
|---|---|
| "삭제" 버튼 default | `color-error` 배경 |
| "삭제" 버튼 hover | `color-error` 보다 한 톤 진하게 |
| "삭제" 버튼 삭제 중 | 비활성 + 스피너 |
| 삭제 실패 | 인라인 에러 텍스트 (`color-text-secondary`) + "다시 시도" 링크 |

**전역 토큰 참조**: `color-bg-primary`, `color-text-primary`, `color-text-secondary`, `color-border-normal`, `color-error`, `radius-md`, `radius-dialog`, `shadow-dialog`

---

### 2-13. Asset 빈 상태 — URL/텍스트 2버튼만 (파일 업로드 제거)

원본(스크린샷 `10`) 파일 드래그 중앙 박스를 제거하고 URL/텍스트 2버튼만 차용한다. Reference 빈 상태(Liner 뷰)와 Document 빈 상태(Write 뷰)가 각각 맥락에 맞는 문구로 표시된다.

```
Reference 빈 상태 (/liner 또는 /p/[pid]/liner — Reference 0개):
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                                                                           │
│                    아직 저장된 자료가 없습니다.                                │
│                    자료를 추가하면 대화할 때 참조할 수 있어요.                   │
│                                                                           │
│              ┌─────────────────┐   ┌─────────────────┐                   │
│              │    URL 입력      │   │   텍스트 입력     │                   │
│              └─────────────────┘   └─────────────────┘                   │
│                                                                           │
│                          수직 중앙 정렬 (measurements)                      │
└──────────────────────────────────────────────────────────────────────────┘

Document 빈 상태 (/write 또는 /p/[pid]/write — Document 0개):
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                    아직 저장된 Document가 없습니다.                           │
│                    Liner에서 AI와 나눈 대화를 Document로 내보내거나,           │
│                    새 Document를 직접 만들어보세요.                           │
│                                                                           │
│                         ┌─────────────────────┐                          │
│                         │    + 새 Document      │                          │
│                         └─────────────────────┘                          │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

**Reference 빈 상태 2버튼 세부 (Q4·Q16 확정)**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 안내 텍스트 (제목) | `color-text-primary` + `text-heading-3` | 17px / 600 | "아직 저장된 자료가 없습니다." |
| 안내 텍스트 (보조) | `color-text-secondary` | `text-body` (16px) | 원본 파일 드래그 설명 텍스트 대체 |
| "URL 입력" 버튼 | `color-text-primary` + `color-border-normal` | 약 48~52px 높이, `radius-md` (measurements `10` 관찰) | 클릭 시 Reference 추가 모달 URL variant(§2-3) |
| "텍스트 입력" 버튼 | `color-text-primary` + `color-border-normal` | 동상 | 클릭 시 Reference 추가 모달 텍스트 variant(§2-4) |
| 버튼 간 gap | — | 12px | 나란히 배치 |
| 컨테이너 정렬 | — | 수직 중앙 (measurements 관찰) | — |

**전역 토큰 참조**: `color-text-primary`, `color-text-secondary`, `color-border-normal`, `color-primary`, `radius-md`, `text-heading-3`, `text-body`

---

### 2-14. 로딩 / 에러 / 삭제된 출처 graceful degradation

원본 관찰 불가. 기능 3 에러 처리 패턴(measurements §독자 설계 가이드라인) 준용. 독자 설계.

```
Asset 목록 로딩:
┌─────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────┐    │
│  │  ████████████████████████░░░░░░░░░░░░░  │    │  ← 스켈레톤 카드 (애니메이션)
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │  ██████████████████░░░░░░░░░░░░░░░░░░░  │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘

삭제된 출처 배지 (출처 패널에서):
┌──────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────┐  │
│  │  [1]  (흐린 텍스트 — color-text-tertiary)    │  │
│  │  삭제된 출처입니다.                            │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**구성 요소**:

| 상황 | 처리 방식 | 토큰 | 비고 |
|---|---|---|---|
| Asset 목록 로딩 중 | 스켈레톤 카드 (기능 3 패턴 준용). 카드 높이 ~42px, `radius-sm` | `color-bg-secondary` shimmer | React Query `isLoading` 상태 |
| Asset 목록 로딩 실패 | "자료를 불러오지 못했습니다." + "다시 시도" 버튼 | `color-text-secondary` | 기능 3 에러 인라인 패턴 |
| 출처 패널 - 삭제된 Asset | 해당 항목을 `color-text-tertiary`로 흐리게 + "삭제된 출처입니다." 텍스트 | `color-text-tertiary` | graceful degradation |
| 포워딩 생성 중 | "Document 생성" 버튼 비활성 + 인라인 스피너 | — | §2-9 참조 |

**전역 토큰 참조**: `color-bg-secondary`, `color-text-secondary`, `color-text-tertiary`, `radius-sm`

---

### 2-15. 사이드바 Reference 진입점

PM 명세 v0.6 §5 "사이드바 Reference 진입점 — D7 범위로 편입" 결정 + 사용자 추가 결정(하위 최상단 위치, 파일 아이콘) 반영. 기존 사이드바 Project 노드의 caret 펼침 패턴(§2-1 / project-item.tsx)을 계승하며, "자료" 노드를 Chat 목록 **위에** 상시 표시한다.

#### Project 스코프 — "자료" 노드

Project를 펼쳤을 때 Chat 목록 최상단에 "자료" 노드가 위치한다.

```
사이드바 — Project 펼침 상태:
┌─────────────────────────────┐
│  + 새 대화                   │  ← 전역 버튼
│  + 새 Project                │
│                             │
│  프로젝트                     │
│  ▾ Project A                │  ← caret 클릭으로 펼침/접힘 (기존 패턴)
│    ┌───────────────────────┐│
│    │ 📄 자료               ││  ← "자료" 노드: Chat 목록 위 최상단 (신규)
│    └───────────────────────┘│
│      Chat 1                 │  ← 기존 Chat 항목들
│      Chat 2                 │
│  ▸ Project B                │  ← 접힌 상태 (자료 노드 미노출)
│                             │
│  최근 기록                   │
│  ● Chat X                   │
└─────────────────────────────┘
```

**구성 요소 — "자료" 노드**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 노드 컨테이너 | 투명 bg + hover: `color-bg-hover` | h 30px (Project Chat 항목 32px와 유사), w 244px `radius-sm`(6px) | `pl-4` 들여쓰기(Project 항목과 동일 depth) |
| 파일 아이콘 | `color-text-secondary` | 14×14px | lucide-react `Files` (복수 파일 의미. "자료 목록" 표현) |
| "자료" 레이블 | `color-text-secondary` | `text-caption`(13px) / 400 | default 상태. 클릭 시 → `/p/[projectId]/references` |
| 아이콘-레이블 gap | — | `space-sm`(8px) | — |
| 좌우 padding | — | `space-sm`(8px) | — |

**상태**:

| 상태 | 변화 |
|---|---|
| default | 투명 bg, `color-text-secondary` 텍스트·아이콘 |
| hover | `color-bg-hover` bg. 텍스트·아이콘 `color-text-primary`로 밝아짐 |
| active (현재 페이지) | `color-bg-active-subtle` bg, `color-text-primary` 텍스트·아이콘 |
| focus (키보드) | `color-focus-ring` |

**클릭 동작**: `/p/[projectId]/references` 라우트로 이동. 기존 D2에서 임시로 URL 직접 입력으로만 접근하던 페이지를 사이드바에서 직접 진입 가능하게 한다.

**펼침/접힘 연동**: "자료" 노드는 Project를 caret으로 펼치면 **항상 Chat 목록과 함께 노출**된다. 별도 토글 없음 — Chat 목록과 동등 레벨의 항목으로 상시 노출. 프로젝트가 접힌 상태에서는 보이지 않는다.

**전역 토큰 참조**: `color-text-secondary`, `color-text-primary`, `color-bg-hover`, `color-bg-active-subtle`, `color-focus-ring`, `radius-sm`, `space-sm`, `text-caption`

---

#### 미할당 영역 — Reference 진입점

미할당 영역(Project 미소속 상태)의 Reference 목록은 `/references` 라우트로 신규 생성된다. 사이드바 진입점은 **"최근 기록" 섹션 상단**, "미할당 Chat + Document" 목록과 구분되도록 별도 고정 링크로 배치한다.

```
사이드바 — 미할당 영역 진입점:
┌─────────────────────────────┐
│  + 새 대화                   │
│  + 새 Project                │
│                             │
│  프로젝트                     │
│  ▾ Project A                │
│    📄 자료                   │  ← Project 스코프 진입점 (위 §2-15 참조)
│      Chat 1                 │
│                             │
│  최근 기록                   │
│  ┌───────────────────────┐  │
│  │ 📄 미할당 자료          │  │  ← 미할당 Reference 진입점 (신규, 고정)
│  └───────────────────────┘  │
│  ● Chat X (미할당)           │  ← 기존 미할당 Chat
│    Chat Y (Project A)        │
└─────────────────────────────┘
```

**구성 요소 — "미할당 자료" 고정 링크**:

| 요소 | 토큰 | 치수 | 비고 |
|---|---|---|---|
| 링크 컨테이너 | 투명 bg + hover: `color-bg-hover` | h 30px, w 244px, `radius-sm` | "최근 기록" 섹션 헤더 바로 아래, Chat/Document 항목 위에 고정 |
| 파일 아이콘 | `color-text-secondary` | 14×14px | lucide-react `Files` (Project 스코프와 동일 아이콘 — 일관성) |
| "미할당 자료" 레이블 | `color-text-secondary` | `text-caption`(13px) / 400 | 클릭 시 → `/references` |
| 아이콘-레이블 gap | — | `space-sm`(8px) | — |
| 좌우 padding | — | `space-sm`(8px) | — |

**상태**:

| 상태 | 변화 |
|---|---|
| default | 투명 bg, `color-text-secondary` |
| hover | `color-bg-hover` bg, `color-text-primary` |
| active | `color-bg-active-subtle` bg, `color-text-primary` |
| focus | `color-focus-ring` |

**클릭 동작**: `/references` 라우트로 이동. 미할당 Reference 목록(`listUnassignedReferencesByUser` 쿼리 — D2에서 이미 존재)을 표시하는 신규 페이지.

**위치 결정 근거**: "최근 기록" 섹션은 시간순 최근 Chat/Document가 모이는 영역으로 사용자의 현재 작업 맥락을 보여준다. 미할당 자료 진입점을 이 섹션 최상단에 고정함으로써 "미할당 컨텍스트에서의 Reference 접근"이 Chat/Document와 동등한 위계로 노출된다. 별도 섹션(예: "자료"를 독립 섹션으로)을 두면 사이드바 섹션 수가 늘어나 인지 부하가 증가한다. "최근 기록" 섹션 상단 고정이 현재 사이드바 정보 구조와 가장 적은 충돌로 통합되는 위치다.

**전역 토큰 참조**: `color-text-secondary`, `color-text-primary`, `color-bg-hover`, `color-bg-active-subtle`, `color-focus-ring`, `radius-sm`, `space-sm`, `text-caption`

---

## 3. 상태 매트릭스

| 화면/요소 | default | hover | active(선택) | focus | disabled | loading | error |
|---|---|---|---|---|---|---|---|
| "+ 새 대화" 버튼 | 투명 + `color-text-primary` | `color-bg-hover` | — | `color-focus-ring` | 생성 중: 비활성 | 스피너 | — |
| Reference 추가 모달 "추가" 버튼 | `color-surface-overlay` (비활성) | — | `color-primary` (URL+제목 입력 시) | `color-focus-ring` | 비어있음 | 스피너 | 인라인 에러 |
| 삭제 다이얼로그 "삭제" 버튼 | `color-error` | 한 톤 진하게 | — | `color-focus-ring` | 삭제 중: 비활성 | 스피너 | 인라인 에러 |
| Chat 이동 "이동" 버튼 | `color-surface-overlay` (Project 미선택) | — | `color-primary` (선택 시) | `color-focus-ring` | 이동 중: 비활성 | 스피너 | 인라인 에러 |
| Reference 칩 | `color-bg-badge` + `color-text-primary` | 약간 밝아짐 | — | `color-focus-ring` | — | — | — |
| 팝오버 항목 | 투명 | `color-bg-hover` | `color-bg-active-subtle` + 체크 | `color-focus-ring` | — | — | — |
| Reference 목록 항목 | 투명 | `color-bg-hover` + "⋯" 표시 | — | `color-focus-ring` | — | 스켈레톤 | — |
| Document 사이드바 항목 | 투명 + `color-text-primary` | `color-bg-hover` | `color-bg-active-subtle` (활성) | `color-focus-ring` | — | — | — |
| "Document로 내보내기" 버튼 | `color-text-secondary` | `color-bg-hover` | — | `color-focus-ring` | 스트리밍 중: 비표시 | — | — |
| 출처 패널 삭제된 항목 | `color-text-tertiary` (흐림) | — | — | — | — | — | "삭제된 출처" |
| 포워딩 확인 폼 "Document 생성" | `color-primary` (제목 있을 때) | 한 톤 진하게 | — | `color-focus-ring` | 제목 없음: `color-surface-overlay` | 스피너 | 인라인 에러 |
| "Project에 할당" 버튼 | `color-text-secondary` | `color-bg-hover` | — | `color-focus-ring` | — | — | — |
| Asset 빈 상태 "URL 입력" | `color-text-primary` + `color-border-normal` | `color-bg-hover` | — | `color-focus-ring` | — | — | — |
| Asset 빈 상태 "텍스트 입력" | 동상 | 동상 | — | `color-focus-ring` | — | — | — |

### 기능 4 특유 상태 조합

| 상태 | 설명 |
|---|---|
| Reference 선택 후 스트리밍 중 | 칩 표시 유지 + 입력 비활성 (기능 3 스트리밍 중과 동일) |
| 포워딩 후 Write 뷰 이동 전 | "Document 생성" 버튼 스피너 + 입력카드 비활성 |
| Chat 이동 완료 후 | URL 리다이렉트 애니메이션 없음. 즉시 `/p/[pid]/liner/c/[id]`로 이동 |
| SSE 에러 후 재시도 (T-004) | "다시 시도" 클릭 → 기존 user 메시지 ID 재사용 → user 메시지 중복 없음 |

---

## 4. 인터랙션 플로우

### Reference 추가 플로우

| 단계 | 트리거 | 동작 | 피드백 |
|---|---|---|---|
| 1 | "URL 입력" / "텍스트 입력" 버튼 클릭 | 해당 variant 추가 모달 열림 | backdrop fade-in + 모달 scale-in (`motion-medium`) |
| 2 | 입력 필드에 내용 입력 | "추가" 버튼 활성화 | 버튼 배경 `color-surface-overlay` → `color-primary` |
| 3 | "추가" 클릭 | Server Action 실행. 버튼 스피너 | 버튼 비활성 + 스피너 아이콘 |
| 4 | 저장 성공 | 모달 닫힘 + 목록 갱신 | 목록에 새 항목 상단 추가 (빠른 피드백) |
| 5 | 저장 실패 | 모달 유지 + 인라인 에러 표시 | "저장에 실패했습니다. 다시 시도해주세요." |
| 취소 | "취소" 또는 ✕ 클릭, backdrop 클릭 | 모달 닫힘 | 입력 내용 초기화 |

### Reference 선택 (입력창 첨부) 플로우

| 단계 | 트리거 | 동작 | 피드백 |
|---|---|---|---|
| 1 | 입력카드 "+" 버튼 클릭 | Reference 팝오버 열림 | 버튼 위로 팝오버 scale-in. 검색 필드 자동 포커스 |
| 2 | 검색 필드 입력 | 제목 기준 로컬 필터링 | 항목 목록 즉시 갱신 |
| 3 | 항목 클릭 | 입력창 하단 칩 추가 | 항목 배경 `color-bg-active-subtle` + 체크. 칩 fade-in |
| 4 | 이미 선택된 항목 클릭 | 선택 해제 | 칩 제거. 항목 선택됨 상태 해제 |
| 5 | 칩 "×" 클릭 | 칩 제거 | 해당 항목 팝오버에서도 선택 해제 |
| 6 | 팝오버 외부 클릭 | 팝오버 닫힘 | 칩 유지 |
| 7 | 메시지 전송 | 선택된 Reference 내용을 시스템 프롬프트에 주입 | 기존 SSE 스트리밍 시작 (`referencedAssetIds`에 실 ID 저장) |

### Chat 포워딩 플로우 (시나리오 5-b)

| 단계 | 트리거 | 동작 | 피드백 |
|---|---|---|---|
| 1 | "Document로 내보내기" 클릭 | 응답 하단에 인라인 폼 등장 | 폼 slide-down (`motion-medium`) |
| 2 | 제목 필드 | 어시스턴트 응답 첫 40자 자동 입력 | 커서 제목 끝에 위치 |
| 3 | Project 선택 드롭다운 | 현재 뷰 Project 사전 선택 | — |
| 4 | "Document 생성" 클릭 | 트랜잭션 실행 (Document 생성 + `origin_chat_id` + `generated_asset_id` 업데이트) | 버튼 스피너 |
| 5 | 생성 성공 | Write 뷰 자동 이동 | 즉시 라우트 push. 전환 애니메이션 없음 |
| 6 | "취소" 클릭 | 폼 닫힘 | 응답 원래 상태 복원 |

### 키보드 포커스 규칙

| 요소 | 포커스 진입 | Tab 순서 |
|---|---|---|
| Reference 추가 모달 | 열릴 때 URL(또는 텍스트) 첫 입력 필드 자동 포커스 | 입력 필드 → Project 선택 → 취소 → 추가 |
| Reference 팝오버 | 열릴 때 검색 필드 자동 포커스 | 검색 필드 → 항목 목록 (방향키 탐색) |
| 삭제 다이얼로그 | 열릴 때 "취소" 버튼 포커스 (파괴적 액션의 default는 취소) | 취소 → 삭제 |
| Chat 이동 다이얼로그 | 열릴 때 첫 번째 Project 항목 포커스 | Project 목록 → 체크박스 → 취소 → 이동 |
| Esc 키 | 모든 모달·팝오버·다이얼로그에서 닫힘 | — |

---

## 5. 디자인 결정 근거

### (1) Reference 선택 첨부 버튼 재사용 — 기존 `+` 버튼 의미 확장

기능 3의 입력카드에는 `+` 버튼(40×40px, `radius-full` 200px)이 이미 존재하며 파일 첨부 용도로 설계됐으나 기능 3에서는 미구현(PM 명세 비-스코프). 기능 4에서 이 버튼을 "Reference 선택" 진입점으로 재사용한다.

| 대안 | 장점 | 단점 | 선택 여부 |
|---|---|---|---|
| **기존 `+` 버튼 재사용 (채택)** | 입력카드 레이아웃 변경 없음. 사용자에게 "첨부"의 affordance 유지 | 원래 파일 첨부 용도였으므로 Reference 첨부로 의미가 확장됨 (2차 파일 첨부 도입 시 팝오버에 탭 추가로 확장 가능) | **채택** |
| 별도 Reference 버튼 추가 | 의미 명확 | 입력카드 하단 영역 증가. 기능 3 디자인에서 `+` 버튼이 이미 "첨부"로 자리잡음. 중복 |기각 |
| 사이드 패널 | 레퍼런스 목록을 넓게 보여줌 | 입력 맥락을 유지하면서 선택하기 불편 — 패널 열릴 때마다 대화 영역 축소 | 기각 |

**근거**: 파일 첨부와 Reference 첨부는 사용자 멘탈 모델에서 같은 "첨부" 범주다. 팝오버 내에서 URL/텍스트만 지원하고 2차에서 파일 탭을 추가하면 자연스럽게 확장된다. measurements 실측에서 기존 `+` 버튼 치수(`40×40px`, `radius-full`(200px))가 확인됐으므로 그대로 재사용.

---

### (2) Document "재료 첨부" composition 모델 — Chat 응답 지름길 + 모달 다중 선택

Document 생성은 composition 모델([ADR-0016](../../architecture/decisions/0016-asset-chat-composition-model.md))에 따라 `sourceChatIds[]`(0~N개)를 Document에 안는 구조다. 진입점은 두 가지, UI는 세 시나리오를 포괄한다:

- **지름길 (시나리오 5-b)**: Chat 응답 하단 "이 Chat을 재료로 새 Document" 버튼 → 인라인 폼 (§2-9)
- **통합 모달 (시나리오 5-a + 5-c)**: Write 뷰 "+ 새 Document" → 제목 + Chat 체크박스 선택 (0~N개). 재료 0개면 빈 Document (§2-8)

**v0.1 대비 변화** (사용자 피드백, 2026-04-21):
- v0.1은 "포워딩 = Chat 응답에서 모달 띄우기" 단일 프레임으로 설계. "다중 Chat 재료" 표현 불가능.
- v0.2는 composition(Document가 N개 Chat을 안음) 프레임. 단일 재료는 `sourceChatIds=[chatId]`인 특수 경우.
- "이미 내보냄" UI 분기 제거 — 한 Chat이 여러 Document 재료가 될 수 있음.
- Chat 응답 버튼을 **시각 강조** (배경색 있는 버튼으로 변경) — "주 진입점"임을 UI에 반영.

**지름길 UI (인라인 폼) 대안 비교**:

| 대안 | 장점 | 단점 | 선택 여부 |
|---|---|---|---|
| **인라인 폼 (채택)** | 대상 응답이 보이는 상태에서 제목 결정 — 맥락 분리 없음 | 응답 아래 공간을 차지 | **채택** |
| 별도 모달 | 레이아웃 변화 없음 | 대상 응답이 모달 뒤로 가려짐. 맥락 전환 비용 | 기각 |
| 바로 Write 뷰 이동 | 클릭 즉시 이동 — 빠른 피드백 | 제목 못 정하고 이동. Write에서 다시 설정 | 기각 |

**통합 모달 UI (§2-8) 대안 비교**:

| 대안 | 장점 | 단점 | 선택 여부 |
|---|---|---|---|
| **단일 모달(제목 + Chat 체크박스) (채택)** | 빈/다중 모두 한 UI로 커버. 사용자 학습 비용 낮음 | 모달 높이가 재료 목록으로 약간 증가 | **채택** |
| 빈/다중을 별도 진입점으로 분리 | 각 시나리오 UI 최적화 가능 | 진입점 이중화. 사용자가 어느 버튼을 눌러야 할지 학습 필요 | 기각 |
| 재료 선택을 Write 편집 화면으로 연기 | 모달 단순화 | 편집 중 재료 추가 플로우가 복잡해짐. 초기 재료 concat이 편집 후에 이뤄져 TipTap에 더러운 상태 생성 | 기각 |

**근거**: 핵심 가치 1번(통합성)을 재료 첨부 은유로 구체화. 사용자는 "이메일에 파일 첨부하듯" 문서를 만들 때 재료를 붙인다고 이해한다. 통합 모달은 이 멘탈 모델을 그대로 반영하고, Chat 응답 지름길은 가장 흔한 단일 재료 경우를 빠르게 지원한다.

---

### (3) Document 목록 사이드바 "최근 기록" 재사용

원본 Liner Write의 측정 결과(measurements §Document 목록), Liner Write는 전용 Document 목록 라우트 없이 사이드바 "최근 기록" 섹션만 사용한다. 우리 앱도 동일한 패턴을 채택한다.

| 대안 | 장점 | 단점 | 선택 여부 |
|---|---|---|---|
| **사이드바 "최근 기록" 재사용 (채택)** | 원본 패턴 수렴. Liner 뷰의 "최근 기록"(Chat 목록)과 동일한 UI 언어. 사이드바만 보면 Document에 바로 접근 | 메인 패널에 Document 목록이 없어 "전체 목록" 탐색이 불편할 수 있음 | **채택** |
| 전용 `/p/[pid]/write` 목록 뷰 | 메인 패널에서 모든 Document 한눈에 | 사이드바와 중복. Write 뷰 메인이 목록과 편집기를 겸해야 해 레이아웃 복잡성 증가 | 기각 |

**근거**: Write 뷰의 메인 패널은 기능 5에서 TipTap 편집기가 채울 예정이다. 기능 4에서 이 공간에 임시 Document 목록을 만들면 기능 5에서 다시 갈아엎는 비용이 든다. 사이드바 재사용이 사용성에서도 충분하고 기능 5 전환 비용도 없다.

---

### (4) Asset 빈 상태에서 파일 업로드 박스 제거

원본(스크린샷 `10`)은 큰 점선 박스(파일 드래그 영역)가 화면 중앙을 차지한다. 우리는 파일 업로드를 1차에서 제외(PM 명세 비-스코프)하므로 이 박스를 제거하고, 원본 하단의 URL/텍스트 2버튼만 중앙 배치한다.

**근거**: 파일 업로드 UI를 남기면 기능 기대치 불일치 — 사용자가 파일을 드래그했다가 "지원되지 않음"을 마주치는 마찰. 없는 기능의 UI는 항상 제거한다. 2차 파일 업로드 도입 시 2버튼과 동일한 위계로 "파일 선택" 버튼을 추가하면 자연스럽게 확장된다.

---

### (5) Chat → Project 이동 시 Asset 동반 옵션 기본 off

PM 명세 Q4의 방향 결정을 UI에서 구체화한다.

**결정**: 체크박스 기본 unchecked. 체크박스는 다이얼로그 본문 하단(구분선 아래)에 배치.

| 대안 | 장점 | 단점 | 선택 여부 |
|---|---|---|---|
| **기본 off, 본문 하단 (채택)** | 사용자가 의식적으로 선택해야 Asset이 이동 — 도메인 모델의 "강제 아님" 원칙 준수. 실수로 Asset을 옮기는 사고 방지 | 처음에 모르면 Asset이 따라오지 않아 "왜 Asset이 분리됐지?" 혼란 가능 | **채택** |
| 기본 on | 자주 예상되는 패턴(Chat 이동 시 함께 이동)을 자동화 | 의도치 않게 Asset을 이동시키는 사고 발생. 도메인 모델 행동 규칙("선택")과 충돌 | 기각 |
| 별도 단계 (Step 2에서 물어보기) | 명확하게 의도 확인 | 단계 수 증가. 간단한 이동에도 2-step이 되어 마찰 | 기각 |

**근거**: 도메인 모델(`architecture/domain-model.md` v0.3)은 Chat 삭제/이동 시 Asset을 "강제 이동하지 않는다"는 규칙을 명시한다. 이 규칙은 "Chat과 Asset은 동등한 피어"라는 설계 철학에서 나온다. UI에서 기본 off로 이를 반영하되, 체크박스가 눈에 보여야 하므로 가장 마지막에 배치한다.

---

### (7) 사이드바 Reference 진입점 — Project 트리 하위 최상단(자료 노드) + 미할당은 "최근 기록" 상단 고정

PM 명세 v0.6 §5에서 "사이드바 Reference 진입점 — D7 범위로 편입"이 결정됐고, 사용자가 구체적인 위치와 아이콘을 추가 결정(Project 트리 하위 최상단 / 파일 아이콘)했다.

**Project 스코프 "자료" 노드 — 위치 결정**:

| 대안 | 장점 | 단점 | 선택 여부 |
|---|---|---|---|
| **Chat 목록 위 최상단 (채택)** | 프로젝트 펼침 시 즉시 눈에 띔. "자료"가 Chat보다 "프로젝트의 맥락 소스"로서 앞에 오는 것이 직관적 | Chat이 주 진입점인 사용자에게 "자료"가 약간 앞을 차지할 수 있음 | **채택** (사용자 결정) |
| Chat 목록 아래 최하단 | Chat이 주 진입점이므로 방해 없음 | 하단은 시각적으로 자주 숨김. 자료 진입 빈도가 낮아짐 | 기각 |
| 별도 상단 액션 (Project 항목 행 우측) | 항상 노출 (접힌 상태에서도) | Project 항목 행이 좁아 아이콘 버튼 추가 시 crowded. 기존 "+" / "⋯" 버튼과 충돌 | 기각 |

**아이콘 — `Files` 선택 근거**: lucide-react의 `Files`는 복수 파일 아이콘으로, "자료 목록"이라는 개념을 단일 파일(`File`)보다 자연스럽게 표현한다. `FileText`는 단일 문서 문서의 뉘앙스가 강해 Reference 목록(복수)을 나타내기에 `Files`가 더 적합하다. `Folder`는 Directory 개념 혼동 우려.

**"자료" 노드 vs 별도 자료 섹션 비교**:

| 대안 | 장점 | 단점 | 선택 여부 |
|---|---|---|---|
| **Project 하위 항목으로 표현 (채택)** | Project 트리의 기존 패턴(caret → 하위 항목)을 그대로 계승. 신규 패턴 없음 | — | **채택** |
| Project 노드 위에 별도 "자료" 섹션 | 항상 노출 | 사이드바에 섹션 과잉. "프로젝트별 자료"와 "전체 자료"를 혼동할 우려 | 기각 |

**미할당 진입점 위치 — "최근 기록" 상단 고정**:

미할당 영역은 별도 섹션을 추가하지 않고, 기존 "최근 기록" 섹션의 최상단에 "미할당 자료" 고정 링크를 배치한다. Chat/Document가 시간순으로 쌓이는 공간 위에 Reference 진입점을 고정하면, 사이드바 섹션 수를 늘리지 않고 미할당 자료 접근성을 확보할 수 있다.

**펼침/접힘과의 상호작용**: "자료" 노드는 Project caret 펼침 시 Chat 목록과 **동등 레벨로 상시 노출**된다. 별도 토글을 두면 Project 펼침 → "자료" 펼침의 2-step이 되어 접근 비용이 증가하므로, 단일 caret으로 "자료 + Chat 목록"이 한번에 펼쳐지는 설계를 채택한다.

---

### (6) 미할당 Chat UI를 사이드바 "최근 기록"에 포함

measurements v0.3 §열린 관찰에서 발견(원본의 "미할당 = 최근 기록" 매핑). 원본 Liner는 미할당 개념이 없고 `+` 버튼으로 만든 모든 Chat이 "최근 기록"에 쌓인다. 우리 앱도 미할당 Chat을 사이드바 "최근 기록" 섹션에 포함시킨다.

**결정**: 사이드바 "최근 기록" 섹션에 미할당 Chat을 포함. Project 소속 Chat과 함께 시간순 정렬. Chat 항목 우측에 Project 배지(소속 Chat) 또는 배지 없음(미할당) 방식으로 구분.

**근거**: URL 축(ADR-0015의 `/liner/c/[chatId]`)은 도메인 모델에 충실하고, UI 축(사이드바 최근 기록)은 원본 패턴을 수렴한다. 두 축이 충돌 없이 양립 — URL만 보면 미할당/할당 구분 가능, 사이드바는 사용자에게 "시간순 최근 Chat" 경험 제공.

---

## 6. 열린 질문 해소 결과

PM 명세 v0.3의 열린 질문 중 Designer 단계에서 확정하는 것.

| # | PM 명세 질문 | 이 문서의 확정 |
|---|---|---|
| Q4 (부분) | Chat ↔ Project 이동 시 Asset 동반 체크박스 위치 | **다이얼로그 본문 하단, 구분선 아래 (§2-11 상세)**. 기본 unchecked. |
| Q6 (부분) | Reference 선택 UI 세부 인터랙션 | **팝오버 열기/닫기·검색·중복 선택 방지·칩 제거 동작 모두 §2-6에서 확정** |
| — | Asset 빈 상태 안내 문구 | Reference 빈 상태: "아직 저장된 자료가 없습니다. 자료를 추가하면 대화할 때 참조할 수 있어요." Document 빈 상태: "아직 저장된 Document가 없습니다. Liner에서 AI와 나눈 대화를 Document로 내보내거나, 새 Document를 직접 만들어보세요." |
| — | 삭제된 출처 배지 graceful degradation | 출처 패널에서 `color-text-tertiary`로 흐림 + "삭제된 출처입니다." (§2-14) |
| — | 포워딩 미니 확인 폼 위치 | 모달 대신 **응답 하단 인라인 폼** (§2-9, §5 결정 근거) |

---

## 7. 구현자 참고사항

1. **"Document로 내보내기" 버튼 표시 조건**: 스트리밍 완료 후에만 표시. 스트리밍 중에는 다른 액션바 버튼과 함께 숨김. 기능 3 §2-3 스트리밍 중 상태 표 참조.

2. **Reference 팝오버 방향**: 입력카드가 화면 하단에 고정(`sticky bottom`)되어 있으므로, 팝오버는 항상 위 방향으로 열린다. `position: absolute; bottom: 100%`로 구현. 최대 높이 300px(measurements) 초과 시 내부 스크롤.

3. **출처 패널 실 데이터 연결**: `Message.referencedAssetIds` 배열에 저장된 실 Asset ID를 이용해 패널 진입 시 Asset 데이터를 조회한다. `[n]` 배지 번호는 배열 인덱스 + 1. 삭제된 Asset(DB에 없는 ID)은 graceful degradation(§2-14).

4. **Chat 이동 후 URL 리다이렉트**: Server Action 완료 후 클라이언트에서 `router.push('/p/[newPid]/liner/c/[chatId]')`로 이동. 사이드바 Project 트리는 `revalidatePath`로 갱신(ADR-0009 패턴).

5. **포워딩 트랜잭션 원자성**: Document 생성 + `Message.generated_asset_id` 업데이트를 Prisma 트랜잭션으로 묶는다. 부분 실패 시 모두 롤백. PM 명세 §4 #20 요구사항.

6. **T-004 재시도 플로우**: "다시 시도" 클릭 시 클라이언트가 마지막 user 메시지 ID를 서버에 전달. 서버는 해당 ID의 user 메시지를 재사용하고 assistant 응답만 새로 생성. `referencedAssetIds`는 이전 메시지에서 복사. 중복 user 메시지 방지.

7. **사이드바 "최근 기록" — Write 뷰 활성 조건**: 기능 3에서 Liner 뷰 활성 시만 "최근 기록"을 표시했다. 기능 4에서는 Write 뷰 활성 시 "최근 기록"을 Document 목록으로 치환(또는 병렬 표시). Write/Liner 뷰에서 각각 다른 "최근 기록" 항목 타입을 사용함을 컴포넌트 조건 분기로 처리.

---

## Changelog

- 0.4 (2026-04-23): **사이드바 Reference 진입점 디자인 명세 추가** (D7 범위 / PM 명세 v0.6 §5 + 사용자 추가 결정 반영).
  - **§2-15 신규 추가** — Project 스코프 "자료" 노드(Chat 목록 위 최상단, lucide `Files` 아이콘)와 미할당 영역 "미할당 자료" 고정 링크("최근 기록" 섹션 상단)를 ASCII 와이어프레임·구성 요소 표·상태 표와 함께 정의. 두 진입점 모두 기존 토큰 조합으로 표현 — 신규 전역 토큰 없음.
  - **§5 결정 근거 (7) 신규 추가** — 위치·아이콘·펼침 연동 결정의 대안 비교와 근거 기록. PM v0.6 §5의 D7 편입 결정 + 사용자의 "하위 최상단 / 파일 아이콘" 지시를 근거로 명시.
  - PM 명세 참조 버전 표기를 v0.4 → v0.6으로 갱신.
- 0.3 (2026-04-22): PM v0.5에 맞춰 §2-11 Chat → Project 이동 다이얼로그 체크박스 레이블 정정. "이 Chat이 만든 Asset도 함께 이동" → "이 Chat의 전용 Asset도 함께 이동". 설명문도 "다른 Chat과 재료를 공유하는 Asset은 영향받지 않습니다"로 composition 모델 정합 보강.
- 0.2 (2026-04-21): **Composition 모델로 재설계** (PM v0.4 / 도메인 모델 v0.4 / [ADR-0016](../../architecture/decisions/0016-asset-chat-composition-model.md) 반영).
  - D3-B 사용자 피드백: "포워딩은 결국 Document에 Chat을 재료로 첨부하는 것"이라는 지적. FK 방향을 Document 쪽(`Asset.source_chat_ids[]`)으로 뒤집는 도메인 모델 전환.
  - §2-8 **통합 모달로 재작성** — 제목 + "재료 Chat 선택" 체크박스 섹션. 재료 0개=빈 Document(5-a), 1~N개=composition Document(5-c). 치수 400→480px로 확장.
  - §2-9 **시각 강조 + 언어 정정** — "Document로 내보내기" 텍스트 버튼 → `color-bg-badge` 배경 있는 강조 버튼 + "이 Chat을 재료로 새 Document" 레이블. "이미 내보냄 → Document 보기 →" 분기 제거 (composition 모델에서 같은 Chat이 여러 Document 재료가 될 수 있으므로 "이미"가 없음). 인라인 폼은 유지하되 Project 선택 드롭다운 제거(현재 Chat의 projectId 자동).
  - §5 결정 (2) 재작성 — "포워딩 주 플로우"에서 "재료 첨부 composition 모델"로. 통합 모달 UI 대안 비교 추가(단일 모달 vs 진입점 이중화 vs 편집 화면으로 연기).
  - 프론트매터 PM 참조 v0.3 → v0.4. 관련 ADR 블록에 ADR-0016 추가.
  - D3-A·D3-B 구현 일부 폐기 예정(다음 구현 커밋에서 `forwardMessageToDocument` 제거, `response-actions.tsx` 버튼 재디자인, Document 생성 모달에 Chat 체크박스 섹션 추가).
- 0.1 (2026-04-21): 초안 작성. 기능 4 전체 화면 구조 설계.
  - §1 사용자 흐름: 미할당 Liner 뷰 / Reference 추가 / 포워딩(5-b) / 빈 Document(5-a) / Chat 이동 / Asset 삭제 흐름과 정상·예외 흐름 표.
  - §2 화면 구조: 14개 소단원 (§2-1~§2-14). 미할당 Liner 뷰 / 미할당 Chat / Reference 추가 모달 2종 / Reference 목록 / Reference 선택 칩+팝오버 / 출처 패널 실데이터 / 빈 Document 모달 / 포워딩 인라인 폼 / Document 목록 / Chat 이동 다이얼로그 / 삭제 다이얼로그 / 빈 상태 / graceful degradation.
  - §3 상태 매트릭스: 기능 4 특유 상태 조합(포워딩 중·T-004 재시도·Chat 이동 후) 포함.
  - §4 인터랙션: Reference 추가·Reference 선택 칩·포워딩 플로우 단계별 피드백. 키보드 포커스 규칙(삭제 다이얼로그 기본 포커스: 취소 버튼 — 파괴적 액션 안전성).
  - §5 디자인 결정 근거 6종: (1) Reference 첨부 버튼 재사용, (2) 포워딩 인라인 폼, (3) Document 목록 사이드바 재사용, (4) 파일 업로드 박스 제거, (5) Asset 동반 이동 기본 off·위치 확정, (6) 미할당 Chat 최근 기록 포함.
  - PM 명세 Q4(체크박스 위치)·Q6(팝오버 세부) 확정. 빈 상태 안내 문구·삭제된 출처 graceful degradation·포워딩 폼 위치 확정.
  - T-001 해소 반영 (`color-error`, `color-citation-text`, `shadow-dialog`, `radius-dialog` 신규 토큰 참조).
