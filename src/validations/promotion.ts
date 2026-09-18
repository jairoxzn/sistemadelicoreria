import { z } from "zod";

export const promotionSchema = z
  .object({
    name: z.string().min(2, "El nombre es obligatorio").max(120),
    type: z.enum(["PORCENTAJE", "MONTO_FIJO", "PRECIO_PROMOCIONAL", "DOS_POR_UNO"]),
    discountPercent: z.coerce.number().min(0).max(100).optional().nullable(),
    discountAmount: z.coerce.number().min(0).optional().nullable(),
    promoPrice: z.coerce.number().min(0).optional().nullable(),
    minQuantity: z.coerce.number().int().min(1).default(1),
    startDate: z.string().min(1, "Selecciona la fecha de inicio"),
    endDate: z.string().min(1, "Selecciona la fecha de fin"),
    startTime: z.string().optional().or(z.literal("")),
    endTime: z.string().optional().or(z.literal("")),
    imageUrl: z.string().max(500).optional().or(z.literal("")),
    productIds: z.array(z.string()).min(1, "Selecciona al menos un producto"),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "La fecha de fin debe ser posterior a la de inicio",
    path: ["endDate"],
  });

export type PromotionValues = z.output<typeof promotionSchema>;
export type PromotionFormInput = z.input<typeof promotionSchema>;
