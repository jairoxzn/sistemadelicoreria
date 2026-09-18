"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Search, Pencil, Power, Award } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { brandSchema, type BrandValues } from "@/validations/brand";
import { createBrand, updateBrand, toggleBrandActive } from "./actions";

type BrandRow = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  productCount: number;
};

export function BrandTable({ brands }: { brands: BrandRow[] }) {
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BrandRow | null>(null);
  const [toggleTarget, setToggleTarget] = React.useState<BrandRow | null>(null);

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(brand: BrandRow) {
    setEditing(brand);
    setDialogOpen(true);
  }

  async function handleToggle() {
    if (!toggleTarget) return;
    const result = await toggleBrandActive(toggleTarget.id, !toggleTarget.active);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(toggleTarget.active ? "Marca desactivada correctamente." : "Marca activada correctamente.");
    }
    setToggleTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar marca..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nueva marca
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No se encontraron marcas"
          description="Crea tu primera marca para asociarla a tus productos."
          action={
            <Button onClick={openCreate} variant="outline">
              <Plus className="size-4" />
              Nueva marca
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                    {brand.description || "—"}
                  </TableCell>
                  <TableCell>{brand.productCount}</TableCell>
                  <TableCell>
                    <Badge variant={brand.active ? "default" : "secondary"}>
                      {brand.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(brand)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setToggleTarget(brand)}>
                        <Power className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <BrandFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.active ? "¿Desactivar marca?" : "¿Activar marca?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.active
                ? `La marca "${toggleTarget?.name}" no aparecerá en los formularios de nuevos productos.`
                : `La marca "${toggleTarget?.name}" volverá a estar disponible.`}
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

function BrandFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: BrandRow | null;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<BrandValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: "", description: "" },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ name: editing?.name ?? "", description: editing?.description ?? "" });
    }
  }, [open, editing, form]);

  async function onSubmit(values: BrandValues) {
    setIsSubmitting(true);
    const result = editing ? await updateBrand(editing.id, values) : await createBrand(values);
    setIsSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success(editing ? "Marca actualizada." : "Marca creada.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar marca" : "Nueva marca"}</DialogTitle>
          <DialogDescription>
            {editing ? "Actualiza los datos de la marca." : "Completa los datos para crear una nueva marca."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Cusqueña" {...field} />
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
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {editing ? "Guardar cambios" : "Crear marca"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
