import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SaleTable } from "./sale-table";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() ?? "";
  const estado = params.estado ?? "";

  const where: Prisma.SaleWhereInput = {
    ...(q && {
      OR: [
        { saleNumber: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...(estado && { status: estado === "completada" ? "COMPLETADA" : "ANULADA" }),
  };

  const [sales, total, businessConfig] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true } },
            combo: { select: { name: true } },
            returnItems: { select: { quantity: true } },
          },
        },
        payments: true,
      },
    }),
    prisma.sale.count({ where }),
    prisma.businessConfig.findFirst(),
  ]);

  return (
    <div>
      <PageHeader title="Ventas" description="Historial de ventas realizadas." />
      <SaleTable
        canManage={session?.user?.role === "ADMINISTRADOR" || session?.user?.role === "SUPERVISOR"}
        canReturn={
          session?.user?.role === "ADMINISTRADOR" ||
          session?.user?.role === "SUPERVISOR" ||
          session?.user?.role === "CAJERO"
        }
        sales={sales.map((s) => ({
          id: s.id,
          saleNumber: s.saleNumber,
          customerName: s.customer?.name ?? "Cliente genérico",
          userName: s.user.name,
          subtotal: Number(s.subtotal),
          discount: Number(s.discount),
          total: Number(s.total),
          status: s.status,
          cancelReason: s.cancelReason,
          createdAt: s.createdAt.toISOString(),
          items: s.items.map((i) => ({
            id: i.id,
            name: i.product?.name ?? i.combo?.name ?? "Producto",
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            subtotal: Number(i.subtotal),
            alreadyReturned: i.returnItems.reduce((acc, ri) => acc + ri.quantity, 0),
          })),
          payments: s.payments.map((p) => ({
            method: p.method,
            amount: Number(p.amount),
            receivedAmount: p.receivedAmount ? Number(p.receivedAmount) : null,
            changeAmount: p.changeAmount ? Number(p.changeAmount) : null,
          })),
        }))}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        filters={{ q, estado }}
        business={{
          tradeName: businessConfig?.tradeName ?? "LiquorFlow",
          address: businessConfig?.address ?? null,
          phone: businessConfig?.phone ?? null,
          ticketFooter: businessConfig?.ticketFooter ?? null,
          logoUrl: businessConfig?.logoUrl ?? null,
        }}
      />
    </div>
  );
}
