import { AppTab } from "@/components/app-tab";
import { useAuth } from "@/context/AuthContext";
import ChartOfAccountsPage from "@/modules/finance/chart-of-accounts-list";
import GLBalancePage from "@/modules/finance/gl-balance-page";
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
      value: "transactions",
      label: "Transactions",
      element: ({ companyId }: { companyId: number }) => (
        <TransactionPage companyId={companyId} />
      ),
    },
  ];

  console.log(user);
  return (
    <AppTab
      title=""
      tabs={tabsList}
      defaultValue={tabsList[0].value}
      props={{ companyId: Number(user?.companyId) }}
    />
  );
};

export default GeneralLedgerPage;
