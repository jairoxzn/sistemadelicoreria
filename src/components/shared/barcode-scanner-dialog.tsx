"use client";

import * as React from "react";
import type { IScannerControls } from "@zxing/browser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DUPLICATE_WINDOW_MS = 1500;

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
  closeOnScan = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
  /** Cierra el diálogo automáticamente tras la primera lectura exitosa. */
  closeOnScan?: boolean;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const controlsRef = React.useRef<IScannerControls | null>(null);
  const lastScanRef = React.useRef<{ code: string; time: number }>({ code: "", time: 0 });
  const onScanRef = React.useRef(onScan);
  const closeOnScanRef = React.useRef(closeOnScan);
  const onOpenChangeRef = React.useRef(onOpenChange);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    onScanRef.current = onScan;
    closeOnScanRef.current = closeOnScan;
    onOpenChangeRef.current = onOpenChange;
  }, [onScan, closeOnScan, onOpenChange]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);

    Promise.all([import("@zxing/browser"), import("@zxing/library")]).then(
      async ([{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }]) => {
        if (cancelled || !videoRef.current) return;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF,
          BarcodeFormat.QR_CODE,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints);
        try {
          const controls = await reader.decodeFromConstraints(
            {
              video: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                // @ts-expect-error focusMode no esta en el tipo estandar pero mejora el enfoque en camaras que lo soportan
                advanced: [{ focusMode: "continuous" }],
              },
            },
            videoRef.current,
            (result) => {
              if (!result) return;
              const code = result.getText();
              const now = Date.now();
              if (
                code === lastScanRef.current.code &&
                now - lastScanRef.current.time < DUPLICATE_WINDOW_MS
              ) {
                return;
              }
              lastScanRef.current = { code, time: now };
              onScanRef.current(code);
              if (closeOnScanRef.current) onOpenChangeRef.current(false);
            }
          );
          if (cancelled) {
            controls.stop();
            return;
          }
          controlsRef.current = controls;
        } catch {
          if (!cancelled) {
            setError(
              "No se pudo acceder a la cámara. Verifica los permisos del navegador y que uses HTTPS."
            );
          }
        }
      }
    );

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear código de barras</DialogTitle>
        </DialogHeader>
        <div className="relative overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
          {!error && (
            <div className="pointer-events-none absolute inset-x-10 top-1/2 h-16 -translate-y-1/2 rounded-md border-2 border-primary/80" />
          )}
        </div>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Apunta la cámara al código de barras del producto.
            {!closeOnScan && " Puedes escanear varios seguidos."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
