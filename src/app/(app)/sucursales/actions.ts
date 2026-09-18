"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";
import { branchSchema, type BranchValues } from "@/validations/branch";
import type { ActionResult } from "@/lib/action-result";

const ONLY_ADMIN = [Role.ADMINISTRADOR];

function clean(values: BranchValues) {
  return {
    name: values.name.trim(),
    address: values.address || null,
    phone: values.phone || null,
  };
}

export async function createBranch(values: BranchValues): Promise<ActionResult> {
  const user = await requireRole(ONLY_ADMIN);
  const parsed = branchSchema.parse(values);

  const branch = await prisma.branch.create({ data: clean(parsed) });

  await logAudit({
    userId: user.id,
    action: "CREAR",
    module: "SUCURSALES",
    entityId: branch.id,
    newData: branch,
    description: `${user.name} creó la sucursal "${branch.name}"`,
  });

  revalidatePath("/sucursales");
  return { success: true };
}

export async function updateBranch(id: string, values: BranchValues): Promise<ActionResult> {
  const user = await requireRole(ONLY_ADMIN);
  const parsed = branchSchema.parse(values);

  const before = await prisma.branch.findUnique({ where: { id } });
  const branch = await prisma.branch.update({ where: { id }, data: clean(parsed) });

  await logAudit({
    userId: user.id,
    action: "ACTUALIZAR",
    module: "SUCURSALES",
    entityId: branch.id,
    oldData: before ?? undefined,
    newData: branch,
    description: `${user.name} actualizó la sucursal "${branch.name}"`,
  });

  revalidatePath("/sucursales");
  return { success: true };
}

export async function toggleBranchActive(id: string, active: boolean): Promise<ActionResult> {
  const user = await requireRole(ONLY_ADMIN);

  const branch = await prisma.branch.update({ where: { id }, data: { active } });

  await logAudit({
    userId: user.id,
    action: active ? "ACTIVAR" : "DESACTIVAR",
    module: "SUCURSALES",
    entityId: branch.id,
    newData: branch,
    description: `${user.name} ${active ? "activó" : "desactivó"} la sucursal "${branch.name}"`,
  });

  revalidatePath("/sucursales");
  return { success: true };
}
