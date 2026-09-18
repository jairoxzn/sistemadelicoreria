"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { saveUploadedImage } from "@/lib/uploads";
import { Role } from "@/generated/prisma/enums";
import { businessConfigSchema, type BusinessConfigValues } from "@/validations/business-config";
import type { ActionResult } from "@/lib/action-result";

export async function uploadBusinessLogo(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  await requireRole([Role.ADMINISTRADOR]);
  return saveUploadedImage(formData, "negocio");
}

export async function uploadBusinessBanner(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  await requireRole([Role.ADMINISTRADOR]);
  return saveUploadedImage(formData, "negocio");
}

export async function updateBusinessConfig(values: BusinessConfigValues): Promise<ActionResult> {
  const user = await requireRole([Role.ADMINISTRADOR]);
  const parsed = businessConfigSchema.parse(values);

  const existing = await prisma.businessConfig.findFirst();

  const data = {
    tradeName: parsed.tradeName,
    businessName: parsed.businessName || null,
    ruc: parsed.ruc || null,
    address: parsed.address || null,
    phone: parsed.phone || null,
    whatsapp: parsed.whatsapp || null,
    logoUrl: parsed.logoUrl || null,
    bannerUrl: parsed.bannerUrl || null,
    igvPercent: parsed.igvPercent,
    ticketFooter: parsed.ticketFooter || null,
  };

  const config = existing
    ? await prisma.businessConfig.update({ where: { id: existing.id }, data })
    : await prisma.businessConfig.create({ data });

  await logAudit({
    userId: user.id,
    action: "ACTUALIZAR",
    module: "CONFIGURACION",
    entityId: config.id,
    newData: config,
    description: `${user.name} actualizó la configuración del negocio`,
  });

  revalidatePath("/configuracion");
  revalidatePath("/pos");
  revalidatePath("/catalogo");
  return { success: true };
}
