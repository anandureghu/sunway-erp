import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Download, FileText, Video } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getKnowledgeBaseItem } from "@/service/knowledgeBaseService";
import type { KnowledgeBaseItem } from "@/types/knowledge-base";
import { getApiErrorMessage } from "@/lib/api-error-message";

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeBaseItemPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<KnowledgeBaseItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getKnowledgeBaseItem(numericId)
      .then(setItem)
      .catch((err) => {
        toast.error(getApiErrorMessage(err, "Failed to load material"));
        setItem(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading…</div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          This knowledge base item was not found.
        </p>
        <Button asChild variant="outline">
          <Link to="/knowledge-base">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to library
          </Link>
        </Button>
      </div>
    );
  }

  const isVideo = item.contentType === "VIDEO";
  const Icon = isVideo ? Video : FileText;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title={item.title}
        description={
          item.description ||
          (isVideo
            ? "Training video"
            : "Training document")
        }
        icon={<Icon className="w-5 h-5" />}
        actions={
          <Button asChild variant="outline">
            <Link to="/knowledge-base">
              <BookOpen className="mr-2 h-4 w-4" />
              Library
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Badge variant="secondary">
          {isVideo ? "Video" : "Document"}
        </Badge>
        <span>{item.fileName}</span>
        <span>·</span>
        <span>{formatBytes(item.sizeBytes)}</span>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {isVideo && item.fileUrl ? (
            <video
              key={item.fileUrl}
              controls
              className="w-full max-h-[70vh] rounded-lg bg-black"
              src={item.fileUrl}
            >
              Your browser does not support video playback.
            </video>
          ) : null}

          {!isVideo && item.fileUrl && item.contentTypeMime === "application/pdf" ? (
            <iframe
              title={item.title}
              src={item.fileUrl}
              className="h-[70vh] w-full rounded-lg border border-slate-200"
            />
          ) : null}

          {!isVideo &&
          item.fileUrl &&
          item.contentTypeMime !== "application/pdf" ? (
            <p className="text-sm text-muted-foreground">
              Preview is not available for this file type. Download it to view.
            </p>
          ) : null}

          {item.fileUrl ? (
            <Button asChild>
              <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                {isVideo ? "Open video" : "Download document"}
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              File URL is not available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
