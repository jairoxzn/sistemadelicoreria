"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";
import { categorySchema, type CategoryValues } from "@/validations/category";
import type { ActionResult } from "@/lib/action-result";

const EDITORS = [Role.ADMINISTRADOR, Role.ALMACENERO];

export async function createCategory(values: CategoryValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = categorySchema.parse(values);

  const existing = await prisma.category.findUnique({ where: { name: parsed.name } });
  if (existing) {
    return { error: "Ya existe una categoría con ese nombre." };
  }

  const category = await prisma.category.create({
    data: { name: parsed.name, description: parsed.description || null },
  });

  await logAudit({
    userId: user.id,
    action: "CREAR",
    module: "CATEGORIAS",
    entityId: category.id,
    newData: category,
    description: `${user.name} creó la categoría "${category.name}"`,
  });

  revalidatePath("/productos/categorias");
  return { success: true };
}

export async function updateCategory(id: string, values: CategoryValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = categorySchema.parse(values);

  const existing = await prisma.category.findFirst({
    where: { name: parsed.name, NOT: { id } },
  });
  if (existing) {
    return { error: "Ya existe una categoría con ese nombre." };
  }

  const before = await prisma.category.findUnique({ where: { id } });
  const category = await prisma.category.update({
    where: { id },
    data: { name: parsed.name, description: parsed.description || null },
  });

  await logAudit({
    userId: user.id,
    action: "ACTUALIZAR",
    module: "CATEGORIAS",
    entityId: category.id,
    oldData: before ?? undefined,
    newData: category,
    description: `${user.name} actualizó la categoría "${category.name}"`,
  });

  revalidatePath("/productos/categorias");
  return { success: true };
}

export async function toggleCategoryActive(id: string, active: boolean): Promise<ActionResult> {
  const user = await requireRole(EDITORS);

  const category = await prisma.category.update({
    where: { id },
    data: { active },
  });

  await logAudit({
    userId: user.id,
    action: active ? "ACTIVAR" : "DESACTIVAR",
    module: "CATEGORIAS",
    entityId: category.id,
    newData: category,
    description: `${user.name} ${active ? "activó" : "desactivó"} la categoría "${category.name}"`,
  });

  revalidatePath("/productos/categorias");
  return { success: true };
}
