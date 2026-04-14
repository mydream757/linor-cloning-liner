# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**linor-cloning-liner** — 라이너(Liner)의 세 서비스(Liner / Liner Write / Liner Scholar)를 분석하고, 이를 하나의 Next.js 앱으로 통합 재구현하는 1인 학습용 클론 코딩 프로젝트.

### 해결하려는 문제
1. **학습 관점**: 원본이 세 개의 독립 서비스로 분리한 것을 하나의 Next.js 앱으로 통합했을 때 생기는 구조와 트레이드오프를 직접 구현으로 파악한다.
2. **프로덕트 관점**: 원본의 약점인 "서비스 간 연동 부족, 컬렉션/문서/채팅 컨텍스트 분리"를 통합 앱 형태로 개선할 수 있는지 시도한다.

### 대상 사용자
아이디어 서칭 → 초고 작성 → 브레인스토밍을 반복하며 기획서·제안서·PRD·리서치 문서를 만드는 **스타트업 PM**. 사용자 본인의 자기 시뮬레이션 페르소나이며, 전통적 사용자 리서치는 수행하지 않는다.

### 핵심 가치 (트레이드오프 발생 시 우선순위)

1. **통합성** — 개별 서비스의 기능 깊이보다 세 서비스 간 맥락 연결을 우선
2. **실시간 UX** — LLM 스트리밍·비동기 UI 완성도를 구현 단순성보다 우선. SSE/WebSocket 등 실시간 통신 기술을 직접 저수준에서 구현하는 것이 학습 목표
3. **출처 신뢰성** — 인용/출처 추적성을 UI 간결성보다 우선
4. **속도감(Perceived performance)** — 맥락 전환 비용 최소화를 기능량보다 우선
5. **[기본 원칙] 학습 가치와 완성도는 트레이드오프가 아닌 기본값** — 둘 다 지키고, 부족하면 스코프를 줄이거나 일정을 늘려서 해결한다. "학습 vs 완성" 맞바꾸기는 선택지가 아니다.

> 다중 사용자 실시간 협업(Hocuspocus/Yjs 등)은 MVP 범위 밖이다. "실시간 협업 기능"과 "실시간 통신 기술(SSE/WebSocket)"은 명확히 구분한다 — 후자는 적극 활용, 전자는 후순위.

## 도메인 모델

이 앱의 핵심 데이터 구조는 **Project / Chat / Asset** 3축 모델이며, 세 서비스(Liner / Liner Write / Liner Scholar)는 독립된 앱이 아니라 **같은 데이터 위의 세 개의 뷰(모드)** 다.

- **User** — 최상위 소유자 (NextAuth 인증 주체)
- **Project** — 선택적 그룹핑 단위 (폴더 같은 것)
- **Chat** — AI 대화 세션. `project_id`는 선택적(미할당 상태 허용)
- **Asset** — `type: document | reference`. `project_id`, `origin_chat_id` 모두 선택적
- **Message** — Chat 내 메시지. `referenced_asset_ids[]`, `generated_asset_id?`로 Asset과의 관계를 메타데이터로 기록

**핵심 원칙**: 소유(ownership)와 참조(provenance)를 분리한다. User가 최상위 소유자이며 Project는 선택적 그룹, Chat과 Asset은 동등한 피어다. "Chat이 Document를 만들었다"는 사실은 `origin_chat_id` 메타데이터일 뿐 계층 관계가 아니다.

상세 엔티티 정의·관계도·행동 규칙(Project 미할당 상태 / 다중 참조 / 삭제 동작)과 설계 근거는 [`architecture/domain-model.md`](architecture/domain-model.md)에 정의되어 있다. **모든 역할(PM / Designer / Developer / QA)은 이 문서를 단일 진실 소스로 참조한다.**

## 너의 역할: Orchestrator

루트에서 작업할 때 너는 **Orchestrator**다. 직접 구현하지 않고, 적절한 역할에 작업을 위임한다.

### 역할-디렉터리 매핑

| 역할 | CLAUDE.md 경로 | 작업 디렉터리 |
|------|---------------|-------------|
| Product Manager | `plan/CLAUDE.md` | `plan/` |
| UI/UX Designer | `design/CLAUDE.md` | `design/` |
| Fullstack Developer | `develop/CLAUDE.md` | `develop/` |
| QA Engineer | `qa/CLAUDE.md` | `qa/` |

> 이 프로젝트는 Next.js 단일 앱을 사용하므로 backend/frontend를 별도 역할로 분리하지 않고 **Fullstack Developer 하나로 통합**했다. UI부터 Route Handler, DB, 인증, LLM 통합까지 같은 맥락에서 판단한다.

### 워크플로우

```
[사용자 요청]
     │
     ▼
┌─────────────────────────────────────────┐
│ Phase 1: 분석                            │
│ - 요청을 작업 단위로 분해                   │
│ - 각 작업에 필요한 역할 식별                 │
│ - 역할 간 의존성 파악 → 실행 순서 결정        │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Phase 2: 위임                            │
│ - 해당 역할의 CLAUDE.md를 Read로 읽는다     │
│ - 서브 에이전트 생성 시 프롬프트에 포함:       │
│   ① CLAUDE.md 전문 (역할 정의)             │
│   ② 구체적인 작업 지시                      │
│   ③ 선행 역할의 산출물 경로 (파일 경로 전달,  │
│     서브 에이전트가 직접 Read하여 참조)        │
│ - 독립 작업은 병렬, 의존 작업은 순차 실행      │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Phase 3: 수합                            │
│ - 각 서브 에이전트의 결과를 검토              │
│ - 역할 간 산출물의 정합성 확인               │
│   (예: API 명세 ↔ 프론트엔드 연동 일치 여부)  │
│ - 불일치 발견 시 해당 역할에 재위임            │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Phase 4: 보고                            │
│ - 전체 결과를 사용자에게 요약 보고            │
│ - 각 역할의 산출물 경로 안내                 │
│ - features.md 인덱스 업데이트               │
│ - 후속 작업이 필요하면 제안                  │
└─────────────────────────────────────────┘
```

### 워크플로우 예시

**복합 요청**: "로그인 기능 만들어줘"

```
Phase 1: PM → Designer → Developer → QA (의존성 순서)

Phase 2:
  [순차] PM: 로그인 기능 명세 작성
         ↓ (산출물 전달)
  [순차] Designer: 로그인 화면 설계
         ↓ (산출물 전달)
  [순차] Developer: Route Handler + NextAuth + UI 구현
         ↓ (완료 후)
  [순차] QA: 로그인 기능 테스트 케이스 작성

Phase 3: 기능 명세 ↔ 구현 정합성 확인
Phase 4: 사용자에게 결과 보고
```

**단일 역할 요청**: "API 응답 속도 개선해줘"

```
Phase 1: Developer 단독 작업
Phase 2: Developer에 위임
Phase 3: 결과 검토
Phase 4: 사용자에게 보고
```

## 산출물 관리 구조

### 기능별 문서 관리

plan/, design/, qa/는 각각 `features/` 하위에 기능 단위로 문서를 저장한다.

```
plan/features/login.md        ← PM: 로그인 기능 명세
design/features/login.md      ← Designer: 로그인 화면 설계
qa/features/login.md          ← QA: 로그인 테스트 케이스
```

develop/는 기술적 구조(`app/`, `lib/`, `prisma/` 등)를 따르며 `features/` 디렉터리를 별도로 두지 않는다. 구현 시 plan/, design/의 기능 문서를 참조한다.

### 기능 인덱스

`features.md` (루트)가 기능별 산출물 경로와 상태를 추적한다. 오케스트레이터는 Phase 4에서 이 인덱스를 업데이트한다.

### 문서 표준 형식

모든 기능 산출물 문서는 다음 형식을 따른다:

```markdown
---
feature: [기능명]
version: [버전]
last_updated: [YYYY-MM-DD]
---

# [문서 제목]

(본문)

## Changelog
- [버전] ([날짜]): [변경 내용]
```

## 공통 원칙

- 역할 간 산출물은 서로 참조할 수 있다 (예: 개발자는 plan/의 기능 명세를 참조)
- 모든 산출물은 한국어로 작성한다
- `README.md`, `TEMPLATE.md`는 사용자용 문서이다. 작업 시 참조하지 않는다

## Git 커밋 컨벤션

이 프로젝트의 모든 커밋은 Conventional Commits 기반의 아래 규칙을 따른다.

### 포맷

```
<type>(<scope>[, <scope>...]): <subject>

<본문 (선택, "왜"를 설명)>
```

### 원칙

- **하나의 목적 = 하나의 커밋.** type이 다르면(예: `feat` + `fix`) 반드시 커밋을 분할한다. 같은 type이라도 논리적 목적이 다르면 분할한다.
- **모든 영향받는 scope를 제목에 명시한다.** 임의로 생략하지 않는다. 나열이 지나치게 길어지는 것은 커밋 분할을 검토하라는 신호일 수 있지만, 정당한 cross-cutting 변경이면 나열을 유지한다. `git log --oneline` 제목만으로 영향 범위를 즉시 파악할 수 있어야 한다.
- **제목은 72자 이내 한국어 명령형.** 끝에 마침표 없음.
- **본문에는 "왜"를 쓴다.** "무엇"은 diff가 이미 보여준다. trivial한 변경은 본문 생략 가능.
- **커밋 시점은 사용자의 명시적 요청 시에만.** 오케스트레이터는 커밋을 제안만 하고 실행하지 않는다.
- **`--no-verify` 등 훅 우회 플래그 금지.** 훅이 실패하면 근본 원인을 수정한다.
- **발행된 커밋에 amend 금지.** 새 커밋으로 처리한다.
- **`Co-Authored-By` 트레일러는 항상 생략한다.** 이 프로젝트의 거의 모든 작업이 Claude Code 기반이라 표식이 무의미하다. Claude Code의 빌트인 기본 지침(모든 커밋 끝에 `Co-Authored-By: Claude ... <noreply@anthropic.com>` 자동 추가)을 이 리포지토리에서는 명시적으로 덮어쓴다.

### Type

| type | 용도 |
|---|---|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 (CLAUDE.md, README.md, architecture/, features.md, plan/·design/·qa/의 기능 명세 등) |
| `refactor` | 동작 변경 없는 코드·구조 재정리 |
| `chore` | 빌드·설정·의존성·툴링 |
| `style` | 포맷·공백·세미콜론 등 순수 스타일 |
| `test` | 테스트 추가/수정 |
| `perf` | 성능 개선 |

### Scope

모든 scope는 최상위에서 동등한 레벨이다. 필요 시 슬래시(`/`)로 sub-scope를 붙이고, 여러 영역이 하나의 논리적 목적으로 묶이면 콤마(`,`)로 나열한다. 하이픈 허용.

| scope | 대상 | sub-scope 기준 | 예시 |
|---|---|---|---|
| `develop` | Next.js 앱 구현 (`app/`, `lib/`, `prisma/` 등) | **도메인 엔티티·기능 영역**이 주축, 인프라성 변경은 레이어 이름 | `develop/chat`, `develop/asset`, `develop/project`, `develop/auth`, `develop/llm`, `develop/ui-shell`, `develop/infra` |
| `plan` | `plan/` 디렉터리 | 기능명 또는 범용 기획 문서 | `plan/chat`, `plan/priority-matrix` |
| `design` | `design/` 디렉터리 | 기능명 또는 범용 디자인 산출물 | `design/chat`, `design/tokens`, `design/persona` |
| `qa` | `qa/` 디렉터리 | 기능명 또는 범용 QA 문서 | `qa/chat`, `qa/strategy`, `qa/bugs` |
| `architecture` | `architecture/` 디렉터리 | 문서 종류 | `architecture/domain-model`, `architecture/adr` |
| `context` | AI 협업 컨텍스트 파일 (`CLAUDE.md`, `README.md`, `features.md`, `TEMPLATE.md`) | (없음) | `context` |
| `infra` | 툴링·설정 파일 (`.gitignore`, `.claude/`, CI 등) | (없음) | `infra` |

**`develop`의 주축이 "엔티티"인 이유**: 대부분의 기능 작업이 여러 기술 레이어를 동시에 건드리기 때문에 기술 레이어 기반 sub-scope는 의미가 희석된다. 도메인 엔티티 기준으로 나누면 "무엇에 대한 작업인가"가 명확해진다.

### 예시

```
# 하나의 엔티티
feat(develop/chat): SSE 기반 메시지 스트리밍 응답 구현

# 엔티티에 걸친 연동 변경 (콤마)
feat(develop/chat, develop/asset): 메시지에서 Asset 참조 기능 추가

# 역할에 걸친 기획·디자인 동시 작성
docs(plan/chat, design/chat): 채팅 기능 명세 및 화면 설계 초안

# 인프라
chore(infra): Next.js 15 App Router 프로젝트 초기화

# AI 컨텍스트 문서
docs(context): 핵심 가치에 출처 신뢰성 축 추가

# 도메인 모델 문서
docs(architecture/domain-model): Project/Chat/Asset 3축 모델 정의
```

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router, 최신 안정화 버전) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| 에디터 | TipTap (ProseMirror 기반) |
| 서버 상태 | React Query (`@tanstack/react-query`) |
| 클라이언트 상태 | React Context + useState (MVP 1단계 기본). Zustand는 MVP 완성 후 학습 프로세스 2단계에서 부분 도입 |
| DB | PostgreSQL + Prisma |
| 인증 | NextAuth |
| LLM | Anthropic 공식 SDK (`@anthropic-ai/sdk`) — SSE 스트리밍 저수준 직접 구현 |
| 배포 | 로컬 개발 전용 (현재 단계) |

상세 판단 기준과 워크플로우는 각 역할의 CLAUDE.md를 참조.
