import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ShoppingCart, Package, ChevronRight } from "lucide-react";

const BASE = "/inventory/purchase";

export type RelatedGrRef = {
  id: string;
  receiptNo: string;
};

type Props = {
  /** Purchase requisition id */
  requisitionId?: string | null;
  /** Purchase order id */
  purchaseOrderId?: string | null;
  /** Goods receipts tied to the PO (excluding duplicates by id) */
  goodsReceipts?: RelatedGrRef[];
  /** Document being viewed — optional hint for subtitle */
  context?: "pr" | "po" | "gr";
};

/**
 * PR → PO → GR traceability: quick navigation between procurement documents.
 */
export function RelatedPurchaseDocumentsCard({
  requisitionId,
  purchaseOrderId,
  goodsReceipts = [],
  context,
}: Props) {
  const hasPr = Boolean(requisitionId);
  const hasPo = Boolean(purchaseOrderId);
  const hasGr = goodsReceipts.length > 0;

  if (!hasPr && !hasPo && !hasGr) {
    return null;
  }

  const subtitle =
    context === "pr"
      ? "Navigate to the generated order and receipts."
      : context === "po"
        ? "Source requisition and goods receipts posted against this order."
        : context === "gr"
          ? "Upstream requisition and purchase order for this receipt."
          : "Linked procurement documents.";

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Related documents</CardTitle>
        <p className="text-sm text-muted-foreground font-normal">{subtitle}</p>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row flex-wrap gap-2">
        {hasPr && (
          <Button variant="outline" size="sm" asChild className="justify-start">
            <Link to={`${BASE}/requisitions/${requisitionId}`}>
              <FileText className="h-4 w-4 mr-2 shrink-0" />
              Requisition
              <ChevronRight className="h-4 w-4 ml-1 opacity-50" />
            </Link>
          </Button>
        )}
        {hasPo && (
          <Button variant="outline" size="sm" asChild className="justify-start">
            <Link to={`${BASE}/orders/${purchaseOrderId}`}>
              <ShoppingCart className="h-4 w-4 mr-2 shrink-0" />
              Purchase order
              <ChevronRight className="h-4 w-4 ml-1 opacity-50" />
            </Link>
          </Button>
        )}
        {goodsReceipts.map((gr) => (
          <Button
            key={gr.id}
            variant="outline"
            size="sm"
            asChild
            className="justify-start"
          >
            <Link to={`${BASE}/receiving/${gr.id}`}>
              <Package className="h-4 w-4 mr-2 shrink-0" />
              {gr.receiptNo || `GR #${gr.id}`}
              <ChevronRight className="h-4 w-4 ml-1 opacity-50" />
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
