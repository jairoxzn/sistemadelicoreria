"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { saveUploadedImage } from "@/lib/uploads";
import { Role } from "@/generated/prisma/enums";
import { promotionSchema, type PromotionValues } from "@/validations/promotion";
import type { ActionResult } from "@/lib/action-result";

const EDITORS = [Role.ADMINISTRADOR];

export async function uploadPromotionImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  await requireRole(EDITORS);
  return saveUploadedImage(formData, "promociones");
}

function clean(values: PromotionValues) {
  return {
    name: values.name,
    type: values.type,
    discountPercent: values.type === "PORCENTAJE" ? values.discountPercent : null,
    discountAmount: values.type === "MONTO_FIJO" ? values.discountAmount : null,
    promoPrice: values.type === "PRECIO_PROMOCIONAL" ? values.promoPrice : null,
    minQuantity: values.type === "DOS_POR_UNO" ? 2 : (values.minQuantity ?? 1),
    startDate: new Date(`${values.startDate}T00:00:00-05:00`),
    endDate: new Date(`${values.endDate}T23:59:59-05:00`),
    startTime: values.startTime || null,
    endTime: values.endTime || null,
    imageUrl: values.imageUrl || null,
  };
}

export async function createPromotion(values: PromotionValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = promotionSchema.parse(values);

  const promotion = await prisma.promotion.create({
    data: {
      ...clean(parsed),
      items: { create: parsed.productIds.map((productId) => ({ productId })) },
    },
  });

  await logAudit({
    userId: user.id,
    action: "CREAR",
    module: "PROMOCIONES",
    entityId: promotion.id,
    newData: promotion,
    description: `${user.name} creó la promoción "${promotion.name}"`,
  });

  revalidatePath("/promociones");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function updatePromotion(id: string, values: PromotionValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = promotionSchema.parse(values);

  const before = await prisma.promotion.findUnique({ where: { id } });
  if (!before) return { error: "La promoción no existe." };

  const promotion = await prisma.$transaction(async (tx) => {
    await tx.promotionItem.deleteMany({ where: { promotionId: id } });
    return tx.promotion.update({
      where: { id },
      data: {
        ...clean(parsed),
        items: { create: parsed.productIds.map((productId) => ({ productId })) },
      },
    });
  });

  await logAudit({
    userId: user.id,
    action: "ACTUALIZAR",
    module: "PROMOCIONES",
    entityId: promotion.id,
    oldData: before,
    newData: promotion,
    description: `${user.name} actualizó la promoción "${promotion.name}"`,
  });

  revalidatePath("/promociones");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function togglePromotionActive(id: string, active: boolean): Promise<ActionResult> {
  const user = await requireRole(EDITORS);

  const promotion = await prisma.promotion.update({ where: { id }, data: { active } });

  await logAudit({
    userId: user.id,
    action: active ? "ACTIVAR" : "DESACTIVAR",
    module: "PROMOCIONES",
    entityId: promotion.id,
    newData: promotion,
    description: `${user.name} ${active ? "activó" : "desactivó"} la promoción "${promotion.name}"`,
  });

  revalidatePath("/promociones");
  revalidatePath("/catalogo");
  return { success: true };
}
