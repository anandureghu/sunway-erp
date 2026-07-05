import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
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
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Layers3,
  CircleCheckBig,
  CircleSlash2,
  X,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import { kpiFilterItem } from "@/lib/kpi-filter";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

const CategoriesMaster = () => {
  const { confirm } = useConfirmDialog();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(
    null,
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

  const handleViewCategoryDetails = async (id: string) => {
    try {
      const category = await getCategory(id);
      setSelectedCategoryForDetails(category);
      setShowCategoryDetailsDialog(true);
    } catch (error: any) {
      console.error("Failed to load category details:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load category details.",
      );
    }
  };

  const handleEditCategory = (category: ItemCategory) => {
    setEditingCategory(category);
    resetCategory({
      name: category.name,
      status:
        category.status === "inactive"
          ? ("inactive" as const)
          : ("active" as const),
      parentId: category.parentId ? String(category.parentId) : undefined,
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id: string) => {
    const confirmMessage = selectedCategoryForDetails
      ? "Are you sure you want to delete this subcategory?"
      : "Are you sure you want to delete this category?";

    if (!(await confirm(confirmMessage))) return;

    try {
      await deleteCategory(id);
      toast.success(
        selectedCategoryForDetails
          ? "Subcategory deleted successfully!"
          : "Category deleted successfully!",
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
          "Cannot delete category. This category has subcategories. Please delete all subcategories first.",
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
            : "Category updated successfully!",
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

        await createCategory(payload);
        toast.success(
          data.parentId
            ? "Subcategory created successfully!"
            : "Category created successfully!",
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
            `Category code already exists. The name "${data.name}" generates a code that conflicts. Please use a different name.`,
          );
        } else {
          toast.error(
            `Category name "${data.name}" already exists. Please use a different name.`,
          );
        }
      } else if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error(
          editingCategory
            ? "Failed to update category. Please try again."
            : "Failed to create category. Please try again.",
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

  // Calculate statistics
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.status === "active").length;
    const inactive = categories.filter((c) => c.status === "inactive").length;
    return { total, active, inactive };
  }, [categories]);

  const applyKpiFilter = useCallback((key: string) => {
    setKpiFilter(key);
    switch (key) {
      case "active":
        setStatusFilter("active");
        break;
      case "inactive":
        setStatusFilter("inactive");
        break;
      default:
        setStatusFilter("all");
        break;
    }
  }, []);

  const filteredCategories = useMemo(() => {
    return [
      ...categories.map((cat) => ({
        ...cat,
        _sortOrder: 0,
      })),
    ]
      .sort((a, b) => {
        if (a._sortOrder !== b._sortOrder) {
          return a._sortOrder - b._sortOrder;
        }
        if (a.parentId && b.parentId) {
          if (a.parentId !== b.parentId) {
            return String(a.parentId).localeCompare(String(b.parentId));
          }
        }
        return a.name.localeCompare(b.name);
      })
      .filter((cat) => {
        const matchesSearch =
          searchQuery === "" ||
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cat.parentId &&
            categories
              .find((p) => p.id === cat.parentId)
              ?.name.toLowerCase()
              .includes(searchQuery.toLowerCase()));

        const matchesStatus =
          statusFilter === "all" || cat.status === statusFilter;

        return matchesSearch && matchesStatus;
      });
  }, [categories, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCategories.slice(startIndex, endIndex);
  }, [filteredCategories, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="space-y-6">
      <SecondaryPageHeader
        title="Categories"
        description="Manage categories"
        icon={<Layers3 className="h-5 w-5" />}
        actions={
          <Button
            onClick={handleNewCategory}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> New Category
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="mb-6">
        <KpiSummaryStrip
          items={[
            kpiFilterItem(
              {
                label: "Total Categories",
                value: stats.total,
                hint: "Total item categories",
                accent: "sky",
                icon: Layers3,
              },
              "all",
              kpiFilter,
              applyKpiFilter,
            ),
            kpiFilterItem(
              {
                label: "Active",
                value: stats.active,
                hint: "Currently in use",
                accent: "emerald",
                icon: CircleCheckBig,
              },
              "active",
              kpiFilter,
              applyKpiFilter,
            ),
            kpiFilterItem(
              {
                label: "Inactive",
                value: stats.inactive,
                hint: "Disabled categories",
                accent: "rose",
                icon: CircleSlash2,
              },
              "inactive",
              kpiFilter,
              applyKpiFilter,
            ),
          ]}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search categories..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setKpiFilter(null);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {paginatedCategories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No categories found
        </div>
      ) : (
        <>
          <DataTable
            columns={createCategoryColumns(
              handleViewCategoryDetails,
              handleEditCategory,
              handleDeleteCategory,
              // handleNewSubcategory,
              categories,
            )}
            data={paginatedCategories}
            getSubRows={(row) => {
              return row.subCategories;
            }}
          />
          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  filteredCategories.length,
                )}
                -
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredCategories.length,
                )}{" "}
                of {filteredCategories.length} categories
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={
                        currentPage === page
                          ? "min-w-[40px] bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                          : "min-w-[40px]"
                      }
                    >
                      {page}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </>
      )}

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
        <DialogContent
          className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
          style={{ maxWidth: 640, width: "calc(100vw - 32px)" }}
        >
          {/* ── Top bar ── */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-orange-100 text-orange-600">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                  {editingCategory
                    ? editingCategory.parentId
                      ? "Edit Subcategory"
                      : "Edit Category"
                    : "Add Category / Subcategory"}
                </DialogTitle>
                <p className="mt-0.5 text-[12px] text-slate-300">
                  {editingCategory
                    ? "Update the category information below"
                    : "Create a new category or subcategory"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowCategoryForm(false);
                setEditingCategory(null);
                resetCategory();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="overflow-y-auto bg-white px-6 py-5">
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
                        value === "none" ? undefined : value,
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
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editingCategory && editingCategory.parentId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current parent:{" "}
                      {categories.find(
                        (p) => p.id === editingCategory?.parentId,
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

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    resetCategory();
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
                >
                  {editingCategory ? "Update" : "Create"} Category
                </Button>
              </div>
            </form>
          </div>
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
                {selectedCategoryForDetails.subCategories &&
                selectedCategoryForDetails.subCategories.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCategoryForDetails.subCategories.map((sub) => (
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
                        <div className="flex gap-2"></div>
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
                {/* {subcategoriesByParent.filter(
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
                )} */}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesMaster;
