import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Inbox,
  Loader2,
  StickyNote,
  UserPlus,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addCrmEnquiryNote,
  convertCrmEnquiry,
  createCrmEnquiry,
  getCrmEnquiry,
  updateCrmEnquiry,
} from "@/service/crmEnquiryService";
import type {
  CrmEnquiry,
  CrmPipelineStatus,
  CrmProspectType,
  CrmRelationshipStage,
} from "@/types/crm-enquiry";

const emptyForm = {
  name: "",
  organizationName: "",
  prospectType: "CUSTOMER" as CrmProspectType,
  email: "",
  phone: "",
  secondaryContact: "",
  address: "",
  source: "",
  interest: "",
  summary: "",
  pipelineStatus: "NEW" as CrmPipelineStatus,
  relationshipStage: "PROSPECTIVE" as CrmRelationshipStage,
};

export default function CrmEnquiryDetailPage() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [enquiry, setEnquiry] = useState<CrmEnquiry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [noteBody, setNoteBody] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [converting, setConverting] = useState<"CUSTOMER" | "SUPPLIER" | null>(
    null,
  );

  const load = useCallback(async () => {
    if (isNew || !id) return;
    setLoading(true);
    try {
      const data = await getCrmEnquiry(Number(id));
      setEnquiry(data);
      setForm({
        name: data.name ?? "",
        organizationName: data.organizationName ?? "",
        prospectType: data.prospectType,
        email: data.email ?? "",
        phone: data.phone ?? "",
        secondaryContact: data.secondaryContact ?? "",
        address: data.address ?? "",
        source: data.source ?? "",
        interest: data.interest ?? "",
        summary: data.summary ?? "",
        pipelineStatus: data.pipelineStatus,
        relationshipStage: data.relationshipStage,
      });
    } catch {
      toast.error("Failed to load enquiry");
      navigate("/inventory/crm/enquiries");
    } finally {
      setLoading(false);
    }
  }, [id, isNew, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        organizationName: form.organizationName.trim() || null,
        prospectType: form.prospectType,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        secondaryContact: form.secondaryContact.trim() || null,
        address: form.address.trim() || null,
        source: form.source.trim() || null,
        interest: form.interest.trim() || null,
        summary: form.summary.trim() || null,
        pipelineStatus: form.pipelineStatus,
        relationshipStage: form.relationshipStage,
      };
      if (isNew) {
        const created = await createCrmEnquiry(payload);
        toast.success("Enquiry created");
        navigate(`/inventory/crm/enquiries/${created.id}`, { replace: true });
      } else {
        const updated = await updateCrmEnquiry(Number(id), payload);
        setEnquiry(updated);
        toast.success("Enquiry saved");
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (isNew || !id) return;
    if (!noteBody.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    setAddingNote(true);
    try {
      const updated = await addCrmEnquiryNote(Number(id), noteBody.trim());
      setEnquiry(updated);
      setNoteBody("");
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleConvert = async (target: "CUSTOMER" | "SUPPLIER") => {
    if (isNew || !id) return;
    setConverting(target);
    try {
      const updated = await convertCrmEnquiry(Number(id), target);
      setEnquiry(updated);
      setForm((prev) => ({
        ...prev,
        pipelineStatus: updated.pipelineStatus,
        relationshipStage: updated.relationshipStage,
      }));
      toast.success(
        target === "CUSTOMER"
          ? "Converted to customer"
          : "Converted to supplier",
      );
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Conversion failed";
      toast.error(msg);
    } finally {
      setConverting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 py-2">
      <PageHeader
        title={isNew ? "New enquiry" : form.name || "Enquiry"}
        description={
          isNew
            ? "Capture a prospective customer or supplier."
            : "Update details, track status, and add notes."
        }
        icon={<Inbox className="w-6 h-6" />}
        variant="darkGreen"
        backHref="/inventory/crm/enquiries"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>
            Contact, pipeline, and relationship information
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Contact or lead name"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Organization</Label>
            <Input
              value={form.organizationName}
              onChange={(e) => setField("organizationName", e.target.value)}
              placeholder="Company / organisation"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Prospect type</Label>
            <Select
              value={form.prospectType}
              onValueChange={(v) => setField("prospectType", v as CrmProspectType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="SUPPLIER">Supplier</SelectItem>
                <SelectItem value="BOTH">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Input
              value={form.source}
              onChange={(e) => setField("source", e.target.value)}
              placeholder="Referral, web, call…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Secondary contact</Label>
            <Input
              value={form.secondaryContact}
              onChange={(e) => setField("secondaryContact", e.target.value)}
              placeholder="Alternate person or number"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Interest / topic</Label>
            <Input
              value={form.interest}
              onChange={(e) => setField("interest", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Pipeline status</Label>
            <Select
              value={form.pipelineStatus}
              onValueChange={(v) =>
                setField("pipelineStatus", v as CrmPipelineStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="WON">Won</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
                <SelectItem value="ON_HOLD">On hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Relationship stage</Label>
            <Select
              value={form.relationshipStage}
              onValueChange={(v) =>
                setField("relationshipStage", v as CrmRelationshipStage)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROSPECTIVE">Prospective</SelectItem>
                <SelectItem value="CURRENT">Current</SelectItem>
                <SelectItem value="PAST">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Summary</Label>
            <Textarea
              value={form.summary}
              onChange={(e) => setField("summary", e.target.value)}
              rows={3}
              placeholder="Useful context about this enquiry"
            />
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isNew ? "Create enquiry" : "Save changes"}
            </Button>
            {!isNew && enquiry?.customerId ? (
              <Button variant="outline" asChild>
                <Link to={`/inventory/sales/customers/${enquiry.customerId}`}>
                  Open customer
                </Link>
              </Button>
            ) : null}
            {!isNew && enquiry?.vendorId ? (
              <Button variant="outline" asChild>
                <Link to={`/inventory/purchase/suppliers/${enquiry.vendorId}`}>
                  Open supplier
                </Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {!isNew ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Convert</CardTitle>
              <CardDescription>
                Create a customer or supplier from this enquiry
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={!!enquiry?.customerId || converting !== null}
                onClick={() => void handleConvert("CUSTOMER")}
              >
                {converting === "CUSTOMER" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Convert to customer
              </Button>
              <Button
                variant="secondary"
                disabled={!!enquiry?.vendorId || converting !== null}
                onClick={() => void handleConvert("SUPPLIER")}
              >
                {converting === "SUPPLIER" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="mr-2 h-4 w-4" />
                )}
                Convert to supplier
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <StickyNote className="h-4 w-4" />
                Notes
              </CardTitle>
              <CardDescription>
                Multiple timestamped notes for this enquiry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={3}
                  placeholder="Add a note…"
                />
                <Button
                  size="sm"
                  onClick={() => void handleAddNote()}
                  disabled={addingNote}
                >
                  {addingNote ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Add note
                </Button>
              </div>
              <div className="space-y-3">
                {(enquiry?.notes ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                ) : (
                  (enquiry?.notes ?? []).map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border bg-slate-50/80 px-3 py-2"
                    >
                      <div className="mb-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span>{note.createdBy || "user"}</span>
                        <span>·</span>
                        <span>
                          {note.createdAt
                            ? format(new Date(note.createdAt), "PPp")
                            : ""}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-slate-800">
                        {note.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
