type SupplierIdNameCellProps = {
  supplierId?: number | string | null;
  supplierName?: string | null;
};

/** Supplier label: name with id in parentheses when both are known. */
export function SupplierIdNameCell({
  supplierId,
  supplierName,
}: SupplierIdNameCellProps) {
  const id =
    supplierId != null && String(supplierId).trim() !== ""
      ? String(supplierId)
      : null;
  const name = supplierName?.trim() || null;

  if (name && id) {
    return (
      <span className="min-w-0">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground text-xs"> ({id})</span>
      </span>
    );
  }
  if (name) {
    return <span className="font-medium">{name}</span>;
  }
  if (id) {
    return <span className="font-mono text-sm">{id}</span>;
  }
  return <span className="text-muted-foreground">—</span>;
}
