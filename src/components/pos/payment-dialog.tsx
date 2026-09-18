"use client";

import * as React from "react";
import { Banknote, CreditCard, Smartphone, ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { cn } from "cn";

export type PaymentMethodKey = "EFECTIVO" | "YAPE" | "PLIN" | "TARJETA" | "TRANSFERENCIA";

export type PaymentLine = {
  method: PaymentMethodKey;
  amount: number;
  receivedAmount?: number;
};

const METHODS: { key: PaymentMethodKey; label: string; icon: typeof Banknote }[] = [
  { key: "EFECTIVO", label: "Efectivo", icon: Banknote },
  { key: "YAPE", label: "Yape", icon: Smartphone },
  { key: "PLIN", label: "Plin", icon: Smartphone },
  { key: "TARJETA", label: "Tarjeta", icon: CreditCard },
  { key: "TRANSFERENCIA", label: "Transferencia", icon: ArrowLeftRight },
];

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (payments: PaymentLine[]) => void;
  isSubmitting: boolean;
}) {
  const [mixed, setMixed] = React.useState(false);
  const [singleMethod, setSingleMethod] = React.useState<PaymentMethodKey>("EFECTIVO");
  const [received, setReceived] = React.useState<string>("");
  const [lines, setLines] = React.useState<PaymentLine[]>([]);

  React.useEffect(() => {
    if (open) {
      setMixed(false);
      setSingleMethod("EFECTIVO");
      setReceived(total.toFixed(2));
      setLines([{ method: "EFECTIVO", amount: total }]);
    }
  }, [open, total]);

  function selectSingleMethod(method: PaymentMethodKey) {
    setSingleMethod(method);
    if (method === "EFECTIVO") {
      setReceived(total.toFixed(2));
    }
  }

  const receivedNum = Number(received) || 0;
  const change = Math.max(0, receivedNum - total);

  function addMixedLine() {
    setLines((prev) => [...prev, { method: "EFECTIVO", amount: 0 }]);
  }

  function updateMixedLine(index: number, patch: Partial<PaymentLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeMixedLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const mixedTotal = Math.round(lines.reduce((a, l) => a + (Number(l.amount) || 0), 0) * 100) / 100;
  const mixedValid = Math.abs(mixedTotal - total) < 0.01;

  function handleConfirm() {
    if (mixed) {
      if (!mixedValid) return;
      onConfirm(lines.map((l) => ({ ...l, amount: Number(l.amount) || 0 })));
    } else {
      if (singleMethod === "EFECTIVO" && receivedNum < total) return;
      onConfirm([
        {
          method: singleMethod,
          amount: total,
          receivedAmount: singleMethod === "EFECTIVO" ? receivedNum : undefined,
        },
      ]);
    }
  }

  const canConfirm = mixed
    ? mixedValid
    : singleMethod !== "EFECTIVO" || receivedNum >= total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cobrar venta</DialogTitle>
          <DialogDescription>Total a pagar: {formatCurrency(total)}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Método de pago</span>
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setMixed((v) => !v)}>
            {mixed ? "Usar un solo método" : "Pago mixto"}
          </Button>
        </div>

        {!mixed ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => selectSingleMethod(m.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-xs font-medium transition-colors hover:bg-muted",
                    singleMethod === m.key && "border-primary bg-primary/10 text-primary"
                  )}
                >
                  <m.icon className="size-5" />
                  {m.label}
                </button>
              ))}
            </div>

            {singleMethod === "EFECTIVO" && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <label className="text-sm font-medium">Monto recibido (S/)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  autoFocus
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                />
                {receivedNum < total ? (
                  <p className="text-sm text-destructive">El monto recibido es insuficiente.</p>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vuelto</span>
                    <span className="font-semibold">{formatCurrency(change)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={line.method}
                  onValueChange={(v) => updateMixedLine(i, { method: v as PaymentMethodKey })}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m.key} value={m.key}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="flex-1"
                  value={line.amount || ""}
                  onChange={(e) => updateMixedLine(i, { amount: Number(e.target.value) || 0 })}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeMixedLine(i)}
                  disabled={lines.length <= 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addMixedLine}>
              <Plus className="size-4" />
              Agregar método
            </Button>
            <div className="flex justify-between border-t border-border pt-2 text-sm">
              <span className="text-muted-foreground">Suma de pagos</span>
              <span className={cn("font-semibold", !mixedValid && "text-destructive")}>
                {formatCurrency(mixedTotal)}
              </span>
            </div>
            {!mixedValid && (
              <p className="text-sm text-destructive">
                La suma de los pagos debe ser igual al total ({formatCurrency(total)}).
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={!canConfirm || isSubmitting} className="w-full">
            {isSubmitting ? "Procesando..." : `Confirmar pago · ${formatCurrency(total)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
