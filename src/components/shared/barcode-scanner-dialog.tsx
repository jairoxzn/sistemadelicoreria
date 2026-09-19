"use client";

import * as React from "react";
import type { IScannerControls } from "@zxing/browser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "cn";

const DUPLICATE_WINDOW_MS = 1500;
const BARCODE_FORMATS = ["qr_code", "ean_13", "ean_8", "code_128", "upc_a", "upc_e", "code_39", "itf"];

/** La Barcode Detection API es experimental y aun no tiene tipos en el DOM lib de TS. */
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
}

function getNativeBarcodeDetector(): BarcodeDetectorConstructor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;
  return ctor ?? null;
}

function beep() {
  try {
    const AudioContextCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
    oscillator.onended = () => ctx.close();
  } catch {
    // el audio es solo un extra, ignorar si el navegador lo bloquea
  }
}

function mapGetUserMediaError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Permiso de cámara denegado. Habilítalo en la configuración del navegador para este sitio.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No se encontró ninguna cámara en este dispositivo.";
    case "NotReadableError":
    case "TrackStartError":
      return "La cámara está siendo usada por otra aplicación.";
    case "OverconstrainedError":
      return "No se pudo aplicar la configuración de cámara solicitada.";
    default:
      return "No se pudo acceder a la cámara. Verifica los permisos del navegador y que uses HTTPS.";
  }
}

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
  const lastScanRef = React.useRef<{ code: string; time: number }>({ code: "", time: 0 });
  const onScanRef = React.useRef(onScan);
  const closeOnScanRef = React.useRef(closeOnScan);
  const onOpenChangeRef = React.useRef(onOpenChange);
  const [error, setError] = React.useState<string | null>(null);
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = React.useState<string | undefined>(undefined);
  const [detected, setDetected] = React.useState(false);

  React.useEffect(() => {
    onScanRef.current = onScan;
    closeOnScanRef.current = closeOnScan;
    onOpenChangeRef.current = onOpenChange;
  }, [onScan, closeOnScan, onOpenChange]);

  React.useEffect(() => {
    if (!open) {
      setDevices([]);
      setDetected(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tu navegador no soporta acceso a la cámara.");
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let rafId: number | null = null;
    let zxingControls: IScannerControls | null = null;
    setError(null);

    function handleDetected(code: string) {
      const now = Date.now();
      if (code === lastScanRef.current.code && now - lastScanRef.current.time < DUPLICATE_WINDOW_MS) {
        return;
      }
      lastScanRef.current = { code, time: now };
      beep();
      if (navigator.vibrate) navigator.vibrate(120);
      setDetected(true);
      setTimeout(() => setDetected(false), 400);
      onScanRef.current(code);
      if (closeOnScanRef.current) onOpenChangeRef.current(false);
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
            : {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
        });
      } catch (err) {
        if (!cancelled) setError(mapGetUserMediaError(err));
        return;
      }

      if (cancelled || !videoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});

      // recien con permiso concedido los dispositivos vienen con "label"
      navigator.mediaDevices.enumerateDevices().then((all) => {
        if (!cancelled) setDevices(all.filter((d) => d.kind === "videoinput"));
      });

      const NativeBarcodeDetector = getNativeBarcodeDetector();
      if (NativeBarcodeDetector) {
        const detector = new NativeBarcodeDetector({ formats: BARCODE_FORMATS });
        const scanFrame = async () => {
          if (video.readyState >= 2) {
            try {
              const results = await detector.detect(video);
              if (results.length > 0) handleDetected(results[0].rawValue);
            } catch {
              // frame no decodificable, se reintenta en el siguiente
            }
          }
          rafId = requestAnimationFrame(scanFrame);
        };
        rafId = requestAnimationFrame(scanFrame);
      } else {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");
        if (cancelled) return;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.CODE_128,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints);
        zxingControls = await reader.decodeFromStream(stream, video, (result) => {
          if (result) handleDetected(result.getText());
        });
        if (cancelled) zxingControls.stop();
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, deviceId, closeOnScan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear código</DialogTitle>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
          {!error && (
            <div
              className={cn(
                "pointer-events-none absolute inset-x-10 top-1/2 h-16 -translate-y-1/2 rounded-md border-2 transition-colors",
                detected ? "border-emerald-400" : "border-primary/80"
              )}
            />
          )}
        </div>

        {devices.length > 1 && !error && (
          <Select value={deviceId} onValueChange={setDeviceId}>
            <SelectTrigger className="w-full text-xs">
              <SelectValue placeholder="Cámara predeterminada" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((d, i) => (
                <SelectItem key={d.deviceId} value={d.deviceId}>
                  {d.label || `Cámara ${i + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Apunta la cámara al código de barras o QR del producto.
            {!closeOnScan && " Puedes escanear varios seguidos."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
