/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PURCHASE_REQUISITION_SCHEMA,
  type PurchaseRequisitionFormData,
} from "@/schema/purchase";
import { z } from "zod";
import type {
  PurchaseRequisitionItem,
  PurchaseRequisition,
} from "@/types/purchase";
import {
  purchaseRequisitions,
  addPurchaseRequisition,
  updatePurchaseRequisition,
} from "@/lib/purchase-data";
import { items } from "@/lib/inventory-data";

export default function PurchaseRequisitionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredRequisitions = purchaseRequisitions.filter((req) => {
    const matchesSearch =
      req.requisitionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestedByName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (id: string) => {
    if (confirm("Are you sure you want to approve this requisition?")) {
      updatePurchaseRequisition(id, {
        status: "approved",
        approvedBy: "current-user",
        approvedByName: "Current User",
        approvedDate: format(new Date(), "yyyy-MM-dd"),
        updatedAt: new Date().toISOString(),
      });
      alert("Requisition approved successfully!");
    }
  };

  const handleReject = (id: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      updatePurchaseRequisition(id, {
        status: "rejected",
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      });
      alert("Requisition rejected.");
    }
  };

  if (showCreateForm) {
    return <CreateRequisitionForm onCancel={() => setShowCreateForm(false)} />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory/purchase">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Purchase Requisitions</h1>
            <p className="text-muted-foreground">
              Create and approve purchase requisitions
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Requisition
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Purchase Requisitions</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requisitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequisitions.map((req) => (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {req.requisitionNo}
                        </h3>
                        <Badge
                          variant={
                            req.status === "approved"
                              ? "default"
                              : req.status === "rejected"
                              ? "destructive"
                              : req.status === "pending"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Requested by: {req.requestedByName} • Department:{" "}
                        {req.department}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Requested: {req.requestedDate} • Required:{" "}
                        {req.requiredDate || "N/A"}
                      </p>
                      {req.approvedByName && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Approved by: {req.approvedByName} on{" "}
                          {req.approvedDate}
                        </p>
                      )}
                      <p className="font-medium mt-2">
                        Total: ₹{req.totalAmount?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {req.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(req.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(req.id)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredRequisitions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No requisitions found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateRequisitionForm({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate();
  const [requisitionItems, setRequisitionItems] = useState<
    PurchaseRequisitionItem[]
  >([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Omit<PurchaseRequisitionFormData, "items"> & { items?: any[] }>({
    resolver: zodResolver(
      z.object({
        requestedBy: z.string().min(1, "Requested by is required"),
        department: z.string().optional(),
        requestedDate: z.string().min(1, "Request date is required"),
        requiredDate: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(z.any()).optional(),
      })
    ),
    defaultValues: {
      requestedDate: format(new Date(), "yyyy-MM-dd"),
      requestedBy: "current-user",
      items: [],
    },
    mode: "onChange",
  });

  const addItemToRequisition = () => {
    if (!selectedItem || itemQuantity <= 0) return;

    const item = items.find((i) => i.id === selectedItem);
    if (!item) return;

    const unitPrice = itemUnitPrice || item.costPrice;
    const estimatedTotal = unitPrice * itemQuantity;

    const newItem: PurchaseRequisitionItem = {
      id: `temp-${Date.now()}`,
      requisitionId: "",
      itemId: item.id,
      item,
      quantity: itemQuantity,
      unitPrice: unitPrice,
      estimatedTotal,
    };

    setRequisitionItems([...requisitionItems, newItem]);
    setSelectedItem("");
    setItemQuantity(1);
    setItemUnitPrice(0);
  };

  const removeItem = (itemId: string) => {
    setRequisitionItems(requisitionItems.filter((item) => item.id !== itemId));
  };

  const calculateTotal = () => {
    return requisitionItems.reduce(
      (sum, item) => sum + (item.estimatedTotal || 0),
      0
    );
  };

  const onSubmit = (data: any) => {
    if (requisitionItems.length === 0) {
      alert("Please add at least one item to the requisition.");
      return;
    }

    const itemsData = requisitionItems.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      notes: "",
    }));

    const completeData = {
      ...data,
      items: itemsData,
    };

    const validationResult =
      PURCHASE_REQUISITION_SCHEMA.safeParse(completeData);
    if (!validationResult.success) {
      const errorMessages = validationResult.error;
      alert(`Please check the form for errors:\n${errorMessages}`);
      return;
    }

    const requisitionNumber = `PR-${new Date().getFullYear()}-${String(
      purchaseRequisitions.length + 1
    ).padStart(3, "0")}`;
    const totalAmount = calculateTotal();

    const requisitionItemsData: PurchaseRequisitionItem[] =
      requisitionItems.map((item) => ({
        id: `pri-${Date.now()}-${Math.random()}`,
        requisitionId: "",
        itemId: item.itemId,
        item: item.item,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        estimatedTotal: item.estimatedTotal,
      }));

    const newRequisition: PurchaseRequisition = {
      id: `pr-${Date.now()}`,
      requisitionNo: requisitionNumber,
      requestedBy: data.requestedBy,
      requestedByName: "Current User",
      department: data.department || undefined,
      requestedDate: data.requestedDate,
      requiredDate: data.requiredDate || undefined,
      status: "pending",
      items: requisitionItemsData.map((item) => ({
        ...item,
        requisitionId: `pr-${Date.now()}`,
      })),
      totalAmount,
      notes: data.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addPurchaseRequisition(newRequisition);
    alert(`Purchase requisition ${requisitionNumber} created successfully!`);
    navigate("/inventory/purchase/requisitions");
  };

  const total = calculateTotal();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Create Purchase Requisition</h1>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit, (errors) => {
            console.error("Form validation errors:", errors);
            alert("Please fix the form errors before submitting.");
          })(e);
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Requisition Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestedBy">Requested By *</Label>
                <Input
                  id="requestedBy"
                  placeholder="Enter requester name"
                  {...register("requestedBy")}
                />
                {errors.requestedBy && (
                  <p className="text-sm text-red-500">
                    {errors.requestedBy.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Enter department"
                  {...register("department")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestedDate">Request Date *</Label>
                <Input
                  id="requestedDate"
                  type="date"
                  {...register("requestedDate")}
                />
                {errors.requestedDate && (
                  <p className="text-sm text-red-500">
                    {errors.requestedDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredDate">Required Date</Label>
                <Input
                  id="requiredDate"
                  type="date"
                  {...register("requiredDate")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Item</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items
                      .filter((i) => i.status === "active")
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={itemQuantity}
                  onChange={(e) =>
                    setItemQuantity(parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Estimated Unit Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemUnitPrice}
                  onChange={(e) =>
                    setItemUnitPrice(parseFloat(e.target.value) || 0)
                  }
                  placeholder="Auto from item"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addItemToRequisition}
                  className="w-full"
                >
                  Add Item
                </Button>
              </div>
            </div>

            {requisitionItems.length > 0 && (
              <div className="mt-4">
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Item</th>
                        <th className="p-2 text-left">Quantity</th>
                        <th className="p-2 text-left">Unit Price</th>
                        <th className="p-2 text-left">Estimated Total</th>
                        <th className="p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requisitionItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.item?.name}</td>
                          <td className="p-2">
                            {item.quantity} {item.item?.unit}
                          </td>
                          <td className="p-2">
                            ₹{item.unitPrice?.toLocaleString() || 0}
                          </td>
                          <td className="p-2 font-medium">
                            ₹{item.estimatedTotal?.toLocaleString() || 0}
                          </td>
                          <td className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {requisitionItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No items added. Add items to create the requisition.
              </p>
            )}
          </CardContent>
        </Card>

        {requisitionItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-lg font-bold">
                <span>Total Estimated Amount:</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or instructions"
                  {...register("notes")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={requisitionItems.length === 0}>
            Create Requisition
          </Button>
        </div>
      </form>
    </div>
  );
}
