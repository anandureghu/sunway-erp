import { AppTab } from "@/components/app-tab";

const Payroll = () => {
  const tabsList = [
    {
      value: "company-payroll",
      label: "Company Payroll",
    },
    { value: "payroll-setup", label: "Payroll Setup" },
  ];
  return (
    <div>
      <AppTab
        title="Payroll"
        tabs={tabsList}
        defaultValue="company-payroll"
        props={{}}
      />
    </div>
  );
};

export default Payroll;
