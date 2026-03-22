import { AppTab } from "@/components/app-tab";
import { useAuth } from "@/context/AuthContext";
import BudgetPage from "@/modules/finance/budget-page";
import TransactionPage from "@/modules/finance/transaction-page";
import CreditNotePage from "./credit-note-page";
import { hasAnyRole } from "@/lib/utils";
import ChartOfAccountsListPage from "@/modules/finance/chart-of-accounts/coa-list-page";
import GlAccountBalancesPage from "@/modules/finance/gl-account-balances-page";
import JournalEntryListPage from "@/modules/finance/journal-entry/je-list-page";
import ReconciliationListPage from "@/modules/finance/reconcilation/recon-list-page";

const GeneralLedgerPage = () => {
  const { user } = useAuth();
  const tabsList = [
    {
      value: "coa",
      label: "Chart Of Accounts",
      element: () => <ChartOfAccountsListPage />,
    },
    {
      value: "gl-balances",
      label: "GL Account Balances",
      element: () => <GlAccountBalancesPage />,
    },
    ...(hasAnyRole(user?.role, ["ACCOUNTANT", "SUPER_ADMIN", "ADMIN"])
      ? [
          {
            value: "manual-journals",
            label: "Manual Journals",
            element: () => <JournalEntryListPage />,
          },
          {
            value: "transactions",
            label: "Transactions",
            element: ({ companyId }: { companyId: number }) => (
              <TransactionPage companyId={companyId} />
            ),
          },
          {
            value: "reconciliations",
            label: "Reconcile",
            element: () => <ReconciliationListPage />,
          },
        ]
      : []),
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
        title="General Ledger"
        tabs={tabsList}
        defaultValue={tabsList[0].value}
        props={{ companyId: Number(user?.companyId) }}
      />
    )
  );
};

export default GeneralLedgerPage;
