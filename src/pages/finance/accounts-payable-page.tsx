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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { invoiceMatchesStatusFilter } from "@/lib/invoice-status-filter";

interface AccountsPayableProps {
  companyId?: number;
}

function PayableInvoicesTab() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<FinanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    const matchesSearch =
      (invoice.invoiceId?.toLowerCase().includes(q) ?? false) ||
      (invoice.toParty?.toLowerCase().includes(q) ?? false) ||
      (invoice.supplierInvoiceNumber?.toLowerCase().includes(q) ?? false);
    const matchesStatus = invoiceMatchesStatusFilter(
      invoice.status,
      statusFilter,
    );
    return matchesSearch && matchesStatus;
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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by ref, supplier, supplier #…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[100]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
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
