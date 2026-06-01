import { useNavigate, useParams } from "react-router-dom";
import { CreatePurchaseRequisitionForm } from "./components/create-purchase-requisition-form";

export default function EditPurchaseRequisitionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Requisition ID is required.
      </div>
    );
  }

  return (
    <CreatePurchaseRequisitionForm
      requisitionId={id}
      onCancel={() => navigate(`/inventory/purchase/requisitions/${id}`)}
      onSaved={() => navigate(`/inventory/purchase/requisitions/${id}`)}
    />
  );
}
