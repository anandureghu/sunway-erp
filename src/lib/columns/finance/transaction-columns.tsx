import { type ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { TransactionResponseDTO } from "@/types/transactions";
import { CreditAmount, DebitAmount } from "@/components/accounting-amount";
import { formatCurrencyAmount } from "@/lib/currency";
import { useCompanyCurrency } from "@/hooks/use-company-currency";
import { CurrencyMissingWarningBadge } from "@/components/currency/currency-missing-warning-badge";
import {
  transactionTypeBadgeClass,
  transactionTypeLabel,
} from "@/lib/transaction-type-label";
import { cn } from "@/lib/utils";

const UNKNOWN = "UNKNOWN";

function AccountCell({
  accountCode,
  accountName,
}: {
  accountCode?: string | null;
  accountName?: string | null;
}) {
  if (!accountCode && !accountName) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="min-w-0">
      {accountCode ? (
        <span className="font-mono text-sm font-medium text-slate-900">
          {accountCode}
        </span>
      ) : null}
      {accountName ? (
        <span
          className={cn(
            "block truncate text-muted-foreground",
            accountCode ? "text-xs" : "text-sm",
          )}
        >
          {accountName}
        </span>
      ) : null}
    </div>
  );
}

function AmountCell({ tx }: { tx: TransactionResponseDTO }) {
  const { currencyCode, currencyConfigured } = useCompanyCurrency();
  const hasDebit =
    tx.debitAccountId != null && Number(tx.debitAccountId) > 0;
  const hasCredit =
    tx.creditAccountId != null && Number(tx.creditAccountId) > 0;

  if (hasDebit && !hasCredit) {
    return <DebitAmount amount={tx.amount} currencyCode={currencyCode} />;
  }

  if (hasCredit && !hasDebit) {
    return <CreditAmount amount={tx.amount} currencyCode={currencyCode} />;
  }

  const n = Math.abs(Number(tx.amount));
  if (Number.isNaN(n)) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 tabular-nums font-medium text-slate-900">
      {formatCurrencyAmount({ amount: n, currencyCode })}
      {!currencyCode && !currencyConfigured ? (
        <CurrencyMissingWarningBadge />
      ) : null}
    </span>
  );
}

function isSingleSided(tx: TransactionResponseDTO) {
  const hasD = tx.debitAccountId != null && tx.debitAccountId > 0;
  const hasC = tx.creditAccountId != null && tx.creditAccountId > 0;
  return hasD !== hasC;
}

function SourceCell({
  tx,
  onSourceSave,
}: {
  tx: TransactionResponseDTO;
  onSourceSave: (id: number, source: string) => Promise<void>;
}) {
  if (!isSingleSided(tx)) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const raw = (tx.source ?? UNKNOWN).toUpperCase();
  const editable = raw === UNKNOWN && !tx.sourceLocked;
  const [val, setVal] = useState(
    tx.source === UNKNOWN || !tx.source ? "" : tx.source,
  );
  const [saving, setSaving] = useState(false);

  if (!editable) {
    return <span className="text-sm">{tx.source ?? UNKNOWN}</span>;
  }

  const submit = async () => {
    const s = val.trim();
    if (!s || s.toUpperCase() === UNKNOWN) {
      return;
    }
    try {
      setSaving(true);
      await onSourceSave(tx.id, s);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 max-w-[220px]">
      <Input
        className="h-8 flex-1 min-w-[100px]"
        placeholder="Set source once…"
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={saving}
        onClick={submit}
      >
        {saving ? "…" : "Save"}
      </Button>
    </div>
  );
}

export const TRANSACTION_COLUMNS = ({
  onSourceSave,
}: {
  onSourceSave: (id: number, source: string) => Promise<void>;
}): ColumnDef<TransactionResponseDTO>[] => [
  {
    accessorKey: "transactionCode",
    header: "Transaction No",
    cell: ({ row }) => (
      <span className="font-medium text-slate-900">
        {row.getValue("transactionCode")}
      </span>
    ),
  },
  {
    accessorKey: "transactionType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue<string | null>("transactionType");
      return (
        <Badge
          variant="outline"
          className={cn("font-normal", transactionTypeBadgeClass(type))}
        >
          {transactionTypeLabel(type)}
        </Badge>
      );
    },
  },

  {
    accessorKey: "transactionDate",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("transactionDate") as string;
      try {
        return (
          <span className="text-slate-600">
            {format(new Date(date), "MMM d, yyyy")}
          </span>
        );
      } catch {
        return <span className="text-slate-600">{date}</span>;
      }
    },
  },
  {
    accessorKey: "debitAccountCode",
    header: "Debit account",
    cell: ({ row }) => (
      <AccountCell
        accountCode={row.original.debitAccountCode}
        accountName={row.original.debitAccountName}
      />
    ),
  },
  {
    accessorKey: "creditAccountCode",
    header: "Credit account",
    cell: ({ row }) => (
      <AccountCell
        accountCode={row.original.creditAccountCode}
        accountName={row.original.creditAccountName}
      />
    ),
  },
  {
    id: "source",
    header: "Source",
    cell: ({ row }) => (
      <SourceCell
        key={`${row.original.id}-${row.original.source ?? ""}-${row.original.sourceLocked ?? false}`}
        tx={row.original}
        onSourceSave={onSourceSave}
      />
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <AmountCell tx={row.original} />,
  },
  {
    accessorKey: "paymentId",
    header: "Payment ID",
    cell: ({ row }) => row.getValue("paymentId") ?? "—",
  },

  {
    accessorKey: "invoiceId",
    header: "Invoice No",
    cell: ({ row }) => row.getValue("invoiceId") ?? "—",
  },
];
