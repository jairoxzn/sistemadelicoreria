"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Download, ExternalLink, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CatalogQrCard({
  catalogUrl,
  qrDataUrl,
}: {
  catalogUrl: string;
  qrDataUrl: string;
}) {
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(catalogUrl);
      toast.success("Enlace copiado al portapapeles.");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="size-4 text-primary" />
          Catálogo para clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Comparte este código QR o el enlace para que tus clientes vean el catálogo de
          productos sin necesidad de iniciar sesión.
        </p>

        <div className="flex justify-center rounded-xl border border-border bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Código QR del catálogo" className="size-48" />
        </div>

        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-center text-xs break-all text-muted-foreground">
          {catalogUrl}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="size-3.5" />
            Copiar enlace
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              Ver catálogo
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={qrDataUrl} download="catalogo-qr.png">
              <Download className="size-3.5" />
              Descargar QR
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
