import "./App.css";

/* Appraisal */
import ManageStocks from "./pages/inventory/manage-stocks";
import InventoryReportsPage from "./pages/inventory/inventory-reports-page";
import InventoryItemDetail from "./pages/inventory/inventory-item-detail";

/* Sales */
import SalesLandingPage from "./pages/sales/sales-landing-page";
import SalesOrdersPage from "./pages/sales/sales-orders-page";
import SalesCustomersPage from "./pages/sales/customers-page";
import PicklistDispatchPage from "./pages/sales/picklist-dispatch-page";
import DeliveryTrackingPage from "./pages/sales/delivery-tracking-page";
import InvoicesPage from "./pages/sales/invoices-page";

/* Purchase */
import PurchaseLandingPage from "./pages/purchase/purchase-landing-page";
import PurchaseOrdersPage from "./pages/purchase/purchase-orders-page";
import PurchaseOrderDetailPage from "./pages/purchase/purchase-order-detail-page";
import PurchaseInvoiceDetailPage from "./pages/purchase/purchase-invoice-detail-page";
import GoodsReceiptDetailPage from "./pages/purchase/goods-receipt-detail-page";
import PurchaseRequisitionDetailPage from "./pages/purchase/purchase-requisition-detail-page";
import SuppliersPage from "./pages/purchase/suppliers-page";
import PurchaseInvoicesPage from "./pages/purchase/purchase-invoices-page";
import ReceivingPage from "./pages/purchase/receiving-page";
import PurchaseRequisitionsPage from "./pages/purchase/purchase-requisitions-page";
import EditPurchaseRequisitionPage from "./pages/purchase/edit-purchase-requisition-page";
import { PermissionProtectedRoute as PrivateRoute } from "./components/protected-route";
import { useAppDispatch } from "./store/store";
import CompanyPage from "./pages/admin/hr/company/company-page";
import Payroll from "./pages/finance/payroll";
import CompanyDetailPage from "./pages/hr/company-detail-page";
import CustomersPage from "./pages/admin/customers/customers-page";
import CustomerDetailPage from "./pages/admin/customers/customer-detail-page";
import VendorsPage from "./pages/admin/vendors/vendors-page";
import VendorDetailPage from "./pages/admin/vendors/vendor-detail-page";

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
import ForgotPasswordPage from "./pages/auth/forgot-password-page";
import ForgotPasswordResetPage from "./pages/auth/forgot-password-reset-page";
import VerifyOtpPage from "./pages/auth/verify-otp-page";
import ResetPasswordPage from "./pages/auth/reset-password";
import NotFound from "./pages/not-found";
import DashboardPage from "./pages/dashboard";
import AccountsReceivablePage from "./pages/finance/accounts-receivable-page";
import EmployeesPage from "./pages/employees-page";

/* Employee area */
import EmployeeShell from "./modules/hr/employee/EmployeeShell";

/* Current Job (tabbed) */
import CurrentJobShell from "./modules/hr/employee/CurrentJobShell";
import CurrentJobForm from "./modules/hr/current-job/tabs/CurrentJobForm";
import EmployeeContractForm from "./modules/hr/current-job/tabs/EmployeeContractForm";
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
import TimesheetTab from "@/modules/hr/leaves/tabs/TimesheetTab";

/* Appraisal */
import AppraisalShell from "@/modules/hr/appraisal/AppraisalShell";
import AppraisalsForm from "@/modules/hr/appraisal/AppraisalsForm";
import GeneralLedgerPage from "./pages/finance/general-ledger-page";
import FinanceReportsPage from "./pages/finance/finance-reports-page";
import AccountsPayablePage from "./pages/finance/accounts-payable-page";
import AdminSystemLogsPage from "./pages/admin/system-logs-page";
import AdminSystemLogDetailPage from "./pages/admin/system-log-detail-page";
import JournalDetailPage from "./modules/finance/journal-detail-page";
import BudgetDetailPage from "./modules/finance/budget-detail-page";
import InventorySettingsPage from "./pages/inventory/inventory-settings-page";
import { ModuleAccessGate } from "./components/module-access-gate";
import { InventoryModule } from "./lib/module-permissions";
import FinanceSettingsPage from "./pages/finance/finance-settings-page";
import WarehouseDetail from "./modules/inventory/warehouse/warehouse-detail";
import SalesOrdersDetailPage from "./pages/sales/sales-orders-detail-page";
import PicklistDetailPage from "./pages/sales/picklist-detail-page";
import InvoiceDetailPage from "./pages/sales/invoice-detail-page";
import SettingsPage from "./pages/settings/settings-page";
import HRSettingsPage from "./pages/hr/settings-page";
import HRReportsPage from "./pages/hr/hr-reports-page";
import LeaveCustomizationPage from "./pages/admin/hr/leaves/leave-customization-page";
import { useEffect } from "react";
import { setGlobalSettingsView } from "@/store/uiSlice";
import UserProfilePage from "@/pages/user-profile-page";
import { ErrorBoundary } from "./components/error-boundary";
import PublicInvoicePage from "./pages/public/public-invoice-page";
import PublicDeliveryTrackingPage from "./pages/public/public-delivery-tracking-page";

export default function App() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setGlobalSettingsView(false));
  }, []);
  return (
    <ErrorBoundary>
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
            element={<DashboardPage />}
          />
          <Route path="profile" element={<UserProfilePage />} />

          {/* Finance */}
          <Route path="finance">
            <Route path="payroll" element={<Payroll />} />
            <Route path="settings" element={<FinanceSettingsPage />} />
            <Route path="receivable" element={<AccountsReceivablePage />} />
            <Route path="payable" element={<AccountsPayablePage />} />
            <Route path="ledger" element={<GeneralLedgerPage />} />
            <Route path="reports" element={<FinanceReportsPage />} />
            <Route path="journals">
              <Route path=":id" element={<JournalDetailPage />} />
            </Route>
            <Route path="budgets">
              <Route path=":id" element={<BudgetDetailPage />} />
            </Route>
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="vendors/:id" element={<VendorDetailPage />} />
          </Route>

          <Route path="sales">
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          </Route>

          <Route
            path="settings/payroll/:id"
            element={<Navigate to="/finance/payroll" replace />}
          />
          <Route path="settings/:id" element={<SettingsPage />} />
          <Route
            path="settings/roles/:id"
            element={<Navigate to="/hr/settings?tab=roles" replace />}
          />

          {/* Admin */}
          <Route path="admin">
            <Route path="company" element={<CompanyPage />} />
            <Route path="bank-accounts" element={<Navigate to="/finance/settings?tab=bank-accounts" replace />} />
            <Route
              path="default-accounts"
              element={<Navigate to="/finance/settings?tab=default-accounts" replace />}
            />
            <Route path="tax-settings" element={<Navigate to="/finance/settings?tab=tax-settings" replace />} />
            <Route path="social-settings" element={<Navigate to="/hr/settings?tab=social" replace />} />
            <Route path="invoice-settings" element={<Navigate to="/finance/settings?tab=invoice-settings" replace />} />
            <Route path="department" element={<Navigate to="/hr/settings?tab=department" replace />} />
            <Route path="division" element={<Navigate to="/hr/settings?tab=department" replace />} />
            <Route
              path="accounting-period"
              element={<Navigate to="/finance/settings?tab=accounting-period" replace />}
            />
            <Route path="leaves" element={<LeaveCustomizationPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="vendors/:id" element={<VendorDetailPage />} />
            <Route path="system-logs" element={<AdminSystemLogsPage />} />
            <Route path="system-logs/:id" element={<AdminSystemLogDetailPage />} />
          </Route>

          {/* Inventory */}
          <Route path="inventory">
            <Route
              path="settings"
              element={
                <ModuleAccessGate
                  modules={[
                    InventoryModule.CATEGORY,
                    InventoryModule.WAREHOUSE,
                    InventoryModule.PURCHASE,
                    InventoryModule.SALES,
                  ]}
                  title="Inventory settings access denied"
                >
                  <InventorySettingsPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="stocks"
              element={
                <ModuleAccessGate
                  modules={[InventoryModule.STOCK, InventoryModule.ITEM]}
                  title="Stock management access denied"
                >
                  <ManageStocks />
                </ModuleAccessGate>
              }
            />
            <Route
              path="stocks/:id"
              element={
                <ModuleAccessGate
                  module={InventoryModule.ITEM}
                  title="Item detail access denied"
                >
                  <InventoryItemDetail />
                </ModuleAccessGate>
              }
            />
            <Route
              path="warehouses/:id"
              element={
                <ModuleAccessGate
                  module={InventoryModule.WAREHOUSE}
                  title="Warehouse access denied"
                >
                  <WarehouseDetail />
                </ModuleAccessGate>
              }
            />
            <Route path="reports">
              <Route
                index
                element={<Navigate to="operations" replace />}
              />
              <Route
                path="operations"
                element={
                  <ModuleAccessGate
                    module={InventoryModule.STOCK}
                    title="Inventory reports access denied"
                  >
                    <InventoryReportsPage />
                  </ModuleAccessGate>
                }
              />
              <Route
                path="management"
                element={
                  <ModuleAccessGate
                    module={InventoryModule.STOCK}
                    title="Inventory reports access denied"
                  >
                    <InventoryReportsPage />
                  </ModuleAccessGate>
                }
              />
            </Route>
            <Route
              path="sales"
              element={
                <ModuleAccessGate
                  module={InventoryModule.SALES}
                  title="Sales access denied"
                >
                  <SalesLandingPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="sales/orders"
              element={
                <ModuleAccessGate module={InventoryModule.SALES}>
                  <SalesOrdersPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="sales/orders/:id"
              element={
                <ModuleAccessGate module={InventoryModule.SALES}>
                  <SalesOrdersDetailPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="sales/orders/new"
              element={
                <ModuleAccessGate module={InventoryModule.SALES}>
                  <SalesOrdersPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="sales/customers"
              element={
                <ModuleAccessGate module={InventoryModule.SALES}>
                  <SalesCustomersPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="sales/customers/:id"
              element={
                <ModuleAccessGate module={InventoryModule.SALES}>
                  <CustomerDetailPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="sales/picklist"
              element={
                <ModuleAccessGate module={InventoryModule.SALES}>
                  <PicklistDispatchPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="sales/picklist/:id"
              element={
                <ModuleAccessGate module={InventoryModule.SALES}>
                  <PicklistDetailPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="sales/tracking"
              element={
                <ModuleAccessGate module={InventoryModule.SALES}>
                  <DeliveryTrackingPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="sales/invoices"
              element={
                <ModuleAccessGate module={InventoryModule.SALES}>
                  <InvoicesPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase"
              element={
                <ModuleAccessGate
                  module={InventoryModule.PURCHASE}
                  title="Purchase access denied"
                >
                  <PurchaseLandingPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase/orders"
              element={
                <ModuleAccessGate module={InventoryModule.PURCHASE}>
                  <PurchaseOrdersPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase/orders/:id"
              element={
                <ModuleAccessGate module={InventoryModule.PURCHASE}>
                  <PurchaseOrderDetailPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase/suppliers"
              element={
                <ModuleAccessGate module={InventoryModule.PURCHASE}>
                  <SuppliersPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase/suppliers/:id"
              element={
                <ModuleAccessGate module={InventoryModule.PURCHASE}>
                  <VendorDetailPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase/invoices"
              element={
                <ModuleAccessGate module={InventoryModule.PURCHASE}>
                  <PurchaseInvoicesPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase/invoices/:id"
              element={
                <ModuleAccessGate module={InventoryModule.PURCHASE}>
                  <PurchaseInvoiceDetailPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase/receiving"
              element={
                <ModuleAccessGate module={InventoryModule.RECEIPT}>
                  <ReceivingPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase/receiving/:id"
              element={
                <ModuleAccessGate module={InventoryModule.RECEIPT}>
                  <GoodsReceiptDetailPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase/requisitions"
              element={
                <ModuleAccessGate module={InventoryModule.PURCHASE}>
                  <PurchaseRequisitionsPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase/requisitions/new"
              element={
                <ModuleAccessGate module={InventoryModule.PURCHASE}>
                  <PurchaseRequisitionsPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase/requisitions/:id/edit"
              element={
                <ModuleAccessGate module={InventoryModule.PURCHASE}>
                  <EditPurchaseRequisitionPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="purchase/requisitions/:id"
              element={
                <ModuleAccessGate module={InventoryModule.PURCHASE}>
                  <PurchaseRequisitionDetailPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="customers/:id"
              element={
                <ModuleAccessGate module={InventoryModule.SALES}>
                  <CustomerDetailPage />
                </ModuleAccessGate>
              }
            />
            <Route
              path="vendors/:id"
              element={
                <ModuleAccessGate module={InventoryModule.PURCHASE}>
                  <VendorDetailPage />
                </ModuleAccessGate>
              }
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
            <Route
              path="employee"
              element={<Navigate to="/hr/employees" replace />}
            />

            <Route path="payroll" element={<Payroll />} />

            {/* employees list */}
            <Route path="employees" element={<EmployeesPage />} />

            {/* HR Reports */}
            <Route path="reports" element={<HRReportsPage />} />

            {/* Immigration expiry now lives as a tab inside HR Reports.
                Keep the old path working by redirecting to that tab. */}
            <Route
              path="immigration-expiry"
              element={<Navigate to="/hr/reports?tab=immigration" replace />}
            />

            {/* HR Settings */}
            <Route path="settings" element={<HRSettingsPage />} />
            <Route
              path="settings/leave-customization"
              element={<LeaveCustomizationPage />}
            />

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
                <Route path="contract" element={<EmployeeContractForm />} />
                <Route
                  path="previous-experiences"
                  element={<PreviousExperiencesForm />}
                />
                <Route
                  path="education"
                  element={<EducationQualificationsForm />}
                />
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
                <Route
                  path="residence-permit"
                  element={<ResidencePermitForm />}
                />
              </Route>

              {/* Loans */}
              <Route path="loans" element={<LoansShell />}>
                <Route index element={<LoansForm />} />
                <Route
                  path="company-properties"
                  element={<CompanyPropertiesForm />}
                />
              </Route>

              {/* Dependents */}
              <Route path="dependents" element={<DependentsShell />}>
                <Route index element={<DependentsForm />} />
              </Route>

              {/* Leaves */}
              <Route path="leaves" element={<LeavesShell />}>
                <Route index element={<LeavesForm />} />
                <Route path="history" element={<LeavesHistory />} />
                <Route path="timesheet" element={<TimesheetTab />} />
              </Route>

              {/* Appraisal */}
              <Route path="appraisal" element={<AppraisalShell />}>
                <Route index element={<AppraisalsForm />} />
                <Route path="form" element={<AppraisalsForm />} />
              </Route>
            </Route>
          </Route>
        </Route>

        {/* Auth */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="forgot-password/reset" element={<ForgotPasswordResetPage />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route
          path="/public/invoices/:invoiceCode"
          element={<PublicInvoicePage />}
        />
        <Route
          path="/public/track/:companyCode"
          element={<PublicDeliveryTrackingPage />}
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}
