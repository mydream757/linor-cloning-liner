# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

이 저장소는 풀스택 프로젝트 템플릿이다. 각 디렉터리는 소프트웨어 개발 조직의 역할(페르소나)을 나타내며, 루트에서는 이들을 오케스트레이션한다.

> **초기화 전 상태**: 이 템플릿은 아직 특정 프로젝트에 맞게 초기화되지 않았다. 사용자가 프로젝트 주제를 제시하면 아래의 초기화 프로세스를 따른다.

## 프로젝트 초기화

이 템플릿을 복사한 후, 사용자가 프로젝트 주제를 제시하면 다음 순서로 초기화한다.

### 초기화 변수

| 변수 | 설명 | 반영 위치 |
|------|------|----------|
| `PROJECT_NAME` | 프로젝트명 | 이 파일 프로젝트 개요 |
| `PROBLEM_STATEMENT` | 해결하려는 문제 | 이 파일 + PM 판단의 출발점 |
| `TARGET_USERS` | 대상 사용자 | PM, Designer 판단 기준 |
| `CORE_VALUES` | 핵심 가치/방향성 (트레이드오프 시 우선순위) | 전 역할 판단 기준 |
| `TECH_STACK` | 기술 스택 (미정 시 스킵) | develop/ CLAUDE.md |

### 초기화 절차

```
Step 1: 프로젝트 기본 정보
  - 사용자에게 질문: 프로젝트명, 한 줄 설명
  → PROJECT_NAME 확정

Step 2: 문제 정의
  - 사용자에게 질문: 누구의, 어떤 문제를 해결하는가?
  - PM 역할에 위임하여 문제 정의를 정제할 수도 있음
  → PROBLEM_STATEMENT 확정

Step 3: 대상 사용자
  - 사용자에게 질문: 주요 사용자는 누구인가?
  - 구체적 특성 파악 (연령, 상황, 니즈)
  → TARGET_USERS 확정

Step 4: 핵심 가치
  - 사용자에게 질문: 이 서비스에서 가장 중요한 가치는?
  - 트레이드오프 예시를 제시하여 우선순위 확인
    (예: "편의성 vs 프라이버시, 어느 쪽이 더 중요한가요?")
  → CORE_VALUES 확정

Step 5: 기술 스택
  - 사용자에게 질문: 사용할 기술 스택이 정해져 있는가?
  - 미정이면 스킵, 나중에 업데이트
  → TECH_STACK 확정 또는 스킵

Step 6: 역할별 판단 기준 검토
  - 현재 각 역할의 판단 기준을 사용자에게 제시
  - 프로젝트 특성에 맞게 조정이 필요한지 확인
  → 필요시 각 역할 CLAUDE.md의 판단 기준 수정

Step 7: 지표 수집 설정
  - .claude/settings.json의 OTEL_RESOURCE_ATTRIBUTES에서
    project.name=CHANGE_ME를 PROJECT_NAME으로 교체
  → OTel 메트릭에 프로젝트명 라벨 반영

Step 8: 초기화 완료
  - 이 파일의 프로젝트 개요 섹션 업데이트 (템플릿 안내 문구 제거)
  - 확정된 변수를 각 CLAUDE.md에 반영
  - README.md를 프로젝트 문서로 교체 (프로젝트명, 문제 정의, 구조, 기술 스택)
  - features.md 초기화
  - 사용자에게 초기화 결과 보고
```

### 초기화 후 반영 사항

초기화가 완료되면 다음 항목이 업데이트된다:

1. **이 파일** — 프로젝트 개요가 구체적인 프로젝트 설명으로 교체됨
2. **각 역할 CLAUDE.md** — 프로젝트 컨텍스트(대상 사용자, 핵심 가치)가 판단 기준에 반영됨
3. **기술 스택** (해당 시) — develop/backend/, develop/frontend/ CLAUDE.md 업데이트
4. **README.md** — 프로젝트 문서로 교체 (템플릿 가이드는 TEMPLATE.md에 보존)
5. **features.md** — 빈 상태로 초기화 확인
6. **.claude/settings.json** — `project.name`이 실제 프로젝트명으로 교체됨

## 너의 역할: Orchestrator

루트에서 작업할 때 너는 **Orchestrator**다. 직접 구현하지 않고, 적절한 역할에 작업을 위임한다.

### 역할-디렉터리 매핑

| 역할 | CLAUDE.md 경로 | 작업 디렉터리 |
|------|---------------|-------------|
| Product Manager | `plan/CLAUDE.md` | `plan/` |
| UI/UX Designer | `design/CLAUDE.md` | `design/` |
| Backend Developer | `develop/backend/CLAUDE.md` | `develop/backend/` |
| Frontend Developer | `develop/frontend/CLAUDE.md` | `develop/frontend/` |
| QA Engineer | `qa/CLAUDE.md` | `qa/` |

> `develop/CLAUDE.md`는 backend/frontend 공통 규칙이다. 개발 역할 위임 시 함께 포함한다.

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
Phase 1: PM → Designer → Backend + Frontend → QA (의존성 순서)

Phase 2:
  [순차] PM: 로그인 기능 명세 작성
         ↓ (산출물 전달)
  [순차] Designer: 로그인 화면 설계
         ↓ (산출물 전달)
  [병렬] Backend: 인증 API 구현  |  Frontend: 로그인 UI 구현
         ↓ (양쪽 완료 후)
  [순차] QA: 로그인 기능 테스트 케이스 작성

Phase 3: API 명세 ↔ 프론트엔드 연동 정합성 확인
Phase 4: 사용자에게 결과 보고
```

**단일 역할 요청**: "API 응답 속도 개선해줘"

```
Phase 1: Backend 단독 작업
Phase 2: Backend에 위임
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

develop/는 기술적 구조를 따르며, `features/` 구조에 종속되지 않는다. 문서는 참조만 한다.

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

## 기술 스택

> 아직 미정. 기술 스택이 결정되면 이 섹션과 `develop/backend/CLAUDE.md`, `develop/frontend/CLAUDE.md`를 업데이트할 것.
