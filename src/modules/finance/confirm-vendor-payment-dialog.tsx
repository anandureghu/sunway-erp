"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import type { PaymentResponseDTO } from "@/types/payment";
import { VENDOR_PAYMENT_METHODS } from "@/lib/payment-method-label";
import { CurrencyAmount } from "@/components/currency/currency-amount";

export function ConfirmVendorPaymentDialog({
  open,
  onOpenChange,
  payment,
  onConfirm,
  confirming,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentResponseDTO | null;
  onConfirm: (paymentMethod: string) => void | Promise<void>;
  confirming?: boolean;
}) {
  const [method, setMethod] = useState("BANK_TRANSFER");

  useEffect(() => {
    if (open) {
      setMethod("BANK_TRANSFER");
    }
  }, [open, payment?.id]);

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm vendor payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Payment code: </span>
              <span className="font-medium">{payment.paymentCode ?? `#${payment.id}`}</span>
            </p>
            {payment.purchaseOrderNumber && (
              <p>
                <span className="text-muted-foreground">Purchase order: </span>
                <span className="font-medium">{payment.purchaseOrderNumber}</span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Amount: </span>
              <CurrencyAmount amount={payment.amount} className="font-semibold inline" />
            </p>
          </div>
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
            onClick={() => void onConfirm(method)}
            disabled={confirming || !method}
          >
            {confirming ? "Confirming…" : "Confirm payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
