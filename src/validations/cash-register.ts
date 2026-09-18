import { z } from "zod";

export const openCashRegisterSchema = z.object({
  openingAmount: z.coerce.number().min(0, "El monto inicial no puede ser negativo"),
});
export type OpenCashRegisterValues = z.output<typeof openCashRegisterSchema>;
export type OpenCashRegisterInput = z.input<typeof openCashRegisterSchema>;

export const closeCashRegisterSchema = z.object({
  countedAmount: z.coerce.number().min(0, "El monto contado no puede ser negativo"),
  notes: z.string().max(300).optional().or(z.literal("")),
});
export type CloseCashRegisterValues = z.output<typeof closeCashRegisterSchema>;
export type CloseCashRegisterInput = z.input<typeof closeCashRegisterSchema>;

export const cashMovementSchema = z.object({
  type: z.enum(["INGRESO", "RETIRO", "GASTO"]),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  description: z.string().min(3, "Indica una descripción").max(200),
});
export type CashMovementValues = z.output<typeof cashMovementSchema>;
export type CashMovementInput = z.input<typeof cashMovementSchema>;
