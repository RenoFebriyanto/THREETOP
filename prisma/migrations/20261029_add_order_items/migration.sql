CREATE TABLE public."OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "productCode" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "status" public."OrderStatus" NOT NULL DEFAULT 'PENDING',
  "digiflazzRef" TEXT,
  "sn" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId")
    REFERENCES public."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OrderItem_digiflazzRef_key"
  ON public."OrderItem"("digiflazzRef");
CREATE INDEX "OrderItem_orderId_idx"
  ON public."OrderItem"("orderId");
