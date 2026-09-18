"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Power, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { branchSchema, type BranchValues } from "@/validations/branch";
import { createBranch, updateBranch, toggleBranchActive } from "./actions";

type BranchRow = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isMain: boolean;
  active: boolean;
  userCount: number;
  salesCount: number;
};

export function BranchTable({ branches }: { branches: BranchRow[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BranchRow | null>(null);
  const [toggleTarget, setToggleTarget] = React.useState<BranchRow | null>(null);

  async function handleToggle() {
    if (!toggleTarget) return;
    const result = await toggleBranchActive(toggleTarget.id, !toggleTarget.active);
    if (result?.error) toast.error(result.error);
    else toast.success(toggleTarget.active ? "Sucursal desactivada." : "Sucursal activada.");
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
          Nueva sucursal
        </Button>
      </div>

      {branches.length === 0 ? (
        <EmptyState icon={Store} title="No hay sucursales registradas" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{branch.name}</p>
                    {branch.isMain && (
                      <Badge variant="outline" className="mt-1">
                        Principal
                      </Badge>
                    )}
                  </div>
                  <Badge variant={branch.active ? "default" : "secondary"}>
                    {branch.active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                {branch.address && <p className="text-sm text-muted-foreground">{branch.address}</p>}
                {branch.phone && <p className="text-sm text-muted-foreground">{branch.phone}</p>}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{branch.userCount} usuario(s)</span>
                  <span>{branch.salesCount} venta(s)</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditing(branch);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setToggleTarget(branch)}
                    disabled={branch.isMain}
                  >
                    <Power className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BranchFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.active ? "¿Desactivar sucursal?" : "¿Activar sucursal?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.active
                ? `"${toggleTarget?.name}" dejará de estar disponible para operar.`
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

function BranchFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: BranchRow | null;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<BranchValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: "", address: "", phone: "" },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: editing?.name ?? "",
        address: editing?.address ?? "",
        phone: editing?.phone ?? "",
      });
    }
  }, [open, editing, form]);

  async function onSubmit(values: BranchValues) {
    setIsSubmitting(true);
    const result = editing
      ? await updateBranch(editing.id, values)
      : await createBranch(values);
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Sucursal actualizada." : "Sucursal creada.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar sucursal" : "Nueva sucursal"}</DialogTitle>
          <DialogDescription>Datos de la sede.</DialogDescription>
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
                    <Input placeholder="Ej: Sede Cerro Colorado" {...field} />
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
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {editing ? "Guardar cambios" : "Crear sucursal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
