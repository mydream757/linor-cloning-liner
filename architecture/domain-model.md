---
document: 도메인 모델
version: 0.2
last_updated: 2026-04-15
---

# 도메인 모델

이 문서는 **linor-cloning-liner의 핵심 데이터 구조**를 정의한다. 모든 역할(PM / Designer / Developer / QA)이 기능 명세·화면 설계·구현·테스트 설계 시 이 문서를 **단일 진실 소스**로 참조한다.

## 공통 컨벤션

이 절은 모든 엔티티에 일괄 적용되는 규칙이다.

- **ID 형식**: 모든 엔티티의 `id`는 **cuid2** (Prisma `@default(cuid(2))` 또는 동등). URL segment(`/p/[projectId]/liner`)에 그대로 노출되므로 짧고 URL-safe해야 한다. uuid v4(36자에 dash 포함)나 auto-increment int(enumeration 위험)는 채택하지 않는다.
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
  - `generated_asset_id?`: 이 메시지가 생성한 Asset (어시스턴트 응답이 새 Document를 만든 경우 등)
- 출처(citation) 정보: 응답 본문 내 `[n]` 마커와 대응되는 배열. Liner 뷰의 출처 배지가 이 데이터를 읽는다.
- **`updated_at`이 변하는 시점** (사용자 직접 편집은 MVP 범위 밖):
  - SSE 스트리밍 중 어시스턴트 응답이 청크 단위로 incremental persist될 때
  - 응답 생성 완료 후 citation 메타데이터·`generated_asset_id`가 부착될 때
  - 재생성(regenerate) 흐름에서 응답 본문이 교체될 때 (있을 경우)

### Asset (Polymorphic)
- 프로젝트의 자산. 두 가지 타입이 있다.
- 공통 필드: `id`, `user_id`, `project_id?`, `type`, `title`, `origin_chat_id?`, `created_at`, `updated_at`
- 타입별 데이터:
  - **Document**: TipTap(ProseMirror) JSON 구조
  - **Reference**: `reference_kind` (`url` | `text` | `file`) + 해당 종류의 페이로드

## 관계

```
User (1) ─< (n) Project             [owner]
User (1) ─< (n) Chat                [owner, chat.project_id?]
User (1) ─< (n) Asset               [owner, asset.project_id?]
Chat (1) ─< (n) Message
Message (n) ─> (m) Asset            [message.referenced_asset_ids]
Message (0..1) ─> (1) Asset         [message.generated_asset_id]
Asset (0..1) ─> (1) Chat            [asset.origin_chat_id]
```

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
- Document Asset은 Chat 없이 Write 뷰에서 직접 생성할 수 있다. 이때 `origin_chat_id=null`이다.
- Reference Asset도 Chat 없이 직접 저장할 수 있다.

### 다중 참조
- 하나의 Document가 여러 Chat의 여러 Message에 의해 참조될 수 있다. Document는 참조 횟수와 무관하게 자기 자리를 유지한다.

### 삭제 동작
- **User 삭제**: 모든 소유 엔티티 cascade 삭제
- **Project 삭제**: 소속 Chat/Asset은 삭제되지 않고 `project_id=null`로 복귀 (또는 사용자 확인 후 cascade 선택)
- **Chat 삭제**: Messages cascade 삭제. `origin_chat_id`가 이 Chat을 가리키던 Asset은 `origin_chat_id=null`로 업데이트 (**Asset은 생존**)
- **Asset 삭제**: 해당 Asset을 참조하던 Message의 `referenced_asset_ids`에서 제거, `generated_asset_id`는 null

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
- 관계(`origin_chat_id`, `referenced_asset_ids`)는 메타데이터일 뿐이라 어느 한쪽이 사라져도 다른 쪽이 고아가 되지 않음

## Changelog

- 0.2 (2026-04-15): 공통 컨벤션 절 신설(ID 형식 cuid2, 타임스탬프 정책, hard delete, 소유자 검증). User 엔티티 필드 명시(email/name/image/timestamps)와 MVP 1단계 임시 user 정책 추가. Message에 `updated_at` 추가 및 변경 시점(스트리밍 청크 누적, citation 부착, 재생성) 명시.
- 0.1 (2026-04-14): 초안 작성. Project / Chat / Asset 3축 모델, 소유-참조 분리 원칙, 뷰 매핑 및 행동 규칙 정의.
