---
feature: 통합 앱 셸 + Project 생성/전환
version: 0.2
last_updated: 2026-04-15
---

# 기능 1: 통합 앱 셸 + Project 생성/전환

이 문서는 MVP 1차 기능 중 첫 번째인 "통합 앱 셸 + Project 생성/전환"의 기획 명세다. 후속 기능(2~6)이 올라탈 프레임을 제공하는 것이 이 기능의 존재 이유다.

## 1. 문제 정의

이 기능이 해결하는 사용자 문제는 두 가지다.

### (a) 프레임 부재 문제
후속 기능(Chat, Asset 관리, Write, Scholar)을 띄울 컨테이너가 없으면 사용자가 그 기능들을 클릭해볼 수조차 없다. 이 기능은 모든 후속 기능의 **전제 조건**이다. 동시에 Next.js 16 셋업 스모크 테스트 역할도 겸한다.

### (b) 맥락 전환 비용
라이너 원본은 세 서비스(Liner / Liner Write / Liner Scholar)가 분리되어 있어, 사용자가 "아이디어 서칭 → 초고 작성 → 브레인스토밍" 루프를 돌 때마다 탭·창을 옮겨다녀야 한다. 통합 셸은 한 화면 안에서 뷰만 전환하면 맥락이 끊기지 않도록 만든다. 이는 프로젝트 핵심 가치 1번(통합성)과 직결된다.

> **주의**: MVP 1단계에서는 각 뷰의 본문이 placeholder이므로 (b)의 가치는 아직 약속 수준이다. 실제 체감은 기능 3(Liner 뷰)부터 누적되기 시작한다. 이 기능의 직접적 성공 지표는 (a)에 치우친다.

## 2. 사용자 시나리오

대상 페르소나는 스타트업 PM (CLAUDE.md의 "자기 시뮬레이션 페르소나"). 다음 시나리오가 자연스럽게 흘러가야 한다.

**시나리오 1: 처음 진입**
1. 사용자가 앱 루트(`/`)로 진입
2. 저장된 Project가 없으므로 빈 상태 화면("첫 Project를 만들어보세요")을 본다
3. "새 Project" 버튼을 눌러 Project를 만든다
4. 새 Project가 생성되자마자 해당 Project의 기본 뷰(Liner)로 진입

**시나리오 2: 돌아온 사용자**
1. 어제 Write 뷰에서 작업을 마치고 브라우저를 닫았다
2. 오늘 앱 루트(`/`)로 다시 진입
3. 흰 화면 없이 곧장 어제 보던 Project의 Write 뷰로 이동한다 (cookie 기반 redirect)

**시나리오 3: 뷰 전환**
1. 현재 Project의 Liner 뷰에서 작업 중
2. 상단/사이드바의 뷰 토글에서 Write를 클릭
3. 사이드바와 Project 선택 상태는 유지된 채 메인 패널만 Write로 교체
4. 새로고침해도 Write 뷰 그대로

**시나리오 4: Project 전환**
1. 사이드바에서 다른 Project를 클릭
2. 현재 뷰(예: Liner)를 유지한 채 Project만 교체

**시나리오 5: Project 이름 변경·삭제**
1. 잘못 만든 Project의 이름을 바꾸거나 통째로 삭제할 수 있다
2. 마지막 Project를 삭제하면 빈 상태 화면으로 돌아간다

## 3. 1차 스코프 (B안)

### 포함
- **앱 셸 레이아웃**
  - 260px 고정폭 사이드바 (접힘/펼침 토글)
  - 사이드바가 접힌 상태에서도 뷰 전환 아이콘은 보임
  - 중앙 메인 패널
- **Project 관리**
  - 목록 (사이드바 내)
  - 생성 (`+ 새 Project` 버튼 → 이름 입력)
  - 전환 (목록 항목 클릭 → 해당 Project의 현재 뷰로 이동)
  - **이름 변경 (rename)** — 인라인 편집 또는 컨텍스트 메뉴 중 하나 (디자인 단계 결정)
  - **삭제** — 단순 confirm 다이얼로그
  - **목록 최대 표시 개수**: 사이드바는 최근 N개(디자인 단계에서 원본 기준 확정, 현 관찰값 3개)까지 노출하고, 그 이상은 "더보기" 행을 통해 펼친다. 원본 Liner Scholar의 "더보기" 패턴을 차용.
- **뷰 전환**
  - 세 뷰(Liner / Write / Scholar) 토글 버튼
  - 각 뷰 본문은 **placeholder**: "Liner 뷰 — 추후 구현" 같은 안내. 본문 구현은 기능 3·5·6에서.
  - **기본 뷰는 Liner로 고정**한다. Project 생성 직후 진입점, Project 전환 시 뷰 상태가 없는 경우의 fallback 모두 Liner. 사용자별 기본 뷰 설정은 오버엔지니어링이라 도입하지 않는다 (불편이 관찰되면 2차 후보로).
  - **상위 뷰 토글은 우리 앱의 발명**이다. 원본 라이너의 세 서비스(Liner / Liner Write / Liner Scholar)는 독립 도메인으로 분리되어 있어 셋을 가로지르는 단일 토글이 존재하지 않는다. 우리는 원본 Liner Scholar 내부의 "파일 / 편집 / 채팅" pill 토글 **스타일을 차용**해 상단 헤더에 배치한다. 시각 일관성을 얻고 사용자 학습 곡선을 낮추는 것이 목적.
- **접힘 상태 UX**
  - 사이드바 접힘(48px)에서 노출되는 요소는 **사이드바 재열기 버튼과 뷰 전환 토글 아이콘**뿐이다. Project 목록·rename·생성 등 나머지 조작은 사이드바를 다시 펼쳐야 한다.
  - 접힘 상태는 "잠깐 메인 패널에 집중하고 싶을 때"의 모드이며, 장시간 사용 상태가 아니라는 설계 가정.
- **영속**
  - 현재 Project와 뷰는 URL segment에 싣는다 (`/p/[projectId]/(liner|write|scholar)`)
  - "마지막에 본 위치"를 cookie에 저장 (`last-project`, `last-view`)
  - `/` 진입 시 cookie 기반 서버 컴포넌트 redirect로 마지막 위치 복원. 흰 화면 깜빡임 없음.
- **빈 상태**
  - Project가 0개일 때: 메인 패널에 "첫 Project를 만들어보세요" 안내 + Project 생성 CTA
  - cookie의 `last-project`가 가리키는 Project가 더는 존재하지 않을 때: 빈 상태로 보내고 cookie 정리

### 테마

**다크 모드를 기본이자 유일한 테마로 한다.** 레퍼런스 대상인 Liner Scholar가 다크를 기본으로 제공하고 있어, 원본 시각 언어를 가장 충실히 재현하는 경로가 다크다. 라이트/다크 토글은 MVP 범위 밖이며, 필요성이 드러나면 2차 후보로.

### 제외 (비-스코프)
아래 항목들은 **1차 MVP에서 의도적으로 제외**한다. 필요성이 드러나면 2차 후보로 재평가.

| 제외 항목 | 제외 이유 |
|---|---|
| Project 검색·정렬 | Project 5개 미만에서는 무의미 |
| 사이드바 폭 사용자 조절 | 사용 빈도 낮고 디자인 일관성 저하 |
| 드래그앤드롭 재정렬 | MVP에서 Project는 생성순 정렬로 충분 |
| Project 삭제 시 "프로젝트명 입력" 안전장치 | 기능 4 이후 Asset/Chat이 쌓이기 시작할 때 재평가 |
| 각 뷰의 본문 (Liner/Write/Scholar) | 기능 3·5·6의 책임 |
| 사이드바의 최근 Chat·Asset 목록 | 2차 후보 |
| 다중 디바이스 간 "마지막 위치" 동기화 | 1인 학습 프로젝트 범위 밖 |
| 라이트 모드 / 테마 토글 | 원본 Scholar가 다크 기본이라 원본 시각 재현에 불필요 |

## 4. 성공 기준 (Acceptance Criteria)

구현 완료 여부를 판단하는 기준. 모두 만족해야 이 기능을 완료로 본다.

### 기능 요구
1. 사이드바를 접고 펼 수 있다. 접힌 상태에서도 뷰 전환 아이콘은 보인다.
2. 빈 상태(Project 0개)에서 "새 Project" CTA를 누르면 이름 입력 후 Project가 생성된다.
3. Project 생성 직후 해당 Project의 기본 뷰(Liner)로 자동 이동한다.
4. 사이드바의 Project 목록에서 다른 Project를 클릭하면 현재 뷰를 유지한 채 Project만 교체된다.
5. 뷰 토글(Liner / Write / Scholar)을 누르면 메인 패널의 본문만 교체된다. 사이드바·Project 선택은 유지된다.
6. Project 이름 변경이 동작한다 (편집 → 저장 → 사이드바 즉시 반영).
7. Project 삭제가 동작한다. 단순 confirm 후 삭제되며, 사이드바 목록에서 사라진다. 마지막 Project를 삭제하면 빈 상태 화면으로 돌아간다.
8. 브라우저를 껐다 다시 `/`로 접속하면 마지막에 본 Project와 뷰로 곧장 이동한다. 흰 화면이 보이지 않는다.
9. cookie의 `last-project`가 더는 존재하지 않는 Project를 가리키면, 빈 상태로 보내고 cookie를 정리한다.

### 기술·품질 요구
10. URL이 `/p/[projectId]/(liner|write|scholar)` 형태로 드러나며 공유·새로고침·뒤로가기가 정상 동작한다.
11. 뷰 전환 시 full page reload가 발생하지 않는다 (App Router 공유 layout).
12. 타입 체크(`pnpm typecheck`)·린트(`pnpm lint`) 통과.
13. 저장된 "마지막 위치" cookie는 `httpOnly`, `sameSite=lax`, 1년 `maxAge`로 설정된다.

## 5. 도메인·기술 결정 요약

이 기능 구현 시 따르는 결정들과 그 근거 문서.

| 결정 | 내용 | 근거 |
|---|---|---|
| 라우팅 | URL Segment 방식 (`/p/[projectId]/(liner\|write\|scholar)`) | [ADR-0003](../../architecture/decisions/0003-view-switching-via-url-segment.md) |
| 영속 저장 | cookie에 `last-project`, `last-view` 저장, 서버 컴포넌트에서 동기적 redirect | [ADR-0004](../../architecture/decisions/0004-last-location-via-cookie.md) |
| Project/User 필드 | `architecture/domain-model.md` v0.2의 정의를 따름 | [domain-model.md](../../architecture/domain-model.md) |
| ID 형식 | cuid2 | 도메인 모델 공통 컨벤션 |
| 삭제 정책 | hard delete | 도메인 모델 공통 컨벤션 |
| 임시 단일 user | 기능 2(NextAuth) 통합 전까지 시드 또는 마이그레이션으로 생성한 임시 user의 `user_id`를 모든 엔티티에 사용 | 도메인 모델 User 섹션 |
| 패키지 매니저 / DB | pnpm / Docker PostgreSQL | ADR-0001, ADR-0002 |
| 디자인 레퍼런스 대상 | **Liner Scholar**를 기준 서비스로 삼는다. Scholar가 세 서비스(Liner / Write / Scholar)의 기능을 정신적으로 계승하는 가장 통합된 형태라서, 레퍼런스 수집·시각 토큰·인터랙션 패턴의 일관된 출처가 된다. | [design/references/1-app-shell/measurements.md](../../design/references/1-app-shell/measurements.md) |
| 상위 뷰 토글 스타일 | 원본 Scholar 내부 "파일/편집/채팅" pill 토글의 **스타일을 차용**해 상단 헤더에 배치. 원본에는 없는 우리 앱의 발명이지만 시각 일관성을 위해 Scholar의 디자인 언어를 따른다. | 측정값: measurements.md 뷰 전환 토글 섹션 |
| 테마 | 다크 모드 기본·유일 (섹션 3.테마 참조) | 원본 Scholar 기본 테마 |

## 6. 의존·후속 영향

### 이 기능이 만드는 것 (후속 기능이 재사용)
- **사이드바 + 메인 패널 레이아웃 셸** — 기능 3·5·6가 각자 본문을 이 셸 안에 올린다
- **현재 Project 컨텍스트** — 후속 기능은 `/p/[projectId]` segment에서 현재 Project ID를 얻는다
- **Project CRUD API / Server Action** — 기능 4(Asset)가 `project_id`를 참조할 때 재사용
- **"마지막 위치" cookie·redirect 패턴** — 기능 2(NextAuth) 이후 로그인 후 진입 지점 결정에도 같은 패턴을 확장 적용

### 이 기능이 깔아야 하는 기반 (독립 비용)
- Prisma 스키마 최초 작성 (User, Project만)
- 최초 마이그레이션 실행
- 임시 user 시드

### 기능 2(인증) 도입 시 바뀔 것
- `[projectId]` segment 진입 시 **현재 user가 해당 Project의 소유자인지 검증**하는 로직이 추가된다
- cookie의 `last-project`가 다른 user의 Project를 가리키면 무시하고 cookie 정리
- 임시 user 시드 → NextAuth user로 교체

## 7. 열린 질문

답을 미루기로 한 것들. 각 항목에 **결정 시점**과 **결정 주체**를 명시한다.

| # | 질문 | 미룬 이유 | 결정 시점 | 결정 주체 |
|---|---|---|---|---|
| Q1 | Project rename UX: 인라인 더블클릭 편집 vs 컨텍스트 메뉴 → 모달 | 디자인 의사결정 영역 | 디자인 단계 | Designer |
| Q2 | 사이드바 폭(현 안: 260px)과 접힘 애니메이션 세부 | 디자인 토큰 확정과 함께 결정 | 디자인 단계 | Designer |
| Q3 | 빈 상태 일러스트/카피 톤 | 디자인 의사결정 영역 | 디자인 단계 | Designer |
| Q4 | 임시 단일 user 시드 방식: Prisma seed script vs 최초 마이그레이션 raw SQL | 기능 2에서 교체될 일회성 코드라 구현자 재량 | 구현 단계 | Developer |
| Q5 | Project 삭제 confirm의 카피 (단순 "정말 삭제할까요?" 수준이면 충분한가) | Asset이 쌓이기 전에는 과한 안전장치 불필요 | 기능 4 구현 완료 후 재평가 | PM |

## Changelog

- 0.2 (2026-04-15): 디자인 레퍼런스 수집 결과 반영. 다크 모드 기본화(라이트 제외로 재분류), 상위 뷰 토글의 Scholar pill 스타일 차용 명시, 디자인 레퍼런스 대상으로 Liner Scholar 지정, 목록 "더보기" 패턴과 접힘 상태 UX 명세 추가.
- 0.1 (2026-04-15): 초안 작성. B안 스코프, URL Segment + cookie 영속, 성공 기준 13개, 열린 질문 6개 정의.
