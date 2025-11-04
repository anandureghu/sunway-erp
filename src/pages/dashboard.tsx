import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

export default function DashboardPage() {
  // Calendar
  const [date, setDate] = useState<Date | undefined>(new Date());

  // HR Data
  const employeeAttendance = [
    { day: "Mon", present: 95 },
    { day: "Tue", present: 98 },
    { day: "Wed", present: 92 },
    { day: "Thu", present: 97 },
    { day: "Fri", present: 94 },
  ];

  // Inventory Data
  const inventoryStock = [
    { item: "Cement", quantity: 120 },
    { item: "Steel", quantity: 90 },
    { item: "Bricks", quantity: 160 },
    { item: "Paint", quantity: 75 },
    { item: "Pipes", quantity: 110 },
  ];

  // Finance Data
  const revenueVsExpense = [
    { month: "Jan", revenue: 250000, expense: 200000 },
    { month: "Feb", revenue: 280000, expense: 220000 },
    { month: "Mar", revenue: 300000, expense: 250000 },
    { month: "Apr", revenue: 320000, expense: 270000 },
    { month: "May", revenue: 350000, expense: 290000 },
  ];

  const payableReceivable = [
    { label: "Accounts Receivable", value: 78 },
    { label: "Accounts Payable", value: 55 },
  ];

  const payrollProgress = 82; // % of payroll processed

  return (
    <div className="p-6 grid gap-6 lg:grid-cols-3 md:grid-cols-2">
      {/* HR Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Attendance</CardTitle>
          <CardDescription>Overall presence this week</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="h-[150px]"
            config={{
              present: { label: "Attendance %", color: "hsl(var(--chart-1))" },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={employeeAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <Tooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Average Attendance:{" "}
            <span className="font-semibold text-primary">95%</span>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Processing</CardTitle>
          <CardDescription>HR & Finance Integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-4xl font-bold text-blue-600 mb-2">
              {payrollProgress}%
            </h2>
            <p className="text-sm text-gray-500 mb-3">Payroll Completed</p>
            <Progress value={payrollProgress} />
            <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white">
              View Payroll Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>HR Calendar</CardTitle>
          <CardDescription>Upcoming events and holidays</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Inventory Status */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Inventory Stock Levels</CardTitle>
          <CardDescription>Warehouse availability overview</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="h-[200px]"
            config={{
              quantity: {
                label: "Available Stock",
                color: "hsl(var(--chart-2))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryStock}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="item" />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="quantity" fill="hsl(var(--chart-2))" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Finance Section */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Revenue vs Expense</CardTitle>
          <CardDescription>Monthly financial performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="h-[200px]"
            config={{
              revenue: { label: "Revenue", color: "hsl(var(--chart-3))" },
              expense: { label: "Expense", color: "hsl(var(--chart-4))" },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueVsExpense}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <Tooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Payable / Receivable */}
      <Card>
        <CardHeader>
          <CardTitle>Finance Summary</CardTitle>
          <CardDescription>Accounts receivable vs payable</CardDescription>
        </CardHeader>
        <CardContent>
          {payableReceivable.map((item) => (
            <div key={item.label} className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{item.label}</span>
                <span className="font-medium">{item.value}%</span>
              </div>
              <Progress value={item.value} />
            </div>
          ))}
          <Button className="w-full mt-2">View Financial Reports</Button>
        </CardContent>
      </Card>
    </div>
  );
}
