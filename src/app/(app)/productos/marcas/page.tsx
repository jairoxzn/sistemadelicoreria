import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { BrandTable } from "./brand-table";

export default async function MarcasPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <PageHeader title="Marcas" description="Marcas comerciales de tus productos." />
      <BrandTable
        brands={brands.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          active: b.active,
          productCount: b._count.products,
        }))}
      />
    </div>
  );
}
