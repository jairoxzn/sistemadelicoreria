import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryTabs } from "./inventory-tabs";

export default async function InventarioPage() {
  const session = await auth();
  const branchId = session?.user?.branchId;

  const [products, movements] = await Promise.all([
    branchId
      ? prisma.product.findMany({
          where: { status: "ACTIVO" },
          orderBy: { name: "asc" },
          include: {
            category: { select: { name: true } },
            inventories: { where: { branchId }, select: { stock: true } },
          },
        })
      : Promise.resolve([]),
    branchId
      ? prisma.inventoryMovement.findMany({
          where: { branchId },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            product: { select: { name: true, internalCode: true } },
            user: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    internalCode: p.internalCode,
    categoryName: p.category.name,
    stock: p.inventories[0]?.stock ?? 0,
    stockMin: p.stockMin,
    purchasePrice: Number(p.purchasePrice),
  }));

  const totalValue = rows.reduce((acc, r) => acc + r.stock * r.purchasePrice, 0);

  const movementRows = movements.map((m) => ({
    id: m.id,
    productName: m.product.name,
    productCode: m.product.internalCode,
    type: m.type,
    quantity: m.quantity,
    previousStock: m.previousStock,
    newStock: m.newStock,
    reason: m.reason,
    userName: m.user.name,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader title="Inventario" description="Stock disponible y movimientos por sucursal." />
      <InventoryTabs products={rows} movements={movementRows} totalValue={totalValue} />
    </div>
  );
}
