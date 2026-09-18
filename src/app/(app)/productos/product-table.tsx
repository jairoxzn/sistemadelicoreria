"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Power,
  Package,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageUploadField } from "@/components/shared/image-upload-field";
import { formatCurrency } from "@/lib/format";
import {
  productSchema,
  type ProductValues,
  type ProductFormInput,
} from "@/validations/product";
import { createProduct, updateProduct, toggleProductActive, uploadProductImage } from "./actions";

type ProductRow = {
  id: string;
  internalCode: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  brandId: string | null;
  brandName: string | null;
  presentation: string | null;
  content: string | null;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice: number | null;
  promoPrice: number | null;
  stockMin: number;
  supplierId: string | null;
  imageUrl: string | null;
  status: "ACTIVO" | "INACTIVO";
  stock: number;
};

type Option = { id: string; name: string };

export function ProductTable({
  products,
  categories,
  brands,
  suppliers,
  total,
  page,
  pageSize,
  filters,
}: {
  products: ProductRow[];
  categories: Option[];
  brands: Option[];
  suppliers: Option[];
  total: number;
  page: number;
  pageSize: number;
  filters: { q: string; categoria: string; estado: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(filters.q);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ProductRow | null>(null);
  const [toggleTarget, setToggleTarget] = React.useState<ProductRow | null>(null);

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

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(product: ProductRow) {
    setEditing(product);
    setDialogOpen(true);
  }

  async function handleToggle() {
    if (!toggleTarget) return;
    const result = await toggleProductActive(toggleTarget.id, toggleTarget.status === "INACTIVO");
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(
        toggleTarget.status === "ACTIVO" ? "Producto desactivado." : "Producto activado."
      );
    }
    setToggleTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o código de barras..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={filters.categoria || "all"}
            onValueChange={(v) => updateParams({ categoria: v === "all" ? "" : v })}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.estado || "all"}
            onValueChange={(v) => updateParams({ estado: v === "all" ? "" : v })}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="size-4" />
          Nuevo producto
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No se encontraron productos"
          description="Ajusta los filtros o crea un nuevo producto."
          action={
            <Button onClick={openCreate} variant="outline">
              <Plus className="size-4" />
              Nuevo producto
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead className="hidden lg:table-cell">Precio compra</TableHead>
                  <TableHead>Precio venta</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.internalCode}
                        {product.brandName ? ` · ${product.brandName}` : ""}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{product.categoryName}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatCurrency(product.purchasePrice)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(product.salePrice)}
                    </TableCell>
                    <TableCell>
                      <StockBadge stock={product.stock} stockMin={product.stockMin} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === "ACTIVO" ? "default" : "secondary"}>
                        {product.status === "ACTIVO" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(product)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setToggleTarget(product)}
                        >
                          <Power className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              {total} producto{total === 1 ? "" : "s"} · Página {page} de {totalPages}
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

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        categories={categories}
        brands={brands}
        suppliers={suppliers}
      />

      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.status === "ACTIVO" ? "¿Desactivar producto?" : "¿Activar producto?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.status === "ACTIVO"
                ? `"${toggleTarget?.name}" no estará disponible para venta en el POS.`
                : `"${toggleTarget?.name}" volverá a estar disponible para venta.`}
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

function StockBadge({ stock, stockMin }: { stock: number; stockMin: number }) {
  if (stock <= 0) {
    return <Badge variant="destructive">Agotado</Badge>;
  }
  if (stock <= stockMin) {
    return (
      <Badge className="border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400">
        {stock} · Bajo
      </Badge>
    );
  }
  return <Badge variant="secondary">{stock}</Badge>;
}

function ProductFormDialog({
  open,
  onOpenChange,
  editing,
  categories,
  brands,
  suppliers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ProductRow | null;
  categories: Option[];
  brands: Option[];
  suppliers: Option[];
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<ProductFormInput, unknown, ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: emptyValues(),
  });

  React.useEffect(() => {
    if (open) {
      form.reset(editing ? editingToValues(editing) : emptyValues());
    }
  }, [open, editing, form]);

  async function onSubmit(values: ProductValues) {
    setIsSubmitting(true);
    const result = editing
      ? await updateProduct(editing.id, values)
      : await createProduct(values);
    setIsSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success(editing ? "Producto actualizado." : "Producto creado.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            Completa la información del producto para el catálogo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Cusqueña Dorada 620ml" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="internalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código interno</FormLabel>
                    <FormControl>
                      <Input placeholder="P0016" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de barras</FormLabel>
                    <FormControl>
                      <Input placeholder="7751271016" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca (opcional)</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sin marca" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin marca</SelectItem>
                        {brands.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="presentation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presentación</FormLabel>
                    <FormControl>
                      <Input placeholder="Botella, Lata..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenido</FormLabel>
                    <FormControl>
                      <Input placeholder="750 ml" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <FormControl>
                      <Input placeholder="UNIDAD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor (opcional)</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sin proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin proveedor</SelectItem>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio de compra (S/)</FormLabel>
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
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio de venta (S/)</FormLabel>
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
                name="wholesalePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio mayorista (opcional)</FormLabel>
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
                name="promoPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio promocional (opcional)</FormLabel>
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
                name="stockMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock mínimo</FormLabel>
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
              {!editing && (
                <FormField
                  control={form.control}
                  name="initialStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock inicial</FormLabel>
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
              )}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Imagen del producto (opcional)</FormLabel>
                    <FormControl>
                      <ImageUploadField
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        uploadAction={uploadProductImage}
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
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Descripción (opcional)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {editing ? "Guardar cambios" : "Crear producto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function emptyValues(): ProductFormInput {
  return {
    internalCode: "",
    barcode: "",
    name: "",
    description: "",
    categoryId: "",
    brandId: "",
    presentation: "",
    content: "",
    unit: "UNIDAD",
    purchasePrice: 0,
    salePrice: 0,
    wholesalePrice: null,
    promoPrice: null,
    stockMin: 5,
    supplierId: "",
    imageUrl: "",
    initialStock: 0,
  };
}

function editingToValues(product: ProductRow): ProductFormInput {
  return {
    internalCode: product.internalCode,
    barcode: product.barcode ?? "",
    name: product.name,
    description: product.description ?? "",
    categoryId: product.categoryId,
    brandId: product.brandId ?? "",
    presentation: product.presentation ?? "",
    content: product.content ?? "",
    unit: product.unit,
    purchasePrice: product.purchasePrice,
    salePrice: product.salePrice,
    wholesalePrice: product.wholesalePrice,
    promoPrice: product.promoPrice,
    stockMin: product.stockMin,
    supplierId: product.supplierId ?? "",
    imageUrl: product.imageUrl ?? "",
  };
}
