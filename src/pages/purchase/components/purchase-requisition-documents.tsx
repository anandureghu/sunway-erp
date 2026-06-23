import { useRef, useState } from "react";
import { format } from "date-fns";
import { FileText, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PurchaseRequisitionDocument } from "@/types/purchase";
import {
  deletePurchaseRequisitionDocument,
  uploadPurchaseRequisitionDocument,
} from "@/service/purchaseFlowService";
import { toast } from "sonner";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

const ACCEPT =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*";

type Props = {
  requisitionId: string;
  documents: PurchaseRequisitionDocument[];
  onDocumentsChange: (documents: PurchaseRequisitionDocument[]) => void;
  readOnly?: boolean;
  /** When true, renders without the outer Card wrapper (for tabs/panels). */
  embedded?: boolean;
};

function formatFileSize(bytes?: number) {
  if (bytes == null || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(contentType?: string, fileName?: string) {
  if (contentType === "application/pdf") return true;
  return (fileName || "").toLowerCase().endsWith(".pdf");
}

function isImage(contentType?: string, fileName?: string) {
  if (contentType?.startsWith("image/")) return true;
  const n = (fileName || "").toLowerCase();
  return n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png");
}

export function PurchaseRequisitionDocuments({
  requisitionId,
  documents,
  onDocumentsChange,
  readOnly = false,
  embedded = false,
}: Props) {
  const { confirm } = useConfirmDialog();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: PurchaseRequisitionDocument[] = [];
      for (const file of Array.from(files)) {
        const doc = await uploadPurchaseRequisitionDocument(
          requisitionId,
          file,
        );
        uploaded.push(doc);
      }
      onDocumentsChange([...uploaded, ...documents]);
      toast.success(
        uploaded.length === 1
          ? "Document uploaded."
          : `${uploaded.length} documents uploaded.`,
      );
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        err?.response?.data?.message || err?.message || "Upload failed.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (docId: string) => {
    if (!(await confirm("Remove this document from the requisition?"))) return;
    setDeletingId(docId);
    try {
      await deletePurchaseRequisitionDocument(requisitionId, docId);
      onDocumentsChange(documents.filter((d) => d.id !== docId));
      toast.success("Document removed.");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        err?.response?.data?.message || err?.message || "Delete failed.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const header = (
    <div className="flex flex-row items-center justify-between gap-4">
      <div>
        {embedded ? (
          <h3 className="text-base font-semibold text-slate-900">Attachments</h3>
        ) : (
          <CardTitle className="text-lg">Documents</CardTitle>
        )}
        <p className="text-sm text-muted-foreground font-normal mt-1">
          PDF, Word, or images up to 15 MB each.
        </p>
      </div>
      {!readOnly && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => void handleUpload(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload
          </Button>
        </>
      )}
    </div>
  );

  const body = (
    <>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {readOnly
              ? "No documents attached."
              : "No documents yet. Upload quotes, specs, or supporting files."}
          </p>
        ) : (
          <ul className="space-y-4">
            {documents.map((doc) => {
              const showPreview =
                doc.downloadUrl &&
                (isPdf(doc.contentType, doc.fileName) ||
                  isImage(doc.contentType, doc.fileName));

              return (
                <li
                  key={doc.id}
                  className="overflow-hidden rounded-lg border bg-card"
                >
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium break-words">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {[
                            doc.uploadedByName,
                            doc.uploadedAt
                              ? format(
                                  new Date(doc.uploadedAt),
                                  "MMM dd, yyyy · HH:mm",
                                )
                              : null,
                            doc.fileSizeBytes
                              ? formatFileSize(doc.fileSizeBytes)
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      {doc.downloadUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={doc.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View
                          </a>
                        </Button>
                      )}
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={deletingId === doc.id}
                          onClick={() => void handleDelete(doc.id)}
                          aria-label="Remove document"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  {showPreview && (
                    <div className="border-t bg-muted/20 p-3">
                      {isPdf(doc.contentType, doc.fileName) ? (
                        <iframe
                          title={doc.fileName}
                          src={doc.downloadUrl}
                          className="h-[min(360px,50vh)] w-full rounded-md border bg-background"
                        />
                      ) : (
                        <img
                          src={doc.downloadUrl}
                          alt={doc.fileName}
                          className="mx-auto max-h-[min(280px,45vh)] w-full rounded-md object-contain"
                        />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-4">
        {header}
        {body}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-0">{header}</CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
