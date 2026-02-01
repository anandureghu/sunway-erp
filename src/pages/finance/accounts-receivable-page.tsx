import { useEffect, useState } from "react";
import { dummyInvoices } from "@/lib/data";
import type { Invoice } from "@/types/sales";
import { AppTab } from "@/components/app-tab";
import PaymentsPage from "@/modules/finance/payments-page";
import { useAuth } from "@/context/AuthContext";
import InvoicesPage from "../sales/invoices-page";

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
      element: () => {
        return (
          <>
            <h1 className="text-2xl font-semibold pl-5 pt-5">Sales Invoices</h1>
            <InvoicesPage disableHeader />
          </>
        );
      },
    },
    {
      value: "payments",
      label: "Customer Payments",
      element: ({ companyId }: AccountsReceivableProps) => (
        <PaymentsPage companyId={companyId || 0} />
      ),
    },
    // { value: "agreements", label: "Agreements" },
    // { value: "credits", label: "Customer Credit Accounts" },
    // { value: "charges", label: "Other Finance Charges" },
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
