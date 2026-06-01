/** Display name for PR/PO line rows from API mapping. */
export function purchaseLineItemName(line: {
  itemId: number;
  itemName?: string | null;
  item?: { itemName?: string | null; name?: string | null } | null;
}): string {
  const fromField = line.itemName?.trim();
  if (fromField) return fromField;
  const fromNested =
    line.item?.itemName?.trim() || (line.item as { name?: string })?.name?.trim();
  if (fromNested) return fromNested;
  return `Item #${line.itemId}`;
}
