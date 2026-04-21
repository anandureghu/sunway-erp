import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { AppTab } from "@/components/app-tab";
import PaymentsPage from "@/modules/finance/payments-page";
import { useAuth } from "@/context/AuthContext";
import { listPurchaseInvoices } from "@/service/invoiceService";
import type { FinanceInvoice } from "@/types/finance-invoice";
import { PURCHASE_INVOICE_COLUMNS } from "@/lib/columns/purchase-columns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface AccountsPayableProps {
  companyId?: number;
}

function PayableInvoicesTab() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<FinanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    listPurchaseInvoices()
      .then(setRows)
      .catch(() => {
        toast.error("Could not load purchase invoices");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows.filter((invoice) => {
    const q = searchQuery.toLowerCase();
    return (
      (invoice.invoiceId?.toLowerCase().includes(q) ?? false) ||
      (invoice.toParty?.toLowerCase().includes(q) ?? false) ||
      (invoice.supplierInvoiceNumber?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleRowClick = useCallback(
    (row: Row<FinanceInvoice>) => {
      navigate(`/inventory/purchase/invoices/${row.original.id}`);
    },
    [navigate],
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Purchase invoices</h2>
      <p className="text-sm text-muted-foreground">
        Accounts payable bills (PURCHASE type only).
      </p>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by ref, supplier, supplier #…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="py-10 text-center text-muted-foreground">
          Loading invoices…
        </div>
      ) : (
        <DataTable
          columns={PURCHASE_INVOICE_COLUMNS}
          data={filtered}
          onRowClick={handleRowClick}
        />
      )}
    </div>
  );
}

const AccountsPayablePage = () => {
  const { user } = useAuth();

  const tabsList = [
    {
      value: "invoices",
      label: "Invoices",
      element: () => <PayableInvoicesTab />,
    },
    {
      value: "payments",
      label: "Vendor Payments",
      element: ({ companyId }: AccountsPayableProps) => (
        <PaymentsPage companyId={companyId || 0} variant="vendor" />
      ),
    },
  ];

  return (
    <AppTab
      title="Accounts Payable"
      subtitle="Manage your accounts payable and vendor payments"
      variant="danger"
      tabs={tabsList}
      defaultValue="invoices"
      props={{
        companyId: user?.companyId ? Number(user.companyId) : 0,
      }}
    />
  );
};

export default AccountsPayablePage;
