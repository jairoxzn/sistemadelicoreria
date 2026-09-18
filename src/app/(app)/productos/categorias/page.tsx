import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CategoryTable } from "./category-table";

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Categorías"
        description="Organiza tus productos por tipo de bebida u otras categorías."
      />
      <CategoryTable
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          active: c.active,
          productCount: c._count.products,
        }))}
      />
    </div>
  );
}
