import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CashRegisterStatus, PaymentMethod, SaleStatus } from "@/generated/prisma/enums";
import { PageHeader } from "@/components/shared/page-header";
import { CajaPanel } from "./caja-panel";

export default async function CajaPage() {
  const session = await auth();
  const branchId = session?.user?.branchId;

  const [openRegister, history] = await Promise.all([
    branchId
      ? prisma.cashRegister.findFirst({
          where: { branchId, status: CashRegisterStatus.ABIERTA },
          include: {
            user: { select: { name: true } },
            movements: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
            sales: {
              where: { status: SaleStatus.COMPLETADA },
              include: { payments: true },
            },
          },
        })
      : null,
    branchId
      ? prisma.cashRegister.findMany({
          where: { branchId, status: CashRegisterStatus.CERRADA },
          orderBy: { closedAt: "desc" },
          take: 15,
          include: { user: { select: { name: true } } },
        })
      : [],
  ]);

  const cashSalesTotal =
    openRegister?.sales
      .flatMap((s) => s.payments)
      .filter((p) => p.method === PaymentMethod.EFECTIVO)
      .reduce((acc, p) => acc + Number(p.amount), 0) ?? 0;

  const totalSalesTotal =
    openRegister?.sales.reduce((acc, s) => acc + Number(s.total), 0) ?? 0;

  return (
    <div>
      <PageHeader title="Caja" description="Apertura, movimientos y cierre de caja." />
      <CajaPanel
        openRegister={
          openRegister
            ? {
                id: openRegister.id,
                openingAmount: Number(openRegister.openingAmount),
                openedAt: openRegister.openedAt.toISOString(),
                userName: openRegister.user.name,
                cashSalesTotal,
                totalSalesTotal,
                salesCount: openRegister.sales.length,
                movements: openRegister.movements.map((m) => ({
                  id: m.id,
                  type: m.type,
                  amount: Number(m.amount),
                  description: m.description,
                  userName: m.user.name,
                  createdAt: m.createdAt.toISOString(),
                })),
              }
            : null
        }
        history={history.map((h) => ({
          id: h.id,
          openingAmount: Number(h.openingAmount),
          expectedAmount: h.expectedAmount ? Number(h.expectedAmount) : 0,
          countedAmount: h.countedAmount ? Number(h.countedAmount) : 0,
          difference: h.difference ? Number(h.difference) : 0,
          openedAt: h.openedAt.toISOString(),
          closedAt: h.closedAt?.toISOString() ?? null,
          userName: h.user.name,
        }))}
      />
    </div>
  );
}
