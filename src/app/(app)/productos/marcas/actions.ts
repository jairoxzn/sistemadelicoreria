"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";
import { brandSchema, type BrandValues } from "@/validations/brand";
import type { ActionResult } from "@/lib/action-result";

const EDITORS = [Role.ADMINISTRADOR, Role.ALMACENERO];

export async function createBrand(values: BrandValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = brandSchema.parse(values);

  const existing = await prisma.brand.findUnique({ where: { name: parsed.name } });
  if (existing) {
    return { error: "Ya existe una marca con ese nombre." };
  }

  const brand = await prisma.brand.create({
    data: { name: parsed.name, description: parsed.description || null },
  });

  await logAudit({
    userId: user.id,
    action: "CREAR",
    module: "MARCAS",
    entityId: brand.id,
    newData: brand,
    description: `${user.name} creó la marca "${brand.name}"`,
  });

  revalidatePath("/productos/marcas");
  return { success: true };
}

export async function updateBrand(id: string, values: BrandValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = brandSchema.parse(values);

  const existing = await prisma.brand.findFirst({ where: { name: parsed.name, NOT: { id } } });
  if (existing) {
    return { error: "Ya existe una marca con ese nombre." };
  }

  const before = await prisma.brand.findUnique({ where: { id } });
  const brand = await prisma.brand.update({
    where: { id },
    data: { name: parsed.name, description: parsed.description || null },
  });

  await logAudit({
    userId: user.id,
    action: "ACTUALIZAR",
    module: "MARCAS",
    entityId: brand.id,
    oldData: before ?? undefined,
    newData: brand,
    description: `${user.name} actualizó la marca "${brand.name}"`,
  });

  revalidatePath("/productos/marcas");
  return { success: true };
}

export async function toggleBrandActive(id: string, active: boolean): Promise<ActionResult> {
  const user = await requireRole(EDITORS);

  const brand = await prisma.brand.update({ where: { id }, data: { active } });

  await logAudit({
    userId: user.id,
    action: active ? "ACTIVAR" : "DESACTIVAR",
    module: "MARCAS",
    entityId: brand.id,
    newData: brand,
    description: `${user.name} ${active ? "activó" : "desactivó"} la marca "${brand.name}"`,
  });

  revalidatePath("/productos/marcas");
  return { success: true };
}
