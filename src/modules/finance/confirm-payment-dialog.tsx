"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import type { PaymentResponseDTO, PaymentsPageVariant } from "@/types/payment";
import { VENDOR_PAYMENT_METHODS } from "@/lib/payment-method-label";
import { CurrencyAmount } from "@/components/currency/currency-amount";

function parseAmount(value: string | number | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function ConfirmPaymentDialog({
  open,
  onOpenChange,
  payment,
  variant,
  onConfirm,
  confirming,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentResponseDTO | null;
  variant: PaymentsPageVariant;
  onConfirm: (payload: { amount: number; paymentMethod?: string }) => void | Promise<void>;
  confirming?: boolean;
}) {
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [amountInput, setAmountInput] = useState("");

  const outstanding = useMemo(() => {
    if (!payment) return 0;
    const fromInvoice = parseAmount(payment.invoiceOutstanding);
    if (fromInvoice > 0) return fromInvoice;
    return parseAmount(payment.amount);
  }, [payment]);

  const invoiceTotal = useMemo(() => {
    if (!payment) return 0;
    const fromInvoice = parseAmount(payment.invoiceTotal);
    if (fromInvoice > 0) return fromInvoice;
    return parseAmount(payment.amount);
  }, [payment]);

  useEffect(() => {
    if (open && payment) {
      setMethod("BANK_TRANSFER");
      setAmountInput(String(outstanding > 0 ? outstanding : ""));
    }
  }, [open, payment?.id, outstanding]);

  const confirmAmount = parseAmount(amountInput);
  const remainingAfter = Math.max(0, outstanding - confirmAmount);
  const amountValid =
    confirmAmount > 0 &&
    confirmAmount <= outstanding + 0.001;

  if (!payment) return null;

  const isVendor = variant === "vendor";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isVendor ? "Confirm vendor payment" : "Confirm customer payment"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Payment code: </span>
              <span className="font-medium">
                {payment.paymentCode ?? `#${payment.id}`}
              </span>
            </p>
            {payment.purchaseOrderNumber && (
              <p>
                <span className="text-muted-foreground">Purchase order: </span>
                <span className="font-medium">{payment.purchaseOrderNumber}</span>
              </p>
            )}
            {payment.salesOrderNumber && (
              <p>
                <span className="text-muted-foreground">Sales order: </span>
                <span className="font-medium">{payment.salesOrderNumber}</span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Invoice total: </span>
              <CurrencyAmount amount={invoiceTotal} className="font-medium inline" />
            </p>
            <p>
              <span className="text-muted-foreground">Outstanding: </span>
              <CurrencyAmount amount={outstanding} className="font-semibold inline" />
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-payment-amount">Payment amount</Label>
            <Input
              id="confirm-payment-amount"
              type="number"
              min={0.01}
              max={outstanding}
              step="0.01"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="Enter amount to confirm"
            />
            {amountInput && !amountValid && (
              <p className="text-sm text-destructive">
                Amount must be greater than zero and not exceed the outstanding balance.
              </p>
            )}
            {amountValid && remainingAfter > 0.001 && (
              <p className="text-sm text-muted-foreground">
                Remaining after confirm:{" "}
                <CurrencyAmount amount={remainingAfter} className="inline font-medium" />
                {" "}(invoice will be partially paid)
              </p>
            )}
            {amountValid && remainingAfter <= 0.001 && (
              <p className="text-sm text-muted-foreground">
                This will fully settle the invoice.
              </p>
            )}
          </div>

          {isVendor && (
            <div className="space-y-2">
              <Label htmlFor="vendor-payment-method">Payment method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="vendor-payment-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() =>
              void onConfirm(
                isVendor
                  ? { amount: confirmAmount, paymentMethod: method }
                  : { amount: confirmAmount },
              )
            }
            disabled={confirming || !amountValid || (isVendor && !method)}
          >
            {confirming ? "Confirming…" : "Confirm payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
