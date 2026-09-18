"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Receipt,
  Eye,
  Ban,
  Undo2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/empty-state";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import type { SaleReceipt } from "@/app/(app)/pos/actions";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cancelSale, createReturn } from "./actions";

const METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  YAPE: "Yape",
  PLIN: "Plin",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

type SaleItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  alreadyReturned: number;
};

type SaleRow = {
  id: string;
  saleNumber: string;
  customerName: string;
  userName: string;
  subtotal: number;
  discount: number;
  total: number;
  status: "COMPLETADA" | "ANULADA";
  cancelReason: string | null;
  createdAt: string;
  items: SaleItem[];
  payments: {
    method: string;
    amount: number;
    receivedAmount: number | null;
    changeAmount: number | null;
  }[];
};

type Business = {
  tradeName: string;
  address: string | null;
  phone: string | null;
  ticketFooter: string | null;
  logoUrl: string | null;
};

function saleToReceipt(sale: SaleRow): SaleReceipt {
  return {
    saleNumber: sale.saleNumber,
    createdAt: sale.createdAt,
    cashierName: sale.userName,
    customerName: sale.customerName,
    items: sale.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    })),
    payments: sale.payments,
    subtotal: sale.subtotal,
    discount: sale.discount,
    total: sale.total,
  };
}

export function SaleTable({
  sales,
  total,
  page,
  pageSize,
  filters,
  canManage,
  canReturn,
  business,
}: {
  sales: SaleRow[];
  total: number;
  page: number;
  pageSize: number;
  filters: { q: string; estado: string };
  canManage: boolean;
  canReturn: boolean;
  business: Business;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(filters.q);
  const [detail, setDetail] = React.useState<SaleRow | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<SaleRow | null>(null);
  const [returnTarget, setReturnTarget] = React.useState<SaleRow | null>(null);
  const [receiptTarget, setReceiptTarget] = React.useState<SaleRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!("page" in next)) params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== filters.q) updateParams({ q: search });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° de venta o cliente..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filters.estado || "all"}
          onValueChange={(v) => updateParams({ estado: v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
            <SelectItem value="anulada">Anulada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sales.length === 0 ? (
        <EmptyState icon={Receipt} title="No se encontraron ventas" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Venta</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Cajero</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDateTime(sale.createdAt)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{sale.customerName}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {sale.userName}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(sale.total)}</TableCell>
                    <TableCell>
                      <Badge variant={sale.status === "COMPLETADA" ? "default" : "destructive"}>
                        {sale.status === "COMPLETADA" ? "Completada" : "Anulada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setDetail(sale)}>
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Ver e imprimir ticket"
                          onClick={() => setReceiptTarget(sale)}
                        >
                          <Receipt className="size-4" />
                        </Button>
                        {sale.status === "COMPLETADA" && canReturn && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Registrar devolución"
                            onClick={() => setReturnTarget(sale)}
                          >
                            <Undo2 className="size-4" />
                          </Button>
                        )}
                        {sale.status === "COMPLETADA" && canManage && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Anular venta"
                            onClick={() => setCancelTarget(sale)}
                          >
                            <Ban className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              {total} venta{total === 1 ? "" : "s"} · Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Siguiente
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <SaleDetailDialog sale={detail} onOpenChange={(open) => !open && setDetail(null)} />
      <CancelSaleDialog sale={cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)} />
      <ReturnDialog sale={returnTarget} onOpenChange={(open) => !open && setReturnTarget(null)} />
      <ReceiptDialog
        open={!!receiptTarget}
        onOpenChange={(open) => !open && setReceiptTarget(null)}
        receipt={receiptTarget ? saleToReceipt(receiptTarget) : null}
        business={business}
        title={`Ticket · ${receiptTarget?.saleNumber ?? ""}`}
        closeLabel="Cerrar"
      />
    </div>
  );
}

function SaleDetailDialog({
  sale,
  onOpenChange,
}: {
  sale: SaleRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!sale} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Venta {sale?.saleNumber}</DialogTitle>
          <DialogDescription>
            {sale && formatDateTime(sale.createdAt)} · {sale?.customerName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          {sale?.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.quantity}x {item.name}
                {item.alreadyReturned > 0 && (
                  <span className="ml-1 text-xs text-amber-600">
                    ({item.alreadyReturned} devuelto{item.alreadyReturned > 1 ? "s" : ""})
                  </span>
                )}
              </span>
              <span className="font-medium">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{sale && formatCurrency(sale.subtotal)}</span>
            </div>
            {sale && sale.discount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Descuento</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{sale && formatCurrency(sale.total)}</span>
            </div>
          </div>
          <div className="border-t border-border pt-2">
            {sale?.payments.map((p, i) => (
              <div key={i} className="flex justify-between text-muted-foreground">
                <span>{METHOD_LABELS[p.method] ?? p.method}</span>
                <span>{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
          {sale?.cancelReason && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive">
              Anulada: {sale.cancelReason}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CancelSaleDialog({
  sale,
  onOpenChange,
}: {
  sale: SaleRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (sale) setReason("");
  }, [sale]);

  async function handleSubmit() {
    if (!sale || reason.trim().length < 3) {
      toast.error("Indica el motivo de la anulación.");
      return;
    }
    setIsSubmitting(true);
    const result = await cancelSale(sale.id, { reason });
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Venta anulada. El stock fue repuesto.");
    onOpenChange(false);
  }

  return (
    <Dialog open={!!sale} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular venta {sale?.saleNumber}</DialogTitle>
          <DialogDescription>
            El stock de los productos se repondrá. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Motivo de la anulación..."
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting}>
            Anular venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReturnDialog({
  sale,
  onOpenChange,
}: {
  sale: SaleRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [selected, setSelected] = React.useState<Record<string, number>>({});
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setSelected({});
    setReason("");
  }, [sale]);

  const returnableItems = sale?.items.filter((i) => i.alreadyReturned < i.quantity) ?? [];

  function toggleItem(item: SaleItem, checked: boolean) {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[item.id] = item.quantity - item.alreadyReturned;
      else delete next[item.id];
      return next;
    });
  }

  function updateQty(itemId: string, qty: number, max: number) {
    setSelected((prev) => ({ ...prev, [itemId]: Math.min(Math.max(1, qty), max) }));
  }

  async function handleSubmit() {
    if (!sale) return;
    const items = Object.entries(selected).map(([saleItemId, quantity]) => ({
      saleItemId,
      quantity,
    }));
    if (items.length === 0) {
      toast.error("Selecciona al menos un producto a devolver.");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Indica el motivo de la devolución.");
      return;
    }
    setIsSubmitting(true);
    const result = await createReturn({ saleId: sale.id, reason, items });
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Devolución registrada y stock repuesto.");
    onOpenChange(false);
  }

  return (
    <Dialog open={!!sale} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Devolución · Venta {sale?.saleNumber}</DialogTitle>
          <DialogDescription>Selecciona los productos y cantidades a devolver.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {returnableItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todos los productos de esta venta ya fueron devueltos.
            </p>
          ) : (
            returnableItems.map((item) => {
              const max = item.quantity - item.alreadyReturned;
              const checked = item.id in selected;
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => toggleItem(item, !!v)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Máx. {max} unidad(es)</p>
                  </div>
                  {checked && (
                    <Input
                      type="number"
                      min={1}
                      max={max}
                      className="w-16"
                      value={selected[item.id]}
                      onChange={(e) => updateQty(item.id, Number(e.target.value) || 1, max)}
                    />
                  )}
                </div>
              );
            })
          )}
          <Textarea
            placeholder="Motivo de la devolución..."
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || returnableItems.length === 0}>
            Registrar devolución
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
