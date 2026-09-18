"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { nextNumber } from "@/lib/numbering";
import { Role, PurchaseStatus, InventoryMovementType } from "@/generated/prisma/enums";
import { createPurchaseSchema, type CreatePurchaseValues } from "@/validations/purchase";
import type { ActionResult } from "@/lib/action-result";

const EDITORS = [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.ALMACENERO];

export async function createPurchase(values: CreatePurchaseValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = createPurchaseSchema.parse(values);

  if (!user.branchId) return { error: "Tu usuario no tiene una sucursal asignada." };

  const subtotal = parsed.items.reduce((acc, i) => acc + i.quantity * i.unitCost, 0);

  await prisma.$transaction(async (tx) => {
    const purchaseNumber = await nextNumber(tx.purchase, "C");

    const purchase = await tx.purchase.create({
      data: {
        purchaseNumber,
        branchId: user.branchId!,
        supplierId: parsed.supplierId,
        userId: user.id,
        subtotal,
        total: subtotal,
        status: PurchaseStatus.BORRADOR,
        items: {
          create: parsed.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotal: item.quantity * item.unitCost,
          })),
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "CREAR",
        module: "COMPRAS",
        entityId: purchase.id,
        newData: { purchaseNumber, total: subtotal },
        description: `${user.name} creó la compra ${purchaseNumber} (borrador)`,
      },
    });
  });

  revalidatePath("/compras");
  return { success: true };
}

export async function confirmPurchase(id: string): Promise<ActionResult> {
  const user = await requireRole(EDITORS);

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!purchase) return { error: "La compra no existe." };
  if (purchase.status !== PurchaseStatus.BORRADOR) {
    return { error: "Solo se pueden confirmar compras en borrador." };
  }

  await prisma.$transaction(async (tx) => {
    for (const item of purchase.items) {
      const inventory = await tx.inventory.upsert({
        where: { productId_branchId: { productId: item.productId, branchId: purchase.branchId } },
        update: {},
        create: { productId: item.productId, branchId: purchase.branchId, stock: 0 },
      });

      const newStock = inventory.stock + item.quantity;

      await tx.inventory.update({ where: { id: inventory.id }, data: { stock: newStock } });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          branchId: purchase.branchId,
          type: InventoryMovementType.ENTRADA,
          quantity: item.quantity,
          previousStock: inventory.stock,
          newStock,
          reason: `Compra confirmada ${purchase.purchaseNumber}`,
          reference: purchase.purchaseNumber,
          userId: user.id,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { purchasePrice: item.unitCost },
      });
    }

    const updated = await tx.purchase.update({
      where: { id },
      data: { status: PurchaseStatus.CONFIRMADA, confirmedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "CONFIRMAR",
        module: "COMPRAS",
        entityId: updated.id,
        newData: updated,
        description: `${user.name} confirmó la compra ${purchase.purchaseNumber}, stock actualizado`,
      },
    });
  });

  revalidatePath("/compras");
  revalidatePath("/inventario");
  revalidatePath("/productos");
  return { success: true };
}

export async function cancelPurchase(id: string): Promise<ActionResult> {
  const user = await requireRole(EDITORS);

  const purchase = await prisma.purchase.findUnique({ where: { id } });
  if (!purchase) return { error: "La compra no existe." };
  if (purchase.status !== PurchaseStatus.BORRADOR) {
    return { error: "Solo se pueden anular compras en borrador." };
  }

  const updated = await prisma.purchase.update({
    where: { id },
    data: { status: PurchaseStatus.ANULADA, cancelledAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "ANULAR",
      module: "COMPRAS",
      entityId: updated.id,
      newData: updated,
      description: `${user.name} anuló la compra ${purchase.purchaseNumber}`,
    },
  });

  revalidatePath("/compras");
  return { success: true };
}
