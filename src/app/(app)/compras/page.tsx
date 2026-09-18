import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PurchaseTable } from "./purchase-table";

export default async function ComprasPage() {
  const [purchases, suppliers, products] = await Promise.all([
    prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { businessName: true } },
        user: { select: { name: true } },
        items: { include: { product: { select: { name: true, internalCode: true } } } },
      },
    }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { businessName: "asc" } }),
    prisma.product.findMany({ where: { status: "ACTIVO" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Compras" description="Órdenes de compra a proveedores." />
      <PurchaseTable
        purchases={purchases.map((p) => ({
          id: p.id,
          purchaseNumber: p.purchaseNumber,
          supplierName: p.supplier.businessName,
          userName: p.user.name,
          total: Number(p.total),
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          items: p.items.map((i) => ({
            productName: i.product.name,
            productCode: i.product.internalCode,
            quantity: i.quantity,
            unitCost: Number(i.unitCost),
            subtotal: Number(i.subtotal),
          })),
        }))}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.businessName }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          internalCode: p.internalCode,
          purchasePrice: Number(p.purchasePrice),
        }))}
      />
    </div>
  );
}
