# 기능 인덱스

이 문서는 기능별 산출물의 위치와 상태를 추적한다. 오케스트레이터가 Phase 4(보고) 시 자동 업데이트한다.

모든 기능은 [`architecture/domain-model.md`](architecture/domain-model.md)의 도메인 모델(Project / Chat / Asset) 위에서 정의된다.

## 상태 표기

- **후보**: MVP 후보로 식별된 상태 (기획 착수 전)
- **기획 중**: PM이 기능 명세 작성 중
- **디자인 중**: Designer가 화면 설계 중
- **구현 중**: Developer가 구현 중
- **QA 중**: QA가 테스트 중
- **완료**: 모든 역할 산출물 완료

## 1차 MVP 기능

도메인 모델 기반으로 정리한 6개 기능. 각 기능은 특정 엔티티·뷰와 매핑된다.

### 1. 통합 앱 셸 + Project 생성/전환
- **상태**: 후보
- **관련 엔티티**: Project, User
- **설명**: 260px 접기 가능 사이드바, 중앙 메인 패널, 뷰 전환(Liner / Write / Scholar). 현재 Project 선택·생성·삭제. 라이너 원본 UI편 레이아웃을 기준.

### 2. 인증 (NextAuth) + 데이터 소유권
- **상태**: 후보
- **관련 엔티티**: User
- **설명**: NextAuth 기반 로그인/세션 관리. Project·Chat·Asset 모두 `user_id`로 소유자 구분. 1인 사용이지만 데이터 구조·NextAuth 심층 기능 학습이 목표.

### 3. Liner 뷰: Chat 기반 AI 대화 (SSE 스트리밍) + 출처·인용 배지
- **상태**: 후보
- **관련 엔티티**: Chat, Message, Asset(Reference)
- **설명**: 현재 Chat에 메시지 전송, Anthropic SDK로 SSE 스트리밍 응답 처리. 선택된 Reference Asset들을 컨텍스트로 주입. 응답 본문 내 `[n]` 출처 배지를 클릭하면 원문/근거 표시. **학습 핵심: SSE 저수준 직접 구현**.

### 4. Asset 관리 (Reference + Document)
- **상태**: 후보
- **관련 엔티티**: Asset
- **설명**: Reference 저장(URL, 텍스트 스니펫), Document 생성·목록·삭제. Project 할당·미할당 상태 모두 지원. **파일 업로드/파싱(PDF·DOCX·HWP)은 1차 제외** — 복잡도 대비 학습 가치 낮음.

### 5. Write 뷰: Document Asset 편집 (TipTap) + AI 수정 제안 Before/After 비교
- **상태**: 후보
- **관련 엔티티**: Asset(Document)
- **설명**: Document Asset을 TipTap으로 편집. 선택 영역을 AI에 보내 수정안 수신, 취소선/하이라이트 diff로 제안 표시, 사용자가 선택적으로 적용. **인용 찾기는 1차 제외**.

### 6. Scholar 뷰: 3패널 워크스페이스
- **상태**: 후보
- **관련 엔티티**: Project, Asset, Chat (모두 현재 Project 스코프)
- **설명**: 현재 Project의 Asset 목록(좌) + 선택된 Document 편집기(중) + 현재 Project의 Chat(우)을 한 화면에 동시에 표시. 3번·5번 기능의 컴포넌트를 재배치하므로 **신규 구현은 레이아웃 셸뿐**. 상단 토글 버튼으로 각 패널 표시 제어.

## 2차 이후 후보

1차 MVP 완성 후 검토할 기능들. 상황에 따라 재평가.

- 최근 기록 / 서비스 간 탐색 (사이드바의 최근 Chat·Asset 목록)
- 파일 업로드/파싱 (PDF / DOCX / HWP)
- 인용 찾기 (Write 본문 선택 → Liner 검색으로 근거 탐색)
- Chat을 Project로 할당할 때 "이 Chat이 만든 Asset도 함께 이동" 옵션 UI
- Document에서 Reference를 `@` 멘션으로 인용 삽입
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
