import { prisma } from "@/lib/prisma";
import { SaleStatus } from "@/generated/prisma/enums";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerTable } from "./customer-table";

export default async function ClientesPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      sales: {
        where: { status: SaleStatus.COMPLETADA },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <div>
      <PageHeader title="Clientes" description="Base de clientes de la licorería." />
      <CustomerTable
        customers={customers.map((c) => ({
          id: c.id,
          name: c.name,
          documentType: (c.documentType as "DNI" | "RUC" | null) ?? "NONE",
          documentNumber: c.documentNumber,
          phone: c.phone,
          whatsapp: c.whatsapp,
          address: c.address,
          email: c.email,
          active: c.active,
          totalPurchased: c.sales.reduce((acc, s) => acc + Number(s.total), 0),
          lastPurchaseAt: c.sales[0]?.createdAt.toISOString() ?? null,
          salesCount: c.sales.length,
        }))}
      />
    </div>
  );
}
