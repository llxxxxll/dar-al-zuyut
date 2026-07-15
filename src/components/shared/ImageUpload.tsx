import { useRef, useState } from "react";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE = 3 * 1024 * 1024; // 3MB

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string; // path prefix inside the media bucket
  className?: string;
}

export function ImageUpload({ value, onChange, folder = "uploads", className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError("الصيغة غير مدعومة. PNG / JPG / WEBP فقط.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("حجم الملف يتجاوز 3MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("media")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (upErr) {
      setError(upErr.message || "فشل الرفع");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className={className}>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… أو ارفع صورة"
          dir="ltr"
          className="flex-1 h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-foreground text-background font-bold text-sm disabled:opacity-60 shrink-0"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? "جاري الرفع…" : "رفع صورة"}
        </button>
      </div>
      {error && <div className="text-xs text-rose-600 mt-1.5">{error}</div>}
      {value ? (
        <div className="mt-2 relative inline-block">
          <img
            src={value}
            alt="معاينة"
            className="h-24 w-auto rounded-lg border border-border object-cover bg-muted"
            onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.3")}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -left-2 size-6 grid place-items-center rounded-full bg-background border border-border shadow"
            title="إزالة"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="size-4" /> لا توجد صورة بعد
        </div>
      )}
      <div className="text-[11px] text-muted-foreground mt-1">PNG / JPG / WEBP — حد أقصى 3MB</div>
    </div>
  );
}