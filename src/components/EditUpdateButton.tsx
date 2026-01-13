import { Button } from "@/components/ui/button";

type Props = {
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function EditUpdateButton({ editing, onEdit, onSave, onCancel }: Props) {
  return (
    <div className="flex gap-2">
      {!editing ? (
        <Button
          onClick={onEdit}
          className="rounded-xl bg-white text-black shadow-sm hover:bg-white/90 border px-4"
        >
          <span className="mr-2 text-[18px] leading-none">✏️</span>
          <span className="font-semibold">Edit/Update</span>
        </Button>
      ) : (
        <>
          <Button variant="outline" onClick={onCancel} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={onSave} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
            Save
          </Button>
        </>
      )}
    </div>
  );
}
