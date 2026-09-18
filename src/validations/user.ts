import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(120),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["ADMINISTRADOR", "SUPERVISOR", "CAJERO", "ALMACENERO"]),
  branchId: z.string().min(1, "Selecciona una sucursal"),
});
export type CreateUserValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(120),
  email: z.string().email("Correo inválido"),
  role: z.enum(["ADMINISTRADOR", "SUPERVISOR", "CAJERO", "ALMACENERO"]),
  branchId: z.string().min(1, "Selecciona una sucursal"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional().or(z.literal("")),
});
export type UpdateUserValues = z.infer<typeof updateUserSchema>;
