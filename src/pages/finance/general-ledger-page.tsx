import { AppTab } from "@/components/app-tab";
import { useAuth } from "@/context/AuthContext";
import BudgetPage from "@/modules/finance/budget-page";
import GLBalancePage from "@/modules/finance/gl-balance-page";
import JournalPage from "@/modules/finance/journal-page";
import TransactionPage from "@/modules/finance/transaction-page";
import CreditNotePage from "./credit-note-page";

const GeneralLedgerPage = () => {
  const { user } = useAuth();
  const tabsList = [
    {
      value: "gl-balance",
      label: "GL Account Balance",
      element: <GLBalancePage />,
    },
    {
      value: "manual-journals",
      label: "Manual Journals",
      element: ({ companyId }: { companyId: number }) => (
        <JournalPage companyId={companyId} />
      ),
    },
    {
      value: "transactions",
      label: "Transactions",
      element: ({ companyId }: { companyId: number }) => (
        <TransactionPage companyId={companyId} />
      ),
    },
    {
      value: "budget",
      label: "Budget",
      element: ({ companyId }: { companyId: number }) => (
        <BudgetPage companyId={companyId} />
      ),
    },
    {
      value: "credit-note",
      label: "Credit Notes",
      element: () => <CreditNotePage />,
    },
  ];

  return (
    user?.companyId && (
      <AppTab
        title=""
        tabs={tabsList}
        defaultValue={tabsList[0].value}
        props={{ companyId: Number(user?.companyId) }}
      />
    )
  );
};

export default GeneralLedgerPage;
