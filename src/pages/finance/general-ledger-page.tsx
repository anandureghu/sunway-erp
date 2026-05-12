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
import { PageHeader } from "@/components/PageHeader";
import {
  ArrowDownUp,
  BookOpen,
  ChartPie,
  CreditCard,
  FileText,
  Landmark,
  ListChecks,
  ListTree,
} from "lucide-react";

const GeneralLedgerPage = () => {
  const { user } = useAuth();
  const tabsList = [
    {
      value: "coa",
      label: "Chart Of Accounts",
      icon: <ListTree className="w-6 h-6" />,
      element: () => <ChartOfAccountsListPage />,
    },
    {
      value: "gl-balances",
      label: "GL Account Balances",
      icon: <Landmark className="w-6 h-6" />,
      element: () => <GlAccountBalancesPage />,
    },
    ...(hasAnyRole(user?.role, ["ACCOUNTANT", "SUPER_ADMIN", "ADMIN"])
      ? [
          {
            value: "manual-journals",
            label: "Manual Journals",
            icon: <FileText className="w-6 h-6" />,
            element: () => <JournalEntryListPage />,
          },
          {
            value: "transactions",
            label: "Transactions",
            icon: <ArrowDownUp className="w-6 h-6" />,
            element: ({ companyId }: { companyId: number }) => (
              <TransactionPage companyId={companyId} />
            ),
          },
          {
            value: "reconciliations",
            label: "Reconcile",
            icon: <ListChecks className="w-6 h-6" />,
            element: () => <ReconciliationListPage />,
          },
        ]
      : []),
    {
      value: "budget",
      label: "Budget",
      icon: <ChartPie className="w-6 h-6" />,
      element: ({ companyId }: { companyId: number }) => (
        <BudgetPage companyId={companyId} />
      ),
    },
    {
      value: "credit-note",
      label: "Credit Notes",
      icon: <CreditCard className="w-6 h-6" />,
      element: () => <CreditNotePage />,
    },
  ];

  return (
    user?.companyId && (
      <div className="p-6 bg-slate-50/60 min-h-screen">
        <PageHeader
          title="General Ledger"
          description="Manage your general ledger and transactions"
          variant="darkBlue"
          icon={<BookOpen className="w-6 h-6" />}
        />
        <AppTab
          tabs={tabsList}
          defaultValue={tabsList[0].value}
          props={{ companyId: Number(user?.companyId) }}
        />
      </div>
    )
  );
};

export default GeneralLedgerPage;
