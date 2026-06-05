import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  editMode: boolean;
  onToggle: () => void;
};

export function EditModeToggle({ editMode, onToggle }: Props) {
  return (
    <Button
      type="button"
      variant={editMode ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      title={editMode ? "Exit edit mode" : "Edit page"}
      aria-pressed={editMode}
    >
      {editMode ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
      {editMode ? "Done" : "Edit"}
    </Button>
  );
}
