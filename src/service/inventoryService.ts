import { apiClient } from "@/service/apiClient";
import type { ItemCategory, Warehouse, Stock } from "@/types/inventory";
import type {
  CategoryCreateDTO,
  CategoryResponseDTO,
  CategoryUpdateDTO,
  ItemResponseDTO,
  WarehouseCreateDTO,
  WarehouseResponseDTO,
  WarehouseUpdateDTO,
  Id,
} from "@/service/erpApiTypes";

function normalizeStatus(status?: string) {
  return (status || "").toLowerCase();
}

function toWarehouse(dto: WarehouseResponseDTO): Warehouse {
  return {
    id: String(dto.id),
    code: dto.code,
    name: dto.name || "",
    location: dto.location || "",
    address: undefined,
    capacity: undefined,
    status: normalizeStatus(dto.status) === "inactive" ? "inactive" : "active",
    createdAt: "",

    street: dto.street,
    city: dto.city,
    country: dto.country,
    pin: dto.pin,

    phone: dto.phone,
    contactPersonName: dto.contactPersonName,

    managerId: dto.managerId,
    managerName: dto.managerName,
  };
}

function toCategory(dto: CategoryResponseDTO): ItemCategory {
  return {
    id: String(dto.id),
    code: dto.code,
    name: dto.name || dto.code || "",
    description: undefined,
    status: dto.status,
    parentId: dto.parentId ? String(dto.parentId) : undefined,
    createdAt: "",
    subCategories: dto.subCategories
      ? dto.subCategories.map(toCategory)
      : undefined,
  };
}

// ---- Categories ----
export async function listCategories(): Promise<ItemCategory[]> {
  const res = await apiClient.get<CategoryResponseDTO[]>(
    "/inventory/categories",
  );
  return (res.data || []).map(toCategory);
}

export async function createCategory(payload: CategoryCreateDTO) {
  const res = await apiClient.post<CategoryResponseDTO>(
    "/inventory/categories",
    payload,
  );
  return toCategory(res.data);
}

export async function updateCategory(
  id: Id | string,
  payload: CategoryUpdateDTO,
) {
  const res = await apiClient.put<CategoryResponseDTO>(
    `/inventory/categories/${id}`,
    payload,
  );
  return toCategory(res.data);
}

export async function getCategory(id: Id | string): Promise<ItemCategory> {
  const res = await apiClient.get<CategoryResponseDTO>(
    `/inventory/categories/${id}`,
  );
  return toCategory(res.data);
}

export async function deleteCategory(id: Id | string) {
  await apiClient.delete(`/inventory/categories/${id}`);
}

// ---- Warehouses ----
export async function listWarehouses(): Promise<Warehouse[]> {
  const res = await apiClient.get<WarehouseResponseDTO[]>(
    "/inventory/warehouses",
  );
  return (res.data || []).map(toWarehouse);
}

export async function createWarehouse(payload: WarehouseCreateDTO) {
  const res = await apiClient.post<WarehouseResponseDTO>(
    "/inventory/warehouses",
    payload,
  );
  return toWarehouse(res.data);
}

export async function updateWarehouse(
  id: Id | string,
  payload: WarehouseUpdateDTO,
) {
  const res = await apiClient.put<WarehouseResponseDTO>(
    `/inventory/warehouses/${id}`,
    payload,
  );
  return toWarehouse(res.data);
}

export async function getWarehouse(id: Id | string): Promise<Warehouse> {
  const res = await apiClient.get<WarehouseResponseDTO>(
    `/inventory/warehouses/${id}`,
  );
  return toWarehouse(res.data);
}

export async function deleteWarehouse(id: Id | string) {
  await apiClient.delete(`/inventory/warehouses/${id}`);
}

// ---- Items ----
export async function listItems(): Promise<ItemResponseDTO[]> {
  const res = await apiClient.get<ItemResponseDTO[]>("/inventory/items");
  return res.data || [];
}

export const getItemById = async (id: string) => {
  const res = await apiClient.get<ItemResponseDTO>(`/inventory/items/${id}`);
  return res.data;
};

// export async function createItem(payload: ItemCreateDTO) {
//   const res = await apiClient.post<ItemResponseDTO>(
//     "/inventory/items",
//     payload
//   );
//   return toItem(res.data);
// }

export const createItem = async (formData: FormData) => {
  const res = await apiClient.post("/inventory/items", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export async function updateItem(id: Id | string, payload: FormData) {
  const res = await apiClient.put<ItemResponseDTO>(
    `/inventory/items/${id}`,
    payload,
  );
  return res.data;
}

// ---- Stock ----
// Note: The API returns stock info embedded in items (quantity, available, reserved)
// We'll fetch items and warehouses, then create stock records
export type StockResponseDTO = {
  id?: Id;
  itemId?: Id;
  warehouseId?: Id;
  quantity?: number;
  available?: number;
  reserved?: number;
  batchNo?: string;
  lotNo?: string;
  serialNo?: string;
  expiryDate?: string;
  dateReceived?: string;
  saleByDate?: string;
  lastUpdated?: string;
  updatedBy?: string;
};

function toStock(
  dto: StockResponseDTO,
  itemId: string,
  warehouseId: string,
): Stock {
  return {
    id: String(dto.id || `${itemId}-${warehouseId}`),
    itemId,
    quantity: Number(dto.quantity || 0),
    reservedQuantity: dto.reserved ? Number(dto.reserved) : undefined,
    availableQuantity: Number(dto.available || dto.quantity || 0),
    batchNo: dto.batchNo,
    lotNo: dto.lotNo,
    serialNo: dto.serialNo,
    expiryDate: dto.expiryDate,
    dateReceived: dto.dateReceived,
    saleByDate: dto.saleByDate,
    lastUpdated: dto.lastUpdated || new Date().toISOString(),
    updatedBy: dto.updatedBy,
  };
}

// Fetch stock data - try dedicated endpoint first, fallback to items
export async function listStock(): Promise<Stock[]> {
  try {
    // Try dedicated stock endpoint
    const res = await apiClient.get<StockResponseDTO[]>("/inventory/stock");
    return (res.data || []).map((s) =>
      toStock(s, String(s.itemId || ""), String(s.warehouseId || "")),
    );
  } catch (error: any) {
    // If stock endpoint doesn't exist (404) or fails (500), fetch items and create stock from item data
    const status = error?.response?.status;
    if (status === 404 || status === 500) {
      console.warn(
        `Stock endpoint returned ${status}, falling back to items-based stock creation`,
      );

      // Fetch items directly from API to get quantity/available/reserved data from DTOs
      const itemsRes =
        await apiClient.get<ItemResponseDTO[]>("/inventory/items");
      const itemsList = itemsRes.data || [];

      // Create stock records from items
      const stock: Stock[] = [];
      itemsList.forEach((itemDto) => {
        // warehouses.forEach((warehouse) => {
        // Use item's quantity/available/reserved if available from API DTO
        const quantity = Number(itemDto.quantity || 0);
        const available = Number(itemDto.available || itemDto.quantity || 0);
        const reserved = Number(itemDto.reserved || 0);

        stock.push({
          id: `${itemDto.id}`,
          itemId: String(itemDto.id),
          quantity: quantity,
          availableQuantity: available,
          reservedQuantity: reserved > 0 ? reserved : undefined,
          lastUpdated: new Date().toISOString(),
          warehouse_id: itemDto.warehouse_id,
          warehouse_name: itemDto.warehouse_name,
          warehouse_location: itemDto.warehouse_location,
        });
        // });
      });

      return stock;
    }
    throw error;
  }
}

// Helper function to generate category code from name
export const generateCategoryCode = (name: string): string => {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .substring(0, 50); // Limit length
};

// Helper function to generate warehouse code from name
export const generateWarehouseCode = (name: string): string => {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .substring(0, 50); // Limit length
};
