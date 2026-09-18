import { z } from "zod";

export const supplierSchema = z.object({
  businessName: z.string().min(2, "La razón social es obligatoria").max(120),
  tradeName: z.string().max(120).optional().or(z.literal("")),
  ruc: z
    .string()
    .regex(/^\d{11}$/, "El RUC debe tener 11 dígitos")
    .optional()
    .or(z.literal("")),
  contactName: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
});

export type SupplierValues = z.infer<typeof supplierSchema>;
