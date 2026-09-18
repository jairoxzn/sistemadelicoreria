import { z } from "zod";

export const brandSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(60),
  description: z.string().max(200).optional().or(z.literal("")),
});

export type BrandValues = z.infer<typeof brandSchema>;
