"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2, Truck, Eye, Check, Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { createPurchase, confirmPurchase, cancelPurchase } from "./actions";

type PurchaseItem = {
  productName: string;
  productCode: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
};

type PurchaseRow = {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  userName: string;
  total: number;
  status: "BORRADOR" | "CONFIRMADA" | "ANULADA";
  createdAt: string;
  items: PurchaseItem[];
};

type Option = { id: string; name: string };
type ProductOption = { id: string; name: string; internalCode: string; purchasePrice: number };

const STATUS_STYLES: Record<string, string> = {
  BORRADOR: "bg-muted text-muted-foreground",
  CONFIRMADA: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  ANULADA: "bg-destructive/15 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  CONFIRMADA: "Confirmada",
  ANULADA: "Anulada",
};

export function PurchaseTable({
  purchases,
  suppliers,
  products,
}: {
  purchases: PurchaseRow[];
  suppliers: Option[];
  products: ProductOption[];
}) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<PurchaseRow | null>(null);
  const [confirmTarget, setConfirmTarget] = React.useState<PurchaseRow | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<PurchaseRow | null>(null);

  async function handleConfirm() {
    if (!confirmTarget) return;
    const result = await confirmPurchase(confirmTarget.id);
    if (result?.error) toast.error(result.error);
    else toast.success("Compra confirmada. El stock fue actualizado.");
    setConfirmTarget(null);
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    const result = await cancelPurchase(cancelTarget.id);
    if (result?.error) toast.error(result.error);
    else toast.success("Compra anulada.");
    setCancelTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Nueva compra
        </Button>
      </div>

      {purchases.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No hay compras registradas"
          action={
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Nueva compra
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Compra</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.purchaseNumber}</TableCell>
                  <TableCell>{p.supplierName}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatDate(p.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(p.total)}</TableCell>
                  <TableCell>
                    <Badge className={`border-transparent ${STATUS_STYLES[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setDetail(p)}>
                        <Eye className="size-4" />
                      </Button>
                      {p.status === "BORRADOR" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setConfirmTarget(p)}
                            title="Confirmar compra"
                          >
                            <Check className="size-4 text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setCancelTarget(p)}
                            title="Anular compra"
                          >
                            <Ban className="size-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreatePurchaseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        suppliers={suppliers}
        products={products}
      />

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compra {detail?.purchaseNumber}</DialogTitle>
            <DialogDescription>
              {detail?.supplierName} · {detail && formatDate(detail.createdAt)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {detail?.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.productName}
                </span>
                <span className="font-medium">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
              <span>Total</span>
              <span>{detail && formatCurrency(detail.total)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar compra {confirmTarget?.purchaseNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se aumentará el stock de los productos y se actualizará su costo. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmar compra</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular compra {cancelTarget?.purchaseNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta compra en borrador quedará anulada y no podrá confirmarse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Anular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type DraftItem = { productId: string; quantity: number; unitCost: number };

function CreatePurchaseDialog({
  open,
  onOpenChange,
  suppliers,
  products,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Option[];
  products: ProductOption[];
}) {
  const [supplierId, setSupplierId] = React.useState("");
  const [items, setItems] = React.useState<DraftItem[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSupplierId("");
      setItems([]);
    }
  }, [open]);

  function addItem() {
    if (products.length === 0) return;
    const first = products[0];
    setItems((prev) => [
      ...prev,
      { productId: first.id, quantity: 1, unitCost: first.purchasePrice },
    ]);
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);

  async function handleSubmit() {
    if (!supplierId) {
      toast.error("Selecciona un proveedor.");
      return;
    }
    if (items.length === 0) {
      toast.error("Agrega al menos un producto.");
      return;
    }
    setIsSubmitting(true);
    const result = await createPurchase({ supplierId, items });
    setIsSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Compra creada como borrador.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nueva compra</DialogTitle>
          <DialogDescription>
            Se creará como borrador. Confírmala luego para aumentar el stock.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Proveedor</label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue placeholder="Selecciona un proveedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={item.productId}
                  onValueChange={(v) => updateItem(i, { productId: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  className="w-20"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })}
                  placeholder="Cant."
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-24"
                  value={item.unitCost}
                  onChange={(e) => updateItem(i, { unitCost: Number(e.target.value) || 0 })}
                  placeholder="Costo"
                />
                <Button variant="ghost" size="icon-sm" onClick={() => removeItem(i)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="size-4" />
              Agregar producto
            </Button>
          </div>

          <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            Crear compra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
