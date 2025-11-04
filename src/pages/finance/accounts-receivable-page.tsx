import { DataTable } from "@/components/datatable";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { SALES_INVOICE_COLUMNS } from "@/lib/columns/accounts-receivable-columns";
import { dummyInvoices } from "@/lib/data";
import type { Invoice } from "@/types/sales";
import { useEffect, useState } from "react";

async function getData(): Promise<Invoice[]> {
  // Fetch data from your API here.
  return dummyInvoices;
}

const AccountsReceivablePage = () => {
  const [data, setData] = useState<Invoice[]>([]);

  useEffect(() => {
    // Fetch data when component mounts
    getData().then((data) => {
      setData(data);
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Accounts Receivable</h1>

      <Card>
        <CardContent>
          <Tabs defaultValue="invoices" className="w-full max-w-3xl">
            <TabsList>
              <StyledTabsTrigger value="invoices">
                Sales Invoices
              </StyledTabsTrigger>
              <StyledTabsTrigger value="payments">
                Customer Payments
              </StyledTabsTrigger>
              <StyledTabsTrigger value="agreements">
                Agreements
              </StyledTabsTrigger>
              <StyledTabsTrigger value="credits">
                Customer Credit Accounts
              </StyledTabsTrigger>
              <StyledTabsTrigger value="charges">
                Other Finance Charges
              </StyledTabsTrigger>
            </TabsList>

            <TabsContent value="invoices">
              <DataTable columns={SALES_INVOICE_COLUMNS} data={data} />
            </TabsContent>

            <TabsContent value="payments">
              <p className="text-gray-600 mt-4">
                Track and record customer payments here.
              </p>
            </TabsContent>

            <TabsContent value="agreements">
              <p className="text-gray-600 mt-4">
                Manage customer agreements and contracts.
              </p>
            </TabsContent>

            <TabsContent value="credits">
              <p className="text-gray-600 mt-4">
                Overview of customer credit accounts.
              </p>
            </TabsContent>

            <TabsContent value="charges">
              <p className="text-gray-600 mt-4">
                Add or review other finance-related charges.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsReceivablePage;
