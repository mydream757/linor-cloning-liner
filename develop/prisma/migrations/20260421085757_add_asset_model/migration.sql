-- CreateEnum
CREATE TYPE "asset_type" AS ENUM ('document', 'reference');

-- CreateEnum
CREATE TYPE "reference_kind" AS ENUM ('url', 'text');

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "type" "asset_type" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "origin_chat_id" TEXT,
    "reference_kind" "reference_kind",
    "reference_url" VARCHAR(2048),
    "reference_text" TEXT,
    "document_content" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assets_user_id_idx" ON "assets"("user_id");

-- CreateIndex
CREATE INDEX "assets_project_id_idx" ON "assets"("project_id");

-- CreateIndex
CREATE INDEX "assets_origin_chat_id_idx" ON "assets"("origin_chat_id");

-- CreateIndex
CREATE INDEX "assets_user_id_type_idx" ON "assets"("user_id", "type");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_generated_asset_id_fkey" FOREIGN KEY ("generated_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_origin_chat_id_fkey" FOREIGN KEY ("origin_chat_id") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
