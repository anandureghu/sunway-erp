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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import type { PaymentResponseDTO, PaymentsPageVariant } from "@/types/payment";
import { PAYMENT_METHODS } from "@/lib/payment-method-label";
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
  onConfirm: (payload: {
    amount: number;
    paymentMethod?: string;
    applyCreditAmount?: number;
  }) => void | Promise<void>;
  confirming?: boolean;
}) {
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [amountInput, setAmountInput] = useState("");
  const [applyCredit, setApplyCredit] = useState(false);
  const [creditAmountInput, setCreditAmountInput] = useState("");

  const isVendor = variant === "vendor";

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

  const availableCredit = useMemo(
    () => (payment ? parseAmount(payment.availableCreditAmount) : 0),
    [payment],
  );

  const maxApplicableCredit = useMemo(
    () => Math.min(availableCredit, outstanding),
    [availableCredit, outstanding],
  );

  useEffect(() => {
    if (open && payment) {
      setMethod("BANK_TRANSFER");
      setApplyCredit(false);
      setCreditAmountInput(maxApplicableCredit > 0 ? String(maxApplicableCredit) : "");
      setAmountInput(String(outstanding > 0 ? outstanding : ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment?.id, outstanding]);

  const appliedCredit = applyCredit
    ? Math.min(parseAmount(creditAmountInput), maxApplicableCredit)
    : 0;
  const cashCap = Math.max(0, outstanding - appliedCredit);

  const handleToggleCredit = (checked: boolean) => {
    setApplyCredit(checked);
    const credit = checked ? maxApplicableCredit : 0;
    const newCap = Math.max(0, outstanding - credit);
    setAmountInput(newCap > 0 ? String(newCap) : "0");
  };

  const handleCreditAmountChange = (value: string) => {
    setCreditAmountInput(value);
    const credit = Math.min(parseAmount(value), maxApplicableCredit);
    const newCap = Math.max(0, outstanding - credit);
    setAmountInput(newCap > 0 ? String(newCap) : "0");
  };

  const confirmAmount = parseAmount(amountInput);
  const remainingAfter = Math.max(0, cashCap - confirmAmount);
  const amountValid =
    confirmAmount >= 0 &&
    confirmAmount <= cashCap + 0.001 &&
    (confirmAmount > 0 || cashCap <= 0.001);

  if (!payment) return null;

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
            {isVendor && (
              <p>
                <span className="text-muted-foreground">
                  Vendor invoice code:{" "}
                </span>
                <span className="font-medium">
                  {payment.supplierInvoiceNumber || "Not matched"}
                </span>
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

          {maxApplicableCredit > 0 && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 space-y-2 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="apply-credit-note"
                  checked={applyCredit}
                  onCheckedChange={(checked) => handleToggleCredit(checked === true)}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="apply-credit-note" className="cursor-pointer">
                    {isVendor
                      ? "Apply available supplier credit"
                      : "Apply available customer credit"}{" "}
                    (<CurrencyAmount amount={availableCredit} className="inline" /> available)
                  </Label>
                  {applyCredit && (
                    <Input
                      type="number"
                      min={0.01}
                      max={maxApplicableCredit}
                      step="0.01"
                      value={creditAmountInput}
                      onChange={(e) => handleCreditAmountChange(e.target.value)}
                      placeholder="Amount of credit to apply"
                      className="h-8 text-sm"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirm-payment-amount">Payment amount</Label>
            <Input
              id="confirm-payment-amount"
              type="number"
              min={0}
              max={cashCap}
              step="0.01"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              disabled={cashCap <= 0.001}
              placeholder="Enter amount to confirm"
            />
            {amountInput && !amountValid && (
              <p className="text-sm text-destructive">
                Amount must be zero or greater and not exceed the remaining balance
                after credit.
              </p>
            )}
            {cashCap <= 0.001 && appliedCredit > 0 && (
              <p className="text-sm text-muted-foreground">
                Fully covered by applied credit — no cash payment required.
              </p>
            )}
            {amountValid && cashCap > 0.001 && remainingAfter > 0.001 && (
              <p className="text-sm text-muted-foreground">
                Remaining after confirm:{" "}
                <CurrencyAmount amount={remainingAfter} className="inline font-medium" />
                {" "}(invoice will be partially paid)
              </p>
            )}
            {amountValid && cashCap > 0.001 && remainingAfter <= 0.001 && (
              <p className="text-sm text-muted-foreground">
                This will fully settle the invoice.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
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
            onClick={() =>
              void onConfirm({
                amount: confirmAmount,
                paymentMethod: method,
                applyCreditAmount: appliedCredit > 0 ? appliedCredit : undefined,
              })
            }
            disabled={confirming || !amountValid || !method}
          >
            {confirming ? "Confirming…" : "Confirm payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
