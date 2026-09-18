"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { nextNumber } from "@/lib/numbering";
import { Role, CashRegisterStatus, InventoryMovementType } from "@/generated/prisma/enums";
import { createSaleSchema, type CreateSaleValues } from "@/validations/sale";

const EDITORS = [Role.ADMINISTRADOR, Role.CAJERO];

export type SaleReceipt = {
  saleNumber: string;
  createdAt: string;
  cashierName: string;
  customerName: string | null;
  items: { name: string; quantity: number; unitPrice: number; subtotal: number }[];
  payments: { method: string; amount: number; receivedAmount: number | null; changeAmount: number | null }[];
  subtotal: number;
  discount: number;
  total: number;
};

export type CreateSaleResult = { error: string } | { success: true; receipt: SaleReceipt };

export async function createSale(values: CreateSaleValues): Promise<CreateSaleResult> {
  const user = await requireRole(EDITORS);
  const parsed = createSaleSchema.parse(values);

  if (!user.branchId) return { error: "Tu usuario no tiene una sucursal asignada." };

  const cashRegister = await prisma.cashRegister.findUnique({
    where: { id: parsed.cashRegisterId },
  });
  if (!cashRegister || cashRegister.status !== CashRegisterStatus.ABIERTA) {
    return { error: "No hay una caja abierta. Abre caja antes de vender." };
  }
  if (cashRegister.branchId !== user.branchId) {
    return { error: "La caja no pertenece a tu sucursal." };
  }

  const subtotal = parsed.items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity - item.discount,
    0
  );
  const total = Math.max(0, Math.round((subtotal - parsed.discount) * 100) / 100);

  const paymentsTotal = Math.round(parsed.payments.reduce((acc, p) => acc + p.amount, 0) * 100) / 100;
  if (Math.abs(paymentsTotal - total) > 0.01) {
    return { error: "La suma de los pagos no coincide con el total de la venta." };
  }

  const productIds = parsed.items.filter((i) => i.productId).map((i) => i.productId!);
  const comboIds = parsed.items.filter((i) => i.comboId).map((i) => i.comboId!);

  const [products, combos, customer] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } } }),
    prisma.combo.findMany({ where: { id: { in: comboIds } }, include: { items: true } }),
    parsed.customerId
      ? prisma.customer.findUnique({ where: { id: parsed.customerId } })
      : Promise.resolve(null),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const comboMap = new Map(combos.map((c) => [c.id, c]));

  for (const item of parsed.items) {
    if (item.productId && !productMap.has(item.productId)) {
      return { error: "Uno de los productos ya no está disponible." };
    }
    if (item.comboId && !comboMap.has(item.comboId)) {
      return { error: "Uno de los combos ya no está disponible." };
    }
  }

  // Cantidad total requerida por producto, expandiendo combos a sus componentes
  const requiredByProduct = new Map<string, number>();
  for (const item of parsed.items) {
    if (item.productId) {
      requiredByProduct.set(
        item.productId,
        (requiredByProduct.get(item.productId) ?? 0) + item.quantity
      );
    } else if (item.comboId) {
      const combo = comboMap.get(item.comboId)!;
      for (const comboItem of combo.items) {
        const needed = comboItem.quantity * item.quantity;
        requiredByProduct.set(
          comboItem.productId,
          (requiredByProduct.get(comboItem.productId) ?? 0) + needed
        );
      }
    }
  }
  const allProductIds = [...requiredByProduct.keys()];

  try {
    const receipt = await prisma.$transaction(async (tx) => {
      const inventories = await tx.inventory.findMany({
        where: { branchId: user.branchId!, productId: { in: allProductIds } },
      });
      const inventoryMap = new Map(inventories.map((i) => [i.productId, i]));

      for (const [productId, needed] of requiredByProduct) {
        const inv = inventoryMap.get(productId);
        if (!inv || inv.stock < needed) {
          const name = productMap.get(productId)?.name ?? "producto";
          throw new Error(`Stock insuficiente para "${name}".`);
        }
      }

      const saleNumber = await nextNumber(tx.sale, "V");

      const sale = await tx.sale.create({
        data: {
          saleNumber,
          branchId: user.branchId!,
          userId: user.id,
          customerId: parsed.customerId || null,
          cashRegisterId: parsed.cashRegisterId,
          subtotal,
          discount: parsed.discount,
          total,
          items: {
            create: parsed.items.map((item) => ({
              productId: item.productId || null,
              comboId: item.comboId || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              subtotal: item.unitPrice * item.quantity - item.discount,
            })),
          },
          payments: {
            create: parsed.payments.map((p) => ({
              method: p.method,
              amount: p.amount,
              receivedAmount: p.receivedAmount,
              changeAmount:
                p.receivedAmount !== undefined ? Math.max(0, p.receivedAmount - p.amount) : null,
              reference: p.reference || null,
            })),
          },
        },
        include: { items: true, payments: true },
      });

      for (const [productId, needed] of requiredByProduct) {
        const inv = inventoryMap.get(productId)!;
        const newStock = inv.stock - needed;

        await tx.inventory.update({
          where: { id: inv.id },
          data: { stock: newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId,
            branchId: user.branchId!,
            type: InventoryMovementType.SALIDA,
            quantity: needed,
            previousStock: inv.stock,
            newStock,
            reason: `Venta ${saleNumber}`,
            reference: saleNumber,
            userId: user.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREAR",
          module: "VENTAS",
          entityId: sale.id,
          newData: { saleNumber, total },
          description: `${user.name} registró la venta ${saleNumber} por S/ ${total.toFixed(2)}`,
        },
      });

      const receiptData: SaleReceipt = {
        saleNumber: sale.saleNumber,
        createdAt: sale.createdAt.toISOString(),
        cashierName: user.name ?? "Cajero",
        customerName: customer?.name ?? null,
        items: sale.items.map((si) => ({
          name: si.productId
            ? (productMap.get(si.productId)?.name ?? "Producto")
            : (comboMap.get(si.comboId!)?.name ?? "Combo"),
          quantity: si.quantity,
          unitPrice: Number(si.unitPrice),
          subtotal: Number(si.subtotal),
        })),
        payments: sale.payments.map((p) => ({
          method: p.method,
          amount: Number(p.amount),
          receivedAmount: p.receivedAmount ? Number(p.receivedAmount) : null,
          changeAmount: p.changeAmount ? Number(p.changeAmount) : null,
        })),
        subtotal,
        discount: parsed.discount,
        total,
      };

      return receiptData;
    });

    revalidatePath("/pos");
    revalidatePath("/inventario");
    revalidatePath("/ventas");
    revalidatePath("/caja");
    return { success: true, receipt };
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo completar la venta.";
    return { error: message };
  }
}
