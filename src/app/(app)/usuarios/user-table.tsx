"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Search, Pencil, Power, UserCog } from "lucide-react";

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
import { ROLE_LABELS } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/enums";
import { createUserSchema, updateUserSchema, type CreateUserValues, type UpdateUserValues } from "@/validations/user";
import { createUser, updateUser, toggleUserActive } from "./actions";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | null;
  branchName: string | null;
  active: boolean;
};

type Option = { id: string; name: string };

export function UserTable({ users, branches }: { users: UserRow[]; branches: Option[] }) {
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<UserRow | null>(null);
  const [toggleTarget, setToggleTarget] = React.useState<UserRow | null>(null);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  async function handleToggle() {
    if (!toggleTarget) return;
    const result = await toggleUserActive(toggleTarget.id, !toggleTarget.active);
    if (result?.error) toast.error(result.error);
    else toast.success(toggleTarget.active ? "Usuario desactivado." : "Usuario activado.");
    setToggleTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o correo..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={UserCog} title="No se encontraron usuarios" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead className="hidden md:table-cell">Rol</TableHead>
                <TableHead className="hidden lg:table-cell">Sucursal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {user.branchName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "default" : "secondary"}>
                      {user.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(user);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setToggleTarget(user)}>
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

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        branches={branches}
      />

      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.active ? "¿Desactivar usuario?" : "¿Activar usuario?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.active
                ? `"${toggleTarget?.name}" no podrá iniciar sesión.`
                : `"${toggleTarget?.name}" podrá iniciar sesión nuevamente.`}
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

function UserFormDialog({
  open,
  onOpenChange,
  editing,
  branches,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: UserRow | null;
  branches: Option[];
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const schema = editing ? updateUserSchema : createUserSchema;
  const form = useForm<CreateUserValues | UpdateUserValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "CAJERO", branchId: "" },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: editing?.name ?? "",
        email: editing?.email ?? "",
        password: "",
        role: editing?.role ?? "CAJERO",
        branchId: editing?.branchId ?? "",
      });
    }
  }, [open, editing, form]);

  async function onSubmit(values: CreateUserValues | UpdateUserValues) {
    setIsSubmitting(true);
    const result = editing
      ? await updateUser(editing.id, values as UpdateUserValues)
      : await createUser(values as CreateUserValues);
    setIsSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Usuario actualizado." : "Usuario creado.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Deja la contraseña en blanco para no cambiarla."
              : "Completa los datos para crear una nueva cuenta."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{editing ? "Nueva contraseña (opcional)" : "Contraseña"}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
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
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((b) => (
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
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {editing ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
