import { AppTab } from "@/components/app-tab";
import PaymentsPage from "@/modules/finance/payments-page";
import { useAuth } from "@/context/AuthContext";
import InvoicesPage from "../sales/invoices-page";
import { FileText, Wallet } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

interface AccountsReceivableProps {
  companyId?: number;
}

const AccountsReceivablePage = () => {
  const { user } = useAuth();
  const companyId = user?.companyId ? Number(user.companyId) : 0;

  const tabsList = [
    {
      value: "invoices",
      label: "Sales Invoices",
      icon: <FileText className="w-6 h-6" />,
      element: () => {
        return (
          <>
            {/* <h1 className="text-2xl font-semibold pl-5 pt-5">Sales Invoices</h1> */}
            <InvoicesPage disableHeader />
          </>
        );
      },
    },
    {
      value: "payments",
      label: "Customer Payments",
      icon: <Wallet className="w-6 h-6" />,
      element: ({ companyId: cId }: AccountsReceivableProps) => (
        <PaymentsPage companyId={cId || 0} variant="customer" />
      ),
    },
    // { value: "agreements", label: "Agreements" },
    // { value: "credits", label: "Customer Credit Accounts" },
    // { value: "charges", label: "Other Finance Charges" },
  ];

  return (
    <div className="p-6 bg-slate-50/60 min-h-screen">
      <PageHeader
        title="Accounts Receivable"
        description="Manage your accounts receivable and customer payments"
        variant="lightGreen"
        icon={<Wallet className="w-6 h-6" />}
      />
      <AppTab
        tabs={tabsList}
        defaultValue="invoices"
        props={{ companyId }}
      />
    </div>
  );
};

export default AccountsReceivablePage;
