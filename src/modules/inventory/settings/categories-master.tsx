import { DataTable } from "@/components/datatable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategoryColumns } from "@/lib/columns/category-columns";
import { type CategoryFormData, CATEGORY_SCHEMA } from "@/schema/inventory";
import {
  updateCategory,
  generateCategoryCode,
  createCategory,
  listCategories,
  deleteCategory,
  getCategory,
} from "@/service/inventoryService";
import type { ItemCategory } from "@/types/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const CategoriesMaster = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(
    null
  );
  // Categories management state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categories, setCategories] = useState<ItemCategory[]>([]);

  const [selectedCategoryForDetails, setSelectedCategoryForDetails] =
    useState<ItemCategory | null>(null);

  const [showCategoryDetailsDialog, setShowCategoryDetailsDialog] =
    useState(false);

  // TODO: set loading and error states properly
  const [, setLoading] = useState(true);
  const [, setLoadError] = useState<string | null>(null);

  const {
    register: registerCategory,
    handleSubmit: handleCategorySubmit,
    formState: { errors: categoryErrors },
    reset: resetCategory,
    watch: watchCategory,
    setValue: setCategoryValue,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(CATEGORY_SCHEMA),
    defaultValues: {
      status: "active" as const,
    },
  });

  const categoryParentId = watchCategory("parentId");
  const watchCategoryStatus = watchCategory("status");
  const watchCategoryName = watchCategory("name");

  // Filter categories - separate parent categories from subcategories
  const parentCategories = categories.filter((cat) => !cat.parentId);
  const subcategoriesByParent = categories.filter((cat) => cat.parentId);

  const handleViewCategoryDetails = async (id: string) => {
    try {
      const category = await getCategory(id);
      setSelectedCategoryForDetails(category);
      setShowCategoryDetailsDialog(true);
    } catch (error: any) {
      console.error("Failed to load category details:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load category details."
      );
    }
  };

  const handleEditCategory = (category: ItemCategory) => {
    setEditingCategory(category);
    resetCategory({
      name: category.name,
      status: "active" as const,
      parentId: category.parentId,
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) {
      toast.error("Category not found");
      return;
    }

    const isSubcategory = !!category.parentId;
    const hasSubcategories = subcategoriesByParent.some(
      (sub) => sub.parentId === id
    );

    if (hasSubcategories) {
      toast.error(
        "Cannot delete category. Please delete all subcategories first."
      );
      return;
    }

    const confirmMessage = isSubcategory
      ? "Are you sure you want to delete this subcategory?"
      : "Are you sure you want to delete this category?";

    if (!window.confirm(confirmMessage)) return;

    try {
      await deleteCategory(id);
      toast.success(
        isSubcategory
          ? "Subcategory deleted successfully!"
          : "Category deleted successfully!"
      );

      // Reload categories
      const categoriesList = await listCategories();
      setCategories(categoriesList);
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to delete category. Please try again.";
      if (
        errorMessage.includes("subcategories") ||
        errorMessage.includes("child")
      ) {
        toast.error(
          "Cannot delete category. This category has subcategories. Please delete all subcategories first."
        );
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    resetCategory({
      status: "active" as const,
      parentId: undefined,
    });
    setShowCategoryForm(true);
  };

  const handleNewSubcategory = (parentCategory: ItemCategory) => {
    setEditingCategory(null);
    resetCategory({
      status: "active" as const,
      parentId: parentCategory.id,
    });
    setShowCategoryForm(true);
  };

  // Category handlers
  const onCategorySubmit = async (data: CategoryFormData) => {
    try {
      // Trim and normalize the name
      const normalizedName = data.name.trim();

      if (editingCategory) {
        // For updates, check if parentId is being changed
        const updatePayload: any = {
          name: normalizedName,
          status: data.status || "active",
        };
        // If editing and parentId changed, we need to handle it via API
        // Note: Update endpoint might not support parentId change, so we check
        await updateCategory(editingCategory.id, updatePayload);
        toast.success(
          editingCategory.parentId
            ? "Subcategory updated successfully!"
            : "Category updated successfully!"
        );
      } else {
        // Generate code from name for new categories
        const categoryCode = generateCategoryCode(normalizedName);

        const payload = {
          code: categoryCode,
          name: normalizedName,
          status: data.status || "active",
          parentId: data.parentId ? Number(data.parentId) : undefined,
        };

        console.log("Creating category with payload:", payload);
        await createCategory(payload);
        toast.success(
          data.parentId
            ? "Subcategory created successfully!"
            : "Category created successfully!"
        );
      }

      // Reload categories
      const categoriesList = await listCategories();
      setCategories(categoriesList);

      // Reset form
      setShowCategoryForm(false);
      setEditingCategory(null);
      resetCategory();
    } catch (error: any) {
      console.error("Failed to save category:", error);
      const status = error?.response?.status;
      const errorMessage = error?.response?.data?.message || "";
      const errorData = error?.response?.data || {};

      if (status === 409) {
        // Conflict - category name or code already exists
        const conflictField =
          errorData.field ||
          (errorMessage.toLowerCase().includes("code") ? "code" : "name");
        if (conflictField === "code") {
          toast.error(
            `Category code already exists. The name "${data.name}" generates a code that conflicts. Please use a different name.`
          );
        } else {
          toast.error(
            `Category name "${data.name}" already exists. Please use a different name.`
          );
        }
      } else if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error(
          editingCategory
            ? "Failed to update category. Please try again."
            : "Failed to create category. Please try again."
        );
      }
    }
  };

  // Load stock data from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        // Fetch all data in parallel
        const [categoriesList] = await Promise.all([listCategories()]);

        if (!cancelled) {
          setCategories(categoriesList);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error("Failed to load cateogry data:", error);
          setLoadError(error?.message || "Failed to load cateogry data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search categories..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleNewCategory} className="ml-4">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Table - Show all categories and subcategories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Categories & Subcategories</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            columns={createCategoryColumns(
              handleViewCategoryDetails,
              handleEditCategory,
              handleDeleteCategory,
              handleNewSubcategory,
              parentCategories
            )}
            data={[
              ...parentCategories.map((cat) => ({
                ...cat,
                _sortOrder: 0,
              })),
              ...subcategoriesByParent.map((cat) => ({
                ...cat,
                _sortOrder: 1,
              })),
            ]
              .sort((a, b) => {
                // Sort by parent first, then by name within each group
                if (a._sortOrder !== b._sortOrder) {
                  return a._sortOrder - b._sortOrder;
                }
                // If both are subcategories, group by parent
                if (a.parentId && b.parentId) {
                  if (a.parentId !== b.parentId) {
                    return String(a.parentId).localeCompare(String(b.parentId));
                  }
                }
                return a.name.localeCompare(b.name);
              })
              .filter(
                (cat) =>
                  searchQuery === "" ||
                  cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (cat.parentId &&
                    parentCategories
                      .find((p) => p.id === cat.parentId)
                      ?.name.toLowerCase()
                      .includes(searchQuery.toLowerCase()))
              )}
          />
        </CardContent>
      </Card>

      <Dialog
        open={showCategoryForm}
        onOpenChange={(open) => {
          setShowCategoryForm(open);
          if (!open) {
            setEditingCategory(null);
            resetCategory();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? editingCategory.parentId
                  ? "Edit Subcategory"
                  : "Edit Category"
                : "Add Category / Subcategory"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category information below."
                : "Create a new category or subcategory. Leave parent category as 'None' for a main category."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleCategorySubmit(onCategorySubmit)}
            className="space-y-4 mt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Category name"
                  {...registerCategory("name")}
                />
                {categoryErrors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {categoryErrors.name.message}
                  </p>
                )}
                {!editingCategory && watchCategoryName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Code will be:{" "}
                    <span className="font-mono font-semibold">
                      {generateCategoryCode(watchCategoryName)}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {editingCategory && editingCategory.parentId
                    ? "Parent Category (Cannot change for existing subcategory)"
                    : "Parent Category (for subcategory)"}
                </label>
                <Select
                  onValueChange={(value) =>
                    setCategoryValue(
                      "parentId",
                      value === "none" ? undefined : value
                    )
                  }
                  value={categoryParentId || "none"}
                  disabled={!!(editingCategory && editingCategory.parentId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Main Category)</SelectItem>
                    {parentCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingCategory && editingCategory.parentId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current parent:{" "}
                    {parentCategories.find(
                      (p) => p.id === editingCategory?.parentId
                    )?.name || "Unknown"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Status <span className="text-red-500">*</span>
                </label>
                <Select
                  onValueChange={(value) =>
                    setCategoryValue("status", value as "active" | "inactive")
                  }
                  value={watchCategoryStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                  resetCategory();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? "Update" : "Create"} Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Details Dialog */}
      <Dialog
        open={showCategoryDetailsDialog}
        onOpenChange={setShowCategoryDetailsDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCategoryForDetails?.name} - Details
            </DialogTitle>
            <DialogDescription>
              View category information and manage subcategories.
            </DialogDescription>
          </DialogHeader>
          {selectedCategoryForDetails && (
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Category Name</p>
                <p className="font-medium text-lg">
                  {selectedCategoryForDetails.name}
                </p>
              </div>
              {selectedCategoryForDetails.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">
                    {selectedCategoryForDetails.description}
                  </p>
                </div>
              )}

              {/* Subcategories List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Subcategories
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleNewSubcategory(selectedCategoryForDetails);
                      setShowCategoryDetailsDialog(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subcategory
                  </Button>
                </div>
                {subcategoriesByParent.filter(
                  (sub) => sub.parentId === selectedCategoryForDetails.id
                ).length > 0 ? (
                  <div className="space-y-2">
                    {subcategoriesByParent
                      .filter(
                        (sub) => sub.parentId === selectedCategoryForDetails.id
                      )
                      .map((sub) => (
                        <div
                          key={sub.id}
                          className="p-3 border rounded-md flex items-center justify-between hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <span className="font-medium">{sub.name}</span>
                            {sub.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {sub.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                handleEditCategory(sub);
                                setShowCategoryDetailsDialog(false);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setShowCategoryDetailsDialog(false);
                                handleDeleteCategory(sub.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md">
                    <p className="text-sm text-gray-500 mb-3">
                      No subcategories found.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleNewSubcategory(selectedCategoryForDetails);
                        setShowCategoryDetailsDialog(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Subcategory
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesMaster;
