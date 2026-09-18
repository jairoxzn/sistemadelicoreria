import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Truck,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Role, SaleStatus, PurchaseStatus, CashRegisterStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertsCard } from "@/components/dashboard/alerts-card";
import {
  SalesTrendChart,
  TopProductsChart,
  CategorySalesChart,
  PaymentMethodsChart,
} from "@/components/dashboard/dashboard-charts";
import { startOfTodayLima, startOfMonthLima, daysAgoStartLima } from "@/lib/dates";
import { formatShortDate } from "@/lib/format";

export default async function DashboardPage() {
  const session = await auth();
  const todayStart = startOfTodayLima();
  const monthStart = startOfMonthLima();
  const sevenDaysStart = daysAgoStartLima(6);

  const [
    salesToday,
    salesMonth,
    purchasesMonth,
    lowStockCount,
    outOfStockCount,
    pendingPurchases,
    openCashRegisters,
    monthSaleItems,
    last7DaysSales,
    paymentsMonth,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { status: SaleStatus.COMPLETADA, createdAt: { gte: todayStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { status: SaleStatus.COMPLETADA, createdAt: { gte: monthStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.purchase.aggregate({
      where: { status: PurchaseStatus.CONFIRMADA, createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM inventories i
      JOIN products p ON p.id = i."productId"
      WHERE i.stock > 0 AND i.stock <= p."stockMin" AND p.status = 'ACTIVO'
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM inventories i
      JOIN products p ON p.id = i."productId"
      WHERE i.stock = 0 AND p.status = 'ACTIVO'
    `,
    prisma.purchase.count({ where: { status: PurchaseStatus.BORRADOR } }),
    prisma.cashRegister.findMany({
      where: { status: CashRegisterStatus.ABIERTA },
      select: { openingAmount: true },
    }),
    prisma.saleItem.findMany({
      where: { sale: { status: SaleStatus.COMPLETADA, createdAt: { gte: monthStart } } },
      select: {
        quantity: true,
        subtotal: true,
        product: {
          select: { id: true, name: true, purchasePrice: true, category: { select: { name: true } } },
        },
        combo: { select: { id: true, name: true, price: true } },
      },
    }),
    prisma.sale.findMany({
      where: { status: SaleStatus.COMPLETADA, createdAt: { gte: sevenDaysStart } },
      select: { total: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { sale: { status: SaleStatus.COMPLETADA, createdAt: { gte: monthStart } } },
      select: { method: true, amount: true },
    }),
  ]);

  const estimatedProfit = monthSaleItems.reduce((acc, item) => {
    if (item.product) {
      const cost = Number(item.product.purchasePrice) * item.quantity;
      return acc + (Number(item.subtotal) - cost);
    }
    return acc + Number(item.subtotal) * 0.25;
  }, 0);

  const productsSoldCount = monthSaleItems.reduce((acc, item) => acc + item.quantity, 0);

  const cashOnHand = openCashRegisters.reduce((acc, c) => acc + Number(c.openingAmount), 0);

  // Ventas ultimos 7 dias
  const dayBuckets: { date: string; total: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysStart.getTime() + i * 24 * 60 * 60 * 1000);
    dayBuckets.push({ date: formatShortDate(d), total: 0 });
  }
  for (const sale of last7DaysSales) {
    const diffDays = Math.floor(
      (sale.createdAt.getTime() - sevenDaysStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (diffDays >= 0 && diffDays < 7) {
      dayBuckets[diffDays].total += Number(sale.total);
    }
  }

  // Top productos
  const productTotals = new Map<string, { name: string; quantity: number }>();
  for (const item of monthSaleItems) {
    const key = item.product?.id ?? item.combo?.id ?? "otro";
    const name = item.product?.name ?? item.combo?.name ?? "Otro";
    const prev = productTotals.get(key);
    productTotals.set(key, { name, quantity: (prev?.quantity ?? 0) + item.quantity });
  }
  const topProducts = [...productTotals.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Ventas por categoria
  const categoryTotals = new Map<string, number>();
  for (const item of monthSaleItems) {
    const name = item.product?.category?.name ?? "Combos";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + Number(item.subtotal));
  }
  const categoryData = [...categoryTotals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Metodos de pago
  const methodLabels: Record<string, string> = {
    EFECTIVO: "Efectivo",
    YAPE: "Yape",
    PLIN: "Plin",
    TARJETA: "Tarjeta",
    TRANSFERENCIA: "Transferencia",
  };
  const methodTotals = new Map<string, number>();
  for (const p of paymentsMonth) {
    methodTotals.set(p.method, (methodTotals.get(p.method) ?? 0) + Number(p.amount));
  }
  const paymentData = [...methodTotals.entries()].map(([method, total]) => ({
    name: methodLabels[method] ?? method,
    total,
  }));

  const lowStock = Number(lowStockCount[0]?.count ?? 0);
  const outOfStock = Number(outOfStockCount[0]?.count ?? 0);

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${session?.user?.name?.split(" ")[0] ?? ""}`}
        description="Resumen general del negocio."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Ventas de hoy"
          value={Number(salesToday._sum.total ?? 0)}
          isCurrency
          helper={`${salesToday._count} venta(s)`}
        />
        <StatCard
          icon={TrendingUp}
          label="Ventas del mes"
          value={Number(salesMonth._sum.total ?? 0)}
          isCurrency
          helper={`${salesMonth._count} venta(s)`}
        />
        <StatCard
          icon={DollarSign}
          label="Ganancia estimada"
          value={estimatedProfit}
          isCurrency
          helper="Este mes"
          accent="gold"
        />
        <StatCard
          icon={ShoppingBag}
          label="Productos vendidos"
          value={productsSoldCount}
          helper="Este mes"
        />
        <StatCard
          icon={AlertTriangle}
          label="Stock bajo"
          value={lowStock}
          helper="Productos por reponer"
          accent={lowStock > 0 ? "warning" : undefined}
        />
        <StatCard
          icon={XCircle}
          label="Productos agotados"
          value={outOfStock}
          helper="Sin stock disponible"
          accent={outOfStock > 0 ? "destructive" : undefined}
        />
        <StatCard
          icon={Truck}
          label="Compras del mes"
          value={Number(purchasesMonth._sum.total ?? 0)}
          isCurrency
        />
        <StatCard
          icon={Wallet}
          label="Caja actual"
          value={cashOnHand}
          isCurrency
          helper={`${openCashRegisters.length} caja(s) abierta(s)`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesTrendChart data={dayBuckets} />
        <TopProductsChart data={topProducts} />
        <CategorySalesChart data={categoryData} />
        <PaymentMethodsChart data={paymentData} />
      </div>

      <div className="mt-6">
        <AlertsCard
          lowStock={lowStock}
          outOfStock={outOfStock}
          pendingPurchases={pendingPurchases}
          role={session?.user?.role ?? Role.CAJERO}
        />
      </div>
    </div>
  );
}
