import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PromotionTable } from "./promotion-table";

export default async function PromocionesPage() {
  const [promotions, products] = await Promise.all([
    prisma.promotion.findMany({
      orderBy: { startDate: "desc" },
      include: { items: { include: { product: { select: { name: true } } } } },
    }),
    prisma.product.findMany({ where: { status: "ACTIVO" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Promociones"
        description="Descuentos por producto, vigentes en un rango de fechas y horario."
      />
      <PromotionTable
        promotions={promotions.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          discountPercent: p.discountPercent ? Number(p.discountPercent) : null,
          discountAmount: p.discountAmount ? Number(p.discountAmount) : null,
          promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
          minQuantity: p.minQuantity,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate.toISOString(),
          startTime: p.startTime,
          endTime: p.endTime,
          imageUrl: p.imageUrl,
          active: p.active,
          productNames: p.items.map((i) => i.product.name),
          productIds: p.items.map((i) => i.productId),
        }))}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
