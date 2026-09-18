"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";
import { customerSchema, type CustomerValues } from "@/validations/customer";
import type { ActionResult } from "@/lib/action-result";

const EDITORS = [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.CAJERO];

function clean(values: CustomerValues) {
  return {
    name: values.name.trim(),
    documentType: values.documentType === "NONE" ? null : values.documentType,
    documentNumber: values.documentNumber || null,
    phone: values.phone || null,
    whatsapp: values.whatsapp || null,
    address: values.address || null,
    email: values.email || null,
  };
}

export async function createCustomer(values: CustomerValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = customerSchema.parse(values);

  if (parsed.documentNumber) {
    const existing = await prisma.customer.findUnique({
      where: { documentNumber: parsed.documentNumber },
    });
    if (existing) return { error: "Ya existe un cliente con ese número de documento." };
  }

  const customer = await prisma.customer.create({ data: clean(parsed) });

  await logAudit({
    userId: user.id,
    action: "CREAR",
    module: "CLIENTES",
    entityId: customer.id,
    newData: customer,
    description: `${user.name} creó el cliente "${customer.name}"`,
  });

  revalidatePath("/clientes");
  return { success: true };
}

export async function updateCustomer(id: string, values: CustomerValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = customerSchema.parse(values);

  if (parsed.documentNumber) {
    const existing = await prisma.customer.findFirst({
      where: { documentNumber: parsed.documentNumber, NOT: { id } },
    });
    if (existing) return { error: "Ya existe un cliente con ese número de documento." };
  }

  const before = await prisma.customer.findUnique({ where: { id } });
  const customer = await prisma.customer.update({ where: { id }, data: clean(parsed) });

  await logAudit({
    userId: user.id,
    action: "ACTUALIZAR",
    module: "CLIENTES",
    entityId: customer.id,
    oldData: before ?? undefined,
    newData: customer,
    description: `${user.name} actualizó el cliente "${customer.name}"`,
  });

  revalidatePath("/clientes");
  return { success: true };
}

export async function toggleCustomerActive(id: string, active: boolean): Promise<ActionResult> {
  const user = await requireRole(EDITORS);

  const customer = await prisma.customer.update({ where: { id }, data: { active } });

  await logAudit({
    userId: user.id,
    action: active ? "ACTIVAR" : "DESACTIVAR",
    module: "CLIENTES",
    entityId: customer.id,
    newData: customer,
    description: `${user.name} ${active ? "activó" : "desactivó"} el cliente "${customer.name}"`,
  });

  revalidatePath("/clientes");
  return { success: true };
}
