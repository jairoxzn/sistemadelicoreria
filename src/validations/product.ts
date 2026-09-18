import { z } from "zod";

export const productSchema = z
  .object({
    internalCode: z.string().min(1, "El código interno es obligatorio").max(30),
    barcode: z.string().max(30).optional().or(z.literal("")),
    name: z.string().min(2, "El nombre es obligatorio").max(120),
    description: z.string().max(500).optional().or(z.literal("")),
    categoryId: z.string().min(1, "Selecciona una categoría"),
    brandId: z.string().optional().or(z.literal("")),
    presentation: z.string().max(60).optional().or(z.literal("")),
    content: z.string().max(30).optional().or(z.literal("")),
    unit: z.string().max(20).default("UNIDAD"),
    purchasePrice: z.coerce.number().min(0, "El precio de compra no puede ser negativo"),
    salePrice: z.coerce.number().min(0.01, "El precio de venta debe ser mayor a 0"),
    wholesalePrice: z.coerce.number().min(0).optional().nullable(),
    promoPrice: z.coerce.number().min(0).optional().nullable(),
    stockMin: z.coerce.number().int().min(0).default(5),
    supplierId: z.string().optional().or(z.literal("")),
    imageUrl: z.string().max(500).optional().or(z.literal("")),
    initialStock: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => data.salePrice >= data.purchasePrice, {
    message: "El precio de venta no puede ser menor al precio de compra",
    path: ["salePrice"],
  });

export type ProductValues = z.output<typeof productSchema>;
export type ProductFormInput = z.input<typeof productSchema>;
