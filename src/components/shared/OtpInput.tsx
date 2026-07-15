import React, { useRef, useCallback } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  length?: number;
}

export function OtpInput({ value, onChange, error = false, disabled = false, length = 6 }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusIndex = useCallback((index: number) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
    }
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    const digit = val.slice(-1);
    const arr = value.split("");
    arr[index] = digit;
    const next = arr.join("").slice(0, length);
    onChange(next);
    if (index < length - 1) {
      focusIndex(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[index]) {
        const next = value.slice(0, index) + value.slice(index + 1);
        onChange(next);
      } else if (index > 0) {
        const next = value.slice(0, index - 1) + value.slice(index);
        onChange(next);
        focusIndex(index - 1);
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusIndex(index - 1);
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      focusIndex(index + 1);
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    focusIndex(focusIdx);
  };

  return (
    <div dir="ltr" className="flex items-center justify-center gap-2 md:gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={[
            "w-12 h-14 md:w-14 md:h-16 text-center text-2xl md:text-3xl font-bold rounded-xl",
            "bg-secondary/40 border-2 outline-none transition-all duration-200",
            "text-foreground placeholder:text-muted-foreground/30",
            error
              ? "border-destructive focus:border-destructive focus:ring-4 focus:ring-destructive/10"
              : "border-border focus:border-primary focus:ring-4 focus:ring-primary/10",
            disabled && "opacity-60 cursor-not-allowed",
          ].filter(Boolean).join(" ")}
        />
      ))}
    </div>
  );
}
