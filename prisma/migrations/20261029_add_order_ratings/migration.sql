CREATE TABLE public."GameRating" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT,
  "game" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GameRating_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GameRating_rating_check" CHECK ("rating" BETWEEN 1 AND 5),
  CONSTRAINT "GameRating_orderId_fkey" FOREIGN KEY ("orderId")
    REFERENCES public."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GameRating_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public."User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "GameRating_orderId_key"
  ON public."GameRating"("orderId");
CREATE INDEX "GameRating_game_idx"
  ON public."GameRating"("game");
