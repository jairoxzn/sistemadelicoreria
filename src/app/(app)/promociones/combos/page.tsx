import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ComboTable } from "./combo-table";

export default async function CombosPage() {
  const [combos, products] = await Promise.all([
    prisma.combo.findMany({
      orderBy: { name: "asc" },
      include: { items: { include: { product: { select: { name: true, salePrice: true } } } } },
    }),
    prisma.product.findMany({ where: { status: "ACTIVO" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Combos" description="Productos compuestos vendidos como paquete." />
      <ComboTable
        combos={combos.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          price: Number(c.price),
          active: c.active,
          items: c.items.map((i) => ({
            productId: i.productId,
            productName: i.product.name,
            quantity: i.quantity,
            unitPrice: Number(i.product.salePrice),
          })),
        }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          salePrice: Number(p.salePrice),
        }))}
      />
    </div>
  );
}
