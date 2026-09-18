import Link from "next/link";
import { Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CashRegisterStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PosClient } from "@/components/pos/pos-client";

export default async function PosPage() {
  const session = await auth();
  const branchId = session?.user?.branchId;

  const [cashRegister, products, combos, categories, customers, businessConfig] = await Promise.all([
    branchId
      ? prisma.cashRegister.findFirst({
          where: { branchId, status: CashRegisterStatus.ABIERTA },
        })
      : null,
    branchId
      ? prisma.product.findMany({
          where: { status: "ACTIVO" },
          orderBy: { name: "asc" },
          include: {
            category: { select: { id: true, name: true } },
            inventories: { where: { branchId }, select: { stock: true } },
          },
        })
      : [],
    branchId
      ? prisma.combo.findMany({
          where: { active: true },
          orderBy: { name: "asc" },
          include: {
            items: {
              include: { product: { include: { inventories: { where: { branchId } } } } },
            },
          },
        })
      : [],
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.businessConfig.findFirst(),
  ]);

  if (!cashRegister) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Wallet}
          title="No hay una caja abierta"
          description="Debes abrir caja antes de poder registrar ventas en el punto de venta."
          action={
            <Button asChild>
              <Link href="/caja">Ir a Caja</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <PosClient
      cashRegisterId={cashRegister.id}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        internalCode: p.internalCode,
        barcode: p.barcode,
        salePrice: Number(p.salePrice),
        promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        stock: p.inventories[0]?.stock ?? 0,
        imageUrl: p.imageUrl,
      }))}
      combos={combos.map((c) => ({
        id: c.id,
        name: c.name,
        price: Number(c.price),
        stock: Math.min(
          ...c.items.map((i) =>
            Math.floor((i.product.inventories[0]?.stock ?? 0) / i.quantity)
          )
        ),
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      customers={customers.map((c) => ({ id: c.id, name: c.name, documentNumber: c.documentNumber }))}
      canDiscount={session?.user?.role === "ADMINISTRADOR"}
      business={{
        tradeName: businessConfig?.tradeName ?? "LiquorFlow",
        address: businessConfig?.address ?? null,
        phone: businessConfig?.phone ?? null,
        ticketFooter: businessConfig?.ticketFooter ?? null,
        logoUrl: businessConfig?.logoUrl ?? null,
      }}
    />
  );
}
