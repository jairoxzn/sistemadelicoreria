import "server-only";
import { auth } from "@/lib/auth";
import { Role } from "@/generated/prisma/enums";

export class UnauthorizedError extends Error {
  constructor(message = "No tienes permisos para realizar esta acción.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Obtiene el usuario autenticado o lanza si no hay sesión. Para usar dentro de server actions. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError("Debes iniciar sesión.");
  }
  return session.user;
}

/** Obtiene el usuario autenticado y valida que su rol esté permitido. */
export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new UnauthorizedError();
  }
  return user;
}
