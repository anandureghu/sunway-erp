import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";

interface Props {
  onCreated: () => void;
}

export default function CreateCreditNoteDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    try {
      await apiClient.post("/credit-notes", {
        invoiceId: invoiceId,
        amount: Number(amount),
        reason,
        creditDate: new Date().toISOString().split("T")[0],
      });

      toast.success("Credit note created");
      setOpen(false);
      onCreated();
    } catch (e) {
      toast.error("Failed to create credit note");
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Credit Note</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Credit Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Invoice ID</Label>
            <Input
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
            />
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <Label>Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <Button className="w-full" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
