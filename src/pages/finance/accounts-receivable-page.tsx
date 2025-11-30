import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { SALES_INVOICE_COLUMNS } from "@/lib/columns/accounts-receivable-columns";
import { dummyInvoices } from "@/lib/data";
import type { Invoice } from "@/types/sales";
import { AppTab } from "@/components/app-tab";
import PaymentsPage from "@/modules/finance/payments-page";
import { useAuth } from "@/context/AuthContext";

interface AccountsReceivableProps {
  invoices: Invoice[];
  companyId?: number;
}

async function getInvoices(): Promise<Invoice[]> {
  return dummyInvoices;
}

const AccountsReceivablePage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    Promise.all([getInvoices()]).then(([inv]) => {
      setInvoices(inv);
    });
  }, []);

  const tabsList = [
    {
      value: "invoices",
      label: "Sales Invoices",
      element: ({ invoices }: AccountsReceivableProps) => (
        <DataTable columns={SALES_INVOICE_COLUMNS} data={invoices} />
      ),
    },
    {
      value: "payments",
      label: "Customer Payments",
      element: ({ companyId }: AccountsReceivableProps) => (
        <PaymentsPage companyId={companyId || 0} />
      ),
    },
    { value: "agreements", label: "Agreements" },
    { value: "credits", label: "Customer Credit Accounts" },
    { value: "charges", label: "Other Finance Charges" },
  ];

  return (
    <AppTab
      title="Accounts Receivable"
      tabs={tabsList}
      defaultValue="invoices"
      props={{
        invoices,
        companyId: user?.companyId ? Number(user.companyId) : 0,
      }}
    />
  );
};

export default AccountsReceivablePage;
