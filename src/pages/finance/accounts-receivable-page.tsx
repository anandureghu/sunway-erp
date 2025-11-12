import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { SALES_INVOICE_COLUMNS } from "@/lib/columns/accounts-receivable-columns";
import { dummyInvoices } from "@/lib/data";
import type { Invoice } from "@/types/sales";
import { AppTab } from "@/components/app-tab";

interface AccountsReceivableProps {
  invoices: Invoice[];
  payments: { id: string; amount: number }[];
}

async function getInvoices(): Promise<Invoice[]> {
  return dummyInvoices;
}

async function getPayments(): Promise<{ id: string; amount: number }[]> {
  return [{ id: "1", amount: 5000 }];
}

const AccountsReceivablePage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<{ id: string; amount: number }[]>(
    []
  );

  useEffect(() => {
    Promise.all([getInvoices(), getPayments()]).then(([inv, pay]) => {
      setInvoices(inv);
      setPayments(pay);
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
    { value: "payments", label: "Customer Payments" },
    { value: "agreements", label: "Agreements" },
    { value: "credits", label: "Customer Credit Accounts" },
    { value: "charges", label: "Other Finance Charges" },
  ];

  return (
    <AppTab
      title="Accounts Receivable"
      tabs={tabsList}
      defaultValue="invoices"
      props={{ invoices, payments }}
    />
  );
};

export default AccountsReceivablePage;
