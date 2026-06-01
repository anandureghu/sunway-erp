import { Button } from "@/components/ui/button";
import { ImageIcon, Package } from "lucide-react";
import type { ItemResponseDTO } from "@/service/erpApiTypes";

interface Props {
  item: ItemResponseDTO;
  imageNonce: number;
  onUpdateImage: () => void;
}

export function ItemGallery({ item, imageNonce, onUpdateImage }: Props) {
  return (
    <div className="sticky top-6 space-y-4">
      <div className="group relative overflow-hidden rounded-2xl bg-muted/40 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <div className="aspect-square w-full">
          {item.imageUrl ? (
            <img
              key={`${item.imageUrl}-${imageNonce}`}
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-linear-to-br from-muted to-muted/50 text-muted-foreground">
              <Package className="h-20 w-20 opacity-30" strokeWidth={1} />
              <span className="text-sm">No product photo</span>
            </div>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-black/60 via-black/20 to-transparent p-4 pt-16 opacity-0 transition-opacity group-hover:opacity-100">
          <Button type="button" size="sm" variant="secondary" className="shadow-lg" onClick={onUpdateImage}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Update photo
          </Button>
        </div>
      </div>
      <Button type="button" variant="outline" className="w-full lg:hidden" onClick={onUpdateImage}>
        <ImageIcon className="mr-2 h-4 w-4" />
        Change product image
      </Button>
    </div>
  );
}
