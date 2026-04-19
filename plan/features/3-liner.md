---
feature: Liner 뷰 — Chat 기반 AI 대화 (SSE 스트리밍) + 출처·인용 배지
version: 0.1
last_updated: 2026-04-17
---

# 기능 3: Liner 뷰 — Chat 기반 AI 대화 (SSE 스트리밍) + 출처·인용 배지

이 문서는 MVP 1차 기능 중 세 번째인 "Liner 뷰: Chat + SSE + 출처 배지"의 기획 명세다. 기능 1이 만든 앱 셸 위에, 기능 2가 확보한 사용자 식별 계층을 전제로, **이 프로젝트 최대 학습 목표인 SSE 저수준 스트리밍을 실현**하는 것이 이 기능의 존재 이유다.

## 1. 문제 정의

### (a) Liner 뷰의 핵심 가치가 비어 있다

기능 1에서 `/p/[projectId]/liner` 경로를 만들었지만 본문은 placeholder("Liner 뷰 — 추후 구현")다. 도메인 모델의 뷰 매핑에 따르면 Liner 뷰는 "현재 Chat에 대해 AI 대화, 선택된 Reference Asset들을 컨텍스트로 주입, 응답 내 출처 배지를 표시"하는 뷰인데, 그 핵심 동작이 전혀 존재하지 않는다. **기본 뷰(Liner)가 빈 껍데기인 상태에서는 앱 자체가 가치를 전달하지 못한다.**

### (b) 이 프로젝트 최대 불확실성을 해소해야 한다

features.md의 순서 근거에서 밝혔듯이, 이 프로젝트에서 기술적 불확실성이 가장 높은 영역은:

- **SSE 저수준 직접 구현**: Anthropic 공식 SDK의 스트리밍 응답을 Next.js Route Handler에서 Web Streams API로 변환하여 클라이언트에 내보내는 것
- **클라이언트 SSE 소비**: EventSource(또는 fetch + ReadableStream)로 스트리밍 청크를 받아 실시간 UI에 반영하는 것
- **Next.js 16 Route Handler 스트리밍**: 현재 Next.js 버전에서 스트리밍 Response가 기대대로 동작하는지 검증

이 세 가지가 기능 3에서 흔들리면 기능 4(Asset)·5(Write AI 수정)·6(Scholar)이 모두 재설계되어야 한다. **리스크를 앞당기는 것이 핵심 의도다.**

### (c) 학습 핵심: SSE 저수준 직접 구현

이 프로젝트의 핵심 가치 2번(실시간 UX)은 "SSE/WebSocket 등 실시간 통신 기술을 **저수준에서 직접 구현**하는 것이 학습 목표"라고 명시하고 있다. AI SDK(`@ai-sdk/*`)나 Vercel AI SDK 같은 고수준 추상화를 사용하면 학습 가치가 사라진다. **Anthropic 공식 SDK + Web Streams API + EventSource로 직접 구현한다.**

## 2. 사용자 시나리오

대상 페르소나는 스타트업 PM. 다음 시나리오가 자연스럽게 흘러가야 한다.

### 시나리오 1: 첫 대화 시작

1. 사용자가 Project의 Liner 뷰(`/p/[projectId]/liner`)에 진입
2. Chat이 없으므로 빈 상태 화면("AI에게 질문해보세요" 또는 유사 CTA)을 본다
3. 입력창에 메시지를 작성하고 전송
4. **새 Chat이 자동 생성**되고, 사용자 메시지가 표시된다
5. AI 응답이 **실시간으로 한 글자씩 스트리밍**되며 화면에 나타난다
6. 응답 완료 후, 본문 내에 `[1]`, `[2]` 같은 출처 배지가 표시된다

### 시나리오 2: 기존 대화 계속

1. 사이드바(또는 Liner 뷰 내 Chat 목록)에서 기존 Chat을 선택
2. 이전 메시지 목록이 표시된다
3. 새 메시지를 입력하고 전송
4. 이전 대화 맥락을 유지한 AI 응답이 스트리밍된다

### 시나리오 3: 스트리밍 중 행동

1. AI가 응답을 스트리밍하는 도중 사용자가:
   - **스크롤 업**: 이전 메시지를 볼 수 있고, 스트리밍은 계속된다
   - **중단 버튼 클릭**: 스트리밍이 즉시 중단되고, 지금까지 받은 응답이 그대로 저장된다
   - **브라우저 닫기/이탈**: 서버 측 스트리밍이 정리되고, 다음 접속 시 마지막 저장 시점까지의 메시지를 본다

### 시나리오 4: 출처 배지 확인

1. AI 응답 본문에 `[1]` 배지가 보인다
2. 배지를 클릭하면 해당 출처의 제목·URL(또는 텍스트 발췌)이 표시된다
3. 이 단계에서는 stub Reference 데이터이므로, 실제 웹 페이지 링크가 아닌 **더미 출처 정보**가 표시된다

### 시나리오 5: 새 Chat 생성

1. 현재 Chat에서 대화하다가 "새 대화" 버튼을 클릭
2. 새 Chat이 생성되고 빈 대화 화면으로 전환
3. 이전 Chat은 Chat 목록에 남아 있어 돌아갈 수 있다

### 시나리오 6: Chat 삭제

1. Chat 목록에서 특정 Chat의 삭제를 실행
2. 확인 후 Chat과 소속 Message가 삭제된다
3. 도메인 모델 행동 규칙에 따라, 이 Chat을 `origin_chat_id`로 참조하던 Asset은 `origin_chat_id=null`로 업데이트된다 (Asset 생존)

### 시나리오 7: 에러 상황

1. 네트워크 오류로 SSE 연결이 끊기면, 에러 메시지가 표시되고 "다시 시도" 버튼이 나타난다
2. Anthropic API 키가 유효하지 않거나 rate limit에 걸리면, 구체적인 에러 안내가 표시된다
3. 빈 메시지 전송을 시도하면 전송이 차단된다

## 3. 1차 스코프

### 스코프 결정: Project 하위 Chat만

이 단계에서는 **Project에 속한 Chat만 다룬다**. 도메인 모델은 `project_id=null`인 Chat(미할당)을 허용하지만, 기능 3에서는 Liner 뷰가 `/p/[projectId]/liner` 경로에 존재하므로 항상 Project 컨텍스트가 있다. Project 미할당 Chat(예: 사이드바에서 Project 없이 바로 "새 대화")은 기능 4 이후 또는 2차 후보에서 다룬다.

### 포함

- **Prisma 스키마 확장**
  - Chat 모델 추가 (`id`, `userId`, `projectId`, `title`, `createdAt`, `updatedAt`)
  - Message 모델 추가 (`id`, `chatId`, `role`, `content`, `referencedAssetIds`, `generatedAssetId`, `citations`, `createdAt`, `updatedAt`)
  - 도메인 모델 v0.3의 엔티티 정의를 따름

- **Chat CRUD**
  - 생성: 첫 메시지 전송 시 자동 생성 (명시적 "Chat 생성" 단계 없음) + "새 대화" 버튼으로도 생성 가능
  - 목록: 현재 Project의 Chat 목록 표시 (Liner 뷰 내 또는 사이드바 — 디자인 단계에서 결정)
  - 삭제: Chat 삭제 시 소속 Message cascade 삭제, 연관 Asset의 `origin_chat_id` null 처리
  - **Chat 이름 변경**: 자동 제목 생성(첫 메시지 기반) + 수동 편집 가능
  - **Chat 이름 자동 생성**: 첫 사용자 메시지의 앞 N자를 제목으로 설정하는 단순 전략. LLM 기반 제목 생성은 2차 후보.

- **메시지 전송 + SSE 스트리밍 응답**
  - 사용자 메시지를 DB에 저장 후 Route Handler에 전송
  - Route Handler에서 Anthropic SDK로 LLM 호출, 스트리밍 응답을 Web Streams API로 변환하여 SSE 이벤트로 클라이언트에 전송
  - 클라이언트에서 EventSource(또는 fetch + ReadableStream)로 수신, 실시간 UI 반영
  - **AI SDK / Vercel AI SDK 사용 금지** — Anthropic 공식 SDK + Web Streams API + EventSource 저수준 직접 구현
  - SSE 이벤트 포맷: 시작(stream_start) / 텍스트 청크(text_delta) / 종료(stream_end) / 에러(stream_error) 신호를 명시적으로 구분
  - 어시스턴트 응답 완료 후 DB에 최종 content 저장

- **대화 맥락 유지**
  - 현재 Chat의 이전 Message들을 Anthropic API의 `messages` 배열로 전달
  - 컨텍스트 윈도우 관리 전략은 Developer 단계에서 결정 (열린 질문)

- **출처 배지 (`[n]`)**
  - Anthropic 응답에 citations 기능을 활용하거나, 시스템 프롬프트에서 `[n]` 형식 출처 표기를 지시
  - 응답 본문 내 `[n]` 마커를 파싱하여 클릭 가능한 배지로 렌더링
  - 배지 클릭 시 출처 정보(제목, URL 또는 텍스트 발췌) 표시
  - **이 단계에서는 stub Reference 데이터 기반**: 실제 Reference Asset CRUD는 기능 4의 범위. 기능 3에서는 하드코딩된 더미 Reference 또는 시스템 프롬프트에 주입한 샘플 텍스트를 출처로 사용하여 배지 파이프라인을 검증

- **스트리밍 중단 (Stop)**
  - 스트리밍 중 "중단" 버튼 표시
  - 클릭 시 SSE 연결 종료 + 서버 측 Anthropic 스트림 abort
  - 지금까지 받은 응답은 DB에 저장

- **에러 처리**
  - 네트워크 오류: 에러 메시지 + "다시 시도" 버튼
  - Anthropic API 에러 (인증 실패, rate limit, 서버 오류): 구체적 에러 유형별 안내
  - 빈 메시지 전송 차단 (클라이언트 검증)
  - SSE 연결 중 세션 만료: 기능 2의 보호 라우트 패턴과 연계

- **UI 기본 구조**
  - 메시지 목록 (스크롤 가능, 최신 메시지 하단)
  - 메시지 입력창 (하단 고정)
  - 사용자/어시스턴트 메시지 시각 구분
  - 스트리밍 중 타이핑 인디케이터 또는 커서 애니메이션
  - Chat 목록 (현재 Project 내)
  - 빈 상태 (Chat 0개일 때)
  - 다크 모드 테마 일관성 유지

### 제외 (비-스코프)

| 제외 항목 | 제외 이유 |
|---|---|
| 실제 Reference Asset CRUD 및 컨텍스트 주입 | 기능 4(Asset 관리)의 범위. 이 단계에서는 stub으로 배지 파이프라인만 검증 |
| Project 미할당 Chat (`project_id=null`) | Liner 뷰는 `/p/[projectId]/liner`에 존재하므로 항상 Project 컨텍스트가 있음. 미할당 Chat은 2차 후보 |
| 메시지 편집 / 재생성 (regenerate) | 도메인 모델에 `updated_at` 변경 시점으로 재생성을 언급하지만, 1차 스코프에서는 제외. 충분한 가치 대비 복잡도가 높음 |
| LLM 기반 Chat 제목 자동 생성 | 첫 메시지 앞 N자 잘라내기로 충분. LLM 호출 추가 비용 불필요 |
| 메시지 내 마크다운 렌더링 (코드 블록, 테이블 등) | 최소 텍스트 렌더링으로 시작. 마크다운 파서 도입은 별도 결정 |
| 멀티턴 스트리밍 중 새 메시지 전송 | 현재 스트리밍 완료 전 추가 메시지 전송 차단 |
| 파일 첨부 / 이미지 업로드 | 기능 4 이후 확장 |
| 음성 입력 | MVP 범위 밖 |
| Chat을 다른 Project로 이동 | 2차 후보 |

## 4. 성공 기준 (Acceptance Criteria)

### 기능 요구

1. Project의 Liner 뷰 진입 시, Chat이 없으면 빈 상태 화면이 표시된다.
2. 빈 상태에서 메시지를 입력하고 전송하면 새 Chat이 자동 생성되고, 사용자 메시지가 표시된다.
3. AI 응답이 **글자 단위로 실시간 스트리밍**되어 화면에 나타난다. 전체 응답이 완성될 때까지 기다리지 않는다.
4. 스트리밍 중 "중단" 버튼이 표시되고, 클릭 시 스트리밍이 즉시 중단된다. 지금까지 받은 내용은 보존된다.
5. 응답 완료 후 본문 내 `[n]` 출처 배지가 클릭 가능하며, 클릭 시 출처 정보(stub)가 표시된다.
6. 현재 Project의 Chat 목록이 표시되고, 다른 Chat을 선택하면 해당 대화가 로드된다.
7. "새 대화" 버튼으로 새 Chat을 시작할 수 있다.
8. Chat 삭제가 동작한다. 삭제 후 Chat 목록에서 사라지고, 연관 Asset의 `origin_chat_id`는 null 처리된다.
9. 이전 대화 맥락이 유지된다 — 두 번째 메시지의 응답이 첫 번째 메시지를 참조할 수 있다.
10. 에러 상황(네트워크 오류, API 에러)에서 구체적인 에러 메시지와 "다시 시도" 동선이 제공된다.

### 기술·품질 요구

11. SSE 스트리밍이 고수준 추상화(AI SDK, Vercel AI SDK) 없이 Anthropic 공식 SDK + Web Streams API + EventSource로 구현되어 있다.
12. SSE 이벤트 포맷이 시작/텍스트 청크/종료/에러를 명시적으로 구분한다.
13. 어시스턴트 응답이 DB에 영속된다 (브라우저 새로고침 후에도 이전 대화가 보인다).
14. 모든 Server Action / Route Handler에서 session 기반 소유권 검증이 적용된다 (기능 2 패턴 계승).
15. 다른 사용자의 Chat/Message에 접근 시도 시 404가 반환된다.
16. 타입 체크(`pnpm typecheck`)·린트(`pnpm lint`) 통과.
17. Anthropic API 키는 서버 전용 환경변수로 관리되며 클라이언트 번들에 노출되지 않는다.

## 5. 도메인·기술 결정 요약

| 결정 | 내용 | 근거 |
|---|---|---|
| LLM 프로바이더 | Anthropic (Claude) | 프로젝트 기술 스택에서 확정. 공식 SDK(`@anthropic-ai/sdk`) 사용 |
| SSE 구현 방식 | 저수준 직접 구현 (Web Streams API + EventSource) | 프로젝트 핵심 가치 2번(실시간 UX). 고수준 추상화 사용 시 학습 가치 소멸 |
| Reference 데이터 | stub (하드코딩 더미) | 기능 4에서 실데이터 연결. 배지 파이프라인 검증에 집중 |
| Chat 스코프 | Project 하위만 (`project_id` 필수) | Liner 뷰가 `/p/[projectId]/liner`에 존재. 미할당 Chat은 2차 후보 |
| Chat 자동 생성 | 첫 메시지 전송 시 | 명시적 "Chat 만들기" 단계는 사용자 마찰. 원본 라이너도 즉시 대화 시작 패턴 |
| Chat 제목 | 첫 메시지 앞 N자 | LLM 기반 제목 생성은 과도한 복잡도 |
| 메시지 영속 | 어시스턴트 응답 완료 후 DB 저장 | 스트리밍 중 incremental persist는 복잡도가 높아 1차에서는 완료 후 저장. 열린 질문 참조 |
| 삭제 정책 | hard delete (도메인 모델 공통 컨벤션) | Chat 삭제 → Message cascade. Asset은 생존(`origin_chat_id=null`) |

## 6. 의존·후속 영향

### 이 기능의 전제 (기능 1·2에서 받는 것)

- **앱 셸 레이아웃**: 사이드바 + 메인 패널 + `/p/[projectId]/liner` 라우트 (기능 1)
- **session 기반 user 식별 헬퍼**: 모든 Server Action / Route Handler에서 현재 user를 얻는 패턴 (기능 2)
- **보호 라우트 패턴**: Middleware(전역 인증) + layout(소유권 검증) 조합 (기능 2)
- **Project 엔티티 + CRUD**: Chat이 속할 Project가 이미 존재 (기능 1)
- **User/Project Prisma 스키마**: Chat/Message 모델이 참조할 기반 (기능 1·2)

### 이 기능이 만드는 것 (후속 기능이 재사용)

- **SSE 스트리밍 인프라** (서버: Route Handler + Web Streams, 클라: EventSource 소비 패턴) — 기능 5(Write AI 수정 제안)가 동일 인프라를 재사용
- **Chat/Message Prisma 모델** — 기능 6(Scholar 뷰)의 우측 Chat 패널이 그대로 재배치
- **출처 배지 파싱·렌더링 컴포넌트** — 기능 4에서 실 Reference 데이터와 연결, 기능 5·6에서 재사용
- **Anthropic SDK 통합 패턴** — 기능 5(AI 수정 제안)에서 프롬프트만 바꿔 재사용
- **메시지 목록 + 입력 UI 컴포넌트** — 기능 6(Scholar 뷰)의 Chat 패널로 재배치

### 기능 4(Asset 관리) 도입 시 추가로 고려할 것

- stub Reference를 실제 Asset 엔티티로 교체
- Message의 `referencedAssetIds`가 실제 Asset ID를 참조하도록 연결
- 출처 배지 클릭 시 실제 Reference Asset 상세 표시

### 기능 5(Write 뷰) 도입 시 추가로 고려할 것

- SSE 스트리밍 인프라를 AI 수정 제안 스트리밍에 재사용
- 다른 프롬프트 템플릿이지만 같은 Anthropic SDK 호출 패턴

## 7. 열린 질문

| # | 질문 | 미룬 이유 | 결정 시점 | 결정 주체 |
|---|---|---|---|---|
| Q1 | 어시스턴트 응답의 영속 전략: 완료 후 일괄 저장 vs 스트리밍 중 incremental persist | 1차는 완료 후 저장으로 시작하되, 긴 응답에서 브라우저 이탈 시 데이터 손실 리스크 존재. 실사용 후 판단 | 구현 D-stage에서 | Developer |
| Q2 | 대화 맥락(이전 메시지) 전달 시 컨텍스트 윈도우 관리 전략 (전체 전달 / 최근 N개 / 토큰 수 기반 잘라내기) | 초기에는 전체 전달로 시작 가능하지만, 긴 대화에서 토큰 한도 초과 리스크. 실측 후 결정 | 구현 D-stage에서 | Developer |
| Q3 | Chat 목록 UI 위치: Liner 뷰 메인 패널 내 좌측 vs 사이드바 확장 | 사이드바에는 이미 Project 목록이 있어 공간 경합. 디자인 의사결정 영역 | 디자인 단계 | Designer |
| Q4 | 출처 배지 클릭 시 UI: 인라인 팝오버 vs 하단 패널 vs 사이드 패널 | 디자인 의사결정 영역. 기능 4에서 실 Reference 연결 시 UI가 달라질 수 있음 | 디자인 단계 | Designer |
| Q5 | 메시지 내 마크다운 렌더링 범위 (plain text만 vs 기본 마크다운 vs 코드 블록 포함) | 렌더링 라이브러리 선택이 번들 사이즈에 영향. 최소 시작 후 필요 시 확장 | 구현 D-stage에서 | Developer |
| Q6 | SSE 클라이언트 구현 방식: EventSource API vs fetch + ReadableStream | EventSource는 GET만 지원하는 제약이 있고, POST body로 메시지를 보내려면 fetch 기반이 필요할 수 있음 | 구현 D-stage에서 | Developer |
| Q7 | Anthropic의 citations 기능 활용 vs 시스템 프롬프트 기반 `[n]` 마커 생성 | API 기능 가용성과 제어 수준에 따라 달라짐. 실제 SDK 통합 시 판단 | 구현 D-stage에서 | Developer |
| Q8 | 스트리밍 중 어시스턴트 메시지의 `updated_at` 갱신 빈도와 방식 | 도메인 모델이 "청크 단위로 incremental persist"를 언급하지만, Q1과 연동. 1차 완료 후 저장이면 이 질문은 해소 | Q1 결정 시 | Developer |

## 8. 구현 단계 (D-stages)

이 섹션은 기능 3을 Developer가 어떤 순서로 구현할지에 대한 로드맵이다. 각 단계는 **구현 전 합의 → 구현 → 결정 문서화 → 커밋**의 공통 사이클을 따른다.

| # | 단계 | 목표 | 포함 | 제외 (이후 단계) |
|---|------|------|------|-----------------|
| D1 | Prisma 스키마 + 기본 Chat CRUD | 데이터 바닥 | Chat/Message 모델 추가 (도메인 모델 v0.3 기반), 마이그레이션, Chat 생성/목록/삭제 Server Action | UI, SSE |
| D2 | SSE 스트리밍 인프라 | **핵심 학습 목표** | Anthropic SDK 설치, Route Handler (Web Streams → SSE), 클라이언트 SSE 소비 훅, 최소 테스트 페이지로 검증 | 완성된 Chat UI, 출처 |
| D3 | Chat 대화 UI | 메시지 표시 + 입력 + 스트리밍 통합 | 메시지 목록, 사용자 버블/어시스턴트 메시지, 입력카드 (전송/중단), 빈 상태, 자동 스크롤, 에러 표시 | 사이드바 Chat 목록, 출처 |
| D4 | 사이드바 Chat 목록 + Chat 관리 | Chat 전환/생성/삭제 동선 | "최근 기록" 섹션 (Liner 뷰 활성 시에만), Chat 항목 (선택/hover/컨텍스트 메뉴), "새 대화" 버튼, Chat rename, 삭제 confirm | 출처 |
| D5 | 출처 배지 + 출처 패널 | 출처 파이프라인 검증 | 인라인 `[n]` 배지 파싱/렌더, "N개의 출처" 버튼, 우측 출처 패널 (399px, stub 데이터), 시스템 프롬프트 출처 지시 | — |
| D6 | 종합 검증 + 정리 | 기능 3 완료 | Golden path + 엣지 케이스 수동 검증, 타입체크/린트, PM 명세 열린 질문 해소 반영, `features.md` 상태 갱신 | — |

### 순서 근거

D1(데이터) → D2(SSE 인프라: **리스크 front-loading**, DB가 있어야 메시지 저장 가능) → D3(Chat UI: D2의 SSE와 D1의 데이터가 합류) → D4(사이드바: D3에서 단일 Chat이 동작해야 Chat 간 전환 의미 있음) → D5(출처: 대화가 완성된 위에 올리는 부가 기능) → D6(전체 검증).

D2를 가장 앞에 두고 싶지만, Chat/Message 모델이 없으면 스트리밍 결과를 저장할 곳이 없어 D1이 선행한다.

### 변경 규율

이 섹션의 **모든 변경은 반드시 Changelog 엔트리와 근거를 수반**한다. 기능 1·2에서 확립한 원칙을 동일하게 적용한다.

## Changelog

- 0.2 (2026-04-17): "8. 구현 단계 (D-stages)" 섹션 신설 — D1~D6 로드맵과 순서 근거 정의. 디자인 단계에서 Q3(Chat 목록 사이드바 배치), Q4(출처 우측 패널) 해소 반영.
- 0.1 (2026-04-17): 초안 작성. SSE 저수준 직접 구현을 학습 핵심으로 한 Chat 기반 AI 대화 기능 범위 정의. Project 하위 Chat만 스코프에 포함, Reference는 stub으로 처리, 출처 배지 파이프라인 검증까지. 열린 질문 8개 정의.
