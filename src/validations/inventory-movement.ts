import { z } from "zod";

export const inventoryMovementSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  type: z.enum(["ENTRADA", "SALIDA", "AJUSTE"]),
  quantity: z.coerce.number().int().min(0, "La cantidad no puede ser negativa"),
  reason: z.string().min(3, "Indica el motivo del movimiento").max(200),
});

export type InventoryMovementValues = z.output<typeof inventoryMovementSchema>;
export type InventoryMovementFormInput = z.input<typeof inventoryMovementSchema>;
