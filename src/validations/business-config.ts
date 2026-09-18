import { z } from "zod";

export const businessConfigSchema = z.object({
  tradeName: z.string().min(2, "El nombre comercial es obligatorio").max(120),
  businessName: z.string().max(150).optional().or(z.literal("")),
  ruc: z
    .string()
    .regex(/^\d{11}$/, "El RUC debe tener 11 dígitos")
    .optional()
    .or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  logoUrl: z.string().max(500).optional().or(z.literal("")),
  bannerUrl: z.string().max(500).optional().or(z.literal("")),
  igvPercent: z.coerce.number().min(0).max(100),
  ticketFooter: z.string().max(300).optional().or(z.literal("")),
});
export type BusinessConfigValues = z.output<typeof businessConfigSchema>;
export type BusinessConfigFormInput = z.input<typeof businessConfigSchema>;
