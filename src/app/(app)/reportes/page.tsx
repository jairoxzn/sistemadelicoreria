import { prisma } from "@/lib/prisma";
import { SaleStatus, PurchaseStatus } from "@/generated/prisma/enums";
import { PageHeader } from "@/components/shared/page-header";
import { ReportesTabs } from "./reportes-tabs";
import { startOfMonthLima } from "@/lib/dates";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const params = await searchParams;
  const defaultStart = startOfMonthLima();
  const desde = params.desde ? new Date(`${params.desde}T00:00:00-05:00`) : defaultStart;
  const hasta = params.hasta
    ? new Date(`${params.hasta}T23:59:59-05:00`)
    : new Date();

  const [sales, purchases, cashRegisters, products] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: desde, lte: hasta } },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        customer: { select: { name: true } },
        payments: true,
      },
    }),
    prisma.purchase.findMany({
      where: { createdAt: { gte: desde, lte: hasta } },
      orderBy: { createdAt: "desc" },
      include: { supplier: { select: { businessName: true } } },
    }),
    prisma.cashRegister.findMany({
      where: { openedAt: { gte: desde, lte: hasta } },
      orderBy: { openedAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVO" },
      include: { category: { select: { name: true } }, inventories: true },
    }),
  ]);

  const completedSales = sales.filter((s) => s.status === SaleStatus.COMPLETADA);
  const confirmedPurchases = purchases.filter((p) => p.status === PurchaseStatus.CONFIRMADA);

  return (
    <div>
      <PageHeader title="Reportes" description="Ventas, inventario, compras y caja." />
      <ReportesTabs
        range={{
          desde: desde.toISOString().slice(0, 10),
          hasta: hasta.toISOString().slice(0, 10),
        }}
        sales={completedSales.map((s) => ({
          saleNumber: s.saleNumber,
          createdAt: s.createdAt.toISOString(),
          userName: s.user.name,
          customerName: s.customer?.name ?? "Cliente genérico",
          total: Number(s.total),
          methods: s.payments.map((p) => p.method),
        }))}
        purchases={confirmedPurchases.map((p) => ({
          purchaseNumber: p.purchaseNumber,
          createdAt: p.createdAt.toISOString(),
          supplierName: p.supplier.businessName,
          total: Number(p.total),
        }))}
        cashRegisters={cashRegisters.map((c) => ({
          id: c.id,
          userName: c.user.name,
          openedAt: c.openedAt.toISOString(),
          closedAt: c.closedAt?.toISOString() ?? null,
          status: c.status,
          openingAmount: Number(c.openingAmount),
          expectedAmount: c.expectedAmount ? Number(c.expectedAmount) : null,
          countedAmount: c.countedAmount ? Number(c.countedAmount) : null,
          difference: c.difference ? Number(c.difference) : null,
        }))}
        inventory={products.map((p) => {
          const stock = p.inventories.reduce((acc, i) => acc + i.stock, 0);
          return {
            name: p.name,
            code: p.internalCode,
            categoryName: p.category.name,
            stock,
            stockMin: p.stockMin,
            value: stock * Number(p.purchasePrice),
          };
        })}
      />
    </div>
  );
}
