import { z } from "zod";

export const returnItemSchema = z.object({
  saleItemId: z.string().min(1),
  quantity: z.number().int().min(1),
});

export const createReturnSchema = z.object({
  saleId: z.string().min(1),
  reason: z.string().min(3, "Indica el motivo de la devolución").max(200),
  items: z.array(returnItemSchema).min(1, "Selecciona al menos un producto a devolver"),
});

export type CreateReturnValues = z.infer<typeof createReturnSchema>;

export const cancelSaleSchema = z.object({
  reason: z.string().min(3, "Indica el motivo de la anulación").max(200),
});
export type CancelSaleValues = z.infer<typeof cancelSaleSchema>;
