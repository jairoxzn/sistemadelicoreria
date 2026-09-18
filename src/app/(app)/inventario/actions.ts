"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { Role, InventoryMovementType } from "@/generated/prisma/enums";
import {
  inventoryMovementSchema,
  type InventoryMovementValues,
} from "@/validations/inventory-movement";
import type { ActionResult } from "@/lib/action-result";

const EDITORS = [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.ALMACENERO];

export async function createInventoryMovement(values: InventoryMovementValues): Promise<ActionResult> {
  const user = await requireRole(EDITORS);
  const parsed = inventoryMovementSchema.parse(values);

  if (!user.branchId) {
    return { error: "Tu usuario no tiene una sucursal asignada." };
  }

  if (parsed.type !== "AJUSTE" && parsed.quantity <= 0) {
    return { error: "La cantidad debe ser mayor a 0." };
  }

  const inventory = await prisma.inventory.findUnique({
    where: { productId_branchId: { productId: parsed.productId, branchId: user.branchId } },
  });

  const previousStock = inventory?.stock ?? 0;
  let newStock = previousStock;
  let movementQuantity = parsed.quantity;

  if (parsed.type === "ENTRADA") {
    newStock = previousStock + parsed.quantity;
  } else if (parsed.type === "SALIDA") {
    if (parsed.quantity > previousStock) {
      return { error: "No puedes retirar más stock del disponible." };
    }
    newStock = previousStock - parsed.quantity;
  } else {
    // AJUSTE: quantity representa el nuevo stock total
    newStock = parsed.quantity;
    movementQuantity = Math.abs(newStock - previousStock);
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventory.upsert({
      where: { productId_branchId: { productId: parsed.productId, branchId: user.branchId! } },
      update: { stock: newStock },
      create: { productId: parsed.productId, branchId: user.branchId!, stock: newStock },
    });

    await tx.inventoryMovement.create({
      data: {
        productId: parsed.productId,
        branchId: user.branchId!,
        type: parsed.type as InventoryMovementType,
        quantity: movementQuantity,
        previousStock,
        newStock,
        reason: parsed.reason,
        userId: user.id,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "AJUSTAR_STOCK",
        module: "INVENTARIO",
        entityId: parsed.productId,
        oldData: { stock: previousStock },
        newData: { stock: newStock, type: parsed.type, reason: parsed.reason },
        description: `${user.name} registró un movimiento de ${parsed.type.toLowerCase()} (${previousStock} → ${newStock})`,
      },
    });
  });

  revalidatePath("/inventario");
  revalidatePath("/productos");
  return { success: true };
}
