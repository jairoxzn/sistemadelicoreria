import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ProductTable } from "./product-table";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; estado?: string; page?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() ?? "";
  const categoria = params.categoria ?? "";
  const estado = params.estado ?? "";

  const where: Prisma.ProductWhereInput = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { internalCode: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(categoria && { categoryId: categoria }),
    ...(estado && { status: estado === "activo" ? "ACTIVO" : "INACTIVO" }),
  };

  const branchId = session?.user?.branchId;

  const [products, total, categories, brands, suppliers] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        inventories: branchId ? { where: { branchId }, select: { stock: true } } : false,
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { businessName: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Productos" description="Catálogo de productos de la licorería." />
      <ProductTable
        products={products.map((p) => ({
          id: p.id,
          internalCode: p.internalCode,
          barcode: p.barcode,
          name: p.name,
          description: p.description,
          categoryId: p.categoryId,
          categoryName: p.category.name,
          brandId: p.brandId,
          brandName: p.brand?.name ?? null,
          presentation: p.presentation,
          content: p.content,
          unit: p.unit,
          purchasePrice: Number(p.purchasePrice),
          salePrice: Number(p.salePrice),
          wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : null,
          promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
          stockMin: p.stockMin,
          supplierId: p.supplierId,
          imageUrl: p.imageUrl,
          status: p.status,
          stock: p.inventories?.[0]?.stock ?? 0,
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.businessName }))}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        filters={{ q, categoria, estado }}
      />
    </div>
  );
}
