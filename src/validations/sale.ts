import { z } from "zod";

export const saleItemSchema = z
  .object({
    productId: z.string().optional(),
    comboId: z.string().optional(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).default(0),
  })
  .refine((item) => !!item.productId !== !!item.comboId, {
    message: "El item debe tener un producto o un combo, no ambos",
  });

export const salePaymentSchema = z.object({
  method: z.enum(["EFECTIVO", "YAPE", "PLIN", "TARJETA", "TRANSFERENCIA"]),
  amount: z.number().min(0.01),
  receivedAmount: z.number().min(0).optional(),
  reference: z.string().max(60).optional(),
});

export const createSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  cashRegisterId: z.string().min(1, "No hay una caja abierta"),
  discount: z.number().min(0).default(0),
  items: z.array(saleItemSchema).min(1, "Agrega al menos un producto"),
  payments: z.array(salePaymentSchema).min(1, "Agrega al menos un método de pago"),
});

export type CreateSaleValues = z.infer<typeof createSaleSchema>;
export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type SalePaymentInput = z.infer<typeof salePaymentSchema>;
