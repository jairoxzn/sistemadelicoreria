import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1, "La cantidad debe ser mayor a 0"),
  unitCost: z.number().min(0, "El costo no puede ser negativo"),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor"),
  items: z.array(purchaseItemSchema).min(1, "Agrega al menos un producto"),
});

export type CreatePurchaseValues = z.infer<typeof createPurchaseSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
