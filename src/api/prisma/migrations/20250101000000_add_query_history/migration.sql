-- CreateTable
CREATE TABLE "query_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "query" TEXT NOT NULL,
    "query_type" TEXT NOT NULL,
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "is_saved" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "query_history_user_id_idx" ON "query_history"("user_id");

-- CreateIndex
CREATE INDEX "query_history_created_at_idx" ON "query_history"("created_at");

-- CreateIndex
CREATE INDEX "query_history_is_saved_idx" ON "query_history"("is_saved");

-- AddForeignKey
ALTER TABLE "query_history" ADD CONSTRAINT "query_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
