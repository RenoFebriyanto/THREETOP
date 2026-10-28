CREATE TABLE IF NOT EXISTS "DigiflazzProduct" (
  "id" TEXT NOT NULL,
  "buyerSkuCode" TEXT NOT NULL,
  "game" TEXT NOT NULL,
  "product" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DigiflazzProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DigiflazzProduct_buyerSkuCode_key"
  ON "DigiflazzProduct"("buyerSkuCode");
