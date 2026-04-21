---
document: 도메인 모델
version: 0.4
last_updated: 2026-04-21
---

# 도메인 모델

이 문서는 **linor-cloning-liner의 핵심 데이터 구조**를 정의한다. 모든 역할(PM / Designer / Developer / QA)이 기능 명세·화면 설계·구현·테스트 설계 시 이 문서를 **단일 진실 소스**로 참조한다.

## 공통 컨벤션

이 절은 모든 엔티티에 일괄 적용되는 규칙이다.

- **ID 형식**: 모든 엔티티의 `id`는 **cuid** (Prisma `@default(cuid())`, cuid v1). URL segment(`/p/[projectId]/liner`)에 그대로 노출되므로 짧고 URL-safe해야 한다. cuid2는 별도 라이브러리가 필요하고 cuid1과 실용적 차이가 거의 없어 Prisma 네이티브 지원을 따른다. uuid v4(36자에 dash 포함)나 auto-increment int(enumeration 위험)는 채택하지 않는다.
- **타임스탬프**: 모든 엔티티는 `created_at`을 가진다. 생성 후 수정 가능한 엔티티는 `updated_at`도 가진다 (DB 또는 애플리케이션이 수정 시점에 갱신).
- **삭제 정책**: **hard delete만 사용한다**. soft delete(`deleted_at` 컬럼 + 필터)는 MVP 범위에서 도입하지 않는다. 1인 학습 프로젝트라 휴지통/복구 UX의 가치보다 스키마·쿼리 복잡도가 더 크다. 필요해지면 별도 ADR로 도입한다.
- **소유자 검증**: 모든 조회·수정·삭제 쿼리는 `user_id` 일치 여부를 함께 검증한다. 인증 도입(기능 2) 이후 Route Handler 레벨에서 일관 적용.

## 핵심 원칙

**소유(ownership)와 참조(reference / provenance)를 분리한다.** 엔티티 간 "누가 만들었다"는 관계는 소유 계층이 아니라 메타데이터로 기록한다.

- **소유**: User가 최상위 소유자이며, Project는 **선택적 그룹핑 단위**(폴더 같은 것)
- **참조**: `origin_chat_id`, `referenced_asset_ids`, `generated_asset_id` 같은 메타데이터 필드로 표현

이 원칙이 깨지면 "Chat을 삭제하면 Document도 사라지는가?", "같은 Document를 여러 Chat에서 쓸 수 있는가?", "Chat을 Project로 이동하면 Document도 강제 이동되는가?" 같은 결정이 지저분해진다.

## 엔티티

### User
- 시스템의 최상위 소유자
- NextAuth가 관리하는 인증 주체
- Projects, Chats, Assets를 직접 소유
- 필드: `id`, `email`, `name?`, `image?`, `created_at`, `updated_at`
  - `email`은 필수 (로그인 식별자)
  - `name`, `image`는 OAuth 프로바이더에서 받아오는 값으로 nullable
- **MVP 1단계(인증 도입 전) 임시 user**: 기능 1 구현 시점에서는 NextAuth가 아직 없으므로, 시드 또는 마이그레이션으로 단일 임시 user를 생성해 두고 모든 엔티티가 그 `user_id`를 사용한다. 기능 2(NextAuth)에서 실제 user 모델로 교체된다.

### Project
- **선택적 그룹핑 단위**. 폴더와 비슷하다.
- 필드: `id`, `user_id`, `name`, `created_at`, `updated_at`
- 여러 Chat/Asset을 묶을 수 있지만, Project 없이 존재하는 Chat/Asset도 유효하다.

### Chat
- AI와의 대화 세션
- 필드: `id`, `user_id`, `project_id?`, `title`, `created_at`, `updated_at`
- `project_id`는 **선택적** — 대화 시작 시 Project가 없어도 되고, 나중에 할당할 수 있다.
- 여러 Message를 가진다.

### Message
- Chat 내 개별 메시지
- 필드: `id`, `chat_id`, `role` (`user` | `assistant` | `system`), `content`, `created_at`, `updated_at`
- 참조 메타데이터:
  - `referenced_asset_ids[]`: 이 메시지가 컨텍스트로 사용한 Asset 목록
- 출처(citation) 정보: 응답 본문 내 `[n]` 마커와 대응되는 배열. Liner 뷰의 출처 배지가 이 데이터를 읽는다.
- **`updated_at`이 변하는 시점** (사용자 직접 편집은 MVP 범위 밖):
  - SSE 스트리밍 중 어시스턴트 응답이 청크 단위로 incremental persist될 때
  - 응답 생성 완료 후 citation 메타데이터가 부착될 때
  - 재생성(regenerate) 흐름에서 응답 본문이 교체될 때 (있을 경우)

> v0.4 변경: **`generated_asset_id?` 필드 제거**. "Message가 Asset을 생성한다"는 역방향 관계는 composition 모델에서 중복·혼란의 원인이었다. Document-Chat 관계는 이제 `Asset.source_chat_ids[]`에서 Document 쪽이 소유한다. 설계 근거 §Composition 섹션 참조.

### Asset (Polymorphic)
- 프로젝트의 자산. 두 가지 타입이 있다.
- 공통 필드: `id`, `user_id`, `project_id?`, `type`, `title`, `source_chat_ids[]`, `created_at`, `updated_at`
- 타입별 데이터:
  - **Document**: TipTap(ProseMirror) JSON 구조
  - **Reference**: `reference_kind` (`url` | `text` | `file`) + 해당 종류의 페이로드
- `source_chat_ids[]`: **Composition 메타데이터**. 이 Asset이 "재료로 삼은" Chat들의 ID 배열.
  - **Document**: 재료 Chat 여러 개 (기본 플로우). 빈 배열이면 순수 빈 Document.
  - **Reference**: 보통 비어있음(Reference는 직접 저장). Chat 대화 중 저장된 경우 그 Chat ID가 들어감 — 옵션적 메타데이터.
  - 빈 배열 기본값. Chat 삭제 시 해당 ID만 배열에서 제거 (Asset은 생존).

## 관계

```
User (1) ─< (n) Project             [owner]
User (1) ─< (n) Chat                [owner, chat.project_id?]
User (1) ─< (n) Asset               [owner, asset.project_id?]
Chat (1) ─< (n) Message
Message (n) ─> (m) Asset            [message.referenced_asset_ids]
Asset (n) ─> (m) Chat               [asset.source_chat_ids] — composition
```

composition 화살표는 **Document가 여러 Chat을 재료로 안는 관계**다. Chat 응답 1건을 내보내는 것(단일 재료)도, Write 뷰에서 여러 Chat을 선택해 통합 Document를 만드는 것(다중 재료)도 모두 이 한 축에서 표현된다. Asset 쪽이 배열 FK를 들고 있어 Document 관점의 composition이 1급 관계.

## 뷰(View) ↔ 모델 매핑

이 앱의 "세 서비스"는 독립된 서비스가 아니라 **같은 데이터 위의 세 개의 뷰(모드)** 다.

| 뷰 | 주 데이터 | 동작 |
|---|---|---|
| **Liner 뷰** (검색·대화) | Chat, Message, Asset(Reference) | 현재 Chat에 대해 AI 대화. 선택된 Reference Asset들을 컨텍스트로 주입. 응답 내 출처 배지를 표시. |
| **Write 뷰** (문서 편집) | Asset(Document) | 하나의 Document Asset을 TipTap으로 편집. AI 수정 제안 Before/After 비교. |
| **Scholar 뷰** (3패널 워크스페이스) | Project, Assets, 선택된 Document, Chat | 현재 Project의 Assets(좌) + 선택된 Document Asset 편집기(중) + 현재 Project의 Chat(우)을 한 화면에 동시에. 3번·5번 컴포넌트를 재배치할 뿐이다. |

## 행동 규칙

### Project 미할당 상태
- 사용자가 "새 Chat"을 시작하면 `project_id=null`로 생성된다.
- 이 상태의 Chat이 만든 Asset도 기본적으로 `project_id=null`이다.
- 사용자는 언제든 Chat에 Project를 할당할 수 있다. 이때 "이 Chat이 만든 Asset도 함께 이동할까?"를 **옵션으로** 제공한다 (강제가 아님).

### Asset 독립 생성
- Document Asset은 Chat 없이 Write 뷰에서 직접 생성할 수 있다. 이때 `source_chat_ids=[]`이다 (빈 재료).
- Reference Asset도 Chat 없이 직접 저장할 수 있다. 이때 `source_chat_ids=[]`.

### Composition (Document 재료 구성)
- Document는 생성 시 0~N개의 Chat을 "재료"로 취할 수 있다 (`source_chat_ids[]`).
- **0개**: 순수 빈 Document. Write 뷰에서 "+ 새 Document"로 생성한 경우.
- **1개**: 단일 Chat을 재료로 — Chat 응답 하단 "이 Chat을 재료로 새 Document" 지름길.
- **N개**: 여러 Chat을 재료로 — Write 뷰에서 "+ 새 Document" 시 Chat 체크박스로 복수 선택.
- 초기 콘텐츠: 재료 Chat들의 콘텐츠(전체 대화 또는 어시스턴트 응답 — 생성 시 선택)를 concat한 초안이 `documentContent`에 채워진다. 편집은 Write 뷰에서 이어감.
- 같은 Chat이 여러 Document의 재료가 될 수 있다 (다대다). Chat은 재료로 소비되어도 원상태 유지 (읽기 전용 관계).

### 다중 참조
- 하나의 Document가 여러 Chat의 여러 Message에 의해 참조될 수 있다. Document는 참조 횟수와 무관하게 자기 자리를 유지한다. (`Message.referenced_asset_ids`)
- 반대로 하나의 Chat이 여러 Document의 재료로 쓰일 수 있다. Chat도 재료 사용 횟수와 무관하게 자기 자리를 유지한다. (`Asset.source_chat_ids`)

### 삭제 동작
- **User 삭제**: 모든 소유 엔티티 cascade 삭제
- **Project 삭제**: 소속 Chat/Asset은 삭제되지 않고 `project_id=null`로 복귀 (또는 사용자 확인 후 cascade 선택)
- **Chat 삭제**: Messages cascade 삭제. 이 Chat을 재료로 삼던 Asset의 `source_chat_ids`에서 해당 ID만 제거 (**Asset은 생존**, 콘텐츠는 건드리지 않음 — 이미 Document에 반영된 재료는 유지)
- **Asset 삭제**: 해당 Asset을 참조하던 Message의 `referenced_asset_ids`에서 제거 (`generated_asset_id`는 v0.4에서 폐지됨)

## 설계 근거

### 왜 Document를 Chat 하위로 두지 않는가?

아래 사용 시나리오들이 깨지기 때문:

1. **다중 참조**: 하나의 Document를 여러 Chat이 참조·수정 — Document가 한 Chat에 묶여 있으면 불가능해진다.
2. **이동 유연성**: Chat을 Project로 이동할 때 Document가 강제 이동되는 cascade는 사용자가 원하는 동작이 아닐 수 있다.
3. **삭제 cascade**: Chat 삭제 시 Document까지 같이 사라지는 건 대부분의 사용자 기대와 어긋난다.
4. **독립 편집**: Chat 없이 Write 뷰에서 Document를 직접 만드는 경로가 자연스러워야 한다.

### 왜 Project를 선택적으로 두는가?

원본 Liner의 약점(검색은 Space 단위, 편집은 Project 단위로 분리)을 피하기 위해 **통합 Project 모델**을 도입한다. 하지만 "새 Chat을 빠르게 시작"하는 사용자 습관을 막지 않기 위해 **Project 미할당 상태를 허용**한다.

Project는 "필요할 때 붙이는 그룹핑"이지 "반드시 먼저 만들어야 하는 필수 계층"이 아니다.

### 왜 Chat과 Asset을 동등한 피어로 두는가?

둘 다 User 아래 직접 소속되는 최상위 엔티티로 두면:
- 어느 쪽이든 독립적으로 생성·조회·삭제 가능
- Project 할당 여부가 둘에게 동일하게 적용
- 관계(`source_chat_ids`, `referenced_asset_ids`)는 메타데이터일 뿐이라 어느 한쪽이 사라져도 다른 쪽이 고아가 되지 않음

### 왜 Message→Asset FK를 폐지하고 Document 중심 composition으로 전환했는가? (v0.4)

v0.3은 "이 Message가 이 Document를 만들었다"를 `Message.generated_asset_id`로 표현했다. 기능 4 D3 구현 중 아래 문제가 드러났다:

1. **단일 FK가 다중 재료를 표현할 수 없다.** 여러 Chat의 내용을 하나의 Document 재료로 합치는 사용자 요구가 있을 때, Message 쪽 단일 FK로는 "이 Document를 만든 여러 Message"를 표현 불가. Message 쪽에 여러 Document 레코드를 중복 생성하거나 별도 join 테이블이 필요.
2. **행위 주체가 거꾸로.** 사용자 멘탈 모델에서 Document는 "생성된 결과물"이 아니라 "작성 중인 산출물"이고, Chat은 "재료"다. FK가 Message에 있으면 Message가 주체로 보이지만 실제 주체는 Document.
3. **카디널리티 미스매치.** 같은 Chat(응답)이 여러 Document의 재료가 될 수 있지만, `Message.generated_asset_id`가 단일 FK라 "한 번 재료로 쓰면 다시 못 씀"이라는 잘못된 제약이 생긴다.

**해소**: Composition을 Document 쪽에서 소유하는 구조로 전환.
- `Asset.source_chat_ids[]`가 1급 관계. 0~N개의 Chat을 재료로 표현 가능.
- `Message.generated_asset_id` 제거. 역방향 FK는 중복이자 혼란의 원인.
- 단일 재료 지름길(Chat 응답 하단 버튼)도 다중 선택 플로우(Write 뷰 모달)도 한 축에서 자연스럽게 표현된다.
- 상세 결정·대안 비교는 [ADR-0016](decisions/0016-asset-chat-composition-model.md).

## Changelog

- 0.4 (2026-04-21): **Composition 모델로 전환** — `Asset.origin_chat_id?`(단일) → `Asset.source_chat_ids[]`(배열). `Message.generated_asset_id?` 제거. 관계 다이어그램에서 Message→Asset 생성 화살표 제거, Asset→Chat composition 화살표로 대체. 행동 규칙 §Asset 독립 생성·§Composition·§다중 참조·§삭제 동작 재작성. 설계 근거에 전환 사유 섹션 추가 (기능 4 D3 구현 중 사용자 피드백 반영, [ADR-0016](decisions/0016-asset-chat-composition-model.md)). Message.updated_at 변경 시점에서 `generated_asset_id` 부착 항목 제거.
- 0.3 (2026-04-15): ID 형식을 `cuid2` → `cuid`(Prisma 네이티브 v1)로 정정. cuid2는 별도 라이브러리 필요하고 실용적 차이 없어 Prisma 네이티브 지원을 따른다.
- 0.2 (2026-04-15): 공통 컨벤션 절 신설(ID 형식 cuid2, 타임스탬프 정책, hard delete, 소유자 검증). User 엔티티 필드 명시(email/name/image/timestamps)와 MVP 1단계 임시 user 정책 추가. Message에 `updated_at` 추가 및 변경 시점(스트리밍 청크 누적, citation 부착, 재생성) 명시.
- 0.1 (2026-04-14): 초안 작성. Project / Chat / Asset 3축 모델, 소유-참조 분리 원칙, 뷰 매핑 및 행동 규칙 정의.
