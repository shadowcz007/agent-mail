-- AlterTable
ALTER TABLE "Alliance" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Alliance_isPrimary_idx" ON "Alliance"("isPrimary");
