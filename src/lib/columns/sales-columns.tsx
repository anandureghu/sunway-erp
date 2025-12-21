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
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Sales Order Columns
export function createSalesOrderColumns(
  onConfirm?: (id: string) => void,
  onCancel?: (id: string) => void,
  onGeneratePicklist?: (id: string) => void,
  onViewDetails?: (id: string) => void,
  onEdit?: (id: string) => void
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
      const customer = row.original.customer;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{customer?.name || "N/A"}</span>
          {customer?.code && (
            <span className="text-xs text-gray-500">{customer.code}</span>
          )}
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
        cancelled: "bg-red-100 text-red-800",
      };
      return (
        <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "total",
    header: "Total Amount",
    cell: ({ row }) => {
      const amount = row.getValue("total") as number;
      return <span className="font-semibold">₹ {amount.toLocaleString()}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;
      const canConfirm = order.status === "draft";
      const canCancel = order.status === "draft" || order.status === "confirmed";
      
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
              <DropdownMenuItem onClick={() => onViewDetails(order.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            )}
            {order.status === "draft" && onEdit && (
              <DropdownMenuItem onClick={() => onEdit(order.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Order
              </DropdownMenuItem>
            )}
            {canConfirm && onConfirm && (
              <DropdownMenuItem onClick={() => onConfirm(order.id)}>
                <Package className="mr-2 h-4 w-4" />
                Confirm Order
              </DropdownMenuItem>
            )}
            {order.status === "confirmed" && onGeneratePicklist && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onGeneratePicklist(order.id)}>
                  <Package className="mr-2 h-4 w-4" />
                  Generate Picklist
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem>
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </DropdownMenuItem>
            {canCancel && onCancel && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => onCancel(order.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel Order
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  ];
}

// Backward compatibility - export default columns without handlers
export const SALES_ORDER_COLUMNS: ColumnDef<SalesOrder>[] = createSalesOrderColumns();

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
  onCreateDispatch?: (id: string) => void
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
        <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
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
    cell: ({ row }) => {
      const picklist = row.original;
      const canMarkPicked = picklist.status === "created";
      const canCancel = picklist.status === "created";
      const canCreateDispatch = picklist.status === "picked";
      
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
            {canMarkPicked && onMarkPicked && (
              <DropdownMenuItem onClick={() => onMarkPicked(picklist.id)}>
                <Package className="mr-2 h-4 w-4" />
                Mark as Picked
              </DropdownMenuItem>
            )}
            {canCreateDispatch && onCreateDispatch && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onCreateDispatch(picklist.id)}>
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
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  ];
}

// Backward compatibility
export const PICKLIST_COLUMNS: ColumnDef<Picklist>[] = createPicklistColumns();

// Dispatch Columns
export function createDispatchColumns(
  onDispatch?: (id: string) => void,
  onMarkInTransit?: (id: string) => void,
  onMarkDelivered?: (id: string) => void,
  onCancel?: (id: string) => void
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
        delivered: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
      };
      return (
        <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
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
    cell: ({ row }) => {
      const dispatch = row.original;
      const canDispatch = dispatch.status === "created";
      const canMarkInTransit = dispatch.status === "dispatched";
      const canMarkDelivered = dispatch.status === "in_transit" || dispatch.status === "dispatched";
      const canCancel = dispatch.status === "created";
      
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
            {canMarkDelivered && onMarkDelivered && (
              <DropdownMenuItem onClick={() => onMarkDelivered(dispatch.id)}>
                <Package className="mr-2 h-4 w-4" />
                Mark Delivered
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
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              Update Tracking
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  ];
}

// Backward compatibility
export const DISPATCH_COLUMNS: ColumnDef<Dispatch>[] = createDispatchColumns();
