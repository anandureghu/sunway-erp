import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Grid2x2, Search } from "lucide-react";
import { toast } from "sonner";
import type { DivisionResponseDTO } from "@/types/division";
import { DivisionDialog } from "./division-dialog";
import { getDivisionColumns } from "@/lib/columns/division-listing-admin";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { fetchDivisions, deleteDivision } from "@/service/divisionService";

export default function DivisionListPage() {
  const [divisions, setDivisions] = useState<DivisionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DivisionResponseDTO | null>(null);
  const [open, setOpen] = useState(false);

  const { company, user } = useAuth();
  const companyId =
    company?.id != null
      ? Number(company.id)
      : user?.companyId != null
        ? Number(user.companyId)
        : null;

  const fetchDivisionsData = async () => {
    if (companyId == null) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchDivisions(companyId);
      setDivisions(data as DivisionResponseDTO[]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load divisions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDivisionsData();
  }, [companyId]);

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

  const handleEdit = (division: DivisionResponseDTO) => {
    setSelected(division);
    setOpen(true);
  };

  const handleDelete = async (division: DivisionResponseDTO) => {
    try {
      await deleteDivision(division.id);
      toast.success(`Deleted ${division.name}`);
      setDivisions((prev) => prev.filter((d) => d.id !== division.id));
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

  if (companyId == null) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">
          Loading company information...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Divisions"
        description="Manage divisions under departments"
        variant="darkBlue"
        icon={<Grid2x2 className="w-6 h-6" />}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
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
        companyId={companyId}
      />
    </div>
  );
}
