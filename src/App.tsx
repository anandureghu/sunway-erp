import "./App.css";


/* Appraisal */
import ManageStocks from "./pages/inventory/manage-stocks";
import InventoryReportsPage from "./pages/inventory/inventory-reports-page";
import InventoryItemDetail from "./pages/inventory/inventory-item-detail";

/* Sales */
import SalesLandingPage from "./pages/sales/sales-landing-page";
import SalesOrdersPage from "./pages/sales/sales-orders-page";
import CustomersPage from "./pages/sales/customers-page";
import PicklistDispatchPage from "./pages/sales/picklist-dispatch-page";
import DeliveryTrackingPage from "./pages/sales/delivery-tracking-page";
import InvoicesPage from "./pages/sales/invoices-page";

/* Purchase */
import PurchaseLandingPage from "./pages/purchase/purchase-landing-page";
import PurchaseOrdersPage from "./pages/purchase/purchase-orders-page";
import SuppliersPage from "./pages/purchase/suppliers-page";
import PurchaseInvoicesPage from "./pages/purchase/purchase-invoices-page";
import ReceivingPage from "./pages/purchase/receiving-page";
import PurchaseRequisitionsPage from "./pages/purchase/purchase-requisitions-page";
import { PrivateRoute } from "./components/protected-route";
import { useAppSelector } from "./store/store";
import CompanyPage from "./pages/admin/hr/company/company-page";
import Payroll from "./pages/finance/payroll";
import DepartmentListPage from "./pages/admin/hr/department/department-list-page";
import CompanyDetailPage from "./pages/hr/company-detail-page";

import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

/* Profile tabs (shell + forms) */
import ProfileShell from "./modules/hr/employee/tabs/ProfileShell";
import EmployeeProfileForm from "./modules/hr/employee/tabs/EmployeeProfileForm";
import ContactInfoForm from "./modules/hr/employee/tabs/ContactInfoForm";

/* Layouts */
import AuthLayout from "./components/layout/auth-layout";
import AppLayout from "./components/layout/app-layout";

/* Pages */
import LoginPage from "./pages/auth/login-page";
import NotFound from "./pages/not-found";
import DashboardPage from "./pages/dashboard";
import AccountsReceivablePage from "./pages/finance/accounts-receivable-page";
import EmployeesPage from "./pages/employees-page";

/* Employee area */
import EmployeeShell from "./modules/hr/employee/EmployeeShell";

/* Current Job (tabbed) */
import CurrentJobShell from "./modules/hr/employee/CurrentJobShell";
import CurrentJobForm from "./modules/hr/current-job/tabs/CurrentJobForm";
import PreviousExperiencesForm from "./modules/hr/current-job/tabs/PreviousExperiencesForm";
import EducationQualificationsForm from "./modules/hr/current-job/tabs/EducationQualificationsForm";

/* Dependents */
import DependentsShell from "./modules/hr/employee/DependentsShell";
import { DependentsForm } from "./modules/hr/dependents/DependentsForm";

/* Loans */
import LoansShell from "./modules/hr/loans/LoansShell";
import LoansForm from "./modules/hr/loans/tabs/LoansForm";
import CompanyPropertiesForm from "./modules/hr/loans/tabs/CompanyPropertiesForm";

/* Salary */
import SalaryShell from "@/modules/hr/salary/SalaryShell";
import SalaryForm from "@/modules/hr/salary/tabs/SalaryForm";
import BankForm from "@/modules/hr/salary/tabs/BankForm";
import PayrollTab from "@/modules/hr/salary/tabs/PayrollTab";

/* Immigration */
import ImmigrationShell from "@/modules/hr/immigration/ImmigrationShell";
import PassportForm from "@/modules/hr/immigration/tabs/PassportForm";
import ResidencePermitForm from "@/modules/hr/immigration/tabs/ResidencePermitForm";

/* Leaves */
import LeavesShell from "@/modules/hr/employee/LeavesShell";
import LeavesForm from "@/modules/hr/leaves/tabs/LeavesForm";
import LeavesHistory from "@/modules/hr/leaves/tabs/LeavesHistory";

/* Appraisal */
import AppraisalShell from "@/modules/hr/appraisal/AppraisalShell";
import AppraisalForm from "@/modules/hr/appraisal/tabs/AppraisalForm";
import PerformanceForm from "@/modules/hr/appraisal/tabs/PerformanceForm";


export default function App() {
  const adminView = useAppSelector((s) => s.ui.adminView);
  return (
    <Routes>
      {/* App frame */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route
          index
          element={adminView ? <DashboardPage /> : <DashboardPage />}
        />

        {/* Finance */}
        <Route path="finance">
          <Route path="receivable" element={<AccountsReceivablePage />} />
          <Route path="payroll" element={<Payroll />} />
        </Route>

        {/* Admin */}
        <Route path="admin">
          <Route path="company" element={<CompanyPage />} />
          <Route path="department" element={<DepartmentListPage />} />
        </Route>

        {/* Inventory */}
        <Route path="inventory">
          <Route path="stocks" element={<ManageStocks />} />
          <Route path="stocks/:id" element={<InventoryItemDetail />} />
          <Route path="reports" element={<InventoryReportsPage />} />
          <Route path="sales" element={<SalesLandingPage />} />
          <Route path="sales/orders" element={<SalesOrdersPage />} />
          <Route path="sales/orders/new" element={<SalesOrdersPage />} />
          <Route path="sales/customers" element={<CustomersPage />} />
          <Route path="sales/picklist" element={<PicklistDispatchPage />} />
          <Route path="sales/tracking" element={<DeliveryTrackingPage />} />
          <Route path="sales/invoices" element={<InvoicesPage />} />
          <Route path="purchase" element={<PurchaseLandingPage />} />
          <Route path="purchase/orders" element={<PurchaseOrdersPage />} />
          <Route path="purchase/orders/new" element={<PurchaseOrdersPage />} />
          <Route path="purchase/suppliers" element={<SuppliersPage />} />
          <Route path="purchase/invoices" element={<PurchaseInvoicesPage />} />
          <Route path="purchase/receiving" element={<ReceivingPage />} />
          <Route
            path="purchase/requisitions"
            element={<PurchaseRequisitionsPage />}
          />
        </Route>

        <Route path="companies">
          <Route path=":id" element={<CompanyDetailPage />} />
        </Route>

        {/* HR */}
        <Route path="hr">
          {/* default for /hr */}
          <Route index element={<Navigate to="employees" replace />} />

          {/* alias /hr/employee -> /hr/employees */}
          <Route path="employee" element={<Navigate to="/hr/employees" replace />} />

          {/* employees list */}
          <Route path="employees" element={<EmployeesPage />} />

          {/* employee detail shell + nested tabs */}
          <Route path="employees/:id" element={<EmployeeShell />}>
            <Route index element={<Navigate to="profile" replace />} />

            {/* Profile (tabbed: Employee Profile / Contact Info) */}
            <Route path="profile" element={<ProfileShell />}>
              <Route index element={<EmployeeProfileForm />} />
              <Route path="contact" element={<ContactInfoForm />} />
            </Route>

            {/* Current Job */}
            <Route path="current-job" element={<CurrentJobShell />}>
              <Route index element={<CurrentJobForm />} />
              <Route path="previous-experiences" element={<PreviousExperiencesForm />} />
              <Route path="education" element={<EducationQualificationsForm />} />
            </Route>

            {/* Salary */}
            <Route path="salary" element={<SalaryShell />}>
              <Route index element={<SalaryForm />} />
              <Route path="bank" element={<BankForm />} />
              <Route path="payroll" element={<PayrollTab />} />
            </Route>

            {/* Immigration */}
            <Route path="immigration" element={<ImmigrationShell />}>
              <Route index element={<PassportForm />} />
              <Route path="residence-permit" element={<ResidencePermitForm />} />
            </Route>

            {/* Loans */}
            <Route path="loans" element={<LoansShell />}>
              <Route index element={<LoansForm />} />
              <Route path="company-properties" element={<CompanyPropertiesForm />} />
            </Route>

            {/* Dependents */}
            <Route path="dependents" element={<DependentsShell />}>
              <Route index element={<DependentsForm />} />
            </Route>

            {/* Leaves */}
            <Route path="leaves" element={<LeavesShell />}>
              <Route index element={<LeavesForm />} />
              <Route path="history" element={<LeavesHistory />} />
            </Route>

            {/* Appraisal */}
            <Route path="appraisal" element={<AppraisalShell />}>
              <Route index element={<PerformanceForm />} />
              <Route path="form" element={<AppraisalForm />} />
            </Route>

          </Route>
        </Route>
      </Route>

      {/* Auth */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}