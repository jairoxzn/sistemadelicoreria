"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";
import { createUserSchema, updateUserSchema, type CreateUserValues, type UpdateUserValues } from "@/validations/user";
import type { ActionResult } from "@/lib/action-result";

const ONLY_ADMIN = [Role.ADMINISTRADOR];

export async function createUser(values: CreateUserValues): Promise<ActionResult> {
  const admin = await requireRole(ONLY_ADMIN);
  const parsed = createUserSchema.parse(values);

  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing) return { error: "Ya existe un usuario con ese correo." };

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      passwordHash,
      role: parsed.role,
      branchId: parsed.branchId,
    },
  });

  await logAudit({
    userId: admin.id,
    action: "CREAR",
    module: "USUARIOS",
    entityId: user.id,
    newData: { name: user.name, email: user.email, role: user.role },
    description: `${admin.name} creó el usuario "${user.name}" (${user.role})`,
  });

  revalidatePath("/usuarios");
  return { success: true };
}

export async function updateUser(id: string, values: UpdateUserValues): Promise<ActionResult> {
  const admin = await requireRole(ONLY_ADMIN);
  const parsed = updateUserSchema.parse(values);

  const existing = await prisma.user.findFirst({ where: { email: parsed.email, NOT: { id } } });
  if (existing) return { error: "Ya existe un usuario con ese correo." };

  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return { error: "El usuario no existe." };

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      branchId: parsed.branchId,
      ...(parsed.password ? { passwordHash: await bcrypt.hash(parsed.password, 10) } : {}),
    },
  });

  await logAudit({
    userId: admin.id,
    action: "ACTUALIZAR",
    module: "USUARIOS",
    entityId: user.id,
    oldData: { name: before.name, email: before.email, role: before.role },
    newData: { name: user.name, email: user.email, role: user.role },
    description: `${admin.name} actualizó el usuario "${user.name}"`,
  });

  revalidatePath("/usuarios");
  return { success: true };
}

export async function toggleUserActive(id: string, active: boolean): Promise<ActionResult> {
  const admin = await requireRole(ONLY_ADMIN);
  const me = await requireUser();

  if (id === me.id && !active) {
    return { error: "No puedes desactivar tu propio usuario." };
  }

  const user = await prisma.user.update({ where: { id }, data: { active } });

  await logAudit({
    userId: admin.id,
    action: active ? "ACTIVAR" : "DESACTIVAR",
    module: "USUARIOS",
    entityId: user.id,
    newData: { active },
    description: `${admin.name} ${active ? "activó" : "desactivó"} el usuario "${user.name}"`,
  });

  revalidatePath("/usuarios");
  return { success: true };
}
