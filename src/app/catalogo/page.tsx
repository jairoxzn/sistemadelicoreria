import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CatalogClient } from "@/components/catalog/catalog-client";
import { SaleStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Catálogo | LiquorFlow",
  description: "Catálogo de licores disponibles.",
};

export const revalidate = 300;

const NEW_PRODUCT_DAYS = 14;
const TOP_SELLERS_COUNT = 3;

export default async function CatalogoPage() {
  const now = new Date();
  const newSince = new Date(now.getTime() - NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000);

  const [business, categories, products, salesAgg] = await Promise.all([
    prisma.businessConfig.findFirst(),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { status: "ACTIVO" },
      orderBy: { name: "asc" },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { name: true } },
      },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null }, sale: { status: SaleStatus.COMPLETADA } },
      _sum: { quantity: true },
    }),
  ]);

  const soldByProduct = new Map(salesAgg.map((s) => [s.productId as string, s._sum.quantity ?? 0]));
  const topSellerIds = new Set(
    [...soldByProduct.entries()]
      .filter(([, qty]) => qty > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_SELLERS_COUNT)
      .map(([id]) => id)
  );

  const categoryIdsWithProducts = new Set(products.map((p) => p.categoryId));

  const mappedProducts = products.map((p) => {
    const salePrice = Number(p.promoPrice ?? p.salePrice);
    const originalPrice = p.promoPrice ? Number(p.salePrice) : null;
    return {
      id: p.id,
      name: p.name,
      brandName: p.brand?.name ?? null,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      presentation: p.presentation,
      content: p.content,
      salePrice,
      originalPrice,
      imageUrl: p.imageUrl,
      soldCount: soldByProduct.get(p.id) ?? 0,
      isTopSeller: topSellerIds.has(p.id),
      isNew: p.createdAt >= newSince,
    };
  });

  const brandCounts = new Map<string, number>();
  const presentationCounts = new Map<string, number>();
  let minPrice = Infinity;
  let maxPrice = 0;

  for (const p of mappedProducts) {
    if (p.brandName) brandCounts.set(p.brandName, (brandCounts.get(p.brandName) ?? 0) + 1);
    if (p.presentation)
      presentationCounts.set(p.presentation, (presentationCounts.get(p.presentation) ?? 0) + 1);
    minPrice = Math.min(minPrice, p.salePrice);
    maxPrice = Math.max(maxPrice, p.salePrice);
  }

  if (!Number.isFinite(minPrice)) minPrice = 0;

  return (
    <CatalogClient
      business={{
        tradeName: business?.tradeName ?? "LiquorFlow",
        address: business?.address ?? null,
        phone: business?.phone ?? null,
        whatsapp: business?.whatsapp ?? null,
        logoUrl: business?.logoUrl ?? null,
        bannerUrl: business?.bannerUrl ?? null,
      }}
      categories={categories
        .filter((c) => categoryIdsWithProducts.has(c.id))
        .map((c) => ({ id: c.id, name: c.name }))}
      products={mappedProducts}
      brands={[...brandCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }))}
      presentations={[...presentationCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }))}
      priceBounds={{ min: Math.floor(minPrice), max: Math.ceil(maxPrice) }}
    />
  );
}
