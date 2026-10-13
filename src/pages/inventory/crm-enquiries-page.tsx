import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Inbox, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listCrmEnquiries } from "@/service/crmEnquiryService";
import type {
  CrmEnquiry,
  CrmPipelineStatus,
  CrmProspectType,
  CrmRelationshipStage,
} from "@/types/crm-enquiry";

const PIPELINE_LABEL: Record<CrmPipelineStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  WON: "Won",
  LOST: "Lost",
  ON_HOLD: "On hold",
};

const STAGE_LABEL: Record<CrmRelationshipStage, string> = {
  PROSPECTIVE: "Prospective",
  CURRENT: "Current",
  PAST: "Past",
};

const TYPE_LABEL: Record<CrmProspectType, string> = {
  CUSTOMER: "Customer",
  SUPPLIER: "Supplier",
  BOTH: "Both",
};

function pipelineBadge(status: CrmPipelineStatus): string {
  switch (status) {
    case "NEW":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "WON":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "LOST":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "ON_HOLD":
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function CrmEnquiriesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CrmEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<CrmPipelineStatus | "all">("all");
  const [stage, setStage] = useState<CrmRelationshipStage | "all">("all");
  const [type, setType] = useState<CrmProspectType | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCrmEnquiries({
        page,
        size: 20,
        pipeline,
        stage,
        type,
        search,
      });
      setRows(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      toast.error("Failed to load enquiries");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, pipeline, stage, type, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto w-full space-y-6 p-4 sm:p-6 py-2">
      <PageHeader
        title="CRM Enquiries"
        description="Track prospects, notes, and convert won leads to customers or suppliers."
        icon={<Inbox className="w-6 h-6" />}
        variant="darkGreen"
        backHref="/inventory/crm"
        actions={
          <Button onClick={() => navigate("/inventory/crm/enquiries/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New enquiry
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border bg-white p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, org, email, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          value={pipeline}
          onValueChange={(v) => {
            setPipeline(v as CrmPipelineStatus | "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All pipelines</SelectItem>
            {(Object.keys(PIPELINE_LABEL) as CrmPipelineStatus[]).map((k) => (
              <SelectItem key={k} value={k}>
                {PIPELINE_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={stage}
          onValueChange={(v) => {
            setStage(v as CrmRelationshipStage | "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {(Object.keys(STAGE_LABEL) as CrmRelationshipStage[]).map((k) => (
              <SelectItem key={k} value={k}>
                {STAGE_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v as CrmProspectType | "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.keys(TYPE_LABEL) as CrmProspectType[]).map((k) => (
              <SelectItem key={k} value={k}>
                {TYPE_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Pipeline</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No enquiries yet. Create one to start tracking prospects.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b last:border-0 hover:bg-slate-50"
                    onClick={() =>
                      navigate(`/inventory/crm/enquiries/${row.id}`)
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{row.name}</div>
                      {row.organizationName ? (
                        <div className="text-xs text-muted-foreground">
                          {row.organizationName}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {TYPE_LABEL[row.prospectType]}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={pipelineBadge(row.pipelineStatus)}
                      >
                        {PIPELINE_LABEL[row.pipelineStatus]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {STAGE_LABEL[row.relationshipStage]}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{row.email || "—"}</div>
                      <div>{row.phone || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {row.updatedAt
                        ? format(new Date(row.updatedAt), "MMM d, yyyy")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <span>
            {totalElements} enquir{totalElements === 1 ? "y" : "ies"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="flex items-center px-2">
              Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
