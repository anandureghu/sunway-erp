import { apiClient } from "@/service/apiClient";
import type { Item, ItemCategory, Warehouse } from "@/types/inventory";
import type {
  CategoryCreateDTO,
  CategoryResponseDTO,
  CategoryUpdateDTO,
  ItemCreateDTO,
  ItemResponseDTO,
  ItemUpdateDTO,
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
    name: dto.name || "",
    location: dto.location || "",
    address: "",
    capacity: undefined,
    status: normalizeStatus(dto.status) === "inactive" ? "inactive" : "active",
    createdAt: "",
  };
}

function toCategory(dto: CategoryResponseDTO): ItemCategory {
  return {
    id: String(dto.id),
    name: dto.name || dto.code || "",
    description: undefined,
    parentId: dto.parentId ? String(dto.parentId) : undefined,
    createdAt: "",
  };
}

function toItem(dto: ItemResponseDTO): Item {
  // Our UI `Item` model is richer than the backend response.
  // We map what we have and fill the rest with safe defaults.
  return {
    id: String(dto.id),
    sku: dto.sku || "",
    name: dto.name || "",
    description: undefined,
    itemType: undefined,
    category: dto.category || "",
    subcategory: dto.subCategory || undefined,
    brand: dto.brand || undefined,
    unit: "pcs",
    costPrice: Number(dto.costPrice || 0),
    sellingPrice: Number(dto.sellingPrice || 0),
    reorderLevel: 0,
    maximum: undefined,
    reorderQuantity: undefined,
    status:
      normalizeStatus(dto.status) === "discontinued"
        ? "discontinued"
        : normalizeStatus(dto.status) === "out_of_stock"
          ? "out_of_stock"
          : "active",
    barcode: undefined,
    rfidTag: undefined,
    createdAt: dto.createdAt || "",
    updatedAt: dto.updatedAt || "",
  };
}

// ---- Categories ----
export async function listCategories(): Promise<ItemCategory[]> {
  const res = await apiClient.get<CategoryResponseDTO[]>("/inventory/categories");
  return (res.data || []).map(toCategory);
}

export async function createCategory(payload: CategoryCreateDTO) {
  const res = await apiClient.post<CategoryResponseDTO>(
    "/inventory/categories",
    payload
  );
  return toCategory(res.data);
}

export async function updateCategory(id: Id | string, payload: CategoryUpdateDTO) {
  const res = await apiClient.put<CategoryResponseDTO>(
    `/inventory/categories/${id}`,
    payload
  );
  return toCategory(res.data);
}

export async function deleteCategory(id: Id | string) {
  await apiClient.delete(`/inventory/categories/${id}`);
}

// ---- Warehouses ----
export async function listWarehouses(): Promise<Warehouse[]> {
  const res =
    await apiClient.get<WarehouseResponseDTO[]>("/inventory/warehouses");
  return (res.data || []).map(toWarehouse);
}

export async function createWarehouse(payload: WarehouseCreateDTO) {
  const res = await apiClient.post<WarehouseResponseDTO>(
    "/inventory/warehouses",
    payload
  );
  return toWarehouse(res.data);
}

export async function updateWarehouse(
  id: Id | string,
  payload: WarehouseUpdateDTO
) {
  const res = await apiClient.put<WarehouseResponseDTO>(
    `/inventory/warehouses/${id}`,
    payload
  );
  return toWarehouse(res.data);
}

export async function deleteWarehouse(id: Id | string) {
  await apiClient.delete(`/inventory/warehouses/${id}`);
}

// ---- Items ----
export async function listItems(): Promise<Item[]> {
  const res = await apiClient.get<ItemResponseDTO[]>("/inventory/items");
  return (res.data || []).map(toItem);
}

export async function createItem(payload: ItemCreateDTO) {
  const res = await apiClient.post<ItemResponseDTO>("/inventory/items", payload);
  return toItem(res.data);
}

export async function updateItem(id: Id | string, payload: ItemUpdateDTO) {
  const res = await apiClient.put<ItemResponseDTO>(
    `/inventory/items/${id}`,
    payload
  );
  return toItem(res.data);
}


