"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { Role, CashRegisterStatus, PaymentMethod } from "@/generated/prisma/enums";
import {
  openCashRegisterSchema,
  closeCashRegisterSchema,
  cashMovementSchema,
  type OpenCashRegisterValues,
  type CloseCashRegisterValues,
  type CashMovementValues,
} from "@/validations/cash-register";
import type { ActionResult } from "@/lib/action-result";

const ALL_CAJA_ROLES = [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.CAJERO];

export async function openCashRegister(values: OpenCashRegisterValues): Promise<ActionResult> {
  const user = await requireRole(ALL_CAJA_ROLES);
  const parsed = openCashRegisterSchema.parse(values);

  if (!user.branchId) return { error: "Tu usuario no tiene una sucursal asignada." };

  const existing = await prisma.cashRegister.findFirst({
    where: { branchId: user.branchId, status: CashRegisterStatus.ABIERTA },
  });
  if (existing) return { error: "Ya existe una caja abierta en esta sucursal." };

  const register = await prisma.cashRegister.create({
    data: {
      branchId: user.branchId,
      userId: user.id,
      openingAmount: parsed.openingAmount,
    },
  });

  await logAudit({
    userId: user.id,
    action: "ABRIR_CAJA",
    module: "CAJA",
    entityId: register.id,
    newData: register,
    description: `${user.name} abrió caja con S/ ${parsed.openingAmount.toFixed(2)}`,
  });

  revalidatePath("/caja");
  return { success: true };
}

export async function createCashMovement(
  cashRegisterId: string,
  values: CashMovementValues
): Promise<ActionResult> {
  const user = await requireRole(ALL_CAJA_ROLES);
  const parsed = cashMovementSchema.parse(values);

  const register = await prisma.cashRegister.findUnique({ where: { id: cashRegisterId } });
  if (!register || register.status !== CashRegisterStatus.ABIERTA) {
    return { error: "La caja no está abierta." };
  }

  const movement = await prisma.cashMovement.create({
    data: {
      cashRegisterId,
      type: parsed.type,
      amount: parsed.amount,
      description: parsed.description,
      userId: user.id,
    },
  });

  await logAudit({
    userId: user.id,
    action: "REGISTRAR_MOVIMIENTO_CAJA",
    module: "CAJA",
    entityId: movement.id,
    newData: movement,
    description: `${user.name} registró un ${parsed.type.toLowerCase()} de S/ ${parsed.amount.toFixed(2)}: ${parsed.description}`,
  });

  revalidatePath("/caja");
  return { success: true };
}

export async function closeCashRegister(
  cashRegisterId: string,
  values: CloseCashRegisterValues
): Promise<ActionResult> {
  const user = await requireRole(ALL_CAJA_ROLES);
  const parsed = closeCashRegisterSchema.parse(values);

  const register = await prisma.cashRegister.findUnique({
    where: { id: cashRegisterId },
    include: { movements: true, sales: { include: { payments: true } } },
  });

  if (!register) return { error: "La caja no existe." };
  if (register.status !== CashRegisterStatus.ABIERTA) {
    return { error: "Esta caja ya fue cerrada." };
  }

  const cashSales = register.sales
    .filter((s) => s.status === "COMPLETADA")
    .flatMap((s) => s.payments)
    .filter((p) => p.method === PaymentMethod.EFECTIVO)
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const ingresos = register.movements
    .filter((m) => m.type === "INGRESO")
    .reduce((acc, m) => acc + Number(m.amount), 0);
  const retiros = register.movements
    .filter((m) => m.type === "RETIRO")
    .reduce((acc, m) => acc + Number(m.amount), 0);
  const gastos = register.movements
    .filter((m) => m.type === "GASTO")
    .reduce((acc, m) => acc + Number(m.amount), 0);
  const devoluciones = register.movements
    .filter((m) => m.type === "DEVOLUCION")
    .reduce((acc, m) => acc + Number(m.amount), 0);

  const expectedAmount =
    Number(register.openingAmount) + cashSales + ingresos - retiros - gastos - devoluciones;
  const difference = parsed.countedAmount - expectedAmount;

  const updated = await prisma.cashRegister.update({
    where: { id: cashRegisterId },
    data: {
      status: CashRegisterStatus.CERRADA,
      closedAt: new Date(),
      expectedAmount,
      countedAmount: parsed.countedAmount,
      difference,
      notes: parsed.notes || null,
    },
  });

  await logAudit({
    userId: user.id,
    action: "CERRAR_CAJA",
    module: "CAJA",
    entityId: updated.id,
    newData: updated,
    description: `${user.name} cerró caja. Esperado: S/ ${expectedAmount.toFixed(2)}, contado: S/ ${parsed.countedAmount.toFixed(2)}, diferencia: S/ ${difference.toFixed(2)}`,
  });

  revalidatePath("/caja");
  return { success: true };
}
