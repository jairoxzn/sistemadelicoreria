import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(60),
  description: z.string().max(200).optional().or(z.literal("")),
});

export type CategoryValues = z.infer<typeof categorySchema>;
