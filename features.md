# 기능 인덱스

이 문서는 기능별 산출물의 위치와 상태를 추적한다. 오케스트레이터가 Phase 4(보고) 시 자동 업데이트한다.

모든 기능은 [`architecture/domain-model.md`](architecture/domain-model.md)의 도메인 모델(Project / Chat / Asset) 위에서 정의된다.

## 현재 진행 상황 (빠른 핸드오프용)

**기능 4 구현 코드 완료** — D7 구현까지 완료. 브라우저 수동 검증 후 기능 4 "완료" 확정 예정. 다음 기능은 **5 (Write 뷰 TipTap + AI 수정 제안)**. 기능 5에서는 **Reference 첨부 UI가 1급 편입** 예정 (PM v0.6 §5 결정).

**다음 세션 시작 시 읽을 문서 순서**:
1. 이 파일 §1차 MVP 기능 §5 (후보 상태, Reference 첨부 UI 편입 명시)
2. [`plan/features/4-asset.md`](plan/features/4-asset.md) v0.6 — 기능 5로 이관된 결정(§5 마지막 2행)
3. [`architecture/domain-model.md`](architecture/domain-model.md) v0.4 + [ADR-0014](architecture/decisions/0014-asset-schema-polymorphic-single-table.md)·[ADR-0015](architecture/decisions/0015-unassigned-route-structure.md)·[ADR-0016](architecture/decisions/0016-asset-chat-composition-model.md)
4. [`design/features/4-asset.md`](design/features/4-asset.md) v0.4 — §2-15 (사이드바 Reference 진입점)
5. 기술 부채: [T-001·T-004 Resolved](architecture/tech-debt.md#resolved), T-005 Open (기능 5와 함께 일관 구현 가능)

## 상태 표기

- **후보**: MVP 후보로 식별된 상태 (기획 착수 전)
- **기획 중**: PM이 기능 명세 작성 중
- **디자인 중**: Designer가 화면 설계 중
- **구현 중**: Developer가 구현 중
- **QA 중**: QA가 테스트 중
- **완료**: 모든 역할 산출물 완료

## 1차 MVP 기능

도메인 모델 기반으로 정리한 6개 기능. 각 기능은 특정 엔티티·뷰와 매핑된다.

### 구현 순서와 근거

아래 번호는 **기획·구현 착수 권장 순서**이며, 다음 네 축으로 결정되었다:

1. **의존성** — 후속 기능의 전제가 되는 것 먼저
2. **리스크 front-loading** — 불확실성이 큰 작업을 앞당겨서, 나중에 뒤집어야 할 코드가 쌓이기 전에 검증
3. **재사용 극대화** — 후속 기능이 이미 만들어진 것을 최대한 재배치
4. **학습 곡선 분산** — 한 번에 새로운 것을 너무 많이 마주치지 않도록

| # | 기능 | 주 근거 |
|---|---|---|
| 1 | 통합 앱 셸 + Project 생성/전환 | 프레임이 없으면 후속 기능을 클릭해볼 수 없음. Next.js 16 셋업 스모크 테스트 역할도 겸함. User/Project만 먼저 스키마에 등록 |
| 2 | 인증 (NextAuth) | `user_id`가 모든 엔티티의 전제. 나중에 끼워 넣으면 기존 코드를 역으로 꿰매야 하는 고통. NextAuth 학습 가치도 독립적으로 얻음 |
| 3 | Liner 뷰: Chat + SSE + 출처 배지 | **이 프로젝트 최대 불확실성**(저수준 SSE 생성/소비, Anthropic SDK 통합, Next.js 16 Route Handler 스트리밍)을 앞으로 당긴다. 3에서 흔들리면 4·5·6이 다시 흔들리는 것을 방지. 학습 동기(SSE 직접 구현)와도 정렬 |
| 4 | Asset 관리 (Reference + Document) | Chat/Message 이후 Asset을 얹어 3축 도메인이 완성된다. CRUD 중심이라 SSE 다음의 **페이스 체인지** 역할. 3단계의 Reference는 stub으로 두었다가 이 단계에서 실데이터로 연결 |
| 5 | Write 뷰: TipTap + AI 수정 제안 | Asset(Document) 기반에 3단계 SSE 인프라를 그대로 재사용. 신규 리스크 낮음, 대부분 통합 작업 |
| 6 | Scholar 뷰: 3패널 워크스페이스 | 명시적으로 **기존 컴포넌트 재배치만** 하는 기능. 모든 재료(Chat·Document Editor·Asset 리스트)가 갖춰진 뒤 마지막에 배치 |

**고려한 대안**: Asset 관리(4)를 Liner 뷰(3) 앞에 놓는 것도 검토했으나, SSE 리스크를 뒤로 미루는 것이 더 위험하다고 판단해 기각. 3단계에서 Reference는 stub으로 두고 4단계에서 실데이터로 연결.

### 1. 통합 앱 셸 + Project 생성/전환
- **상태**: 완료
- **관련 엔티티**: Project, User
- **설명**: 260px 접기 가능 사이드바, 중앙 메인 패널, 뷰 전환(Liner / Write / Scholar). 현재 Project 선택·생성·삭제. 라이너 원본 UI편 레이아웃을 기준.
- 기획: [plan/features/1-app-shell.md](plan/features/1-app-shell.md) (v0.4)
- 디자인: [design/features/1-app-shell.md](design/features/1-app-shell.md) (v0.2)
- 디자인 레퍼런스: [design/references/1-app-shell/](design/references/1-app-shell/)
- 관련 ADR: [0003](architecture/decisions/0003-view-switching-via-url-segment.md), [0004](architecture/decisions/0004-last-location-via-cookie.md), [0005](architecture/decisions/0005-prisma-infrastructure.md), [0006](architecture/decisions/0006-dev-user-seeding-strategy.md), [0007](architecture/decisions/0007-react-cache-for-layout-page-shared-queries.md), [0008](architecture/decisions/0008-server-action-pattern.md), [0009](architecture/decisions/0009-revalidation-strategy.md), [0010](architecture/decisions/0010-sidebar-interactivity-design.md)

### 2. 인증 (NextAuth) + 데이터 소유권
- **상태**: 완료
- **관련 엔티티**: User
- **설명**: NextAuth v4 기반 로그인/세션 관리. Google OAuth + 개발용 Credentials. JWT 세션 전략. Proxy(전역 인증) + layout(소유권 검증) 조합. 사이드바 프로필 + 인라인 로그아웃 메뉴.
- 기획: [plan/features/2-auth.md](plan/features/2-auth.md) (v0.3)
- 디자인: [design/features/2-auth.md](design/features/2-auth.md) (v0.1)
- 디자인 레퍼런스: [design/references/2-auth/](design/references/2-auth/)
- 관련 ADR: [0011](architecture/decisions/0011-auth-session-and-route-protection.md), [0012](architecture/decisions/0012-dev-credentials-provider.md)

### 3. Liner 뷰: Chat 기반 AI 대화 (SSE 스트리밍) + 출처·인용 배지
- **상태**: 완료
- **관련 엔티티**: Chat, Message, Asset(Reference — stub)
- **설명**: 현재 Chat에 메시지 전송, LLM SDK(Anthropic/Gemini 듀얼)로 SSE 스트리밍 응답 처리. 응답 본문 내 `[n]` 출처 배지(인라인) + 우측 출처 패널(stub 데이터). 사이드바 Project 트리(caret 펼침 + Chat 중첩) + 최근 기록 섹션(cross-project recent). **학습 핵심: SSE 저수준 직접 구현** 완료.
- 기획: [plan/features/3-liner.md](plan/features/3-liner.md) (v0.5)
- 디자인: [design/features/3-liner.md](design/features/3-liner.md) (v0.2)
- 관련 ADR: [0013](architecture/decisions/0013-llm-provider-abstraction.md)
- 남은 기술 부채: [T-005](architecture/tech-debt.md#t-005) (ResponseActions stub 아이콘 미구현). T-004는 기능 4 D4-C에서 해소됨.

### 4. Asset 관리 (Reference + Document) + 미할당 Chat
- **상태**: 완료 (코드 구현 기준. 브라우저 수동 검증은 사용자 확인)
- **관련 엔티티**: Asset, Chat
- **설명**: Reference 저장(URL, 텍스트 스니펫), Document 생성·목록·삭제 (Composition 모델 기반, 0/1/N개 Chat을 재료로). Project 할당·미할당 상태 모두 지원. 미할당 top-level 라우트(`/liner`, `/write`, `/references`) 도입, 사이드바 전역 "+ 새 대화" 복귀, Chat ↔ Project 이동 + 유일-재료 Asset 동반. Reference 선택 칩 UI + 시스템 프롬프트 주입 + 출처 배지 실 데이터. 사이드바 Reference 진입점(Project 트리 하위 "자료" 노드 + "최근 기록" 상단 "미할당 자료" 고정 링크, design §2-15) + 빈 상태 URL/텍스트 2버튼 CTA. T-001·T-004 해소. **파일 업로드/파싱은 1차 제외**.
- 기획: [plan/features/4-asset.md](plan/features/4-asset.md) (v0.6)
- 디자인: [design/features/4-asset.md](design/features/4-asset.md) (v0.4)
- 디자인 레퍼런스: [design/references/4-asset/](design/references/4-asset/) (v0.3)
- 관련 ADR: [0014](architecture/decisions/0014-asset-schema-polymorphic-single-table.md) (Asset 스키마), [0015](architecture/decisions/0015-unassigned-route-structure.md) (미할당 라우트), [0016](architecture/decisions/0016-asset-chat-composition-model.md) (Composition 모델)
- D-stage 진행:
  - D1 Prisma 스키마 확장 (Asset 모델): `296db72`
  - D2 Reference CRUD + 임시 검증 페이지: `c1086f6`
  - D3-A Document CRUD + 포워딩 Server Action + Write 뷰 목록: `4737d20`
  - D3-B Chat 응답 포워딩 UI + 사이드바 뷰별 전환: `359c860`
  - Composition 모델 전환 (도메인 모델 v0.4 + ADR-0016 + PM v0.4 + 스키마 마이그레이션 + 구현 전면 재작성): docs `66d9a85`, impl `bd5a08d`
  - D4-A 미할당 라우트 + `(app)` Route Group 공통 layout hoist: `768c5a8`
  - D4-B 사이드바 전역 "+ 새 대화" 버튼: `e8b27f7`
  - D4-C T-004 해소 (재시도 시 user 메시지 중복 저장 방지): `eb9b784` (해시 기록 `2cb57a8`)
  - D5 Chat ↔ Project 이동 + 유일-재료 Asset 동반 (PM v0.5 + Design v0.3): `677d182`
  - D6-A Reference 선택 UI + referencedAssetIds 저장: `68869ce`
  - D6-B Reference 시스템 프롬프트 주입 + Citation 실 데이터: `adff47b`
  - D7 사이드바 Reference 진입점 + 미할당 `/references` 페이지 + 빈 상태 2버튼 CTA + Design v0.4 §2-15: (커밋 대기)

### 5. Write 뷰: Document Asset 편집 (TipTap) + AI 수정 제안 Before/After 비교
- **상태**: 후보 — 착수 대기 (기능 4 완료)
- **관련 엔티티**: Asset(Document)
- **설명**: Document Asset을 TipTap으로 편집. 선택 영역을 AI에 보내 수정안 수신, 취소선/하이라이트 diff로 제안 표시, 사용자가 선택적으로 적용. **인용 찾기는 1차 제외**. **Reference 첨부 UI가 이 기능에서 1급 편입 예정** — Write 뷰의 AI 호출(선택 영역 → 수정 제안) 요청 폼에 Reference 선택을 포함 (기능 4에서는 Liner 뷰 전용으로 구현, 기능 5 범위로 이관 결정 — PM v0.6 §5, D6 사용자 피드백 2026-04-22 참조). T-005(ResponseActions stub 아이콘)도 이 기능의 Write AI 수정 제안 UI와 일관 구현 고려.

### 6. Scholar 뷰: 3패널 워크스페이스
- **상태**: 후보
- **관련 엔티티**: Project, Asset, Chat (모두 현재 Project 스코프)
- **설명**: 현재 Project의 Asset 목록(좌) + 선택된 Document 편집기(중) + 현재 Project의 Chat(우)을 한 화면에 동시에 표시. 3번·5번 기능의 컴포넌트를 재배치하므로 **신규 구현은 레이아웃 셸뿐**. 상단 토글 버튼으로 각 패널 표시 제어.

## 2차 이후 후보

1차 MVP 완성 후 검토할 기능들. 상황에 따라 재평가.

- 파일 업로드/파싱 (PDF / DOCX / HWP)
- 인용 찾기 (Write 본문 선택 → Liner 검색으로 근거 탐색)
- Document에서 Reference를 `@` 멘션으로 인용 삽입 (기능 5 Write Reference 첨부 UI가 도입된 이후)
- Scholar 뷰의 Chat 패널이 현재 편집 중 Document를 자동 컨텍스트로 포함
- **Zustand 부분 마이그레이션 + 성능 비교** (상태 관리 학습 프로세스 2단계)

---

<!--
기능 단위 문서 추가 시 템플릿:

## [기능명]
- **상태**: 후보 / 기획 중 / 디자인 중 / 구현 중 / QA 중 / 완료
- **관련 엔티티**: ...
- 기획: plan/features/[기능명].md
- 디자인: design/features/[기능명].md
- 구현: develop/ 내 관련 경로 (예: app/liner/..., lib/llm/..., prisma/schema.prisma)
- QA: qa/features/[기능명].md
-->
