"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Wallet, Receipt, Lock, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/format";
import {
  openCashRegisterSchema,
  closeCashRegisterSchema,
  cashMovementSchema,
  type OpenCashRegisterValues,
  type OpenCashRegisterInput,
  type CloseCashRegisterValues,
  type CloseCashRegisterInput,
  type CashMovementValues,
  type CashMovementInput,
} from "@/validations/cash-register";
import { openCashRegister, createCashMovement, closeCashRegister } from "./actions";

type Movement = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  userName: string;
  createdAt: string;
};

type OpenRegister = {
  id: string;
  openingAmount: number;
  openedAt: string;
  userName: string;
  cashSalesTotal: number;
  totalSalesTotal: number;
  salesCount: number;
  movements: Movement[];
};

type HistoryRow = {
  id: string;
  openingAmount: number;
  expectedAmount: number;
  countedAmount: number;
  difference: number;
  openedAt: string;
  closedAt: string | null;
  userName: string;
};

const MOVEMENT_LABELS: Record<string, string> = {
  INGRESO: "Ingreso",
  RETIRO: "Retiro",
  GASTO: "Gasto",
  DEVOLUCION: "Devolución",
};

export function CajaPanel({
  openRegister,
  history,
}: {
  openRegister: OpenRegister | null;
  history: HistoryRow[];
}) {
  const [movementOpen, setMovementOpen] = React.useState(false);
  const [closeOpen, setCloseOpen] = React.useState(false);

  const ingresos = openRegister?.movements.filter((m) => m.type === "INGRESO") ?? [];
  const retiros = openRegister?.movements.filter((m) => m.type === "RETIRO") ?? [];
  const gastos = openRegister?.movements.filter((m) => m.type === "GASTO") ?? [];
  const devoluciones = openRegister?.movements.filter((m) => m.type === "DEVOLUCION") ?? [];

  const ingresosTotal = ingresos.reduce((a, m) => a + m.amount, 0);
  const retirosTotal = retiros.reduce((a, m) => a + m.amount, 0);
  const gastosTotal = gastos.reduce((a, m) => a + m.amount, 0);
  const devolucionesTotal = devoluciones.reduce((a, m) => a + m.amount, 0);

  const expected = openRegister
    ? openRegister.openingAmount +
      openRegister.cashSalesTotal +
      ingresosTotal -
      retirosTotal -
      gastosTotal -
      devolucionesTotal
    : 0;

  if (!openRegister) {
    return (
      <div className="space-y-6">
        <OpenRegisterCard />
        <HistorySection history={history} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">Monto inicial</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(openRegister.openingAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">Ventas en efectivo</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(openRegister.cashSalesTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">Total ventas ({openRegister.salesCount})</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(openRegister.totalSalesTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">Efectivo esperado</p>
            <p className="mt-1 text-xl font-semibold text-primary">{formatCurrency(expected)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          Caja abierta · {openRegister.userName} · {formatDateTime(openRegister.openedAt)}
        </Badge>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setMovementOpen(true)}>
            <Wallet className="size-4" />
            Registrar movimiento
          </Button>
          <Button variant="destructive" onClick={() => setCloseOpen(true)}>
            <Lock className="size-4" />
            Cerrar caja
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimientos de la caja</CardTitle>
        </CardHeader>
        <CardContent>
          {openRegister.movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no se registran ingresos, retiros ni gastos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead className="hidden sm:table-cell">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openRegister.movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(m.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{MOVEMENT_LABELS[m.type] ?? m.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(m.amount)}</TableCell>
                    <TableCell className="hidden max-w-xs truncate md:table-cell text-muted-foreground">
                      {m.description || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {m.userName}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <HistorySection history={history} />

      <MovementDialog
        open={movementOpen}
        onOpenChange={setMovementOpen}
        cashRegisterId={openRegister.id}
      />
      <CloseDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        cashRegisterId={openRegister.id}
        expected={expected}
      />
    </div>
  );
}

function OpenRegisterCard() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<OpenCashRegisterInput, unknown, OpenCashRegisterValues>({
    resolver: zodResolver(openCashRegisterSchema),
    defaultValues: { openingAmount: 0 },
  });

  async function onSubmit(values: OpenCashRegisterValues) {
    setIsSubmitting(true);
    const result = await openCashRegister(values);
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Caja abierta correctamente.");
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="size-4 text-primary" />
          Abrir caja
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="openingAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto inicial (S/)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      autoFocus
                      {...field}
                      value={(field.value as number | string | undefined) ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Abrir caja
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function MovementDialog({
  open,
  onOpenChange,
  cashRegisterId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashRegisterId: string;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<CashMovementInput, unknown, CashMovementValues>({
    resolver: zodResolver(cashMovementSchema),
    defaultValues: { type: "INGRESO", amount: 0, description: "" },
  });

  React.useEffect(() => {
    if (open) form.reset({ type: "INGRESO", amount: 0, description: "" });
  }, [open, form]);

  async function onSubmit(values: CashMovementValues) {
    setIsSubmitting(true);
    const result = await createCashMovement(cashRegisterId, values);
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Movimiento registrado.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar movimiento de caja</DialogTitle>
          <DialogDescription>Ingresos, retiros o gastos fuera de una venta.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INGRESO">Ingreso</SelectItem>
                      <SelectItem value="RETIRO">Retiro</SelectItem>
                      <SelectItem value="GASTO">Gasto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto (S/)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      value={(field.value as number | string | undefined) ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CloseDialog({
  open,
  onOpenChange,
  cashRegisterId,
  expected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashRegisterId: string;
  expected: number;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<CloseCashRegisterInput, unknown, CloseCashRegisterValues>({
    resolver: zodResolver(closeCashRegisterSchema),
    defaultValues: { countedAmount: 0, notes: "" },
  });

  const counted = form.watch("countedAmount");
  const difference = (Number(counted) || 0) - expected;

  React.useEffect(() => {
    if (open) form.reset({ countedAmount: 0, notes: "" });
  }, [open, form]);

  async function onSubmit(values: CloseCashRegisterValues) {
    setIsSubmitting(true);
    const result = await closeCashRegister(cashRegisterId, values);
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Caja cerrada correctamente.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar caja</DialogTitle>
          <DialogDescription>
            Cuenta el efectivo físico en caja. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monto esperado</span>
            <span className="font-medium">{formatCurrency(expected)}</span>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="countedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Efectivo contado (S/)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      autoFocus
                      {...field}
                      value={(field.value as number | string | undefined) ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div
              className={
                "rounded-lg px-3 py-2 text-sm font-medium " +
                (difference === 0
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : difference > 0
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive")
              }
            >
              Diferencia: {difference >= 0 ? "+" : ""}
              {formatCurrency(difference)}
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                <Lock className="size-4" />
                Confirmar cierre
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function HistorySection({ history }: { history: HistoryRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4" />
          Historial de cierres
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <EmptyState icon={Receipt} title="Aún no hay cierres de caja registrados." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Inicial</TableHead>
                  <TableHead>Esperado</TableHead>
                  <TableHead>Contado</TableHead>
                  <TableHead>Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {h.closedAt ? formatDate(h.closedAt) : "—"}
                    </TableCell>
                    <TableCell>{h.userName}</TableCell>
                    <TableCell>{formatCurrency(h.openingAmount)}</TableCell>
                    <TableCell>{formatCurrency(h.expectedAmount)}</TableCell>
                    <TableCell>{formatCurrency(h.countedAmount)}</TableCell>
                    <TableCell
                      className={
                        h.difference === 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : h.difference > 0
                            ? "text-primary"
                            : "text-destructive"
                      }
                    >
                      {h.difference >= 0 ? "+" : ""}
                      {formatCurrency(h.difference)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
