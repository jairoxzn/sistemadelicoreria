"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { nextNumber } from "@/lib/numbering";
import {
  Role,
  SaleStatus,
  CashRegisterStatus,
  PaymentMethod,
  InventoryMovementType,
  CashMovementType,
} from "@/generated/prisma/enums";
import { createReturnSchema, cancelSaleSchema, type CreateReturnValues, type CancelSaleValues } from "@/validations/return";
import type { ActionResult } from "@/lib/action-result";

const CANCEL_ROLES = [Role.ADMINISTRADOR, Role.SUPERVISOR];
const RETURN_ROLES = [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.CAJERO];

export async function cancelSale(saleId: string, values: CancelSaleValues): Promise<ActionResult> {
  const user = await requireRole(CANCEL_ROLES);
  const parsed = cancelSaleSchema.parse(values);

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true, payments: true },
  });
  if (!sale) return { error: "La venta no existe." };
  if (sale.status !== SaleStatus.COMPLETADA) {
    return { error: "Solo se pueden anular ventas completadas." };
  }

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      if (!item.productId) continue;

      const inventory = await tx.inventory.findUnique({
        where: { productId_branchId: { productId: item.productId, branchId: sale.branchId } },
      });
      const previousStock = inventory?.stock ?? 0;
      const newStock = previousStock + item.quantity;

      await tx.inventory.upsert({
        where: { productId_branchId: { productId: item.productId, branchId: sale.branchId } },
        update: { stock: newStock },
        create: { productId: item.productId, branchId: sale.branchId, stock: newStock },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          branchId: sale.branchId,
          type: InventoryMovementType.DEVOLUCION_VENTA,
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: `Anulación de venta ${sale.saleNumber}`,
          reference: sale.saleNumber,
          userId: user.id,
        },
      });
    }

    const updated = await tx.sale.update({
      where: { id: saleId },
      data: { status: SaleStatus.ANULADA, cancelReason: parsed.reason, cancelledAt: new Date() },
    });

    if (sale.cashRegisterId) {
      const register = await tx.cashRegister.findUnique({ where: { id: sale.cashRegisterId } });
      if (register?.status === CashRegisterStatus.ABIERTA) {
        const cashAmount = sale.payments
          .filter((p) => p.method === PaymentMethod.EFECTIVO)
          .reduce((acc, p) => acc + Number(p.amount), 0);
        if (cashAmount > 0) {
          await tx.cashMovement.create({
            data: {
              cashRegisterId: sale.cashRegisterId,
              type: CashMovementType.DEVOLUCION,
              amount: cashAmount,
              description: `Anulación de venta ${sale.saleNumber}`,
              userId: user.id,
            },
          });
        }
      }
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "ANULAR",
        module: "VENTAS",
        entityId: updated.id,
        newData: updated,
        description: `${user.name} anuló la venta ${sale.saleNumber}: ${parsed.reason}`,
      },
    });
  });

  revalidatePath("/ventas");
  revalidatePath("/inventario");
  revalidatePath("/caja");
  return { success: true };
}

export async function createReturn(values: CreateReturnValues): Promise<ActionResult> {
  const user = await requireRole(RETURN_ROLES);
  const parsed = createReturnSchema.parse(values);

  const sale = await prisma.sale.findUnique({
    where: { id: parsed.saleId },
    include: {
      items: { include: { returnItems: true } },
    },
  });
  if (!sale) return { error: "La venta no existe." };
  if (sale.status !== SaleStatus.COMPLETADA) {
    return { error: "Solo se pueden devolver productos de ventas completadas." };
  }

  const saleItemMap = new Map(sale.items.map((i) => [i.id, i]));
  for (const item of parsed.items) {
    const saleItem = saleItemMap.get(item.saleItemId);
    if (!saleItem) return { error: "Uno de los productos no pertenece a esta venta." };
    const alreadyReturned = saleItem.returnItems.reduce((acc, ri) => acc + ri.quantity, 0);
    if (item.quantity + alreadyReturned > saleItem.quantity) {
      return { error: `No puedes devolver más unidades de las vendidas.` };
    }
  }

  const totalAmount = parsed.items.reduce((acc, item) => {
    const saleItem = saleItemMap.get(item.saleItemId)!;
    return acc + Number(saleItem.unitPrice) * item.quantity;
  }, 0);

  await prisma.$transaction(async (tx) => {
    const returnNumber = await nextNumber(tx.return, "R");

    const createdReturn = await tx.return.create({
      data: {
        returnNumber,
        saleId: sale.id,
        userId: user.id,
        reason: parsed.reason,
        totalAmount,
        items: {
          create: parsed.items.map((item) => {
            const saleItem = saleItemMap.get(item.saleItemId)!;
            return {
              saleItemId: item.saleItemId,
              productId: saleItem.productId,
              quantity: item.quantity,
              unitPrice: saleItem.unitPrice,
              subtotal: Number(saleItem.unitPrice) * item.quantity,
            };
          }),
        },
      },
    });

    for (const item of parsed.items) {
      const saleItem = saleItemMap.get(item.saleItemId)!;
      if (!saleItem.productId) continue;

      const inventory = await tx.inventory.findUnique({
        where: { productId_branchId: { productId: saleItem.productId, branchId: sale.branchId } },
      });
      const previousStock = inventory?.stock ?? 0;
      const newStock = previousStock + item.quantity;

      await tx.inventory.upsert({
        where: { productId_branchId: { productId: saleItem.productId, branchId: sale.branchId } },
        update: { stock: newStock },
        create: { productId: saleItem.productId, branchId: sale.branchId, stock: newStock },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: saleItem.productId,
          branchId: sale.branchId,
          type: InventoryMovementType.DEVOLUCION_VENTA,
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: `Devolución ${returnNumber} de venta ${sale.saleNumber}`,
          reference: returnNumber,
          userId: user.id,
        },
      });
    }

    if (sale.cashRegisterId) {
      const register = await tx.cashRegister.findUnique({ where: { id: sale.cashRegisterId } });
      if (register?.status === CashRegisterStatus.ABIERTA) {
        await tx.cashMovement.create({
          data: {
            cashRegisterId: sale.cashRegisterId,
            type: CashMovementType.DEVOLUCION,
            amount: totalAmount,
            description: `Devolución ${returnNumber} de venta ${sale.saleNumber}`,
            userId: user.id,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "CREAR",
        module: "DEVOLUCIONES",
        entityId: createdReturn.id,
        newData: { returnNumber, totalAmount },
        description: `${user.name} registró la devolución ${returnNumber} de la venta ${sale.saleNumber}`,
      },
    });
  });

  revalidatePath("/ventas");
  revalidatePath("/inventario");
  revalidatePath("/caja");
  return { success: true };
}
