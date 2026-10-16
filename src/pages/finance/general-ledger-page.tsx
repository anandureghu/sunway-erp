import { AppTab } from "@/components/app-tab";
import { useAuth } from "@/context/AuthContext";
import BudgetPage from "@/modules/finance/budget-page";
import TransactionPage from "@/modules/finance/transaction-page";
import CreditNotePage from "./credit-note-page";
import { isSecurityAdmin } from "@/lib/utils";
import { canView } from "@/service/companyService";
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
import { useMemo } from "react";

function normalizeRoleKey(role?: string | null): string {
  return String(role ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

/** Roles that should see core GL ops tabs when module grants are still missing. */
const FINANCE_LEDGER_OPS_ROLES = new Set([
  "ACCOUNTANT",
  "FINANCE_MANAGER",
  "CONTROLLER",
  "ADMIN",
  "SUPER_ADMIN",
]);

const GeneralLedgerPage = () => {
  const { user, permissions } = useAuth();

  const tabs = useMemo(() => {
    const isAdmin = isSecurityAdmin(user?.role);
    // Prefer company role display name ("Finance Manager") over JWT security role ("USER").
    const roleKey = normalizeRoleKey(user?.companyRole || user?.role);
    const isFinanceOps = isAdmin || FINANCE_LEDGER_OPS_ROLES.has(roleKey);

    const show = (module: string) =>
      isAdmin || isFinanceOps || canView(permissions, module);

    const showCoa = show("FINANCE_COA");
    const showBalances = show("FINANCE_LEDGER");
    const showManualJournals = show("FINANCE_JOURNAL");
    const showTransactions = show("FINANCE_LEDGER");
    const showReconcile = show("FINANCE_RECONCILIATION");
    const showBudget = show("FINANCE_BUDGET");
    const showCreditNotes = show("FINANCE_INVOICE");

    return [
      ...(showCoa
        ? [
            {
              value: "coa",
              label: "Chart Of Accounts",
              icon: <ListTree className="w-6 h-6" />,
              element: () => <ChartOfAccountsListPage />,
            },
          ]
        : []),
      ...(showBalances
        ? [
            {
              value: "gl-balances",
              label: "GL Account Balances",
              icon: <Landmark className="w-6 h-6" />,
              element: () => <GlAccountBalancesPage />,
            },
          ]
        : []),
      ...(showManualJournals
        ? [
            {
              value: "manual-journals",
              label: "Manual Journals",
              icon: <FileText className="w-6 h-6" />,
              element: () => <JournalEntryListPage />,
            },
          ]
        : []),
      ...(showTransactions
        ? [
            {
              value: "transactions",
              label: "Transactions",
              icon: <ArrowDownUp className="w-6 h-6" />,
              element: ({ companyId }: { companyId: number }) => (
                <TransactionPage companyId={companyId} />
              ),
            },
          ]
        : []),
      ...(showReconcile
        ? [
            {
              value: "reconciliations",
              label: "Reconcile",
              icon: <ListChecks className="w-6 h-6" />,
              element: () => <ReconciliationListPage />,
            },
          ]
        : []),
      ...(showBudget
        ? [
            {
              value: "budget",
              label: "Budget",
              icon: <ChartPie className="w-6 h-6" />,
              element: ({ companyId }: { companyId: number }) => (
                <BudgetPage companyId={companyId} />
              ),
            },
          ]
        : []),
      ...(showCreditNotes
        ? [
            {
              value: "credit-note",
              label: "Credit Notes",
              icon: <CreditCard className="w-6 h-6" />,
              element: () => <CreditNotePage />,
            },
          ]
        : []),
    ];
  }, [user?.role, user?.companyRole, permissions]);

  if (!user?.companyId) return null;

  if (tabs.length === 0) {
    return (
      <div className="min-h-screen space-y-5 bg-slate-50/60 p-4 sm:p-6">
        <PageHeader
          title="General Ledger"
          description="Chart of accounts, journals, transactions, and reconciliations"
          variant="darkBlue"
          icon={<BookOpen className="w-6 h-6" />}
        />
        <p className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
          You do not have permission to view any General Ledger sections.
          Contact your administrator to request access.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-5 bg-slate-50/60 p-4 sm:p-6">
      <PageHeader
        title="General Ledger"
        description="Chart of accounts, journals, transactions, and reconciliations"
        variant="darkBlue"
        icon={<BookOpen className="w-6 h-6" />}
      />
      <AppTab
        tabs={tabs}
        defaultValue={tabs[0].value}
        props={{ companyId: Number(user.companyId) }}
        className="p-0"
      />
    </div>
  );
};

export default GeneralLedgerPage;
