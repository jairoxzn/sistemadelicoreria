import { z } from "zod";

export const comboItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
});

export const comboSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(120),
  description: z.string().max(300).optional().or(z.literal("")),
  price: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
  items: z.array(comboItemSchema).min(2, "Un combo debe tener al menos 2 productos"),
});

export type ComboValues = z.output<typeof comboSchema>;
export type ComboFormInput = z.input<typeof comboSchema>;
