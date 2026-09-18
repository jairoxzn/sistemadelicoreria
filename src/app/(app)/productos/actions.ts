"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { saveUploadedImage } from "@/lib/uploads";
import { Role } from "@/generated/prisma/enums";
import { InventoryMovementType } from "@/generated/prisma/enums";
import { productSchema, type ProductValues } from "@/validations/product";
import type { ActionResult } from "@/lib/action-result";

const EDITORS = [Role.ADMINISTRADOR, Role.ALMACENERO];

export async function uploadProductImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  await requireRole(EDITORS);
  return saveUploadedImage(formData, "productos");
}

function toDecimalData(parsed: ProductValues) {
  return {
    internalCode: parsed.internalCode.trim(),
    barcode: parsed.barcode || null,
    name: parsed.name.trim(),
    description: parsed.description || null,
    categoryId: parsed.categoryId,
    brandId: parsed.brandId || null,
    presentation: parsed.presentation || null,
    content: parsed.content || null,
    unit: parsed.unit || "UNIDAD",
    purchasePrice: parsed.purchasePrice,
    salePrice: parsed.salePrice,
    wholesalePrice: parsed.wholesalePrice || null,
    promoPrice: parsed.promoPrice || null,
    stockMin: parsed.stockMin ?? 5,
    supplierId: parsed.supplierId || null,
    imageUrl: parsed.imageUrl || null,
  };
}

export async function createProduct(values: ProductValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = productSchema.parse(values);

  const [codeExists, barcodeExists] = await Promise.all([
    prisma.product.findUnique({ where: { internalCode: parsed.internalCode.trim() } }),
    parsed.barcode
      ? prisma.product.findUnique({ where: { barcode: parsed.barcode } })
      : Promise.resolve(null),
  ]);

  if (codeExists) return { error: "Ya existe un producto con ese código interno." };
  if (barcodeExists) return { error: "El código de barras ya está registrado." };

  if (!user.branchId) {
    return { error: "Tu usuario no tiene una sucursal asignada." };
  }

  const initialStock = parsed.initialStock ?? 0;

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data: toDecimalData(parsed) });

    const inventory = await tx.inventory.create({
      data: { productId: product.id, branchId: user.branchId!, stock: initialStock },
    });

    if (initialStock > 0) {
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          branchId: user.branchId!,
          type: InventoryMovementType.ENTRADA,
          quantity: initialStock,
          previousStock: 0,
          newStock: initialStock,
          reason: "Stock inicial al crear el producto",
          userId: user.id,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "CREAR",
        module: "PRODUCTOS",
        entityId: product.id,
        newData: { ...product, initialStock: inventory.stock } as object,
        description: `${user.name} creó el producto "${product.name}"`,
      },
    });
  });

  revalidatePath("/productos");
  revalidatePath("/inventario");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function updateProduct(id: string, values: ProductValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = productSchema.parse(values);

  const [codeExists, barcodeExists, before] = await Promise.all([
    prisma.product.findFirst({ where: { internalCode: parsed.internalCode.trim(), NOT: { id } } }),
    parsed.barcode
      ? prisma.product.findFirst({ where: { barcode: parsed.barcode, NOT: { id } } })
      : Promise.resolve(null),
    prisma.product.findUnique({ where: { id } }),
  ]);

  if (codeExists) return { error: "Ya existe un producto con ese código interno." };
  if (barcodeExists) return { error: "El código de barras ya está registrado." };
  if (!before) return { error: "El producto no existe." };

  const product = await prisma.product.update({ where: { id }, data: toDecimalData(parsed) });

  const priceChanged =
    Number(before.purchasePrice) !== Number(product.purchasePrice) ||
    Number(before.salePrice) !== Number(product.salePrice);

  await logAudit({
    userId: user.id,
    action: "ACTUALIZAR",
    module: "PRODUCTOS",
    entityId: product.id,
    oldData: before as object,
    newData: product as object,
    description: priceChanged
      ? `${user.name} actualizó precios del producto "${product.name}"`
      : `${user.name} actualizó el producto "${product.name}"`,
  });

  revalidatePath("/productos");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function toggleProductActive(id: string, active: boolean): Promise<ActionResult> {
  const user = await requireRole(EDITORS);

  const product = await prisma.product.update({
    where: { id },
    data: { status: active ? "ACTIVO" : "INACTIVO" },
  });

  await logAudit({
    userId: user.id,
    action: active ? "ACTIVAR" : "DESACTIVAR",
    module: "PRODUCTOS",
    entityId: product.id,
    newData: product as object,
    description: `${user.name} ${active ? "activó" : "desactivó"} el producto "${product.name}"`,
  });

  revalidatePath("/productos");
  revalidatePath("/catalogo");
  return { success: true };
}
