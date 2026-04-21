---
adr: 0016
title: Asset-Chat 관계를 Document 중심 composition 모델로 전환
status: Accepted
date: 2026-04-21
---

# ADR-0016: Asset-Chat 관계를 Document 중심 composition 모델로 전환

## Status

Accepted — ADR-0014를 보완한다 (폐기하지 않음: 스키마 표현 방식은 ADR-0014의 단일 polymorphic 테이블 유지).

## Context

기능 4 D3(Document Asset CRUD + 포워딩)의 UI(D3-B) 구현 후 사용자 리뷰에서 두 가지 피드백이 나왔다.

1. **"Document로 내보내기" 버튼의 시각적 강조 부족** — 상대적으로 가벼운 시각 조정 이슈.
2. **"여러 Chat을 재료로 한 Document 생성이 안 된다"** — 구조적 이슈.

2번을 파고든 결과, 도메인 모델 v0.3이 채택한 **Message → Asset 단일 FK(`Message.generated_asset_id`)** 방식이 다음 문제를 동시에 안고 있음이 드러났다.

### 1. 단일 FK가 다중 재료를 표현할 수 없다

`Message.generated_asset_id: String?` 는 한 Message가 한 Document를 만든다는 1:1 관계다. 사용자 요구 "여러 Chat의 내용을 합쳐 하나의 Document로" 를 표현하려면:

- **회피 1**: 각 Message마다 별도 Document 레코드를 만든 뒤 애플리케이션 레이어에서 concat — 데이터 중복, 단일 Document 조회 시 N번 JOIN
- **회피 2**: 별도 join 테이블 `DocumentSource { documentId, messageId }` 신설 — 모델 복잡도 +1, Prisma 관계 레이어 확장
- **회피 3**: 구현하지 않고 "단일 Chat만 가능" 제약을 남김 — 사용자 요구 미충족

어느 회피도 깔끔하지 않다.

### 2. 행위 주체가 멘탈 모델과 반대

v0.3의 이름 "`generated_asset_id`"는 "**Message가** Asset을 **생성한**다"를 함의한다. 이 뷰에서 행위 주체는 Message.

그러나 사용자 멘탈 모델에서는 주체가 Document다:
- "이메일에 파일 **첨부**하듯이 Chat을 문서 재료로 **붙인**다"
- Document는 **작성 중인 산출물**, Chat은 **재료**

FK가 Message 쪽에 있으면 Message가 주체로 보이고, 이 방향이 "Document는 메시지의 부산물"이라는 잘못된 암시를 준다.

### 3. 카디널리티 미스매치 — 재사용 불가

`Message.generated_asset_id?`가 1:1이라 한 Message(Chat 응답)가 재료로 쓰이면 **그 응답은 더 이상 다른 Document의 재료가 될 수 없다**(FK 덮어쓸 수밖에 없음). 하지만 실제로:

- 같은 Chat 응답이 여러 Document의 재료가 되는 것은 자연스럽다 (같은 조사를 두 번 다르게 활용).
- "이미 내보낸 응답"을 또 내보내는 것이 구조적으로 막혀야 할 이유가 없다.

v0.3 구현(D3-B)은 이를 UX로 방지하려고 "이미 Document로 내보내졌습니다" 에러를 추가했으나, 이건 **근본 문제의 증상 은폐**였다.

## Decision

**Asset 쪽이 Chat들을 배열 FK로 안는 composition 모델로 전환한다.**

### 1. `Asset.source_chat_ids: String[]`를 1급 관계로

Document가 "재료로 삼은" Chat들의 ID 배열. 0~N개 가능. Prisma 스칼라 배열 필드 + 애플리케이션 레이어 검증(Chat 존재·소유권)으로 구현 — ADR-0014가 이미 `Message.referenced_asset_ids`에서 채택한 패턴과 동일.

### 2. `Asset.origin_chat_id?` 폐지

v0.3의 단일 `origin_chat_id`는 `source_chat_ids`에 자연스럽게 흡수된다. "원본 Chat 단 하나"라는 개념을 유지할 필요가 없어진다.

### 3. `Message.generated_asset_id?` 폐지

역방향 FK는 composition 관점에서 중복 정보다. Document가 "어느 Chat들을 재료로 썼는가"를 `source_chat_ids`로 조회 가능하므로 Message 쪽 FK는 삭제.

### 4. Server Action 통합

- v0.3의 `forwardMessageToDocument({ messageId, title? })` 제거
- `createDocument({ title, projectId?, sourceChatIds?: string[] })` 단일 API로 통합
  - `sourceChatIds=[]` 또는 미전달 → 빈 Document (시나리오 5-a)
  - `sourceChatIds=[chatId]` → 단일 재료 Document (Chat 응답 하단 지름길, 기존 포워딩의 후속)
  - `sourceChatIds=[chat1, chat2, ...]` → 다중 재료 Document (시나리오 5-c, D3 범위 내 지원)
- 초기 `documentContent` 생성: 재료 Chat들의 콘텐츠를 concat한 TipTap doc 구조

### 5. UI 조정

- Chat 응답 하단 "Document로 내보내기" 버튼 유지 — 내부적으로 `createDocument({ sourceChatIds: [currentChatId] })` 호출하는 **지름길**이라는 의미로 재해석
- "이미 Document로 내보내졌습니다 · Document 보기 →" 분기 **제거** — 한 Chat이 여러 Document의 재료가 될 수 있으므로 "이미"라는 개념이 없어짐
- Write 뷰 "+ 새 Document" 모달에 Chat 체크박스 선택 섹션 추가 — 다중 재료 진입점

## 고려한 대안

### 대안 A: v0.3 구조 유지 + 다중 선택은 UX 레이어에서 해결

Message→Asset 1:1 FK를 유지한 채, 다중 Chat 선택 UX는 "각 Chat마다 Document 만든 뒤 합치기"로 애플리케이션에서 우회.

**Pros**:
- 스키마 변경 없음, 기존 D1·D3 코드 유지

**Cons**:
- **데이터 중복**: N개 Chat 재료 Document가 N개의 중간 Document를 남긴다 — 사용자 정리 부담
- **리네임·삭제 복잡성 증가**: 중간 Document들의 생명주기 관리가 필요
- **근본 문제 미해결**: FK 방향과 멘탈 모델 불일치는 남음. 기능 5·6 진행 중 반복 등장 가능성 높음

### 대안 B: 별도 join 테이블 `DocumentSource { documentId, messageId, chatId }`

다대다 관계를 정규화된 join 테이블로 표현.

**Pros**:
- Prisma 관계 레이어에서 표준적으로 표현 가능 (`Asset.sources DocumentSource[]`)
- Message-level 세밀한 추적 (어느 특정 응답을 재료로 썼는지)

**Cons**:
- **모델 복잡도 +1**: 새 테이블 + Prisma 관계 + 마이그레이션
- **조회 JOIN 비용**: Asset 조회 시 source 확인이 JOIN 1회 추가
- **과도한 정규화**: 사용자 멘탈 모델은 "Chat을 재료로" (Chat 단위). Message-level 추적은 1인 학습 프로젝트에서 불필요
- ADR-0014가 이미 `referenced_asset_ids`에서 "스칼라 배열 FK + 애플리케이션 검증" 패턴을 승인 — 동일 패턴을 composition에도 적용하는 것이 일관성

### 대안 C: `Asset.source_chat_id` 단일 유지 + 다중 재료는 별도 필드

v0.3의 `origin_chat_id`를 `source_chat_id`(단수)로 유지하고, 다중 재료는 `additional_source_chat_ids[]`로 별도 배열 필드 추가.

**Pros**:
- "대표 출처" 개념(origin)이 코드에서 유용할 수 있음

**Cons**:
- 두 필드의 의미 구분이 모호 — "대표와 추가"의 구분 규칙이 없음
- 사용자가 "아무 Chat이나 다 재료"라고 생각할 때 불필요한 분류 부담
- 단일+다수 표현이 하나의 배열 필드로 자연스럽게 해결되는데 굳이 분리할 이유 없음

## 결과

### Pros

- **Document 중심 멘탈 모델 정렬**: 사용자의 "문서가 재료를 안는다"는 언어 그대로.
- **다중 재료 1급 지원**: 0~N개 재료를 한 필드로 표현. 시나리오 5-a(빈) / 단일 재료(Chat 응답 지름길) / 시나리오 5-c(다중 선택)가 한 축에서 통합됨.
- **재사용 자유**: 같은 Chat이 여러 Document의 재료가 되는 것을 막는 제약이 자연 제거됨.
- **Message 모델 단순화**: `generated_asset_id` 필드·FK·인덱스 제거로 Message 스키마 경량화.
- **Server Action 통합**: `createDocument` 하나로 빈/단일/다중이 모두 커버됨. API 표면 감소.
- **"이미 내보내졌습니다" 에러 UX 제거**: 근본 문제 해소로 증상 은폐 코드가 사라짐.

### Cons

- **D1 스키마 재마이그레이션 필요**: `assets.origin_chat_id` 컬럼 drop·`source_chat_ids` 컬럼 add, `messages.generated_asset_id` 컬럼 drop·FK 제약 drop. 기존 D3 테스트 데이터는 버리고 fresh start.
- **D3 구현 일부 폐기**: `forwardMessageToDocument` Server Action, `response-actions.tsx`의 "이미 내보내짐" 분기, `Message.generatedAssetId`를 프롭으로 전달하는 체인(`ClientMessage` → `MessageList` → `AssistantMessage`)이 불필요해져 제거/단순화. D3-A의 Write 뷰 목록·Document 편집 placeholder는 그대로 유지.
- **Chat 삭제 시 배열 정리 로직 추가**: Chat 삭제 Server Action이 `Asset.source_chat_ids`에서 해당 ID를 `array_remove`해야 함. 기존 `deleteAsset`의 `Message.referenced_asset_ids` 정리와 동일 패턴이라 신규 기술 부담은 없음.

### 되돌림 기준

향후 다음 조건이 모두 충족되면 재검토:
- 사용자 피드백에서 "재료 관계가 오히려 혼란스럽다" 가 반복 제기
- Message-level 추적(어느 특정 응답을 재료로 썼는가)이 실제 UX에 필요해짐
- Join 테이블로 정규화하는 비용이 스칼라 배열 FK의 애플리케이션 검증 비용보다 싸짐

이들 중 하나라도 해당하면 대안 B를 재평가한다.

## 연관 결정

- **[ADR-0014](0014-asset-schema-polymorphic-single-table.md)**: 단일 polymorphic 테이블 유지. 이 ADR은 해당 테이블의 필드 구성을 조정하는 것이지 테이블 구조 자체를 바꾸는 것이 아니다.
- **도메인 모델 v0.4**: 이 ADR의 구현. `Asset.source_chat_ids[]` + `Message.generated_asset_id` 제거가 모델에 반영됨.
- **PM 명세 v0.4**: 시나리오 5-b 재작성 + 시나리오 5-c(다중 재료) 1급 지원으로 승격.
- **기능 5(Write 뷰)**: Document 편집 중 "이 Document에 Chat 추가" 기능이 자연스럽게 확장됨 (`source_chat_ids`에 append).

## References

- `architecture/domain-model.md` v0.4 §Composition 섹션
- `plan/features/4-asset.md` v0.4 §2 시나리오 + §5 결정 요약
- D3-B 사용자 피드백 (2026-04-21): "포워딩이라 하면 결국, 문서 생성을 처음 할 때 채팅에 첨부파일을 포함하는 것과 같은 개념 아냐? 이게 문서에 종속되니까 FK가 다중이 가능하니 하나만 되니 하는 문제에 직면하는 것 같은데."
