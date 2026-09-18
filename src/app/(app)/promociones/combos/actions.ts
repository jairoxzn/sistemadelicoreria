"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";
import { comboSchema, type ComboValues } from "@/validations/combo";
import type { ActionResult } from "@/lib/action-result";

const EDITORS = [Role.ADMINISTRADOR];

export async function createCombo(values: ComboValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = comboSchema.parse(values);

  const combo = await prisma.combo.create({
    data: {
      name: parsed.name,
      description: parsed.description || null,
      price: parsed.price,
      items: {
        create: parsed.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    },
  });

  await logAudit({
    userId: user.id,
    action: "CREAR",
    module: "COMBOS",
    entityId: combo.id,
    newData: combo,
    description: `${user.name} creó el combo "${combo.name}"`,
  });

  revalidatePath("/promociones/combos");
  revalidatePath("/pos");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function updateCombo(id: string, values: ComboValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = comboSchema.parse(values);

  const before = await prisma.combo.findUnique({ where: { id } });
  if (!before) return { error: "El combo no existe." };

  const combo = await prisma.$transaction(async (tx) => {
    await tx.comboItem.deleteMany({ where: { comboId: id } });
    return tx.combo.update({
      where: { id },
      data: {
        name: parsed.name,
        description: parsed.description || null,
        price: parsed.price,
        items: {
          create: parsed.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
    });
  });

  await logAudit({
    userId: user.id,
    action: "ACTUALIZAR",
    module: "COMBOS",
    entityId: combo.id,
    oldData: before,
    newData: combo,
    description: `${user.name} actualizó el combo "${combo.name}"`,
  });

  revalidatePath("/promociones/combos");
  revalidatePath("/pos");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function toggleComboActive(id: string, active: boolean): Promise<ActionResult> {
  const user = await requireRole(EDITORS);

  const combo = await prisma.combo.update({ where: { id }, data: { active } });

  await logAudit({
    userId: user.id,
    action: active ? "ACTIVAR" : "DESACTIVAR",
    module: "COMBOS",
    entityId: combo.id,
    newData: combo,
    description: `${user.name} ${active ? "activó" : "desactivó"} el combo "${combo.name}"`,
  });

  revalidatePath("/promociones/combos");
  revalidatePath("/pos");
  revalidatePath("/catalogo");
  return { success: true };
}
