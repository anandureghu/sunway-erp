import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { ChartOfAccounts } from "@/types/finance/chart-of-accounts";
import { useAuth } from "@/context/AuthContext";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { SignedColoredAmount } from "@/components/accounting-amount";

function InitialBalanceActionCell({
  done,
  saving,
  onSave,
}: {
  done: boolean;
  saving: boolean;
  onSave: (amount: number) => void;
}) {
  const [value, setValue] = useState("");

  if (done) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const submit = () => {
    const raw = value.trim();
    if (raw === "") {
      toast.error("Enter an amount");
      return;
    }
    const amount = Number(raw);
    if (Number.isNaN(amount)) {
      toast.error("Invalid amount");
      return;
    }
    onSave(amount);
  };

  return (
    <div className="flex items-center gap-2 justify-end min-w-[200px]">
      <Input
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        className="h-9 w-32"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        size="sm"
        className="bg-orange-500 hover:bg-orange-600"
        disabled={saving}
        onClick={submit}
      >
        {saving ? "Saving…" : "Set once"}
      </Button>
    </div>
  );
}

export default function GlAccountBalancesPage() {
  const [rows, setRows] = useState<ChartOfAccounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const { company } = useAuth();
  const currencyCode = company?.currency?.currencyCode ?? "";

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get<ChartOfAccounts[]>(
        "/finance/chart-of-accounts",
      );
      setRows(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((a) => {
      if (a.active === false) return false;
      if (!q) return true;
      return (
        String(a.accountNo).includes(q) ||
        (a.accountCode ?? "").toLowerCase().includes(q) ||
        (a.accountName ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  const setInitial = useCallback(
    async (id: number, amount: number) => {
      try {
        setSavingId(id);
        await apiClient.patch(
          `/finance/chart-of-accounts/${id}/initial-balance`,
          {
            amount,
          },
        );
        toast.success("Initial balance saved");
        await load();
      } catch (err: unknown) {
        const msg =
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "data" in err.response &&
          err.response.data &&
          typeof err.response.data === "object" &&
          "message" in err.response.data
            ? String((err.response.data as { message?: string }).message)
            : "Could not save initial balance";
        toast.error(msg);
      } finally {
        setSavingId(null);
      }
    },
    [load],
  );

  const columns: ColumnDef<ChartOfAccounts>[] = useMemo(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "accountNo", header: "Account No" },
      { accessorKey: "accountCode", header: "Account Code" },
      { accessorKey: "accountName", header: "Account Name" },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline">{row.getValue<string>("type")}</Badge>
        ),
      },
      {
        id: "balance",
        header: "Current balance",
        cell: ({ row }) => (
          <SignedColoredAmount
            amount={row.original.balance ?? 0}
            currencyCode={currencyCode || undefined}
          />
        ),
      },
      {
        id: "initialStatus",
        header: "Initial balance",
        cell: ({ row }) => {
          const done = row.original.initialBalanceSet === true;
          return done ? (
            <Badge variant="secondary">Set</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">Not set</span>
          );
        },
      },
      {
        id: "action",
        header: "",
        cell: ({ row }) => {
          const id = row.original.id;
          const done = row.original.initialBalanceSet === true;
          return (
            <InitialBalanceActionCell
              done={done}
              saving={savingId === id}
              onSave={(amount) => setInitial(id, amount)}
            />
          );
        },
      },
    ],
    [currencyCode, savingId, setInitial],
  );

  if (loading) {
    return <p className="text-center text-muted-foreground p-10">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search account…"
                className="pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            View each account&apos;s balance. If opening balance was not set
            when the account was created, enter it here once—after that,
            balances follow from transactions and journals.
          </p>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={filtered} />
        </CardContent>
      </Card>
    </div>
  );
}
