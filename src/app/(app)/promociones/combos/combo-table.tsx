"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2, Gift, Pencil, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatCurrency } from "@/lib/format";
import { createCombo, updateCombo, toggleComboActive } from "./actions";

type ComboItemRow = { productId: string; productName: string; quantity: number; unitPrice: number };
type ComboRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  items: ComboItemRow[];
};
type ProductOption = { id: string; name: string; salePrice: number };
type DraftItem = { productId: string; quantity: number };

export function ComboTable({
  combos,
  products,
}: {
  combos: ComboRow[];
  products: ProductOption[];
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ComboRow | null>(null);
  const [toggleTarget, setToggleTarget] = React.useState<ComboRow | null>(null);

  async function handleToggle() {
    if (!toggleTarget) return;
    const result = await toggleComboActive(toggleTarget.id, !toggleTarget.active);
    if (result?.error) toast.error(result.error);
    else toast.success(toggleTarget.active ? "Combo desactivado." : "Combo activado.");
    setToggleTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nuevo combo
        </Button>
      </div>

      {combos.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No hay combos creados"
          description="Crea paquetes de productos con precio especial para venderlos en el POS."
          action={
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Nuevo combo
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => {
            const normalPrice = combo.items.reduce((a, i) => a + i.unitPrice * i.quantity, 0);
            const savings = normalPrice - combo.price;
            return (
              <Card key={combo.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold">{combo.name}</p>
                    <Badge variant={combo.active ? "default" : "secondary"}>
                      {combo.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {combo.items.map((item) => (
                      <li key={item.productId}>
                        {item.quantity}x {item.productName}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-primary">
                      {formatCurrency(combo.price)}
                    </span>
                    {savings > 0 && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatCurrency(normalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditing(combo);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setToggleTarget(combo)}>
                      <Power className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ComboFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        products={products}
      />

      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.active ? "¿Desactivar combo?" : "¿Activar combo?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.active
                ? `"${toggleTarget?.name}" no aparecerá en el POS.`
                : `"${toggleTarget?.name}" volverá a estar disponible en el POS.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ComboFormDialog({
  open,
  onOpenChange,
  editing,
  products,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ComboRow | null;
  products: ProductOption[];
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState(0);
  const [items, setItems] = React.useState<DraftItem[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
      setPrice(editing?.price ?? 0);
      setItems(
        editing?.items.map((i) => ({ productId: i.productId, quantity: i.quantity })) ?? []
      );
    }
  }, [open, editing]);

  function addItem() {
    if (products.length === 0) return;
    setItems((prev) => [...prev, { productId: products[0].id, quantity: 1 }]);
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!name.trim() || price <= 0 || items.length < 2) {
      toast.error("Completa el nombre, precio y al menos 2 productos.");
      return;
    }
    setIsSubmitting(true);
    const values = { name, description, price, items };
    const result = editing ? await updateCombo(editing.id, values) : await createCombo(values);
    setIsSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Combo actualizado." : "Combo creado.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar combo" : "Nuevo combo"}</DialogTitle>
          <DialogDescription>
            Ej: Combo Reunión = 1 Whisky + 1 Gaseosa + 1 Bolsa de hielo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <Input
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Combo Reunión"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descripción (opcional)</label>
            <Textarea
              className="mt-1.5"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Precio del combo (S/)</label>
            <Input
              className="mt-1.5"
              type="number"
              step="0.01"
              min="0"
              value={price || ""}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Productos incluidos</label>
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
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {editing ? "Guardar cambios" : "Crear combo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
