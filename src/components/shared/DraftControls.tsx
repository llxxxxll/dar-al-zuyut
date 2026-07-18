import { CheckCircle2, Trash2 } from "lucide-react";

interface DraftControlsProps {
  restored: boolean;
  hasDraft: boolean;
  onClear: () => void;
  className?: string;
}

export function DraftControls({ restored, hasDraft, onClear, className = "" }: DraftControlsProps) {
  if (!restored && !hasDraft) return null;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 ${className}`.trim()}>
      <div className="inline-flex items-center gap-2 font-medium">
        <CheckCircle2 className="size-4" />
        {restored ? "تم استرجاع مسودة محفوظة" : "توجد مسودة محفوظة محليًا"}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 font-semibold text-emerald-700 hover:bg-emerald-100"
      >
        <Trash2 className="size-3.5" />
        مسح المسودة
      </button>
    </div>
  );
}
