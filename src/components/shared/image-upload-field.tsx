"use client";

import * as React from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "cn";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploadField({
  value,
  onChange,
  uploadAction,
  disabled,
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  uploadAction: (formData: FormData) => Promise<{ url?: string; error?: string }>;
  disabled?: boolean;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato no soportado. Usa JPG, PNG o WEBP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("La imagen no debe superar 4 MB.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadAction(formData);
    setIsUploading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.url) onChange(result.url);
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Imagen del producto" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground/50" />
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}
        {value && !isUploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-destructive"
            aria-label="Quitar imagen"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <ImagePlus className="size-3.5" />
          {value ? "Cambiar imagen" : "Subir imagen"}
        </button>
        <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · máx. 4 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
