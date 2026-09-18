"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Search, Pencil, Power, Users } from "lucide-react";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  customerSchema,
  type CustomerValues,
  type CustomerFormInput,
} from "@/validations/customer";
import { createCustomer, updateCustomer, toggleCustomerActive } from "./actions";

type CustomerRow = {
  id: string;
  name: string;
  documentType: "DNI" | "RUC" | "NONE";
  documentNumber: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  email: string | null;
  active: boolean;
  totalPurchased: number;
  lastPurchaseAt: string | null;
  salesCount: number;
};

export function CustomerTable({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CustomerRow | null>(null);
  const [toggleTarget, setToggleTarget] = React.useState<CustomerRow | null>(null);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.documentNumber?.includes(q);
  });

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(customer: CustomerRow) {
    setEditing(customer);
    setDialogOpen(true);
  }

  async function handleToggle() {
    if (!toggleTarget) return;
    const result = await toggleCustomerActive(toggleTarget.id, !toggleTarget.active);
    if (result?.error) toast.error(result.error);
    else toast.success(toggleTarget.active ? "Cliente desactivado." : "Cliente activado.");
    setToggleTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o documento..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nuevo cliente
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No se encontraron clientes"
          action={
            <Button onClick={openCreate} variant="outline">
              <Plus className="size-4" />
              Nuevo cliente
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Documento</TableHead>
                <TableHead className="hidden lg:table-cell">Contacto</TableHead>
                <TableHead>Total comprado</TableHead>
                <TableHead className="hidden sm:table-cell">Última compra</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {customer.documentNumber
                      ? `${customer.documentType} ${customer.documentNumber}`
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {customer.phone || "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(customer.totalPurchased)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({customer.salesCount})
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {customer.lastPurchaseAt ? formatDate(customer.lastPurchaseAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.active ? "default" : "secondary"}>
                      {customer.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(customer)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setToggleTarget(customer)}
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
      )}

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.active ? "¿Desactivar cliente?" : "¿Activar cliente?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.active
                ? `"${toggleTarget?.name}" no aparecerá en el buscador de clientes del POS.`
                : `"${toggleTarget?.name}" volverá a estar disponible.`}
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

function CustomerFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CustomerRow | null;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<CustomerFormInput, unknown, CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      documentType: "NONE",
      documentNumber: "",
      phone: "",
      whatsapp: "",
      address: "",
      email: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: editing?.name ?? "",
        documentType: editing?.documentType ?? "NONE",
        documentNumber: editing?.documentNumber ?? "",
        phone: editing?.phone ?? "",
        whatsapp: editing?.whatsapp ?? "",
        address: editing?.address ?? "",
        email: editing?.email ?? "",
      });
    }
  }, [open, editing, form]);

  async function onSubmit(values: CustomerValues) {
    setIsSubmitting(true);
    const result = editing
      ? await updateCustomer(editing.id, values)
      : await createCustomer(values);
    setIsSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success(editing ? "Cliente actualizado." : "Cliente creado.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          <DialogDescription>Datos de contacto del cliente.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de documento</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">Sin documento</SelectItem>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="RUC">RUC</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de documento</FormLabel>
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
                  <FormItem>
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
                {editing ? "Guardar cambios" : "Crear cliente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
