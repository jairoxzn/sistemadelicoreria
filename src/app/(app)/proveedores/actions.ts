"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";
import { supplierSchema, type SupplierValues } from "@/validations/supplier";
import type { ActionResult } from "@/lib/action-result";

const EDITORS = [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.ALMACENERO];

function clean(values: SupplierValues) {
  return {
    businessName: values.businessName,
    tradeName: values.tradeName || null,
    ruc: values.ruc || null,
    contactName: values.contactName || null,
    phone: values.phone || null,
    whatsapp: values.whatsapp || null,
    address: values.address || null,
    email: values.email || null,
  };
}

export async function createSupplier(values: SupplierValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = supplierSchema.parse(values);

  if (parsed.ruc) {
    const existing = await prisma.supplier.findUnique({ where: { ruc: parsed.ruc } });
    if (existing) return { error: "Ya existe un proveedor registrado con ese RUC." };
  }

  const supplier = await prisma.supplier.create({ data: clean(parsed) });

  await logAudit({
    userId: user.id,
    action: "CREAR",
    module: "PROVEEDORES",
    entityId: supplier.id,
    newData: supplier,
    description: `${user.name} creó el proveedor "${supplier.businessName}"`,
  });

  revalidatePath("/proveedores");
  return { success: true };
}

export async function updateSupplier(id: string, values: SupplierValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = supplierSchema.parse(values);

  if (parsed.ruc) {
    const existing = await prisma.supplier.findFirst({ where: { ruc: parsed.ruc, NOT: { id } } });
    if (existing) return { error: "Ya existe un proveedor registrado con ese RUC." };
  }

  const before = await prisma.supplier.findUnique({ where: { id } });
  const supplier = await prisma.supplier.update({ where: { id }, data: clean(parsed) });

  await logAudit({
    userId: user.id,
    action: "ACTUALIZAR",
    module: "PROVEEDORES",
    entityId: supplier.id,
    oldData: before ?? undefined,
    newData: supplier,
    description: `${user.name} actualizó el proveedor "${supplier.businessName}"`,
  });

  revalidatePath("/proveedores");
  return { success: true };
}

export async function toggleSupplierActive(id: string, active: boolean): Promise<ActionResult> {
  const user = await requireRole(EDITORS);

  const supplier = await prisma.supplier.update({ where: { id }, data: { active } });

  await logAudit({
    userId: user.id,
    action: active ? "ACTIVAR" : "DESACTIVAR",
    module: "PROVEEDORES",
    entityId: supplier.id,
    newData: supplier,
    description: `${user.name} ${active ? "activó" : "desactivó"} el proveedor "${supplier.businessName}"`,
  });

  revalidatePath("/proveedores");
  return { success: true };
}
