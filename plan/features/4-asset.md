---
feature: Asset 관리 (Reference + Document) + 미할당 Chat
version: 0.5
last_updated: 2026-04-22
---

# 기능 4: Asset 관리 (Reference + Document) + 미할당 Chat

이 문서는 MVP 1차 기능 중 네 번째인 "Asset 관리 + 미할당 Chat"의 기획 명세다. 기능 3에서 완성한 SSE 스트리밍 인프라와 Chat 대화 UI 위에, **도메인 모델의 Asset 엔티티를 실체화**하고 **Project 미할당 상태라는 도메인 행동 규칙의 핵심을 UI로 실현**하는 것이 이 기능의 존재 이유다. 기능 1·2·3이 만든 "앱 셸 + 인증 + 대화"라는 바닥 위에 3축 도메인(Project / Chat / Asset)을 완성시키는 단계다.

## 1. 문제 정의

### (a) stub Reference의 한계 — 출처 파이프라인은 있으나 데이터가 없다

기능 3은 출처 배지 렌더링 파이프라인을 검증하기 위해 의도적으로 하드코딩 더미 Reference 데이터를 사용했다. "배지가 뜨는가, 패널이 열리는가"는 검증했지만, **실제로 저장된 Resource Asset을 가리키는 배지는 단 하나도 없다**. 출처 배지를 클릭해도 의미 있는 정보를 볼 수 없어, Liner 뷰의 핵심 가치(출처 신뢰성)가 아직 비어 있다.

### (b) Chat의 Project 종속 제약 — "바로 대화 시작"이 불가능하다

기능 3에서 Chat은 `/p/[projectId]/liner` 경로에만 존재한다. 도메인 모델은 `project_id=null`인 Chat을 명시적으로 허용하고, features.md 기능 순서 설계에서도 미할당 Chat을 기능 4의 핵심으로 정의했다. 하지만 현재 사용자는 **Project를 먼저 만들어야만 대화를 시작할 수 있다**. "새 아이디어가 생겼을 때 Project 계층 없이 즉시 대화"하는 스타트업 PM 페르소나의 핵심 사용 습관이 차단되어 있다.

기능 3 D4에서 전역 "+ 새 대화" 버튼을 제거한 것도 이 문제와 직결된다. 이 버튼은 Project에 할당되지 않은 Chat을 만드는 진입점인데, 미할당 라우트(`/liner`)가 없는 상태에서 버튼을 만들면 어디로 보낼지 결정할 수 없었다. 기능 4에서 미할당 라우트를 도입함으로써 이 버튼을 부활시킨다.

### (c) Document Asset의 부재 — Write 뷰(기능 5)의 전제가 없다

기능 5는 Document Asset을 TipTap으로 편집하는 것이다. 그런데 현재 Document Asset을 생성·목록·삭제하는 CRUD가 전혀 없다. 기능 5를 시작하려면 기능 4에서 Document Asset의 기본 생명주기가 먼저 구현되어 있어야 한다. Document 편집 자체는 기능 5에서 다루지만, **"편집 대상이 존재하는가"는 기능 4에서 해결해야 한다**.

### (d) 통합성 가치의 현 시점 의의 — 3축 도메인이 처음으로 완성된다

기능 1~3을 통해 Project·Chat·Message가 실체화되었지만, 도메인 모델의 세 번째 축인 **Asset이 아직 Prisma 스키마에도 없다**. 기능 4가 완료되면 Project / Chat / Asset 3축 모델이 처음으로 데이터 레이어에서 모두 존재하게 된다. 이 시점부터 "Liner 뷰에서 나눈 대화의 출처가 Reference Asset으로 연결되고, Document Asset이 Write 뷰(기능 5)에서 편집 대상이 되고, 두 Asset과 Chat이 함께 Scholar 뷰(기능 6)에서 3패널로 보인다"는 통합 서사가 실체로서 흐르기 시작한다.

## 2. 사용자 시나리오

대상 페르소나는 스타트업 PM. 다음 시나리오가 자연스럽게 흘러가야 한다.

### 시나리오 1: Project 없이 즉시 대화 시작 (미할당 Chat)

1. 사이드바 상단의 전역 "+ 새 대화" 버튼 클릭 (기능 3 D4에서 제거됐다가 복귀)
2. `/liner` 또는 `/liner/c/[chatId]` 형태의 Project-less 라우트로 이동
3. Liner 뷰가 열리고, Project 목록이나 선택 없이 바로 메시지 입력창에 포커스
4. 메시지를 보내면 `project_id=null`인 Chat이 생성되어 대화가 시작된다
5. 대화 후 필요 시 이 Chat을 특정 Project에 나중에 할당할 수 있다

### 시나리오 2: Reference Asset 저장 (URL)

1. Liner 뷰에서 대화 도중, 또는 사이드바·별도 저장 UI를 통해 웹 URL을 참조로 저장하고 싶어진다
2. "Reference 추가" UI에서 URL을 입력하고, 제목(사용자 직접 입력)과 발췌(선택)를 함께 저장
3. Reference Asset이 생성된다 (`type: reference`, `reference_kind: url`)
4. 저장된 Reference가 Asset 목록에 나타난다

### 시나리오 3: Reference Asset 저장 (텍스트 스니펫)

1. 읽은 글에서 특정 문단을 발췌해 메모처럼 저장하고 싶어진다
2. "Reference 추가" UI에서 텍스트를 직접 붙여넣고 제목(선택)과 함께 저장
3. Reference Asset이 생성된다 (`type: reference`, `reference_kind: text`)

### 시나리오 4: Reference를 Chat 컨텍스트로 주입하여 대화

1. 기존에 저장한 Reference Asset이 있는 상태에서 대화를 시작 또는 계속한다
2. "Reference 선택" UI를 통해 이번 메시지에 참조할 Reference를 선택
3. 선택된 Reference의 내용이 시스템 프롬프트 또는 사용자 메시지 컨텍스트로 LLM에 주입된다
4. AI 응답 본문에 `[n]` 출처 배지가 나타나고, 배지를 클릭하면 **실제 Reference Asset의 제목·URL·발췌**가 표시된다 (기능 3 stub 대체)
5. Message의 `referenced_asset_ids`에 해당 Reference Asset의 실제 ID가 기록된다

### 시나리오 5-a: 빈 Document 생성 (재료 0개)

1. Write 뷰 메인 패널에서 "+ 새 Document" 버튼 클릭
2. 모달: 제목 입력 + (Chat 재료 선택 섹션은 건너뛰기)
3. 빈 Document Asset이 생성된다 (`type: document`, `source_chat_ids=[]`, `documentContent`는 빈 TipTap doc)
4. Document 목록(사이드바 "최근 기록" 재사용)에 나타난다. 편집은 기능 5(Write 뷰)에서 한다
5. Project 내에서 생성하거나, 미할당 상태로 생성하는 두 경로 모두 가능하다

### 시나리오 5-b: 단일 Chat을 재료로 Document 생성 (지름길 — 주 플로우)

1. 사용자가 Liner 뷰에서 AI와 조사·탐색 대화를 나눈다
2. 어시스턴트 응답 하단 액션바의 **"이 Chat을 재료로 새 Document"** 버튼을 클릭한다 (시각 강조된 버튼)
3. 인라인 폼: 제목 편집 (기본값은 응답 앞 60자) + 생성 확정
4. Document Asset이 생성된다 — 해당 Chat의 콘텐츠(어시스턴트 응답 본문)가 초안으로 TipTap doc에 주입되고, `Asset.source_chat_ids=[currentChatId]`로 단일 재료가 기록된다
5. 생성 직후 Write 뷰(`/p/[pid]/write/d/[docId]`)로 자동 이동해 편집 대기 상태

**이 지름길 플로우가 "주"인 이유**: 프로젝트 핵심 가치 1번(세 서비스 통합성)의 가장 흔한 진입. "아이디어 서칭(Liner) → 초고 작성(Write)"이 별도 앱 전환 없이 하나의 클릭으로 흘러간다. 내부적으로는 시나리오 5-c의 특수 경우(`sourceChatIds` 배열 길이 1).

**같은 응답에서 여러 번 Document 생성 가능**: Composition 모델(ADR-0016)에 따라 한 Chat이 여러 Document의 재료로 쓰일 수 있다. "이미 내보냈음" 제약 없음.

### 시나리오 5-c: 여러 Chat을 재료로 Document 생성 (다중 선택 플로우)

1. Write 뷰 메인 패널에서 "+ 새 Document" 버튼 클릭
2. 모달: 제목 입력 + **"재료 Chat 선택" 섹션**에서 현재 Project의 Chat 목록을 체크박스로 복수 선택
3. 생성 확정 → 선택된 각 Chat의 어시스턴트 응답들이 순서대로 concat되어 Document의 초안 TipTap doc으로 들어감
4. `Asset.source_chat_ids=[chat1.id, chat2.id, ...]` (순서 유지)
5. 생성 직후 Write 뷰로 자동 이동, 편집 본체는 기능 5에서

**의의**: "여러 조사 결과를 모아 하나의 보고서 초안으로" 시나리오. 사용자 멘탈 모델의 "재료 첨부" 은유를 UI에 직접 반영.

### 시나리오 6: Chat을 Project에 나중에 할당

1. 미할당 Chat(또는 다른 Project에 속한 Chat)을 현재 사용 중 Project에 넣고 싶어진다
2. Chat 항목의 컨텍스트 메뉴에서 "Project로 이동" 선택
3. Project 선택 UI에서 대상 Project를 고른다
4. **"이 Chat만을 유일 재료로 쓰는 Asset도 함께 이동?"** 옵션이 표시된다 — composition 모델에서 여러 Chat이 섞인 Asset은 이 옵션으로 건드리지 않고, `sourceChatIds = [thisChatId]`인 Asset만 동반 대상
   - 이 옵션은 도메인 모델 행동 규칙("강제가 아님") 그대로: 사용자가 선택한다
   - "함께 이동": Chat과 해당 Chat의 `origin_chat_id`를 가진 Asset들이 같은 Project로 이동
   - "이 Chat만 이동": Chat만 이동, Asset은 현재 `project_id` 유지
5. 이동 완료 후 사이드바 Project 트리가 업데이트된다

### 시나리오 7: 출처 배지 → 실 Reference 확인

1. 이전에 Reference Asset을 컨텍스트로 주입하며 나눈 대화를 다시 열어본다
2. 어시스턴트 응답의 `[1]` 배지를 클릭
3. **실제 저장된 Reference Asset의 제목, URL(또는 텍스트 발췌)** 이 출처 패널에 표시된다
4. URL 타입이면 외부 링크로 이동 가능한 링크가 함께 표시된다

### 시나리오 8: Asset 삭제

1. Reference 또는 Document Asset을 목록에서 삭제 실행
2. 확인 다이얼로그 표시
3. 삭제 후:
   - Asset이 목록에서 사라진다
   - 해당 Asset을 `referenced_asset_ids`에 가지던 Message에서 해당 ID가 제거된다
   - `generated_asset_id`가 이 Asset을 가리키던 Message의 필드가 `null`로 업데이트된다
   - (도메인 모델 삭제 동작 계승)

### 시나리오 9: 에러·빈 상태·로딩

1. **빈 상태**: Asset이 하나도 없는 경우 — "아직 저장된 Asset이 없습니다" 안내와 첫 Asset 만들기 CTA
2. **로딩 상태**: Asset 목록을 불러오는 중 — 로딩 인디케이터 표시
3. **저장 실패**: Reference 저장 중 오류 — 인라인 에러 메시지와 재시도 동선
4. **이미 삭제된 Asset을 참조하는 출처 배지**: "삭제된 출처" 안내 표시 (null 처리 후 graceful degradation)

## 3. 1차 스코프

### 포함

- **Prisma 스키마 확장** (스키마 표현 방식은 [ADR-0014](../../architecture/decisions/0014-asset-schema-polymorphic-single-table.md) 참조)
  - Asset 모델 1개 — 공통 필드(`id`, `userId`, `projectId?`, `type`(`document`|`reference`), `title`, `originChatId?`, `createdAt`, `updatedAt`)
  - Reference 전용 nullable 컬럼 — `referenceKind`(`url`|`text`), `referenceUrl?`, `referenceText?`
  - Document 전용 nullable 컬럼 — `documentContent: Json?` (TipTap JSON. 기능 5에서 본격 채워지지만 컬럼은 이 단계에서 추가)
  - Message의 `referencedAssetIds`, `generatedAssetId` 필드는 기능 3에서 이미 스키마에 있으므로 신규 마이그레이션 없이 실 Asset ID를 참조하도록 애플리케이션 레이어에서 연결

- **Reference Asset CRUD**
  - 생성: **수동 입력만** (Q3 해소) — URL 저장 (URL 문자열 + 사용자 직접 입력 제목 + 발췌 선택) / 텍스트 스니펫 저장 (텍스트 + 제목 선택). 서버 측 자동 메타데이터 스크랩은 명시적 제외
  - 목록 표시: 현재 스코프(Project 또는 미할당)의 Reference 목록
  - 삭제: 도메인 모델 삭제 동작 계승 — Message 참조 제거 + hard delete
  - 파일 업로드(PDF/DOCX/HWP)는 명시적 제외

- **Document Asset CRUD (Composition 모델 기반, [ADR-0016](../../architecture/decisions/0016-asset-chat-composition-model.md))**
  - 생성 경로 **단일 API, 3가지 진입**:
    - 시나리오 5-a (빈, 재료 0개): Write 뷰 "+ 새 Document" + 재료 건너뛰기
    - 시나리오 5-b (단일 재료, 지름길): Chat 응답 하단 "이 Chat을 재료로 새 Document" 버튼
    - 시나리오 5-c (다중 재료): Write 뷰 "+ 새 Document" + 현재 Project Chat 체크박스 복수 선택
  - 모두 `createDocument({ title, projectId?, sourceChatIds?: string[] })` 1개 Server Action. `sourceChatIds` 배열 길이로 3가지가 구분됨
  - 재료 Chat 콘텐츠(어시스턴트 응답)를 concat해 초기 TipTap doc에 주입. 빈 경우 빈 doc
  - 목록 표시: **사이드바 "최근 기록" 섹션 재사용**(원본 Liner Write 패턴). Write 뷰 라우트 메인 패널은 빈 상태 CTA + 최근 편집한 Document placeholder 수준으로 경량
  - 삭제: 도메인 모델 삭제 동작 계승 (`Message.referenced_asset_ids`에서 제거, Asset hard delete)
  - **편집은 기능 5 Write 뷰의 몫** — 이 단계에서는 생성(3 경로)·목록·삭제만. `/write/d/[documentId]` 편집 본체는 기능 5에서 채움

- **Chat 삭제 시 Composition 정리**
  - Chat 삭제 Server Action이 `Asset.source_chat_ids`에서 해당 ID를 `array_remove`로 제거
  - Asset(Document)은 생존, 콘텐츠는 건드리지 않음 (이미 Document에 반영된 재료는 유지)
  - `deleteAsset`의 Message 배열 정리와 동일 패턴 — 애플리케이션 트랜잭션

- **미할당 상태 라우트 도입** (구조 결정은 [ADR-0015](../../architecture/decisions/0015-unassigned-route-structure.md) 참조)
  - `/liner` — 미할당 Liner 뷰 진입점 (Chat 없음, 빈 상태 CTA)
  - `/liner/c/[chatId]` — 미할당 특정 Chat
  - `/write` — 미할당 Write 뷰 진입점 (미할당 Document 목록)
  - `/write/d/[documentId]` — 미할당 특정 Document (편집 본체는 기능 5)
  - Scholar 뷰는 Project 스코프 필수이므로 미할당 라우트 없음
  - **Asset 전용 top-level 라우트(`/assets` 등)는 도입하지 않는다** — Reference·Document는 각각을 주로 다루는 뷰(Liner·Write)에 귀속 (Q7 해소)
  - **projectId-less 레이아웃** 신설: 기존 `/p/[projectId]/layout.tsx`와 공존. 사이드바는 공유 구조

- **사이드바 전역 "+ 새 대화" 버튼 복귀**
  - 기능 3 D4에서 제거됐던 전역 "+ 새 대화" 버튼 복귀
  - 클릭 시 `project_id=null`인 Chat 생성 → `/liner/c/[chatId]`로 이동

- **Chat ↔ Project 할당·이동**
  - 미할당 Chat을 Project에 할당하는 UI + Server Action
  - 이미 할당된 Chat을 다른 Project로 이동하는 UI + Server Action
  - "이 Chat만을 유일 재료로 쓰는 Asset도 함께 이동?" 옵션 제공 — composition 모델(ADR-0016) 관점. `sourceChatIds = [thisChatId]` 인 Asset만 동반 대상 (여러 Chat 섞인 Asset은 제외)
  - **옵션 기본값은 off**(Q4 방향 결정) — 사용자가 의식적으로 체크해야 Asset 동반. 세부 UX 레이아웃은 Designer 단계에서 확정

- **출처 배지 ↔ 실 Reference 연결 (기능 3 stub 대체)**
  - Message 전송 시 선택된 Reference Asset ID를 `referencedAssetIds`에 저장
  - 시스템 프롬프트에 Reference 내용 주입 (LLM 컨텍스트)
  - 출처 패널에서 실제 Reference Asset 데이터 표시 (제목, URL/텍스트, 링크)
  - stub 더미 데이터 제거

- **Reference 선택 UI** — 메시지 전송 전 참조할 Reference Asset을 선택하는 인터페이스
  - **위치: 입력창 하단 첨부 영역**(Q6 방향 결정) — 파일 첨부와 유사한 UX. 선택된 Reference는 입력창 바로 아래에 칩(chip) 형태로 표시
  - 세부 인터랙션(검색·열기 방식, 선택 해제 등)은 Designer 단계에서 확정

- **T-004 해소**(Q5 결정) — 에러 재시도 시 user 메시지 DB 중복 저장 방지
  - 재시도 플로우 재설계: 클라이언트가 재시도 시 마지막 user 메시지 ID를 함께 보내면 서버가 user 메시지 재생성을 건너뛰고 assistant 응답만 새로 생성
  - 기능 4에서 Chat 라우팅 구조가 재조정되므로 관련 파일(`route.ts`, `use-chat-stream.ts`, `chat-view.tsx`)을 같은 컨텍스트에서 수정
  - D4 또는 D5에서 처리 (Chat CRUD 흐름과 함께)

- **T-001 해소 착수** — `color-primary` / `color-error` 토큰 확정. 기능 4 Developer 단계 진입 시 원본 라이너의 Asset 관련 UI를 추가 실측하면서 design-tokens.md에 등록. 해소 조건이 이미 "기능 4 Developer 단계 진입 시"로 명시되어 있음

- **로딩·빈 상태·에러 상태** — 모든 Asset CRUD와 라우트 진입에 대한 피드백 UI

### 제외 (비-스코프)

| 제외 항목 | 제외 이유 |
|---|---|
| 파일 업로드/파싱 (PDF/DOCX/HWP) | features.md 기결정. 복잡도(파서·스토리지 인프라) 대비 학습 가치 낮음. 2차 이후 후보 |
| Document 편집 (TipTap) | 기능 5 Write 뷰의 몫. 편집 인프라(TipTap + AI 수정 제안)가 이 단계에서 함께 다뤄져야 함 |
| Scholar 뷰 3패널 조합 | 기능 6. 모든 컴포넌트 재료(Asset·Chat·Editor)가 갖춰진 뒤 마지막에 배치 |
| Reference 자동 웹 스크랩(og:metadata 자동 추출) | 외부 HTTP 요청 + HTML 파싱 인프라 추가 필요. URL 문자열 + 사용자 입력 제목·발췌로 충분한지는 Q3으로 처리. 1차에서는 수동 입력만 |
| Document에서 Reference를 `@` 멘션으로 인용 삽입 | features.md 2차 이후 후보. TipTap 커스텀 노드 + 확장 필요, Write 뷰 이후 별도 설계 |
| Chat을 다른 Chat으로 이동/병합 | 명시적 요구사항 없음. 도메인 모델에서도 언급 없음. 필요성이 명확해지면 별도 기획 |
| LLM 기반 Chat 제목 자동 생성 | 기능 3에서 결정한 전략(첫 메시지 앞 N자) 계승. 추가 LLM 호출 비용 불필요 |
| T-005 (ResponseActions stub 아이콘) | 학습 가치 낮음(tech-debt.md 판단 계승). 기능 5 Write AI 수정 제안 UI와 함께 일관 구현하는 것이 경제적 |
| Asset 간 이동 (다른 Project로 Asset 단독 이동) | Chat ↔ Project 이동 시 동반 이동 옵션으로 충분. Asset 단독 재배치 UI는 1차 범위 초과 |

## 4. 성공 기준 (Acceptance Criteria)

### 기능 요구

1. 전역 "+ 새 대화" 버튼을 클릭하면 `project_id=null`인 Chat이 생성되고, 미할당 Liner 뷰 라우트(`/liner/c/[chatId]`)로 이동한다.
2. 미할당 Liner 뷰에서 메시지를 보내면 기능 3의 SSE 스트리밍이 동작한다. (Project 컨텍스트 없이도 대화 가능)
3. Reference Asset을 URL로 저장할 수 있다. URL 문자열, 제목(필수), 발췌(선택)을 사용자가 직접 입력한다 (자동 메타데이터 추출 없음).
4. Reference Asset을 텍스트 스니펫으로 저장할 수 있다.
5. 저장된 Reference Asset 목록이 표시된다.
6. Reference Asset을 삭제하면 목록에서 사라지고, 해당 Asset을 참조하던 Message의 `referencedAssetIds`에서 제거된다.
7. 빈 Document Asset을 직접 생성할 수 있다 (시나리오 5-a, `sourceChatIds=[]`). Project 내 또는 미할당 상태 모두 가능.
8. Chat 어시스턴트 응답 하단 액션바의 **"이 Chat을 재료로 새 Document"** 버튼(시각 강조)으로 단일 재료 Document를 생성할 수 있다 (시나리오 5-b, `sourceChatIds=[currentChatId]`). 같은 응답에서 여러 번 반복해도 매번 새 Document 생성 가능 — "이미 내보냄" 제약 없음.
9. Write 뷰 "+ 새 Document" 모달의 "재료 Chat 선택" 섹션에서 현재 Project의 Chat들을 체크박스로 복수 선택해 다중 재료 Document를 생성할 수 있다 (시나리오 5-c, `sourceChatIds=[chat1,...,chatN]`).
10. 재료 Chat들의 어시스턴트 응답이 순서대로 concat되어 생성된 Document의 초기 `documentContent`(TipTap doc)에 주입된다. 생성 직후 Write 뷰(`/p/[pid]/write/d/[docId]`)로 이동.
11. Document Asset 목록이 **사이드바 "최근 기록" 섹션**에 노출된다. Write 뷰 라우트(`/p/[projectId]/write` 및 `/write`) 메인 패널은 빈 상태 CTA 또는 경량 placeholder.
12. Document Asset을 삭제하면 목록에서 사라지고, 도메인 모델 삭제 동작이 올바르게 실행된다 (`Message.referenced_asset_ids`에서 제거, hard delete).
13. 재료로 쓰인 Chat을 삭제하면 해당 Chat의 ID가 관련 Document의 `source_chat_ids` 배열에서 제거된다. Document 자체와 콘텐츠는 생존.
14. 메시지 전송 전 **입력창 하단 첨부 영역**에서 Reference Asset을 컨텍스트로 선택할 수 있다. 선택된 Reference는 칩(chip) 형태로 표시되고, 내용이 LLM 호출 시 주입된다.
15. Reference를 컨텍스트로 주입한 응답의 `[n]` 출처 배지를 클릭하면, **실제 Reference Asset의 제목·URL·발췌**가 출처 패널에 표시된다. (기능 3 stub 대체)
16. Message의 `referencedAssetIds`에 실제 Reference Asset ID가 저장된다.
17. 미할당 Chat을 Project에 할당할 수 있다. 할당 후 사이드바 Project 트리에 해당 Chat이 나타난다.
18. Chat 이동 시 "이 Chat만을 유일 재료로 쓰는 Asset도 함께 이동" 옵션이 **기본 off** 상태로 표시된다. 체크 시 `sourceChatIds = [thisChatId]`인 Asset들의 `project_id`가 같은 target으로 업데이트된다. 여러 Chat이 섞인 Asset은 이동하지 않는다 (composition 모델).
19. 빈 상태(Asset 0개), 로딩, 삭제 에러 등 모든 상태에 대한 피드백 UI가 존재한다. Asset 빈 상태는 원본의 파일 업로드 박스를 제거하고 **"URL 입력" / "텍스트 입력" 2버튼**만 중앙 배치한다.
20. **T-004 해소**: SSE 에러 후 재시도 시 user 메시지가 DB에 중복 생성되지 않는다. 재시도 흐름은 기존 user 메시지 ID를 재사용하고 assistant 응답만 새로 생성한다.

### 기술·품질 요구

21. Asset 모델이 단일 polymorphic 테이블 + 개별 nullable 컬럼 + `source_chat_ids[]` composition 필드로 Prisma 스키마에 추가된다 ([ADR-0014](../../architecture/decisions/0014-asset-schema-polymorphic-single-table.md) 스키마 방식, [ADR-0016](../../architecture/decisions/0016-asset-chat-composition-model.md) 관계 방향).
22. Message 모델에는 `generated_asset_id` 필드·FK가 존재하지 않는다 (v0.4에서 제거).
23. 모든 Asset CRUD Server Action이 ADR-0008 패턴(zod + result 객체 + `lib/actions/asset.ts`)을 따른다.
24. Chat 삭제 Server Action은 트랜잭션으로 (a) 관련 Document의 `source_chat_ids` 배열에서 해당 Chat ID 제거 (b) Chat 삭제를 원자적으로 처리한다.
25. 모든 Server Action과 Route Handler에서 session 기반 소유권 검증이 적용된다. 다른 사용자의 Asset 접근 시 404 반환.
26. 미할당 라우트(`/liner`, `/liner/c/[chatId]`, `/write`, `/write/d/[documentId]`)가 존재하며, 기존 `/p/[projectId]/...` 라우트와 레이아웃 구조가 충돌 없이 공존한다 ([ADR-0015](../../architecture/decisions/0015-unassigned-route-structure.md)).
27. Asset 전용 top-level 라우트(`/assets` 등)가 존재하지 않는다. Asset 접근은 뷰(Liner/Write) 내부 경로로만.
28. 출처 패널이 실 Asset 데이터를 표시하며, stub 하드코딩이 코드베이스에서 제거된다.
29. Reference 컨텍스트 주입 시 시스템 프롬프트에 Reference 내용이 올바르게 포함된다.
30. 타입 체크(`pnpm typecheck`)·린트(`pnpm lint`) 통과.
31. T-001 해소: `color-primary`와 `color-error` 토큰이 `design/design-tokens.md`에 등록된다.

## 5. 도메인·기술 결정 요약

| 결정 | 내용 | 상태 |
|---|---|---|
| Asset 스키마 표현 | **단일 polymorphic 테이블** + 개별 nullable 컬럼 하이브리드. 공통 필드 + Reference 전용(`referenceKind`, `referenceUrl?`, `referenceText?`) + Document 전용(`documentContent: Json?`). 근거는 [ADR-0014](../../architecture/decisions/0014-asset-schema-polymorphic-single-table.md) — Message의 polymorphic FK 문제 회피 + 도메인 모델 정합 + 공통 조회 단순성 | **결정됨** (ADR-0014, Q1 해소) |
| 미할당 상태 라우트 구조 | **뷰 segment 유지**. `/liner`, `/liner/c/[chatId]`, `/write`, `/write/d/[documentId]`. Asset 전용 top-level 라우트 없음. 근거는 [ADR-0015](../../architecture/decisions/0015-unassigned-route-structure.md) — ADR-0003 원칙의 공간 확장 | **결정됨** (ADR-0015, Q2·Q7 해소) |
| Document 생성 모델 | **Composition** — Document가 `source_chat_ids[]`로 Chat들을 재료로 안는 구조. 0개(빈) / 1개(Chat 응답 지름길) / N개(다중 선택) 모두 `createDocument({ sourceChatIds? })` 단일 API. "Message가 Document를 생성한다"는 v0.3 모델의 FK 방향을 Document 중심으로 뒤집음. 근거: [ADR-0016](../../architecture/decisions/0016-asset-chat-composition-model.md), 도메인 모델 v0.4 | **결정됨** (D3-B 사용자 피드백 반영) |
| Document 생성 진입점 | **Chat 응답 지름길(단일 재료, 주) + Write 뷰 모달(빈/다중 재료, 2차 진입)**. 원본 Liner Write의 Chat-like 진입 플로우는 모방하지 않음 — 통합 앱의 핵심 가치(서비스 간 맥락 연결)를 "재료 첨부" 언어로 UI에 직접 반영. 근거: [`design/references/4-asset/measurements.md`](../../design/references/4-asset/measurements.md) 열린 관찰 (Designer Step B) | **결정됨** (Designer Step B + 사용자 피드백) |
| Document 목록 UI | **사이드바 "최근 기록" 섹션 재사용** + Write 뷰 메인 패널은 경량(빈 상태 CTA, 최근 편집 Document placeholder). 원본 Liner Write 패턴 준용, Liner 뷰의 "최근 기록"과 UI 언어 통일 | **결정됨** (Designer Step B 발견) |
| Reference URL 메타데이터 수집 | **수동 입력만**. URL 문자열 + 사용자 직접 입력 제목·발췌. 자동 스크랩은 외부 fetch + HTML 파싱 인프라 부담 대비 학습 가치 낮음. 실사용 후 필요하면 2차 후보로 재검토 | **결정됨** (Q3 해소) |
| T-004 (에러 재시도 user 메시지 중복) 처리 | **기능 4 범위에 포함**. 기능 4에서 Chat 라우팅이 재조정되므로 관련 파일을 같은 컨텍스트에서 수정하는 편이 경제적. D4 또는 D5에서 처리 | **결정됨** (Q5 해소) |
| Chat ↔ Project 할당 시 Asset 동반 이동 옵션 | **기본값 off** — 사용자가 의식적으로 체크해야 Asset 동반. 세부 UX 레이아웃(체크박스 위치, 대상 범위)은 Designer 단계에서 확정 | **방향 결정** (Q4 부분 해소, Designer 확정 대기) |
| Reference 선택 UI 위치 | **입력창 하단 첨부 영역** (파일 첨부와 유사한 UX). 선택된 Reference는 입력창 아래 칩(chip) 표시. 세부 인터랙션(검색·해제 등)은 Designer 확정 | **방향 결정** (Q6 부분 해소, Designer 확정 대기) |
| 삭제 정책 | 도메인 모델 컨벤션 계승: hard delete. Chat 삭제 행동 규칙(Asset 생존, `origin_chat_id=null` 업데이트) 동일 적용 | **결정됨** (도메인 모델 컨벤션) |
| Reference를 Chat 컨텍스트 주입 시 프롬프트 구성 | 기능 3의 시스템 프롬프트 기반 `[n]` 마커 전략 계승. Reference 내용을 시스템 프롬프트 최상단에 삽입하고, `[n]` 번호와 Reference ID를 매핑하는 배열을 Message에 저장 | **잠정 결정** (Developer D6에서 구체화) |
| T-001 해소 시점 | 기능 4 Developer 단계 진입 시 원본 라이너 추가 실측 후 확정 | **결정됨** (tech-debt.md T-001 조건) |

## 6. 의존·후속 영향

### 이 기능의 전제 (기능 1·2·3에서 받는 것)

- **앱 셸 레이아웃** — 사이드바 + 메인 패널 + `/p/[projectId]/liner` 라우트 (기능 1)
- **session 기반 user 식별 헬퍼** — 모든 Server Action/Route Handler에서 현재 user를 얻는 패턴 (기능 2)
- **보호 라우트 패턴** — Middleware(전역 인증) + layout(소유권 검증) 조합 (기능 2). 미할당 라우트도 동일 패턴 적용
- **Project 엔티티 + CRUD** — Asset의 `project_id`가 참조할 Project가 이미 존재 (기능 1)
- **Chat/Message Prisma 모델** — `referencedAssetIds`, `generatedAssetId` 필드가 이미 스키마에 있음 (기능 3)
- **SSE 스트리밍 인프라** — Reference 컨텍스트 주입 후 응답 스트리밍이 기능 3의 Route Handler를 그대로 재사용 (기능 3)
- **출처 배지 파싱·렌더링 컴포넌트** — stub 데이터 연결만 실 데이터로 교체하면 됨 (기능 3)
- **ADR-0008 Server Action 패턴** — Asset CRUD에 동일 적용
- **ADR-0009 Revalidation 전략** — Asset mutation 이후 캐시 무효화 동일 패턴
- **ADR-0003 URL Segment 뷰 전환** — 미할당 라우트 도입 시 기존 segment 원칙과 일관성 유지

### 이 기능이 만드는 것 (후속 기능이 재사용)

- **Asset Prisma 모델 + 기본 CRUD** ([ADR-0014](../../architecture/decisions/0014-asset-schema-polymorphic-single-table.md)) — 기능 5(Write 뷰)가 Document Asset을 편집 대상으로 직접 사용
- **Document 생성·목록** — 기능 6(Scholar 뷰)의 좌측 Asset 패널이 이 목록을 재배치
- **미할당 라우트 + projectId-less 레이아웃** ([ADR-0015](../../architecture/decisions/0015-unassigned-route-structure.md)) — 기능 5·6도 미할당 상태를 지원하는 기반
- **Reference 컨텍스트 주입 프롬프트 패턴** — 기능 5의 AI 수정 제안에서도 Document 컨텍스트 주입에 유사 패턴 적용 가능
- **T-001 토큰 확정** — `color-primary`/`color-error`가 등록되면 기능 1 디자인 명세도 교체되고 기능 5·6의 디자인도 이 토큰을 사용
- **T-004 해소** — 에러 재시도 플로우 재설계로 user 메시지 중복 저장 방지. 기능 5(Write AI 수정 제안)의 재시도 흐름도 동일 패턴으로 설계 가능

### 기능 5(Write 뷰) 도입 시 추가로 고려할 것

- Document Asset 편집기(TipTap) 연결 — 이 기능에서 만든 Document ID로 직접 진입
- Document의 TipTap JSON 컬럼이 기능 4에서 스키마에 추가되어 있으므로, 실제 콘텐츠 저장은 기능 5에서 구현

### 기능 6(Scholar 뷰) 도입 시 추가로 고려할 것

- 좌측 Asset 패널 = 기능 4의 Asset 목록 컴포넌트 재배치
- 우측 Chat 패널 = 기능 3의 Chat 컴포넌트 재배치
- Scholar 뷰는 Project 컨텍스트 필수 — 미할당 Asset·Chat도 존재하지만 3패널은 Project 스코프로 설계

## 7. 열린 질문

| # | 질문 | 미룬 이유 | 결정 시점 | 결정 주체 | 상태 |
|---|---|---|---|---|---|
| Q1 | Asset 스키마 표현: 단일 polymorphic 테이블 vs Document/Reference 별도 테이블 분리 | Prisma의 polymorphic FK 한계·도메인 모델 정합·공통 조회 단순성 모두 검토 | 기획 단계 | PM (ADR로 승격) | **해소** — 단일 polymorphic 테이블 + 개별 nullable 컬럼 하이브리드 채택. 근거는 [ADR-0014](../../architecture/decisions/0014-asset-schema-polymorphic-single-table.md). 최종 컬럼명·제약은 Developer D1에서 구체화 |
| Q2 | 미할당 Chat 라우트 구조: `/liner` vs `/l` vs `/chat` | ADR-0003의 URL segment 원칙(뷰 segment = `liner`/`write`/`scholar`)과의 일관성 검토 | 기획 단계 | PM (ADR로 승격) | **해소** — `/liner`, `/liner/c/[chatId]` 채택 (Write도 동일 패턴 `/write`, `/write/d/[documentId]`). 근거는 [ADR-0015](../../architecture/decisions/0015-unassigned-route-structure.md). `/chat`은 뷰명-엔티티명 혼용 문제로 기각 |
| Q3 | Reference URL 저장 시 메타데이터 자동 추출 여부 | 1차에서는 수동 입력으로 시작하는 쪽이 단순. 자동 스크랩은 외부 fetch + HTML 파싱 인프라 필요 | 기획 단계 | PM | **해소** — 수동 입력만 채택. 자동 스크랩은 실사용 후 필요시 2차 후보로 재검토 |
| Q4 | Chat을 Project에 할당할 때 Asset 동반 이동 UX: 기본값(on vs off), 표시 위치, 동반 범위 | 도메인 모델은 "옵션 제공"만 정의 | 기획 → Designer | PM (방향) + Designer (세부) | **부분 해소** — 기본값 off. 체크박스 위치·동반 대상 범위(모든 Asset vs 선택) 등 세부 UX는 Designer 단계 확정 |
| Q5 | T-004(에러 재시도 시 user 메시지 DB 중복) 해소를 기능 4 범위에 포함할지 | 기능 4에서 Chat 라우팅 재조정되므로 함께 처리 시 경제적 | 기획 단계 | PM (스코프 결정) | **해소** — 기능 4 범위 포함. D4 또는 D5에서 처리 |
| Q6 | Reference 선택 UI: 입력창 하단 첨부 영역 vs 사이드 패널 vs 명령 팔레트 | UI 표면이라 Designer가 화면 설계와 함께 결정하는 것이 자연스러움 | 기획 → Designer | PM (방향) + Designer (세부) | **부분 해소** — 입력창 하단 첨부 영역(파일 첨부 UX와 유사). 선택된 Reference는 칩 표시. 세부 인터랙션(검색 방식, 선택 해제 등)은 Designer 확정 |
| Q7 | 미할당 Asset 목록 진입점: `/assets` 전용 라우트 vs 뷰 내부 패널 vs 사이드바 섹션 | Q2 라우트 구조와 연동 | 기획 단계 | PM (ADR로 승격) | **해소** — Asset 전용 top-level 라우트 도입하지 않음. Reference는 Liner 뷰에 귀속, Document는 Write 뷰에 귀속. 근거는 [ADR-0015](../../architecture/decisions/0015-unassigned-route-structure.md) |

## 8. 구현 단계 (D-stages)

이 섹션은 기능 4를 Developer가 어떤 순서로 구현할지에 대한 로드맵이다. 각 단계는 **구현 전 합의 → 구현 → 결정 문서화 → 커밋**의 공통 사이클을 따른다.

| # | 단계 | 목표 | 포함 | 제외 (이후 단계) |
|---|------|------|------|-----------------|
| D1 | Prisma 스키마 확장 | Asset 데이터 바닥 | Asset 모델 추가 ([ADR-0014](../../architecture/decisions/0014-asset-schema-polymorphic-single-table.md) 준수: 단일 polymorphic 테이블 + 개별 nullable 컬럼), 마이그레이션. Message 모델은 기능 3에서 이미 존재하므로 신규 마이그레이션 없이 연결 준비 | UI, CRUD 로직 |
| D2 | Reference Asset CRUD | Reference 저장·목록·삭제 | `lib/actions/asset.ts` (zod + result 패턴), Reference 생성 Server Action (URL/text, **수동 입력만**), 최소 저장 UI, Reference 목록 표시, 삭제 + 도메인 모델 삭제 동작 | Document, 미할당 라우트, 컨텍스트 주입 |
| D3 | Document Asset CRUD (Composition) | Document 생성(3 경로)·목록·삭제 | (i) **통합 Server Action** `createDocument({ title, projectId?, sourceChatIds? })` — `sourceChatIds` 길이 0/1/N으로 시나리오 5-a/b/c 모두 커버. 재료 Chat 콘텐츠를 concat한 TipTap doc을 초기 `documentContent`로 주입. (ii) Chat 응답 하단 **"이 Chat을 재료로 새 Document"** 버튼 (시각 강조) — 단일 재료 지름길. (iii) Write 뷰 "+ 새 Document" 모달에 **재료 Chat 체크박스 선택 섹션** — 다중 재료 진입점. (iv) 사이드바 "최근 기록" 섹션에 Document 목록 노출 (Project 소속 구분). (v) `/p/[projectId]/write` 메인 패널은 경량 placeholder. (vi) Chat 삭제 Server Action에 `Asset.source_chat_ids` 배열 정리 트랜잭션 추가 (`array_remove`). `/write/d/[documentId]`는 편집 placeholder(기능 5) | 편집(기능 5), 미할당 라우트 |
| D4 | 미할당 라우트 도입 + 사이드바 전역 "+ 새 대화" + **T-004 해소** | 미할당 Chat·Document 진입 경로 구축 + 에러 재시도 버그 수정 | `/liner`, `/liner/c/[chatId]`, `/write`, `/write/d/[documentId]` 라우트 + projectId-less 레이아웃 ([ADR-0015](../../architecture/decisions/0015-unassigned-route-structure.md) 준수), 사이드바 전역 "+ 새 대화" 버튼 복귀, 미할당 Chat 생성 Server Action, 미할당 Document 목록 노출, 기능 3의 SSE 스트리밍이 미할당 Chat에서 동작 확인, **T-004**: 재시도 시 user 메시지 ID 재사용으로 중복 저장 방지 | Chat ↔ Project 이동, Asset 동반 이동 |
| D5 | Chat ↔ Project 할당·이동 + 유일-재료 Asset 동반 이동 | 미할당 → Project 이동 동선 | `moveChatToProject` Server Action — Chat.projectId 업데이트 + 옵션에 따라 `sourceChatIds = [thisChatId]`인 Asset만 동반 이동 (composition 모델 ADR-0016). 사이드바 Project 트리 업데이트. UI: Chat 컨텍스트 메뉴 "Project로 이동" + 다이얼로그 (Project 선택 + 동반 체크박스 기본 off) | 출처 stub 교체 |
| D6 | 출처 stub → 실 Reference 연결 | 기능 3 출처 파이프라인 실데이터화 | **입력창 하단 첨부 영역의 Reference 선택 UI**, 선택된 Reference를 시스템 프롬프트에 주입, Message 저장 시 `referencedAssetIds`에 실 Asset ID 기록, 출처 패널에서 실 Reference 데이터 조회·표시, stub 하드코딩 제거 | — |
| D7 | 종합 검증 + features.md 갱신 | 기능 4 완료 | Golden path + 엣지 케이스 수동 검증, 타입체크/린트, PM 명세 열린 질문 해소 반영, T-001 해소(design-tokens.md 토큰 등록), T-004 해소 확인 후 tech-debt.md Resolved 섹션 이동, `features.md` 상태 갱신 | — |

### 순서 근거

D1(데이터 바닥) → D2(Reference CRUD: 먼저 구현하는 이유는 D6의 출처 stub 교체가 Reference 데이터 없이 불가능하고, 기능 3 출처 파이프라인 완성을 위한 선행 조건이기 때문) → D3(Document CRUD: Reference 바로 뒤에 붙여서 Asset 패턴을 연속으로 다룸) → D4(미할당 라우트 + T-004: D2·D3에서 Asset CRUD가 안정된 뒤 라우트 구조 변경과 Chat 라우팅 관련 버그 수정을 한 컨텍스트에서. 라우트 변경이 앞에 오면 D2·D3 경로 참조가 뒤틀릴 위험. T-004는 `/api/chat/.../messages/route.ts`와 `use-chat-stream.ts`를 만지므로 미할당 라우트 도입과 동일 파일군을 건드려 묶음이 자연스러움) → D5(Chat 이동: 라우트가 확정된 뒤 "어디로 이동하는가"의 UX를 설계. 미할당 라우트가 없으면 미할당 → Project 이동 동선을 테스트할 수 없음) → D6(출처 연결: D2의 Reference와 D4의 라우트가 모두 준비된 뒤 출처 파이프라인 실데이터화. 기능의 핵심 가치를 마무리) → D7(전체 검증).

D4(미할당 라우트)를 더 앞에 당기는 것도 고려했지만, 라우트 변경은 파일 구조·레이아웃에 영향 범위가 크므로 CRUD가 먼저 안정화된 뒤 시도하는 편이 충돌 최소화에 유리하다.

### 변경 규율

이 섹션의 **모든 변경은 반드시 Changelog 엔트리와 근거를 수반**한다. 기능 3에서 확립한 원칙을 동일하게 적용한다.

## Changelog

- 0.5 (2026-04-22): D5 구현 중 Composition 모델에 맞는 **Asset 동반 이동 범위 재정의**. v0.3의 "이 Chat이 만든 Asset" 언어는 v0.3의 `origin_chat_id` FK 전제였으나 v0.4 composition 전환으로 개념이 모호해짐. 재정의: **`sourceChatIds = [thisChatId]`인 Asset만 동반 이동** — 이 Chat만을 유일 재료로 쓰는 경우만. 여러 Chat이 섞인 Asset은 소속 Project가 불명확하므로 건드리지 않음. §2-6 시나리오 6 문구 정정, §3 스코프, §4 수용 기준 #18, §8 D5 설명 모두 업데이트.
- 0.4 (2026-04-21): **Composition 모델 전환**. D3-B UI 사용자 피드백에서 "포워딩은 사실 Document에 Chat을 재료로 첨부하는 것"이라는 지적 반영. Message→Asset 단일 FK(`generated_asset_id`)가 다중 재료 표현 불가, 주체 방향 역전, 카디널리티 미스매치 등 3개 문제를 동시에 내포. 해소:
  - (1) 도메인 모델 v0.4: `Asset.origin_chat_id?` → `Asset.source_chat_ids[]`(배열), `Message.generated_asset_id?` 제거. composition 행동 규칙 신설.
  - (2) [ADR-0016](../../architecture/decisions/0016-asset-chat-composition-model.md) 신규 — 전환 근거·대안 비교(A 유지 / B join 테이블 / C 단일+추가 배열 분리) 기록.
  - (3) §2 시나리오 5-a/5-b 재작성 + **5-c(다중 재료) 1급 승격** — "이 응답을 이미 내보냄" UI 분기 폐지.
  - (4) §3 Document CRUD 단일 API(`createDocument({ sourceChatIds? })`)로 통합 + Chat 삭제 시 composition 정리 항목 추가.
  - (5) §4 수용 기준 재번호 — 기능 요구 20개(T-004 포함), 기술·품질 요구 21~31 (신규 #22 Message.generated_asset_id 부재, #24 Chat 삭제 트랜잭션).
  - (6) §5 결정 요약에 "Document 생성 모델 (Composition)" 행 추가, 기존 "Document 생성 진입점" 행 재문구.
  - (7) §8 D3 재정의 — 통합 API 기반 3 경로(0/1/N 재료). 시나리오 5-c(다중 선택)가 D3 범위 내 포함.
  - D3-A/D3-B 기존 커밋(4737d20, 359c860)의 구현 일부 폐기 — 실제 revert는 구현 커밋에서 처리.
- 0.3 (2026-04-21): Designer Step B(레퍼런스 수집·실측)에서 발견된 아키텍처 영향 사항 반영.
  - (1) **Document 생성 경로 이원화** — 원본 Liner Write는 Chat-like 진입(빠른 시작 버튼 → 문서 초안 요청) 플로우지만, 통합 앱의 핵심 가치인 "세 서비스 간 맥락 연결"을 UI로 실현하려면 Liner 대화 결과를 그대로 Document로 넘기는 **"포워딩"이 주 플로우**여야 함. 빈 Document 직접 생성은 보조 플로우로 유지.
  - (2) §2 시나리오 5를 5-a(빈 Document)와 5-b(Chat 포워딩)로 분리. 5-b가 주 플로우.
  - (3) §3 Document Asset CRUD를 포워딩·빈 생성 이원화로 재작성. 목록 UI는 **사이드바 "최근 기록" 섹션 재사용** 방향(원본 Liner Write 패턴 준용).
  - (4) §4 수용 기준에 포워딩 관련 요구 2건 추가(#8, #20). Asset 빈 상태에 파일 업로드 박스 제거 + "URL/텍스트" 2버튼 명시(#16).
  - (5) §5 결정 요약 표에 "Document 생성 진입점", "Document 목록 UI" 2행 추가.
  - (6) §8 D3 stage에 포워딩 구현 포함. Chat 메시지 응답 하단 액션바에 "Document로 내보내기" 버튼 추가, 트랜잭션 기반 Server Action.
  - 도메인 모델 변경 없음 — 포워딩은 `Asset.origin_chat_id` + `Message.generated_asset_id`로 이미 지원되는 참조 메타데이터 조합.
- 0.2 (2026-04-21): PM 초안 리뷰 후 주요 의사결정 7건 반영. (1) Q1 해소 — Asset 스키마를 단일 polymorphic 테이블 + 개별 nullable 컬럼 하이브리드로 확정, [ADR-0014](../../architecture/decisions/0014-asset-schema-polymorphic-single-table.md)로 승격. (2) Q2·Q7 해소 — 미할당 라우트를 뷰 segment 원칙으로 확장(`/liner`, `/liner/c/[chatId]`, `/write`, `/write/d/[documentId]`), Asset 전용 top-level 라우트 미도입, [ADR-0015](../../architecture/decisions/0015-unassigned-route-structure.md)로 승격. `/chat` 대안은 뷰명-엔티티명 혼용 문제로 기각. (3) Q3 해소 — Reference URL 저장 시 수동 입력만 지원, 자동 스크랩 제외. (4) Q5 해소 — T-004(에러 재시도 user 메시지 중복) 기능 4 범위 포함, D4에서 처리. (5) Q4·Q6 방향 결정 — Asset 동반 이동 옵션 기본값 off / Reference 선택 UI는 입력창 하단 첨부 영역. 세부 UX는 Designer 단계. (6) §3 스코프·§4 수용 기준·§5 결정 요약·§7 열린 질문·§8 D-stage 표에 결정 반영. (7) D4에 T-004 해소 작업 병합, D7에 tech-debt.md Resolved 이동 작업 추가.
- 0.1 (2026-04-21): 초안 작성. Asset 관리(Reference/Document CRUD) + 미할당 Chat(top-level 라우트 도입) + Chat ↔ Project 이동 + 출처 stub 실데이터 교체의 기능 4 전체 범위 정의. 도메인 모델 3축 완성의 의의 정의. D-stages D1~D7 로드맵 및 순서 근거 작성. 열린 질문 7개(Q1~Q7) 정의. T-001 해소 착수 명시, T-004 해소 여부는 Q5로 처리, T-005는 기능 4 범위 외로 판단.
