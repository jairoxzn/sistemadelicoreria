import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(120),
  address: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
});
export type BranchValues = z.infer<typeof branchSchema>;
