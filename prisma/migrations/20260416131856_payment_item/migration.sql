-- CreateTable
CREATE TABLE "PaymentItem" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PaymentItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaymentItem" ADD CONSTRAINT "PaymentItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentItem" ADD CONSTRAINT "PaymentItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
