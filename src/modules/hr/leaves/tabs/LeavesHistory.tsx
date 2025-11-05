// src/modules/hr/leaves/tabs/LeavesHistory.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Row = {
  leaveCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  dateReported: string;
  leaveBalance: string;
  leaveStatus: string;
  totalDays: number;
};

export default function LeavesHistory() {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const key = `leaves-history-${id}`;
    setRows(JSON.parse(localStorage.getItem(key) || "[]"));
  }, [id]);

  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">Employee Leave History</div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left">
              <Th>Leave Code</Th><Th>Leave Type</Th><Th>Start Date</Th>
              <Th>End Date</Th><Th>Date Reported</Th><Th>Total Days on Vacation</Th>
              <Th>Leave Status</Th><Th>Leave Balance</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">
                No history yet. Save a leave in “Employee Leaves”.
              </td></tr>
            )}
            {rows.map(r => (
              <tr key={r.leaveCode} className="border-t">
                <Td>{r.leaveCode}</Td>
                <Td>{r.leaveType}</Td>
                <Td>{fmt(r.startDate)}</Td>
                <Td>{fmt(r.endDate)}</Td>
                <Td>{fmt(r.dateReported)}</Td>
                <Td>{r.totalDays}</Td>
                <Td>
                  <span className="inline-flex rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
                    {r.leaveStatus}
                  </span>
                </Td>
                <Td>{r.leaveBalance || "-"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => <th className="px-3 py-2 font-medium">{children}</th>;
const Td = ({ children }: { children: React.ReactNode }) => <td className="px-3 py-2">{children}</td>;
const fmt = (iso: string) => (iso ? iso.split("-").reverse().join("-") : "-");
