import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(120),
  documentType: z.enum(["DNI", "RUC", "NONE"]).default("NONE"),
  documentNumber: z.string().max(20).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
});

export type CustomerValues = z.output<typeof customerSchema>;
export type CustomerFormInput = z.input<typeof customerSchema>;
