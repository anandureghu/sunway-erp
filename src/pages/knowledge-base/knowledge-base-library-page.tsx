import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileText, Video, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listKnowledgeBaseItems } from "@/service/knowledgeBaseService";
import type { KnowledgeBaseItem } from "@/types/knowledge-base";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { useAuth } from "@/context/AuthContext";

export default function KnowledgeBaseLibraryPage() {
  const { user } = useAuth();
  const canManage =
    (user?.role ?? "").toString().toUpperCase() === "SUPER_ADMIN";
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listKnowledgeBaseItems()
      .then(setItems)
      .catch((err) => {
        toast.error(getApiErrorMessage(err, "Failed to load knowledge base"));
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Knowledge Base"
        description="Training videos and documents for end users."
        icon={<BookOpen className="w-5 h-5" />}
        actions={
          canManage ? (
            <Button asChild variant="secondary">
              <Link to="/knowledge-base/manage">Manage uploads</Link>
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No training materials yet.
            {canManage
              ? " Upload videos and documents from Manage uploads."
              : ""}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = item.contentType === "VIDEO" ? Video : FileText;
            return (
              <Card key={item.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.contentType === "VIDEO" ? "Video" : "Document"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs line-clamp-2">
                        {item.description || "Open this material to continue."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild className="w-full sm:w-auto">
                    <Link to={`/knowledge-base/${item.id}`}>
                      Open
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
