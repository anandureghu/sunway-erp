import { AppTab } from "@/components/app-tab";
import VendorsPage from "../admin/vendors/vendors-page";

const FinanceSettingsPage = () => {
  const tabsList = [
    {
      value: "vendors",
      label: "Suppliers",
      element: () => <VendorsPage financeSettings />,
    },
  ];

  return (
    <div className="p-5">
      <AppTab
        title="Finance Settings"
        tabs={tabsList}
        defaultValue={tabsList[0].value}
      />
    </div>
  );
};

export default FinanceSettingsPage;
