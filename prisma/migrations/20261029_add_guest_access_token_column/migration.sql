ALTER TABLE public."Order"
  ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE public."Order"
  ADD COLUMN IF NOT EXISTS "guestAccessToken" TEXT;

ALTER TABLE public."Order"
  DROP CONSTRAINT IF EXISTS "Order_userId_fkey";

ALTER TABLE public."Order"
  ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public."User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_guestAccessToken_key"
  ON public."Order"("guestAccessToken");
