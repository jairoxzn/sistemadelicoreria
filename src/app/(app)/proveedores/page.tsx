import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { SupplierTable } from "./supplier-table";

export default async function ProveedoresPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { businessName: "asc" },
    include: { _count: { select: { purchases: true, products: true } } },
  });

  return (
    <div>
      <PageHeader title="Proveedores" description="Distribuidores y proveedores de mercadería." />
      <SupplierTable
        suppliers={suppliers.map((s) => ({
          id: s.id,
          businessName: s.businessName,
          tradeName: s.tradeName,
          ruc: s.ruc,
          contactName: s.contactName,
          phone: s.phone,
          whatsapp: s.whatsapp,
          address: s.address,
          email: s.email,
          active: s.active,
          purchaseCount: s._count.purchases,
          productCount: s._count.products,
        }))}
      />
    </div>
  );
}
