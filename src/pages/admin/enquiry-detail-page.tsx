import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Inbox } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getEnquiry, updateEnquiry } from "@/service/enquiryService";
import type { Enquiry, EnquiryStatus } from "@/types/enquiry";
import { PageHeader, PAGE_HEADER_ACTION_LINK_CLASS } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  CLOSED: "Closed",
};

export default function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<EnquiryStatus>("NEW");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin || !id) return;
    setLoading(true);
    getEnquiry(Number(id))
      .then((data) => {
        setEnquiry(data);
        setStatus(data.status);
        setNotes(data.notes ?? "");
      })
      .catch(() => {
        toast.error("Could not load enquiry");
        setEnquiry(null);
      })
      .finally(() => setLoading(false));
  }, [isSuperAdmin, id]);

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const listPath = "/admin/enquiries";

  const onSave = async () => {
    if (!enquiry) return;
    setSaving(true);
    try {
      const updated = await updateEnquiry(enquiry.id, { status, notes });
      setEnquiry(updated);
      setStatus(updated.status);
      setNotes(updated.notes ?? "");
      toast.success("Enquiry updated");
    } catch {
      toast.error("Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-50/60 min-h-screen space-y-4">
        <Link to={listPath} className={PAGE_HEADER_ACTION_LINK_CLASS}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="p-6 bg-slate-50/60 min-h-screen space-y-4">
        <Link to={listPath} className={PAGE_HEADER_ACTION_LINK_CLASS}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <p className="text-sm text-muted-foreground">Enquiry not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50/60 min-h-screen space-y-4">
      <PageHeader
        title={enquiry.name}
        description={enquiry.email}
        icon={<Inbox className="h-5 w-5" />}
        actions={
          <Link to={listPath} className={PAGE_HEADER_ACTION_LINK_CLASS}>
            <ArrowLeft className="h-4 w-4" />
            All enquiries
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{STATUS_LABEL[enquiry.status]}</Badge>
            <Badge variant="outline">
              {enquiry.channel === "WHATSAPP" ? "WhatsApp" : "Email"}
            </Badge>
            {enquiry.interest ? <Badge variant="outline">{enquiry.interest}</Badge> : null}
          </div>

          <dl className="space-y-0">
            <DetailRow label="Phone" value={enquiry.phone || "—"} />
            <DetailRow
              label="Submitted"
              value={
                enquiry.createdAt
                  ? format(new Date(enquiry.createdAt), "dd MMM yyyy HH:mm")
                  : "—"
              }
            />
            <DetailRow
              label="Updated"
              value={
                enquiry.updatedAt
                  ? format(new Date(enquiry.updatedAt), "dd MMM yyyy HH:mm")
                  : "—"
              }
            />
          </dl>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1.5">Message</h3>
            <p className="text-sm text-slate-900 whitespace-pre-wrap rounded-md bg-slate-50 border border-slate-100 p-3 min-h-[6rem]">
              {enquiry.message?.trim() || "—"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 h-fit">
          <div className="space-y-2">
            <Label htmlFor="enquiry-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as EnquiryStatus)}>
              <SelectTrigger id="enquiry-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="enquiry-notes">Internal notes</Label>
            <Textarea
              id="enquiry-notes"
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Follow-ups, call notes…"
            />
          </div>
          <Button type="button" onClick={() => void onSave()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 gap-1 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4 py-2 border-b border-slate-100 last:border-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-slate-900 break-words">{value}</dd>
    </div>
  );
}
