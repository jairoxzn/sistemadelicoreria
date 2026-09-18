import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { BranchTable } from "./branch-table";

export default async function SucursalesPage() {
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, sales: true } } },
  });

  return (
    <div>
      <PageHeader title="Sucursales" description="Sedes de la licorería." />
      <BranchTable
        branches={branches.map((b) => ({
          id: b.id,
          name: b.name,
          address: b.address,
          phone: b.phone,
          isMain: b.isMain,
          active: b.active,
          userCount: b._count.users,
          salesCount: b._count.sales,
        }))}
      />
    </div>
  );
}
