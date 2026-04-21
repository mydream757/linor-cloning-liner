-- ADR-0016: Asset-Chat 관계를 Document 중심 composition 모델로 전환.
-- Message.generated_asset_id 제거, Asset.origin_chat_id → Asset.source_chat_ids[].
-- 기존 데이터는 origin_chat_id를 source_chat_ids 배열 첫 요소로 복사해 보존한다.

-- 1. Asset.source_chat_ids 컬럼 추가 (default 빈 배열)
ALTER TABLE "assets"
  ADD COLUMN "source_chat_ids" TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

-- 2. 기존 origin_chat_id 값을 source_chat_ids 배열로 복사 (not null인 것만)
UPDATE "assets"
  SET "source_chat_ids" = ARRAY["origin_chat_id"]
  WHERE "origin_chat_id" IS NOT NULL;

-- 3. Asset.origin_chat_id FK 제약·인덱스·컬럼 제거
ALTER TABLE "assets" DROP CONSTRAINT "assets_origin_chat_id_fkey";
DROP INDEX "assets_origin_chat_id_idx";
ALTER TABLE "assets" DROP COLUMN "origin_chat_id";

-- 4. Message.generated_asset_id FK 제약·컬럼 제거
ALTER TABLE "messages" DROP CONSTRAINT "messages_generated_asset_id_fkey";
ALTER TABLE "messages" DROP COLUMN "generated_asset_id";
