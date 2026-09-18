"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Search, Pencil, Power, Truck, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { supplierSchema, type SupplierValues } from "@/validations/supplier";
import { createSupplier, updateSupplier, toggleSupplierActive } from "./actions";

type SupplierRow = {
  id: string;
  businessName: string;
  tradeName: string | null;
  ruc: string | null;
  contactName: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  email: string | null;
  active: boolean;
  purchaseCount: number;
  productCount: number;
};

export function SupplierTable({ suppliers }: { suppliers: SupplierRow[] }) {
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SupplierRow | null>(null);
  const [toggleTarget, setToggleTarget] = React.useState<SupplierRow | null>(null);

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.businessName.toLowerCase().includes(q) ||
      s.tradeName?.toLowerCase().includes(q) ||
      s.ruc?.includes(q)
    );
  });

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(supplier: SupplierRow) {
    setEditing(supplier);
    setDialogOpen(true);
  }

  async function handleToggle() {
    if (!toggleTarget) return;
    const result = await toggleSupplierActive(toggleTarget.id, !toggleTarget.active);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(toggleTarget.active ? "Proveedor desactivado." : "Proveedor activado.");
    }
    setToggleTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o RUC..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nuevo proveedor
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No se encontraron proveedores"
          description="Registra tu primer proveedor para empezar a comprar mercadería."
          action={
            <Button onClick={openCreate} variant="outline">
              <Plus className="size-4" />
              Nuevo proveedor
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead className="hidden md:table-cell">RUC</TableHead>
                <TableHead className="hidden lg:table-cell">Contacto</TableHead>
                <TableHead>Compras</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <p className="font-medium">{supplier.businessName}</p>
                    {supplier.tradeName && (
                      <p className="text-xs text-muted-foreground">{supplier.tradeName}</p>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{supplier.ruc || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {supplier.phone ? (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="size-3.5" />
                        {supplier.phone}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{supplier.purchaseCount}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.active ? "default" : "secondary"}>
                      {supplier.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(supplier)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setToggleTarget(supplier)}>
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

      <SupplierFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.active ? "¿Desactivar proveedor?" : "¿Activar proveedor?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.active
                ? `"${toggleTarget?.businessName}" no aparecerá disponible para nuevas compras.`
                : `"${toggleTarget?.businessName}" volverá a estar disponible.`}
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

function SupplierFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: SupplierRow | null;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<SupplierValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      businessName: "",
      tradeName: "",
      ruc: "",
      contactName: "",
      phone: "",
      whatsapp: "",
      address: "",
      email: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        businessName: editing?.businessName ?? "",
        tradeName: editing?.tradeName ?? "",
        ruc: editing?.ruc ?? "",
        contactName: editing?.contactName ?? "",
        phone: editing?.phone ?? "",
        whatsapp: editing?.whatsapp ?? "",
        address: editing?.address ?? "",
        email: editing?.email ?? "",
      });
    }
  }, [open, editing, form]);

  async function onSubmit(values: SupplierValues) {
    setIsSubmitting(true);
    const result = editing
      ? await updateSupplier(editing.id, values)
      : await createSupplier(values);
    setIsSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success(editing ? "Proveedor actualizado." : "Proveedor creado.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
          <DialogDescription>Datos de contacto y facturación del proveedor.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Razón social</FormLabel>
                    <FormControl>
                      <Input placeholder="Distribuidora S.A.C." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tradeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre comercial</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ruc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUC</FormLabel>
                    <FormControl>
                      <Input placeholder="20123456789" maxLength={11} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona de contacto</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {editing ? "Guardar cambios" : "Crear proveedor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
