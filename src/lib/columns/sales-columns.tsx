"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SalesOrder, Customer, Picklist, Dispatch } from "@/types/sales";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Package,
  Truck,
  Loader2,
  Archive,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { StatusBadge } from "@/lib/status-badge";

// Sales Order Columns
export function createSalesOrderColumns(
  onConfirm?: (id: string) => void,
  onCancel?: (id: string) => void,
  onGeneratePicklist?: (id: string) => void,
  onEdit?: (id: string) => void,
  onArchive?: (id: string) => void,
  processingOrderId?: string | null,
  processingAction?: "confirm" | "cancel" | "archive" | null,
): ColumnDef<SalesOrder>[] {
  return [
    {
      accessorKey: "orderNo",
      header: "Order No",
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("orderNo")}</span>;
      },
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{data.customerName || "N/A"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "orderDate",
      header: "Order Date",
      cell: ({ row }) => {
        const date = row.getValue("orderDate") as string;
        return <span>{format(new Date(date), "MMM dd, yyyy")}</span>;
      },
    },
    {
      accessorKey: "invoiceDueDate",
      header: "Invoice Due Date",
      cell: ({ row }) => {
        const date = row.original.invoiceDueDate;
        if (!date) {
          return <span className="text-muted-foreground">—</span>;
        }
        return <span>{format(new Date(date), "MMM dd, yyyy")}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusColors: Record<string, string> = {
          draft: "bg-gray-100 text-gray-800",
          confirmed: "bg-blue-100 text-blue-800",
          picked: "bg-yellow-100 text-yellow-800",
          dispatched: "bg-purple-100 text-purple-800",
          delivered: "bg-green-100 text-green-800",
          completed: "bg-emerald-100 text-emerald-900",
          cancelled: "bg-red-100 text-red-800",
        };
        return (
          <Badge
            className={statusColors[status] || "bg-gray-100 text-gray-800"}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment Status",
      cell: ({ row }) => {
        const status = row.original.paymentStatus || "UNPAID";
        const remaining = row.original.outstandingAmount;
        const isPartial = status.toUpperCase() === "PARTIALLY_PAID";
        return (
          <div className="space-y-0.5">
            <StatusBadge status={status} />
            {isPartial && remaining != null && (
              <div className="text-xs text-muted-foreground">
                Remaining: <CurrencyAmount amount={remaining} className="inline" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "total",
      header: "Total Amount",
      cell: ({ row }) => {
        const amount = row.getValue("total") as number;
        return <CurrencyAmount amount={amount} className="font-semibold" />;
      },
    },
    {
      id: "paidAmount",
      header: "Paid Amount",
      cell: ({ row }) => {
        const order = row.original;
        const total = Number(order.total ?? 0);
        const outstanding = Number(order.outstandingAmount ?? total);
        const paid = total - outstanding;
        if (paid <= 0) return <span className="text-muted-foreground">—</span>;
        return <CurrencyAmount amount={paid} className="text-emerald-600 font-medium" />;
      },
    },
    {
      id: "dueAmount",
      header: "Due Amount",
      cell: ({ row }) => {
        const order = row.original;
        const outstanding = Number(order.outstandingAmount ?? 0);
        if (outstanding <= 0) return <span className="text-muted-foreground">—</span>;
        return <CurrencyAmount amount={outstanding} className="text-rose-600 font-medium" />;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        const canConfirm =
          order.status === "quotation" && order.sufficientDebitBalance !== false;
        const canCancel =
          order.status === "quotation" || order.status === "confirmed";
        const canGeneratePicklist =
          order.status === "confirmed" &&
          ["PAID", "PARTIALLY_PAID"].includes(
            (order.paymentStatus || "").toUpperCase(),
          );
        const canArchive =
          !order.archived &&
          (order.status === "completed" || order.status === "cancelled");
        const isRowProcessing = processingOrderId === order.id;

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {order.status === "quotation" && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(order.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Order
                  </DropdownMenuItem>
                )}
                {canConfirm && onConfirm && (
                  <DropdownMenuItem
                    disabled={isRowProcessing}
                    onClick={() => onConfirm(order.id)}
                  >
                    {isRowProcessing && processingAction === "confirm" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Package className="mr-2 h-4 w-4" />
                    )}
                    {isRowProcessing && processingAction === "confirm"
                      ? "Confirming..."
                      : "Confirm Order"}
                  </DropdownMenuItem>
                )}
                {order.status === "quotation" &&
                  order.sufficientDebitBalance === false && (
                    <DropdownMenuItem disabled>
                      <AlertTriangle className="mr-2 h-4 w-4 text-amber-600" />
                      Insufficient balance
                    </DropdownMenuItem>
                  )}
                {canGeneratePicklist && onGeneratePicklist && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onGeneratePicklist(order.id)}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Generate Picklist
                    </DropdownMenuItem>
                  </>
                )}
                {order.status === "confirmed" && !canGeneratePicklist && (
                  <DropdownMenuItem disabled>
                    Awaiting full payment
                  </DropdownMenuItem>
                )}
                {canCancel && onCancel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isRowProcessing}
                      className="text-red-600"
                      onClick={() => onCancel(order.id)}
                    >
                      {isRowProcessing && processingAction === "cancel" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      {isRowProcessing && processingAction === "cancel"
                        ? "Cancelling..."
                        : "Cancel Order"}
                    </DropdownMenuItem>
                  </>
                )}
                {canArchive && onArchive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isRowProcessing}
                      onClick={() => onArchive(order.id)}
                    >
                      {isRowProcessing && processingAction === "archive" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="mr-2 h-4 w-4" />
                      )}
                      {isRowProcessing && processingAction === "archive"
                        ? "Archiving..."
                        : "Archive"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

// Backward compatibility - export default columns without handlers
export const SALES_ORDER_COLUMNS: ColumnDef<SalesOrder>[] =
  createSalesOrderColumns();

// Customer Columns
export const CUSTOMER_COLUMNS: ColumnDef<Customer>[] = [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: "Customer Name",
  },
  {
    accessorKey: "contactPerson",
    header: "Contact Person",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          className={
            status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Customer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Picklist Columns
export function createPicklistColumns(
  onMarkPicked?: (id: string) => void,
  onCancel?: (id: string) => void,
  onCreateDispatch?: (id: string) => void,
  onArchive?: (id: string) => void,
  processingPicklistId?: string | null,
): ColumnDef<Picklist>[] {
  return [
    {
      accessorKey: "picklistNo",
      header: "Picklist No",
    },
    {
      accessorKey: "order.orderNo",
      header: "Order No",
      cell: ({ row }) => {
        return <span>{row.original.order?.orderNo || "N/A"}</span>;
      },
    },
    {
      accessorKey: "warehouse.name",
      header: "Warehouse",
      cell: ({ row }) => {
        return <span>{row.original.warehouse?.name || "N/A"}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusColors: Record<string, string> = {
          created: "bg-gray-100 text-gray-800",
          picked: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
        };
        return (
          <Badge
            className={statusColors[status] || "bg-gray-100 text-gray-800"}
          >
            {status
              .replace("_", " ")
              .split(" ")
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(" ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        return <span>{row.original.items.length} items</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const picklist = row.original;
        const canMarkPicked = picklist.status === "created";
        const canCancel = picklist.status === "created";
        const canCreateDispatch = picklist.status === "picked";
        const canArchive =
          !picklist.archived &&
          (picklist.status === "picked" || picklist.status === "cancelled");
        const isProcessing = processingPicklistId === picklist.id;

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {canMarkPicked && onMarkPicked && (
                  <DropdownMenuItem onClick={() => onMarkPicked(picklist.id)}>
                    <Package className="mr-2 h-4 w-4" />
                    Mark as Picked
                  </DropdownMenuItem>
                )}
                {canCreateDispatch && onCreateDispatch && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onCreateDispatch(picklist.id)}
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      Create Dispatch
                    </DropdownMenuItem>
                  </>
                )}
                {canCancel && onCancel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onCancel(picklist.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancel Picklist
                    </DropdownMenuItem>
                  </>
                )}
                {canArchive && onArchive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isProcessing}
                      onClick={() => onArchive(picklist.id)}
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? "Archiving..." : "Archive"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

// Backward compatibility
export const PICKLIST_COLUMNS: ColumnDef<Picklist>[] = createPicklistColumns();

// Dispatch Columns
export function createDispatchColumns(
  onViewDetails?: (id: string) => void,
  onDispatch?: (id: string) => void,
  onMarkInTransit?: (id: string) => void,
  onMarkOutForDelivery?: (id: string) => void,
  onMarkDelivered?: (id: string) => void,
  onMarkFailedDelivery?: (id: string) => void,
  onCancel?: (id: string) => void,
  onUpdateTracking?: (id: string) => void,
): ColumnDef<Dispatch>[] {
  return [
    {
      accessorKey: "dispatchNo",
      header: "Dispatch No",
    },
    {
      accessorKey: "order.orderNo",
      header: "Order No",
      cell: ({ row }) => {
        return <span>{row.original.order?.orderNo || "N/A"}</span>;
      },
    },
    {
      accessorKey: "vehicleNumber",
      header: "Vehicle",
    },
    {
      accessorKey: "driverName",
      header: "Driver",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusColors: Record<string, string> = {
          created: "bg-gray-100 text-gray-800",
          dispatched: "bg-blue-100 text-blue-800",
          in_transit: "bg-yellow-100 text-yellow-800",
          out_for_delivery: "bg-indigo-100 text-indigo-800",
          delivered: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
          failed_delivery: "bg-red-100 text-red-800",
        };
        return (
          <Badge
            className={statusColors[status] || "bg-gray-100 text-gray-800"}
          >
            {status
              .replace("_", " ")
              .split(" ")
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(" ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "estimatedDeliveryDate",
      header: "Est. Delivery",
      cell: ({ row }) => {
        const date = row.original.estimatedDeliveryDate;
        return date ? (
          <span>{format(new Date(date), "MMM dd, yyyy")}</span>
        ) : (
          <span>-</span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const dispatch = row.original;
        const canDispatch = dispatch.status === "created";
        const canMarkInTransit = dispatch.status === "dispatched";
        const canMarkOutForDelivery = dispatch.status === "in_transit";
        const canMarkDelivered =
          dispatch.status === "out_for_delivery" ||
          dispatch.status === "in_transit" ||
          dispatch.status === "dispatched";
        const canMarkFailed =
          dispatch.status === "out_for_delivery" ||
          dispatch.status === "in_transit" ||
          dispatch.status === "dispatched";
        const canCancel =
          dispatch.status !== "delivered" && dispatch.status !== "cancelled";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {onViewDetails && (
                <DropdownMenuItem onClick={() => onViewDetails(dispatch.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {canDispatch && onDispatch && (
                <DropdownMenuItem onClick={() => onDispatch(dispatch.id)}>
                  <Truck className="mr-2 h-4 w-4" />
                  Dispatch Shipment
                </DropdownMenuItem>
              )}
              {canMarkInTransit && onMarkInTransit && (
                <DropdownMenuItem onClick={() => onMarkInTransit(dispatch.id)}>
                  <Truck className="mr-2 h-4 w-4" />
                  Mark In Transit
                </DropdownMenuItem>
              )}
              {canMarkOutForDelivery && onMarkOutForDelivery && (
                <DropdownMenuItem
                  onClick={() => onMarkOutForDelivery(dispatch.id)}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Mark Out For Delivery
                </DropdownMenuItem>
              )}
              {canMarkDelivered && onMarkDelivered && (
                <DropdownMenuItem onClick={() => onMarkDelivered(dispatch.id)}>
                  <Package className="mr-2 h-4 w-4" />
                  Mark Delivered
                </DropdownMenuItem>
              )}
              {canMarkFailed && onMarkFailedDelivery && (
                <DropdownMenuItem
                  onClick={() => onMarkFailedDelivery(dispatch.id)}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Mark Failed Delivery
                </DropdownMenuItem>
              )}
              {canCancel && onCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onCancel(dispatch.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancel Shipment
                  </DropdownMenuItem>
                </>
              )}
              {onUpdateTracking && (
                <DropdownMenuItem onClick={() => onUpdateTracking(dispatch.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Update Tracking
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

// Backward compatibility
export const DISPATCH_COLUMNS: ColumnDef<Dispatch>[] = createDispatchColumns();
