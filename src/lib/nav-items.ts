import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  Users,
  Gift,
  Wallet,
  BarChart3,
  Store,
  UserCog,
  ClipboardList,
  Settings,
  Receipt,
} from "lucide-react";
import { Role } from "@/generated/prisma/enums";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  children?: { label: string; href: string; roles: Role[] }[];
};

const { ADMINISTRADOR, SUPERVISOR, CAJERO, ALMACENERO } = Role;

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [ADMINISTRADOR, SUPERVISOR],
  },
  {
    label: "Punto de Venta",
    href: "/pos",
    icon: ShoppingCart,
    roles: [ADMINISTRADOR, CAJERO],
  },
  {
    label: "Ventas",
    href: "/ventas",
    icon: Receipt,
    roles: [ADMINISTRADOR, SUPERVISOR, CAJERO],
  },
  {
    label: "Productos",
    href: "/productos",
    icon: Package,
    roles: [ADMINISTRADOR, ALMACENERO],
    children: [
      { label: "Productos", href: "/productos", roles: [ADMINISTRADOR, ALMACENERO] },
      { label: "Categorías", href: "/productos/categorias", roles: [ADMINISTRADOR, ALMACENERO] },
      { label: "Marcas", href: "/productos/marcas", roles: [ADMINISTRADOR, ALMACENERO] },
    ],
  },
  {
    label: "Inventario",
    href: "/inventario",
    icon: Boxes,
    roles: [ADMINISTRADOR, SUPERVISOR, ALMACENERO],
  },
  {
    label: "Compras",
    href: "/compras",
    icon: Truck,
    roles: [ADMINISTRADOR, SUPERVISOR, ALMACENERO],
    children: [
      { label: "Compras", href: "/compras", roles: [ADMINISTRADOR, SUPERVISOR, ALMACENERO] },
      { label: "Proveedores", href: "/proveedores", roles: [ADMINISTRADOR, SUPERVISOR, ALMACENERO] },
    ],
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    roles: [ADMINISTRADOR, SUPERVISOR, CAJERO],
  },
  {
    label: "Promociones",
    href: "/promociones",
    icon: Gift,
    roles: [ADMINISTRADOR],
    children: [
      { label: "Promociones", href: "/promociones", roles: [ADMINISTRADOR] },
      { label: "Combos", href: "/promociones/combos", roles: [ADMINISTRADOR] },
    ],
  },
  {
    label: "Caja",
    href: "/caja",
    icon: Wallet,
    roles: [ADMINISTRADOR, SUPERVISOR, CAJERO],
  },
  {
    label: "Reportes",
    href: "/reportes",
    icon: BarChart3,
    roles: [ADMINISTRADOR, SUPERVISOR],
  },
  {
    label: "Sucursales",
    href: "/sucursales",
    icon: Store,
    roles: [ADMINISTRADOR],
  },
  {
    label: "Usuarios",
    href: "/usuarios",
    icon: UserCog,
    roles: [ADMINISTRADOR],
  },
  {
    label: "Auditoría",
    href: "/auditoria",
    icon: ClipboardList,
    roles: [ADMINISTRADOR],
  },
  {
    label: "Configuración",
    href: "/configuracion",
    icon: Settings,
    roles: [ADMINISTRADOR],
  },
];
