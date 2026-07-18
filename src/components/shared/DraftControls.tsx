import { Trash2 } from "lucide-react";

interface DraftControlsProps {
  restored: boolean;
  hasDraft: boolean;
  onClear: () => void;
  restoreMessage?: string;
  clearLabel?: string;
  className?: string;
}

export function DraftControls({
  restored,
  hasDraft,
  onClear,
  restoreMessage = "تم استرجاع آخر إدخال غير محفوظ",
  clearLabel = "حذف الحفظ التلقائي",
  className = "",
}: DraftControlsProps) {
  if (!restored && !hasDraft) return null;

  return (
    <div className={`flex flex-wrap items-center justify-end gap-3 text-xs ${className}`.trim()}>
      {restored && <span className="text-emerald-600">{restoreMessage}</span>}
      {hasDraft && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          <Trash2 className="size-3.5" />
          {clearLabel}
        </button>
      )}
    </div>
  );
}
