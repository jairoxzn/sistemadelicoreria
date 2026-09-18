"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Gift, Pencil, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { ImageUploadField } from "@/components/shared/image-upload-field";
import { formatDate } from "@/lib/format";
import {
  createPromotion,
  updatePromotion,
  togglePromotionActive,
  uploadPromotionImage,
} from "./actions";

const TYPE_LABELS: Record<string, string> = {
  PORCENTAJE: "% Descuento",
  MONTO_FIJO: "Monto fijo",
  PRECIO_PROMOCIONAL: "Precio promocional",
  DOS_POR_UNO: "2x1",
};

type PromotionRow = {
  id: string;
  name: string;
  type: string;
  discountPercent: number | null;
  discountAmount: number | null;
  promoPrice: number | null;
  minQuantity: number;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  imageUrl: string | null;
  active: boolean;
  productNames: string[];
  productIds: string[];
};
type ProductOption = { id: string; name: string };

function isCurrentlyValid(p: PromotionRow) {
  const now = new Date();
  return p.active && now >= new Date(p.startDate) && now <= new Date(p.endDate);
}

function detailLabel(p: PromotionRow) {
  switch (p.type) {
    case "PORCENTAJE":
      return `${p.discountPercent}% de descuento`;
    case "MONTO_FIJO":
      return `S/ ${p.discountAmount?.toFixed(2)} de descuento`;
    case "PRECIO_PROMOCIONAL":
      return `Precio especial S/ ${p.promoPrice?.toFixed(2)}`;
    case "DOS_POR_UNO":
      return "Lleva 2, paga 1";
    default:
      return "";
  }
}

export function PromotionTable({
  promotions,
  products,
}: {
  promotions: PromotionRow[];
  products: ProductOption[];
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PromotionRow | null>(null);
  const [toggleTarget, setToggleTarget] = React.useState<PromotionRow | null>(null);

  async function handleToggle() {
    if (!toggleTarget) return;
    const result = await togglePromotionActive(toggleTarget.id, !toggleTarget.active);
    if (result?.error) toast.error(result.error);
    else toast.success(toggleTarget.active ? "Promoción desactivada." : "Promoción activada.");
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
          Nueva promoción
        </Button>
      </div>

      {promotions.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No hay promociones creadas"
          action={
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Nueva promoción
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo) => (
            <Card key={promo.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{promo.name}</p>
                    <p className="text-sm text-primary">{detailLabel(promo)}</p>
                  </div>
                  {isCurrentlyValid(promo) ? (
                    <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      Vigente
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{promo.active ? "Programada" : "Inactiva"}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(promo.startDate)} — {formatDate(promo.endDate)}
                  {promo.startTime && promo.endTime && ` · ${promo.startTime}-${promo.endTime}`}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {promo.productNames.join(", ")}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditing(promo);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setToggleTarget(promo)}>
                    <Power className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PromotionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        products={products}
      />

      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.active ? "¿Desactivar promoción?" : "¿Activar promoción?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.active
                ? `"${toggleTarget?.name}" dejará de aplicarse.`
                : `"${toggleTarget?.name}" volverá a estar disponible dentro de su vigencia.`}
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

function PromotionFormDialog({
  open,
  onOpenChange,
  editing,
  products,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: PromotionRow | null;
  products: ProductOption[];
}) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<"PORCENTAJE" | "MONTO_FIJO" | "PRECIO_PROMOCIONAL" | "DOS_POR_UNO">("PORCENTAJE");
  const [discountPercent, setDiscountPercent] = React.useState(10);
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [promoPrice, setPromoPrice] = React.useState(0);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [productIds, setProductIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setType((editing?.type as typeof type) ?? "PORCENTAJE");
      setDiscountPercent(editing?.discountPercent ?? 10);
      setDiscountAmount(editing?.discountAmount ?? 0);
      setPromoPrice(editing?.promoPrice ?? 0);
      setStartDate(editing ? editing.startDate.slice(0, 10) : "");
      setEndDate(editing ? editing.endDate.slice(0, 10) : "");
      setStartTime(editing?.startTime ?? "");
      setEndTime(editing?.endTime ?? "");
      setImageUrl(editing?.imageUrl ?? "");
      setProductIds(editing?.productIds ?? []);
    }
  }, [open, editing]);

  function toggleProduct(id: string, checked: boolean) {
    setProductIds((prev) => (checked ? [...prev, id] : prev.filter((p) => p !== id)));
  }

  async function handleSubmit() {
    if (!name.trim() || !startDate || !endDate || productIds.length === 0) {
      toast.error("Completa el nombre, fechas y al menos un producto.");
      return;
    }
    setIsSubmitting(true);
    const values = {
      name,
      type,
      discountPercent,
      discountAmount,
      promoPrice,
      minQuantity: type === "DOS_POR_UNO" ? 2 : 1,
      startDate,
      endDate,
      startTime,
      endTime,
      imageUrl,
      productIds,
    };
    const result = editing
      ? await updatePromotion(editing.id, values)
      : await createPromotion(values);
    setIsSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Promoción actualizada." : "Promoción creada.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar promoción" : "Nueva promoción"}</DialogTitle>
          <DialogDescription>Configura el descuento y su vigencia.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Tipo de promoción</label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "PORCENTAJE" && (
            <div>
              <label className="text-sm font-medium">Porcentaje de descuento (%)</label>
              <Input
                className="mt-1.5"
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
              />
            </div>
          )}
          {type === "MONTO_FIJO" && (
            <div>
              <label className="text-sm font-medium">Monto fijo de descuento (S/)</label>
              <Input
                className="mt-1.5"
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
              />
            </div>
          )}
          {type === "PRECIO_PROMOCIONAL" && (
            <div>
              <label className="text-sm font-medium">Precio promocional (S/)</label>
              <Input
                className="mt-1.5"
                type="number"
                min="0"
                step="0.01"
                value={promoPrice}
                onChange={(e) => setPromoPrice(Number(e.target.value) || 0)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Fecha inicio</label>
              <Input
                className="mt-1.5"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha fin</label>
              <Input
                className="mt-1.5"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hora inicio (opcional)</label>
              <Input
                className="mt-1.5"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hora fin (opcional)</label>
              <Input
                className="mt-1.5"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Imagen de la promoción (opcional)</label>
            <div className="mt-1.5">
              <ImageUploadField
                value={imageUrl}
                onChange={setImageUrl}
                uploadAction={uploadPromotionImage}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Productos incluidos</label>
            <ScrollArea className="mt-1.5 h-48 rounded-lg border border-border p-2">
              <div className="space-y-1">
                {products.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <Checkbox
                      checked={productIds.includes(p.id)}
                      onCheckedChange={(v) => toggleProduct(p.id, !!v)}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {editing ? "Guardar cambios" : "Crear promoción"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
