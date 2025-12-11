import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { SALES_INVOICE_COLUMNS } from "@/lib/columns/accounts-receivable-columns";
import { dummyInvoices } from "@/lib/data";
import type { Invoice } from "@/types/sales";
import { AppTab } from "@/components/app-tab";
import PaymentsPage from "@/modules/finance/payments-page";
import { useAuth } from "@/context/AuthContext";

interface AccountsPayableProps {
  invoices: Invoice[];
  companyId?: number;
}

async function getInvoices(): Promise<Invoice[]> {
  return dummyInvoices;
}

const AccountsPayablePage = () => {
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
      label: "Invoices",
      element: ({ invoices }: AccountsPayableProps) => (
        <DataTable columns={SALES_INVOICE_COLUMNS} data={invoices} />
      ),
    },
    {
      value: "payments",
      label: "Vendor Payments",
      element: ({ companyId }: AccountsPayableProps) => (
        <PaymentsPage companyId={companyId || 0} />
      ),
    },
  ];

  return (
    <AppTab
      title="Accounts Payable"
      tabs={tabsList}
      defaultValue="invoices"
      props={{
        invoices,
        companyId: user?.companyId ? Number(user.companyId) : 0,
      }}
    />
  );
};

export default AccountsPayablePage;
