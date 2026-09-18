"use client";

import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { SaleReceipt } from "@/app/(app)/pos/actions";

const METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  YAPE: "Yape",
  PLIN: "Plin",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

type Business = {
  tradeName: string;
  address: string | null;
  phone: string | null;
  ticketFooter: string | null;
  logoUrl: string | null;
};

function TicketBody({ receipt, business }: { receipt: SaleReceipt; business: Business }) {
  return (
    <>
      <div className="text-center">
        {business.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logoUrl}
            alt={business.tradeName}
            className="mx-auto mb-1.5 max-h-16 max-w-[140px] object-contain"
          />
        )}
        <p className="text-sm font-semibold">{business.tradeName}</p>
        {business.address && <p>{business.address}</p>}
        {business.phone && <p>Tel: {business.phone}</p>}
      </div>
      <div className="my-2 border-t border-dashed border-border" />
      <p>Boleta: {receipt.saleNumber}</p>
      <p>Fecha: {formatDateTime(receipt.createdAt)}</p>
      <p>Cajero: {receipt.cashierName}</p>
      <p>Cliente: {receipt.customerName ?? "Cliente genérico"}</p>
      <div className="my-2 border-t border-dashed border-border" />
      {receipt.items.map((item, i) => (
        <div key={i} className="mb-1 flex justify-between gap-2">
          <span className="truncate">
            {item.quantity}x {item.name}
          </span>
          <span className="shrink-0 tabular-nums">{formatCurrency(item.subtotal)}</span>
        </div>
      ))}
      <div className="my-2 border-t border-dashed border-border" />
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatCurrency(receipt.subtotal)}</span>
      </div>
      {receipt.discount > 0 && (
        <div className="flex justify-between">
          <span>Descuento</span>
          <span className="tabular-nums">-{formatCurrency(receipt.discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-semibold">
        <span>TOTAL</span>
        <span className="tabular-nums">{formatCurrency(receipt.total)}</span>
      </div>
      <div className="my-2 border-t border-dashed border-border" />
      {receipt.payments.map((p, i) => (
        <div key={i} className="flex justify-between">
          <span>{METHOD_LABELS[p.method] ?? p.method}</span>
          <span className="tabular-nums">{formatCurrency(p.amount)}</span>
        </div>
      ))}
      {receipt.payments.some((p) => p.changeAmount) && (
        <div className="flex justify-between font-medium">
          <span>Vuelto</span>
          <span className="tabular-nums">
            {formatCurrency(receipt.payments.reduce((a, p) => a + (p.changeAmount ?? 0), 0))}
          </span>
        </div>
      )}
      {business.ticketFooter && (
        <>
          <div className="my-2 border-t border-dashed border-border" />
          <p className="text-center">{business.ticketFooter}</p>
        </>
      )}
    </>
  );
}

export function ReceiptDialog({
  open,
  onOpenChange,
  receipt,
  business,
  title = "Venta registrada",
  closeLabel = "Nueva venta",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: SaleReceipt | null;
  business: Business;
  title?: string;
  closeLabel?: string;
}) {
  if (!receipt) return null;

  function handlePrint() {
    // @page solo se inyecta al imprimir el ticket, para no afectar el
    // tamaño de pagina de otras impresiones (ej. Reportes).
    const style = document.createElement("style");
    style.id = "ticket-page-size";
    style.textContent = "@page { size: 80mm auto; margin: 0; }";
    document.head.appendChild(style);

    const cleanup = () => {
      style.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    window.print();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>

        {/* Vista previa en pantalla (el ticket real para imprimir se renderiza
            en un portal aparte, fuera del dialogo, para no heredar su
            position/transform y así poder medir 80mm reales al imprimir). */}
        <div className="mx-auto w-full max-w-[300px] font-mono text-xs leading-relaxed">
          <TicketBody receipt={receipt} business={business} />
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="size-4" />
            Imprimir
          </Button>
          <Button onClick={() => onOpenChange(false)}>{closeLabel}</Button>
        </DialogFooter>
      </DialogContent>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id="print-ticket"
            className="hidden font-mono text-xs leading-relaxed print:block"
          >
            <TicketBody receipt={receipt} business={business} />
          </div>,
          document.body
        )}
    </Dialog>
  );
}
