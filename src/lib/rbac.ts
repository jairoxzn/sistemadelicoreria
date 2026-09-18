import { Role } from "@/generated/prisma/enums";

const ALL_ROLES = [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.CAJERO, Role.ALMACENERO];

/**
 * Prefijos de ruta -> roles permitidos. ADMINISTRADOR siempre tiene acceso total.
 * El primer prefijo que hace match con el pathname define el permiso.
 * Orden importa: rutas mas especificas primero.
 */
export const ROUTE_ACCESS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/dashboard", roles: [Role.ADMINISTRADOR, Role.SUPERVISOR] },
  { prefix: "/pos", roles: [Role.ADMINISTRADOR, Role.CAJERO] },
  { prefix: "/ventas", roles: [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.CAJERO] },
  { prefix: "/productos", roles: [Role.ADMINISTRADOR, Role.ALMACENERO] },
  { prefix: "/inventario", roles: [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.ALMACENERO] },
  { prefix: "/compras", roles: [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.ALMACENERO] },
  { prefix: "/proveedores", roles: [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.ALMACENERO] },
  { prefix: "/clientes", roles: [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.CAJERO] },
  { prefix: "/promociones", roles: [Role.ADMINISTRADOR] },
  { prefix: "/caja", roles: [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.CAJERO] },
  { prefix: "/reportes", roles: [Role.ADMINISTRADOR, Role.SUPERVISOR] },
  { prefix: "/sucursales", roles: [Role.ADMINISTRADOR] },
  { prefix: "/usuarios", roles: [Role.ADMINISTRADOR] },
  { prefix: "/auditoria", roles: [Role.ADMINISTRADOR] },
  { prefix: "/configuracion", roles: [Role.ADMINISTRADOR] },
];

export function isRouteAllowed(pathname: string, role: Role): boolean {
  if (role === Role.ADMINISTRADOR) return true;
  const match = ROUTE_ACCESS.find((r) => pathname.startsWith(r.prefix));
  if (!match) return true;
  return match.roles.includes(role);
}

/** Ruta de aterrizaje por defecto segun el rol, usada tras login o cuando se deniega acceso. */
export function defaultRouteForRole(role: Role): string {
  switch (role) {
    case Role.ADMINISTRADOR:
    case Role.SUPERVISOR:
      return "/dashboard";
    case Role.CAJERO:
      return "/pos";
    case Role.ALMACENERO:
      return "/productos";
    default:
      return "/login";
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMINISTRADOR: "Administrador",
  SUPERVISOR: "Supervisor",
  CAJERO: "Cajero",
  ALMACENERO: "Almacenero",
};

export { ALL_ROLES };
