---
adr: 0014
title: Asset 스키마를 단일 polymorphic 테이블 + 개별 nullable 컬럼 하이브리드로 표현
status: Accepted
date: 2026-04-21
---

# ADR-0014: Asset 스키마를 단일 polymorphic 테이블 + 개별 nullable 컬럼 하이브리드로 표현

## Status

Accepted

## Context

기능 4(Asset 관리) 기획 명세에서 도메인 모델의 **Asset** 엔티티를 Prisma 스키마로 어떻게 표현할지 결정해야 한다. 도메인 모델(`architecture/domain-model.md` v0.3)은 Asset을 **polymorphic**으로 정의했다.

- 공통 필드: `id`, `user_id`, `project_id?`, `type`, `title`, `origin_chat_id?`, `created_at`, `updated_at`
- 타입별 데이터:
  - **Document**: TipTap(ProseMirror) JSON
  - **Reference**: `reference_kind` (`url` | `text` | `file`) + 해당 종류의 페이로드 (이번 MVP에서는 `file` 제외)

이 polymorphic 구조를 Prisma로 표현하는 방식이 세 가지 있고, 각각 장단점이 뚜렷하다. 관련 제약이 아래 3가지다.

### 1. Message의 polymorphic 참조

기능 3에서 `Message.referencedAssetIds: String[]`과 `Message.generatedAssetId?: String` 필드가 이미 스키마에 존재한다. 이 필드는 도메인 모델상 **Reference와 Document 둘 다**를 가리킬 수 있다(Reference만 아님 — 예컨대 Chat이 생성한 Document를 후속 메시지가 참조할 수 있음). 즉 Message는 **polymorphic FK**를 들고 있어야 한다.

### 2. 공통 조회 패턴

- 사이드바 Asset 목록 (Scholar 뷰 좌측 패널, 기능 6)
- 미할당 Asset 목록
- "이 Project의 모든 Asset"

이런 쿼리는 Document·Reference를 **구분 없이** 한 번에 불러야 한다.

### 3. 학습 가치

1인 학습 프로젝트라 "Prisma에서 polymorphic을 어떻게 표현하는가"의 정공법을 직접 경험하는 것이 가치 있다. 과도한 추상화·해킹을 피하되, Prisma가 기본 제공하지 않는 기능을 어떻게 보완하는지를 학습 지점으로 삼는다.

## Decision

**단일 polymorphic 테이블 + 개별 nullable 컬럼 하이브리드**를 채택한다.

### 스키마 골격

```prisma
model Asset {
  id             String    @id @default(cuid())
  userId         String
  projectId      String?
  type           AssetType            // 'document' | 'reference'
  title          String
  originChatId   String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Reference 전용 (type='reference'일 때만 채움)
  referenceKind  ReferenceKind?       // 'url' | 'text'
  referenceUrl   String?
  referenceText  String?

  // Document 전용 (type='document'일 때만 채움)
  documentContent Json?                // TipTap JSON

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  // 구체적 관계 선언(Chat과의 origin 관계 포함)은 Developer D1에서 확정
}

enum AssetType {
  document
  reference
}

enum ReferenceKind {
  url
  text
}
```

### 핵심 결정 포인트

1. **Asset은 단일 테이블.** Document와 Reference는 동일 테이블 내 `type` discriminator로 구분.
2. **type별 필드는 JSON 블롭에 몰지 않고 개별 nullable 컬럼으로 분산.** Reference URL·text, Document TipTap JSON이 각각 독립 컬럼.
3. **단, TipTap 문서 본문만 `Json` 컬럼**(`documentContent`). 이는 내부적으로 구조를 가지지만 쿼리 조건으로 사용할 일이 없고, 컬럼 1개로 묶는 편이 실용적이다.
4. **Reference의 `file` kind는 MVP 제외** — `ReferenceKind` enum에서도 빠진다. features.md의 "파일 업로드/파싱 1차 제외" 결정 계승.
5. **타입 안전성 보완은 애플리케이션 레이어에서.** `AssetType`에 따라 필드 접근을 좁혀주는 TypeScript 타입 가드 또는 Zod 스키마를 별도 작성 (Developer D1·D2에서 구체화).

## 고려한 대안

### 대안 A: 단일 테이블 + JSON 페이로드 컬럼

```prisma
model Asset {
  id        String   @id @default(cuid())
  // ... 공통 필드
  type      AssetType
  payload   Json                // type에 따라 구조가 다름
}
```

#### Pros
- 스키마가 가장 단순
- 새 type 추가 시 마이그레이션 불필요
- Document의 TipTap JSON과 Reference의 url/text가 모두 한 컬럼

#### Cons
- **타입 안전성이 크게 약해진다.** `payload.url`을 읽는 코드 경로에서 ORM/TypeScript가 아무 힌트도 못 준다.
- **인덱싱·쿼리 제약.** 예컨대 "이 user가 같은 URL을 이미 저장했는지" 중복 체크가 JSON 경로 쿼리(Postgres `->>`)로 내려가 Prisma의 표준 API와 멀어진다.
- Postgres JSONB의 표현력은 충분하지만, **구조가 단순할수록 JSON보다 컬럼이 우월**하다. Reference의 url/text는 문자열 하나씩이라 JSON으로 감쌀 이득이 없다.

### 대안 B: Reference / Document 별도 테이블 분리

```prisma
model Reference { id, userId, projectId?, title, kind, url?, text?, originChatId?, ... }
model Document  { id, userId, projectId?, title, contentJson, originChatId?, ... }
```

#### Pros
- 각 엔티티의 컬럼이 명확. Reference에는 `referenceUrl?` null 가능성이 없고, Document에는 `contentJson`이 명시적.
- Reference 전용 인덱스·제약을 독립적으로 정의 가능
- 도메인상 "두 가지 타입"이 스키마에서도 두 테이블로 직관 매핑

#### Cons (**이게 결정적**)
- **`Message.referencedAssetIds`의 polymorphic FK 문제.** Message가 Reference·Document 둘 다 참조 가능해야 하는데, Prisma는 한 필드가 두 테이블을 가리키는 것을 직접 표현하지 못한다. 회피책 둘 다 문제:
  1. **Reference 전용으로 강제** — 현재는 Document 참조가 드물지만 미래에 "Document를 출처로 인용"하는 유스케이스가 막힘
  2. **`{ assetId, assetType }` 쌍 저장 or 중간 join 테이블** — 쿼리 복잡도가 JOIN 2배, "이 Message가 참조하는 모든 Asset을 한 번에" 불러오려면 UNION 필요
- **"Project 전체 Asset 목록" 쿼리에 UNION 필요.** 정렬·페이징이 번거롭고, Prisma Client API로는 직접 표현하기 어려워 `$queryRaw`로 내려갈 가능성.
- **새 Asset type 추가 시 테이블 신설 + 마이그레이션.** 미래 `Note`·`Bookmark` 타입 고려 시 확장 비용.
- Prisma Client 표면이 두 배(`prisma.reference.*`, `prisma.document.*`)가 되어 공통 처리(소유권 검증 헬퍼 등) 추상화 레이어 한 겹 더 필요.

## 결과

### Pros

- **Message FK 자연스러움.** `referencedAssetIds: String[]`와 `generatedAssetId?: String`이 모두 단일 `Asset` 테이블을 가리키므로 Prisma가 직접 표현할 수 있고 JOIN도 단순.
- **공통 조회 1-테이블.** Scholar 뷰 Asset 패널·미할당 Asset 목록 등 여러 후속 기능이 `Asset` 한 테이블만 읽으면 됨.
- **도메인 모델 정합.** 도메인 모델 v0.3이 Asset을 polymorphic으로 정의한 개념이 스키마에 그대로 반영됨.
- **새 type 추가 저렴.** `AssetType` enum에 값 추가 + 신규 전용 컬럼 (필요 시)만으로 확장.
- **타입 안전성은 애플리케이션 레이어에서 Zod/타입 가드로 보완 가능.** Prisma의 한계를 인식하면서 타입 안전성을 **경계에서 주입**하는 것 자체가 학습 가치.
- **JSON은 TipTap 본문에 한정.** 구조 쿼리가 필요 없는 곳에만 JSON을 쓰므로 단점이 최소화.

### Cons

- **Nullable 컬럼이 늘어난다.** Reference 행에서 `documentContent`는 항상 null이고, Document 행에서 `referenceUrl`·`referenceText`는 항상 null. Postgres 저장 효율에는 영향 거의 없고, 팀 내 합의(주석·Zod 스키마)로 "언제 채워지는가"를 명시화해 관리한다.
- **ORM 레벨에서 discriminated union을 자동으로 좁혀주지 못한다.** 앱 코드에서 `if (asset.type === 'reference')` 분기 후 `asset.referenceUrl!`처럼 non-null assertion이 필요. TypeScript `type predicate` 헬퍼(`isReferenceAsset(asset): asset is ReferenceAsset`)를 `lib/asset/guards.ts` 같은 곳에 두는 것이 관용적 해법이다.
- **향후 Document의 contentJson이 거대해지면** Asset 전체 조회 시 해당 컬럼을 `select` 제외하는 튜닝이 필요할 수 있다. 현시점 데이터 볼륨에선 불필요.

## 연관 결정

- **도메인 모델 v0.3**: Asset polymorphic 정의 — 이 ADR은 그 개념을 스키마로 구현하는 방식.
- **ADR-0005 (Prisma 인프라)**: cuid ID, hard delete 컨벤션을 동일 적용.
- **ADR-0008 (Server Action 패턴)**: Asset CRUD Server Action은 `lib/actions/asset.ts`에 zod + result 객체 패턴으로 구현. type 분기 검증은 zod 스키마의 `discriminatedUnion`으로 표현 가능.
- **기능 4 D1 (Prisma 스키마 확장)**: 이 ADR의 스키마 골격이 실제 `schema.prisma` 마이그레이션으로 구체화된다. 최종 컬럼명·제약(`@@index`, `@@unique` 등)은 D1에서 결정.

## References

- `architecture/domain-model.md` v0.3 §엔티티 - Asset
- `plan/features/4-asset.md` §5 도메인·기술 결정 요약
- Prisma docs: polymorphic 관계 표현의 한계 ([Prisma GitHub #1644](https://github.com/prisma/prisma/issues/1644) 계열 이슈가 지속적으로 논의됨)
