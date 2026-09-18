import "server-only";
import { prisma } from "@/lib/prisma";
import { PurchaseStatus } from "@/generated/prisma/enums";

export type AdminAlert = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "warning" | "destructive";
};

const MAX_PER_TYPE = 5;

export async function getAdminAlerts(): Promise<AdminAlert[]> {
  const [lowStockProducts, outOfStockProducts, pendingPurchases] = await Promise.all([
    prisma.$queryRaw<{ id: string; name: string; stock: number; stockMin: number }[]>`
      SELECT p.id, p.name, i.stock, p."stockMin"
      FROM inventories i
      JOIN products p ON p.id = i."productId"
      WHERE i.stock > 0 AND i.stock <= p."stockMin" AND p.status = 'ACTIVO'
      ORDER BY i.stock ASC
      LIMIT ${MAX_PER_TYPE}
    `,
    prisma.$queryRaw<{ id: string; name: string }[]>`
      SELECT p.id, p.name
      FROM inventories i
      JOIN products p ON p.id = i."productId"
      WHERE i.stock = 0 AND p.status = 'ACTIVO'
      ORDER BY p.name ASC
      LIMIT ${MAX_PER_TYPE}
    `,
    prisma.purchase.findMany({
      where: { status: PurchaseStatus.BORRADOR },
      select: { id: true, purchaseNumber: true, supplier: { select: { businessName: true } } },
      orderBy: { createdAt: "desc" },
      take: MAX_PER_TYPE,
    }),
  ]);

  const alerts: AdminAlert[] = [];

  for (const p of outOfStockProducts) {
    alerts.push({
      id: `out-${p.id}`,
      title: "Producto agotado",
      description: p.name,
      href: "/inventario",
      tone: "destructive",
    });
  }
  for (const p of lowStockProducts) {
    alerts.push({
      id: `low-${p.id}`,
      title: "Stock bajo",
      description: `${p.name} · quedan ${p.stock} (mínimo ${p.stockMin})`,
      href: "/inventario",
      tone: "warning",
    });
  }
  for (const purchase of pendingPurchases) {
    alerts.push({
      id: `purchase-${purchase.id}`,
      title: "Compra pendiente de confirmar",
      description: `${purchase.purchaseNumber} · ${purchase.supplier.businessName}`,
      href: "/compras",
      tone: "warning",
    });
  }

  return alerts;
}
