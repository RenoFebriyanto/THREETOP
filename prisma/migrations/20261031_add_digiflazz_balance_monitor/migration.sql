CREATE TABLE IF NOT EXISTS public."DigiflazzBalanceMonitor" (
  "id" TEXT NOT NULL DEFAULT 'singleton',
  "alertLevel" TEXT NOT NULL DEFAULT 'NORMAL',
  "lastBalance" INTEGER,
  "lastCheckedAt" TIMESTAMP(3),
  "lastAlertedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DigiflazzBalanceMonitor_pkey" PRIMARY KEY ("id")
);

ALTER TABLE public."DigiflazzBalanceMonitor"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
