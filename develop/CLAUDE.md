# develop/ - 개발 공통 규칙

이 디렉터리 하위(`backend/`, `frontend/`)에서 작업할 때 공통으로 적용되는 개발 원칙이다.

## 공통 책임

- 코드 품질 관리 — 가독성, 유지보수성, 일관성 유지
- `plan/`의 기능 명세와 `design/`의 디자인 산출물을 참조하여 구현

## 산출물 참조

구현 시 다음 경로에서 관련 문서를 참조한다:
- 기능 명세: `plan/features/[기능명].md`
- 디자인 명세: `design/features/[기능명].md`
- API 계약/아키텍처: `architecture/decisions/`, `architecture/diagrams/`
- 기능별 전체 산출물 경로: 루트 `features.md`

## 내부 워크플로우

오케스트레이터로부터 작업을 수신하면 다음 순서로 진행한다.

```
Step 1: 요구사항 분석
  - plan/features/[기능명].md 확인
  - design/features/[기능명].md 확인
  - 불명확한 점 → 오케스트레이터에 질의

Step 2: 영향 범위 탐색
  - 기존 코드베이스에서 관련 모듈/파일 탐색
  - 변경이 필요한 영역 식별
  - 의존하는/의존받는 코드 파악

Step 3: API 계약 및 설계 (조건부)
  - Backend + Frontend 양쪽에 영향을 주는 경우:
    → /develop/architect 호출하여 API 인터페이스를 선행 정의
    → architecture/decisions/에 ADR 저장
    → 정의된 API 계약을 Backend/Frontend 양쪽이 참조
  - 아래 조건에 해당하면 추가로 구조적 판단 요청:
    · 새로운 모듈/패키지 생성이 필요한 경우
    · DB 스키마 변경이 포함된 경우
    · 기존 구조에 구조적 변경이 필요한 경우
  - 해당 없으면 스킵

Step 4: 구현
  - 기존 패턴/컨벤션을 따라 구현
  - Step 3에서 정의된 API 계약 준수
  - 구현 중 발견한 이슈는 즉시 기록

Step 5: 코드 리뷰
  - /develop/code-reviewer 호출
  - Blocker → Step 4로 돌아가 수정 후 재리뷰
  - Major → 수정 후 재리뷰 없이 진행
  - 승인 → 다음 단계

Step 6: 자체 테스트
  - 구현한 기능의 기본 동작 검증
  - 단위 테스트 작성 (기술 스택 확정 후)
  - 기존 테스트 통과 확인
```

### 오케스트레이터 반환 항목

- 구현 완료 파일 목록
- 변경 영향 범위
- 발견된 이슈 (있을 경우)

## 서브 에이전트

| 서브 에이전트 | 슬래시 커맨드 | 호출 시점 |
|-------------|-------------|----------|
| Code Reviewer | `/develop/code-reviewer` | Step 5: 구현 완료 후 코드 리뷰 |
| Architect | `/develop/architect` | Step 3: 구조적 변경이 필요한 경우 |

## 공통 원칙

- 구현 전 관련 산출물(PRD, 디자인 명세)을 확인한다
- backend와 frontend 간 API 계약(엔드포인트, 요청/응답 형식)을 명확히 정의하고 준수한다
- 기존 코드 패턴과 컨벤션을 따른다 — 새로운 패턴 도입 시 근거를 명시
