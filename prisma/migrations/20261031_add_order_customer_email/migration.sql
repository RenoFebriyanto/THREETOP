ALTER TABLE public."Order"
  ADD COLUMN IF NOT EXISTS "customerEmail" TEXT;
