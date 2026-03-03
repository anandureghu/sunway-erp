// src/pages/admin/divisions/DivisionListPage.tsx
import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { DivisionResponseDTO } from "@/types/division";
import { DivisionDialog } from "./division-dialog";
import { getDivisionColumns } from "@/lib/columns/division-listing-admin";

export default function DivisionListPage() {
  const [divisions, setDivisions] = useState<DivisionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DivisionResponseDTO | null>(null);
  const [open, setOpen] = useState(false);

  const fetchDivisions = async () => {
    try {
      const res = await apiClient.get("/divisions");
      setDivisions(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load divisions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisions();
  }, []);

  const handleSuccess = (
    updated: DivisionResponseDTO,
    mode: "add" | "edit",
  ) => {
    if (mode === "add") {
      setDivisions((prev) => [...prev, updated]);
    } else {
      setDivisions((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
      );
    }
  };

  const handleEdit = (dept: DivisionResponseDTO) => {
    setSelected(dept);
    setOpen(true);
  };

  const handleDelete = async (dept: DivisionResponseDTO) => {
    try {
      await apiClient.delete(`/divisions/${dept.id}`);
      toast.success(`Deleted ${dept.name}`);
      setDivisions((prev) => prev.filter((d) => d.id !== dept.id));
    } catch {
      toast.error("Failed to delete division");
    }
  };

  const columns = getDivisionColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  if (loading)
    return <p className="text-center text-muted-foreground p-10">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Divisions</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search division..." className="pl-10" />
            </div>
            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Add Division
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={divisions} />
        </CardContent>
      </Card>

      <DivisionDialog
        open={open}
        onOpenChange={setOpen}
        division={selected}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
