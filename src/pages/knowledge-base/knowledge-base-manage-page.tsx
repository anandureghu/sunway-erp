import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Trash2,
  Upload,
  Video,
  ExternalLink,
  Plus,
  Type,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RecordFormDialog,
  DialogSection,
  DField,
  DInput,
  DTextarea,
} from "@/modules/hr/components/record-form-dialog";
import {
  deleteKnowledgeBaseItem,
  listKnowledgeBaseItems,
  uploadKnowledgeBaseItem,
} from "@/service/knowledgeBaseService";
import type { KnowledgeBaseItem } from "@/types/knowledge-base";
import { getApiErrorMessage } from "@/lib/api-error-message";

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function KnowledgeBaseManagePage() {
  const { user } = useAuth();
  const isSuperAdmin =
    (user?.role ?? "").toString().toUpperCase() === "SUPER_ADMIN";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeForm = () => {
    if (uploading) return;
    resetForm();
    setShowUploadForm(false);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listKnowledgeBaseItems();
      setItems(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load knowledge base"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) void load();
  }, [isSuperAdmin, load]);

  const videos = useMemo(
    () => items.filter((i) => i.contentType === "VIDEO"),
    [items],
  );
  const documents = useMemo(
    () => items.filter((i) => i.contentType === "DOCUMENT"),
    [items],
  );

  if (!isSuperAdmin) {
    return <Navigate to="/knowledge-base" replace />;
  }

  const handleUpload = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!file) {
      toast.error("Choose a video or document to upload");
      return;
    }
    setUploading(true);
    try {
      await uploadKnowledgeBaseItem({
        title: title.trim(),
        description,
        file,
      });
      toast.success("Uploaded to knowledge base");
      resetForm();
      setShowUploadForm(false);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: KnowledgeBaseItem) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try {
      await deleteKnowledgeBaseItem(item.id);
      toast.success("Deleted");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Delete failed"));
    }
  };

  const renderList = (list: KnowledgeBaseItem[], empty: string) => {
    if (loading) {
      return (
        <p className="text-sm text-muted-foreground py-4">Loading…</p>
      );
    }
    if (list.length === 0) {
      return (
        <p className="text-sm text-muted-foreground py-4">{empty}</p>
      );
    }
    return (
      <ul className="divide-y divide-slate-100">
        {list.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/knowledge-base/${item.id}`}
                  className="font-medium text-slate-800 hover:underline"
                >
                  {item.title}
                </Link>
                <Badge variant="secondary" className="text-[10px]">
                  {item.contentType === "VIDEO" ? "Video" : "Document"}
                </Badge>
              </div>
              {item.description ? (
                <p className="text-xs text-slate-500 line-clamp-2">
                  {item.description}
                </p>
              ) : null}
              <p className="text-xs text-slate-400">
                {item.fileName} · {formatBytes(item.sizeBytes)} ·{" "}
                {formatDate(item.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/knowledge-base/${item.id}`}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Open page
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => void handleDelete(item)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Manage Knowledge Base"
        description="Upload training videos and documents. Each upload appears as its own page under Knowledge Base."
        icon={<BookOpen className="w-5 h-5" />}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/knowledge-base">View library</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 bg-white shadow-sm"
              onClick={() => setShowUploadForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload material
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Video className="h-4 w-4 text-sky-600" />
            Training videos
          </div>
          {renderList(videos, "No training videos uploaded yet.")}
        </Card>
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FileText className="h-4 w-4 text-violet-600" />
            Documents
          </div>
          {renderList(documents, "No documents uploaded yet.")}
        </Card>
      </div>

      <RecordFormDialog
        open={showUploadForm}
        onClose={closeForm}
        title="Upload material"
        subtitle="Add a training video or document for end users"
        badge={<Upload className="h-5 w-5" />}
        badgeClassName="bg-teal-100 text-teal-700"
        saveLabel="Upload"
        saveIcon={<Upload className="h-3.5 w-3.5" />}
        onSave={() => void handleUpload()}
        saving={uploading}
        maxWidth={640}
      >
        <DialogSection
          icon={<Type className="h-3.5 w-3.5 text-blue-600" />}
          iconBg="bg-blue-50"
          title="Details"
        >
          <div className="space-y-4">
            <DField label="Title" required>
              <DInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Getting started with HRMS"
                disabled={uploading}
              />
            </DField>
            <DField label="Description" hint="Optional short summary for end users">
              <DTextarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will users learn from this material?"
                disabled={uploading}
                rows={3}
                showCount={false}
              />
            </DField>
          </div>
        </DialogSection>

        <DialogSection
          icon={<Paperclip className="h-3.5 w-3.5 text-violet-600" />}
          iconBg="bg-violet-50"
          title="File"
        >
          <DField
            label="Video or document"
            required
            hint="Videos up to 200 MB; documents (PDF, Office) up to 25 MB."
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              disabled={uploading}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-slate-700 outline-none transition-all duration-150 focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
            />
            {file ? (
              <p className="mt-2 text-[12px] text-slate-600">
                Selected: <span className="font-medium">{file.name}</span> (
                {formatBytes(file.size)})
              </p>
            ) : null}
          </DField>
        </DialogSection>
      </RecordFormDialog>
    </div>
  );
}
