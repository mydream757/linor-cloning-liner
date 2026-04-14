# Fullstack Project Template with Claude

1인 개발자가 Claude Code를 활용하여 기획, 디자인, 개발, QA 역할을 오케스트레이션하며 프로젝트를 진행하기 위한 템플릿.

## 구조

```
/
├── CLAUDE.md                        ← Orchestrator 컨텍스트 (루트)
├── features.md                      ← 기능별 산출물 인덱스
├── plan/                            ← Product Manager
│   ├── CLAUDE.md
│   ├── templates/                   ← PM 산출물 템플릿
│   └── features/                    ← 기능별 명세
├── design/                          ← UI/UX Designer
│   ├── CLAUDE.md
│   ├── templates/                   ← 디자인 산출물 템플릿
│   └── features/                    ← 기능별 화면 설계
├── develop/                         ← Developer (공통 규칙)
│   ├── CLAUDE.md
│   ├── architecture/                ← ADR, 시스템 구조도
│   ├── backend/                     ← Backend Developer
│   │   └── CLAUDE.md
│   └── frontend/                    ← Frontend Developer
│       └── CLAUDE.md
├── qa/                              ← QA Engineer
│   ├── CLAUDE.md
│   ├── templates/                   ← QA 산출물 템플릿
│   └── features/                    ← 기능별 테스트 케이스
└── .claude/
    └── skills/                      ← 서브 에이전트 (슬래시 커맨드)
        ├── plan/                    ← User Researcher, Competitor Analyst
        ├── design/                  ← UX Reviewer
        ├── develop/                 ← Code Reviewer, Architect
        └── qa/                      ← Exploratory Tester
```

## 동작 방식

### 역할 기반 오케스트레이션

루트에서 Claude Code를 실행하면 **Orchestrator**로 동작한다. 사용자의 요청을 분석하여 적절한 역할에 작업을 위임하고, 결과를 수합하여 보고한다.

```
사용자 → Orchestrator → PM / Designer / Developer / QA (서브 에이전트)
```

각 역할은 독립적인 CLAUDE.md를 가지며, 고유한 판단 기준과 내부 워크플로우에 따라 동작한다. 필요 시 역할 내부의 서브 에이전트(코드 리뷰어, UX 리뷰어 등)를 호출한다.

### 오케스트레이터 워크플로우

1. **분석** — 요청을 작업 단위로 분해, 필요한 역할 식별, 의존성 파악
2. **위임** — 역할별 CLAUDE.md를 서브 에이전트에 주입하여 위임
3. **수합** — 역할 간 산출물의 정합성 검증 (예: API 명세 ↔ 프론트엔드 연동)
4. **보고** — 결과 요약, 산출물 경로 안내, features.md 인덱스 업데이트

### 산출물 관리

- plan/, design/, qa/ → `features/[기능명].md`에 기능 단위로 문서 저장
- develop/ → 기술 구조를 따름 (features/ 구조에 종속되지 않음)
- 루트 `features.md` → 기능별 산출물 경로와 진행 상태를 추적하는 인덱스

## 사용법

### 1. 템플릿 복사

```bash
git clone https://github.com/mydream757/fullstack-project-template-with-claude.git my-project
cd my-project
```

### 2. 프로젝트 초기화

루트에서 Claude Code를 실행하고 프로젝트 주제를 알려주면, 오케스트레이터가 초기화 절차를 안내한다.

```
> 바쁘고 내향적인 사람들을 위한 연애 중계 서비스를 만들려고 해
```

초기화 시 확정하는 항목:
- 프로젝트명, 문제 정의, 대상 사용자, 핵심 가치, 기술 스택(선택)

### 3. 기능 요청

초기화가 완료되면 기능 단위로 작업을 요청한다.

```
> 소셜 로그인 기능 구현해줘
```

### 4. 서브 에이전트 직접 호출

필요 시 슬래시 커맨드로 특정 서브 에이전트를 직접 호출할 수 있다.

```
/develop/code-reviewer develop/backend/auth/
/design/ux-reviewer
/plan/competitor-analyst 카카오톡, 네이버, 페어
```

## 시뮬레이션 예시: "소셜 로그인 기능 구현"

아래는 "소셜 로그인 기능 구현해줘"라는 요청이 처리되는 전체 흐름이다.

### 실행 흐름

```
Phase 1 (분석):
  PM → Designer → Architect(API 계약) → Backend | Frontend → QA

Phase 2 (위임):
  [순차] PM: 소셜 로그인 기능 명세 작성
    ├─ /plan/user-researcher: 사용자 니즈 분석
    └─ /plan/competitor-analyst: 경쟁사 소셜 로그인 분석
         ↓ (plan/features/social-login.md)
  [순차] Designer: 소셜 로그인 화면 설계
    └─ /design/ux-reviewer: 사용성 검증
         ↓ (design/features/social-login.md)
  [순차] Architect: API 인터페이스 선행 정의
         ↓ (develop/architecture/decisions/에 ADR)
  [병렬] Backend: OAuth API 구현  |  Frontend: 로그인 UI 구현
    └─ /develop/code-reviewer       └─ /develop/code-reviewer
         ↓ (양쪽 완료 후)
  [순차] QA: 소셜 로그인 테스트
    └─ /qa/exploratory-tester: 자유 탐색 테스트

Phase 3 (수합):
  - Backend API ↔ Frontend 연동 정합성 확인
  - PM 요구사항 ↔ 구현 범위 일치 확인

Phase 4 (보고):
  - features.md 업데이트
  - 전체 결과 보고
```

### 사용자 의사결정이 필요한 지점

워크플로우 진행 중 오케스트레이터가 사용자에게 확인을 요청하는 시점이 있다.

| 시점 | 유형 | 질문 예시 | 필수 여부 |
|------|------|----------|----------|
| PM 기능 명세 | 의사결정 | "Google, Kakao, Apple 중 어떤 소셜 로그인을 지원할까요?" | 필수 |
| PM 기능 명세 | 의사결정 | "소셜 로그인만 지원? 자체 회원가입도 포함?" | 필수 |
| PM 사용자 리서치 | 자료 제공 | "참고할 사용자 피드백이나 데이터가 있나요?" | 조건부 |
| Designer 화면 설계 | 의사결정 | "디자인 시스템(색상, 폰트 등)이 정해져 있나요?" | 첫 기능일 때 필수 |
| Architect 설계 | 의사결정 | "기술 스택(프레임워크, DB, 인증 방식)을 정해주세요" | 필수 |
| QA 테스트 실행 | 자료 제공 | "OAuth 테스트용 클라이언트 ID/Secret을 제공해주세요" | 실제 테스트 시 필수 |

일반적으로 **3회의 필수 인터랙션** (기능 범위 + 기술 스택 + 테스트 환경)으로 전체 워크플로우가 진행된다.

## 커스터마이징

### 역할별 판단 기준 조정

각 역할의 CLAUDE.md에 있는 "판단 기준" 섹션을 프로젝트 특성에 맞게 수정한다. 초기화 프로세스에서 이 단계가 포함되어 있다.

### 서브 에이전트 추가

`.claude/skills/[역할]/[에이전트명]/SKILL.md`에 새 파일을 생성하고, 해당 역할의 CLAUDE.md 서브 에이전트 테이블에 추가한다.

### 산출물 템플릿 수정

각 역할의 `templates/` 디렉터리에서 템플릿을 프로젝트에 맞게 수정한다.
