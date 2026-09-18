"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search, Boxes, PackagePlus, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  inventoryMovementSchema,
  type InventoryMovementValues,
  type InventoryMovementFormInput,
} from "@/validations/inventory-movement";
import { createInventoryMovement } from "./actions";

type ProductRow = {
  id: string;
  name: string;
  internalCode: string;
  categoryName: string;
  stock: number;
  stockMin: number;
  purchasePrice: number;
};

type MovementRow = {
  id: string;
  productName: string;
  productCode: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  userName: string;
  createdAt: string;
};

const MOVEMENT_LABELS: Record<string, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  AJUSTE: "Ajuste",
  DEVOLUCION_COMPRA: "Devolución de compra",
  DEVOLUCION_VENTA: "Devolución de venta",
};

export function InventoryTabs({
  products,
  movements,
  totalValue,
}: {
  products: ProductRow[];
  movements: MovementRow[];
  totalValue: number;
}) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<ProductRow | null>(null);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.internalCode.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (statusFilter === "agotado") return p.stock <= 0;
    if (statusFilter === "bajo") return p.stock > 0 && p.stock <= p.stockMin;
    if (statusFilter === "normal") return p.stock > p.stockMin;
    return true;
  });

  function openAdjust(product: ProductRow | null) {
    setSelectedProduct(product);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">Valor total del inventario</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">Productos con stock bajo</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">
              {products.filter((p) => p.stock > 0 && p.stock <= p.stockMin).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">Productos agotados</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-destructive">
              {products.filter((p) => p.stock <= 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          </TabsList>
          <Button onClick={() => openAdjust(null)}>
            <PackagePlus className="size-4" />
            Registrar movimiento
          </Button>
        </div>

        <TabsContent value="stock" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="normal">Stock normal</SelectItem>
                <SelectItem value="bajo">Stock bajo</SelectItem>
                <SelectItem value="agotado">Agotado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Boxes} title="No hay productos que coincidan con el filtro." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="hidden sm:table-cell">Mínimo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden lg:table-cell">Valor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.internalCode}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{p.categoryName}</TableCell>
                      <TableCell className="font-medium tabular-nums">{p.stock}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {p.stockMin}
                      </TableCell>
                      <TableCell>
                        <StockStatusBadge stock={p.stock} stockMin={p.stockMin} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatCurrency(p.stock * p.purchasePrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openAdjust(p)}>
                          <ArrowUpDown className="size-3.5" />
                          Ajustar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="movimientos" className="mt-4">
          {movements.length === 0 ? (
            <EmptyState icon={Boxes} title="Aún no hay movimientos registrados." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cambio</TableHead>
                    <TableHead className="hidden md:table-cell">Motivo</TableHead>
                    <TableHead className="hidden sm:table-cell">Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(m.createdAt)}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{m.productName}</p>
                        <p className="text-xs text-muted-foreground">{m.productCode}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{MOVEMENT_LABELS[m.type] ?? m.type}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {m.previousStock} → {m.newStock}
                      </TableCell>
                      <TableCell className="hidden max-w-xs truncate md:table-cell text-muted-foreground">
                        {m.reason || "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {m.userName}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MovementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        products={products}
        selectedProduct={selectedProduct}
      />
    </div>
  );
}

function StockStatusBadge({ stock, stockMin }: { stock: number; stockMin: number }) {
  if (stock <= 0) {
    return <Badge variant="destructive">Agotado</Badge>;
  }
  if (stock <= stockMin) {
    return (
      <Badge className="border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400">
        Stock bajo
      </Badge>
    );
  }
  return (
    <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
      Normal
    </Badge>
  );
}

function MovementFormDialog({
  open,
  onOpenChange,
  products,
  selectedProduct,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductRow[];
  selectedProduct: ProductRow | null;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<InventoryMovementFormInput, unknown, InventoryMovementValues>({
    resolver: zodResolver(inventoryMovementSchema),
    defaultValues: { productId: "", type: "ENTRADA", quantity: 0, reason: "" },
  });

  const type = form.watch("type");
  const productId = form.watch("productId");
  const currentProduct = products.find((p) => p.id === productId);

  React.useEffect(() => {
    if (open) {
      form.reset({
        productId: selectedProduct?.id ?? "",
        type: "ENTRADA",
        quantity: 0,
        reason: "",
      });
    }
  }, [open, selectedProduct, form]);

  async function onSubmit(values: InventoryMovementValues) {
    setIsSubmitting(true);
    const result = await createInventoryMovement(values);
    setIsSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Movimiento registrado correctamente.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar movimiento de inventario</DialogTitle>
          <DialogDescription>
            Los cambios manuales de stock quedan registrados con el motivo y el usuario.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.internalCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentProduct && (
                    <p className="text-xs text-muted-foreground">
                      Stock actual: {currentProduct.stock}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de movimiento</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ENTRADA">Entrada</SelectItem>
                      <SelectItem value="SALIDA">Salida</SelectItem>
                      <SelectItem value="AJUSTE">Ajuste (fijar stock total)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {type === "AJUSTE" ? "Nuevo stock total" : "Cantidad"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Ej: Conteo físico, producto dañado, corrección de ingreso..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                Registrar movimiento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
