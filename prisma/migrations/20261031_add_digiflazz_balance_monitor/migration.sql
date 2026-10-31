CREATE TABLE IF NOT EXISTS public."DigiflazzBalanceMonitor" (
  "id" TEXT NOT NULL DEFAULT 'singleton',
  "alertLevel" TEXT NOT NULL DEFAULT 'NORMAL',
  "lastBalance" INTEGER,
  "lastCheckedAt" TIMESTAMP(3),
  "lastAlertedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DigiflazzBalanceMonitor_pkey" PRIMARY KEY ("id")
);
