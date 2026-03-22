import { type ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TransactionResponseDTO } from "@/types/transactions";
import { CreditAmount, DebitAmount } from "@/components/accounting-amount";

const UNKNOWN = "UNKNOWN";

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
  const [val, setVal] = useState(tx.source === UNKNOWN || !tx.source ? "" : tx.source);
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
      <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={submit}>
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
  { accessorKey: "transactionCode", header: "Transaction No" },
  { accessorKey: "transactionType", header: "Type" },

  {
    accessorKey: "transactionDate",
    header: "Date",
    cell: ({ row }) =>
      new Date(row.getValue("transactionDate")).toLocaleDateString(),
  },

  {
    accessorKey: "transactionDescription",
    header: "Description",
    cell: ({ row }) => row.getValue("transactionDescription") ?? "—",
  },
  {
    accessorKey: "debitAccountName",
    header: "Debit account",
    cell: ({ row }) => row.original.debitAccountName ?? "—",
  },
  {
    accessorKey: "creditAccountName",
    header: "Credit account",
    cell: ({ row }) => row.original.creditAccountName ?? "—",
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
    id: "debitAmount",
    header: "Debit",
    cell: ({ row }) => {
      const tx = row.original;
      const hasD =
        tx.debitAccountId != null && Number(tx.debitAccountId) > 0;
      if (!hasD) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return <DebitAmount amount={tx.amount} currencyCode="₹" />;
    },
  },
  {
    id: "creditAmount",
    header: "Credit",
    cell: ({ row }) => {
      const tx = row.original;
      const hasC =
        tx.creditAccountId != null && Number(tx.creditAccountId) > 0;
      if (!hasC) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return <CreditAmount amount={tx.amount} currencyCode="₹" />;
    },
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
