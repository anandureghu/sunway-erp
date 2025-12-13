import { AppTab } from "@/components/app-tab";
import { useAuth } from "@/context/AuthContext";
import BudgetPage from "@/modules/finance/budget-page";
import ChartOfAccountsPage from "@/modules/finance/chart-of-accounts-list";
import GLBalancePage from "@/modules/finance/gl-balance-page";
import JournalPage from "@/modules/finance/journal-page";
import TransactionPage from "@/modules/finance/transaction-page";

const GeneralLedgerPage = () => {
  const { user } = useAuth();
  const tabsList = [
    {
      value: "coa",
      label: "Chart of Accounts",
      element: () => <ChartOfAccountsPage companyId={user?.companyId || ""} />,
    },
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
      element: () => <BudgetPage />,
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
