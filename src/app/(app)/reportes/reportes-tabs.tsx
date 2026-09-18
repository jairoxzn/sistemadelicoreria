"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Download, Printer, FileBarChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";

const METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  YAPE: "Yape",
  PLIN: "Plin",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

type SaleRow = {
  saleNumber: string;
  createdAt: string;
  userName: string;
  customerName: string;
  total: number;
  methods: string[];
};
type PurchaseRow = { purchaseNumber: string; createdAt: string; supplierName: string; total: number };
type CashRow = {
  id: string;
  userName: string;
  openedAt: string;
  closedAt: string | null;
  status: string;
  openingAmount: number;
  expectedAmount: number | null;
  countedAmount: number | null;
  difference: number | null;
};
type InventoryRow = {
  name: string;
  code: string;
  categoryName: string;
  stock: number;
  stockMin: number;
  value: number;
};

export function ReportesTabs({
  range,
  sales,
  purchases,
  cashRegisters,
  inventory,
}: {
  range: { desde: string; hasta: string };
  sales: SaleRow[];
  purchases: PurchaseRow[];
  cashRegisters: CashRow[];
  inventory: InventoryRow[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateRange(next: Partial<{ desde: string; hasta: string }>) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.desde !== undefined) params.set("desde", next.desde);
    if (next.hasta !== undefined) params.set("hasta", next.hasta);
    router.push(`${pathname}?${params.toString()}`);
  }

  const salesTotal = sales.reduce((a, s) => a + s.total, 0);
  const purchasesTotal = purchases.reduce((a, p) => a + p.total, 0);
  const inventoryValue = inventory.reduce((a, i) => a + i.value, 0);
  const avgTicket = sales.length > 0 ? salesTotal / sales.length : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Desde</label>
          <Input
            type="date"
            value={range.desde}
            onChange={(e) => updateRange({ desde: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Hasta</label>
          <Input
            type="date"
            value={range.hasta}
            onChange={(e) => updateRange({ hasta: e.target.value })}
          />
        </div>
        <Button variant="outline" onClick={() => window.print()} className="print:hidden">
          <Printer className="size-4" />
          Imprimir / PDF
        </Button>
      </div>

      <Tabs defaultValue="ventas">
        <TabsList>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
          <TabsTrigger value="caja">Caja</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard label="Total vendido" value={formatCurrency(salesTotal)} />
            <SummaryCard label="Cantidad de ventas" value={String(sales.length)} />
            <SummaryCard label="Ticket promedio" value={formatCurrency(avgTicket)} />
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  "reporte-ventas.csv",
                  ["N° Venta", "Fecha", "Cliente", "Cajero", "Métodos", "Total"],
                  sales.map((s) => [
                    s.saleNumber,
                    formatDateTime(s.createdAt),
                    s.customerName,
                    s.userName,
                    s.methods.map((m) => METHOD_LABELS[m] ?? m).join(" + "),
                    s.total.toFixed(2),
                  ])
                )
              }
            >
              <Download className="size-4" />
              Exportar CSV
            </Button>
          </div>
          {sales.length === 0 ? (
            <EmptyState icon={FileBarChart} title="No hay ventas en el periodo seleccionado" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Venta</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Cajero</TableHead>
                    <TableHead className="hidden md:table-cell">Método</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((s) => (
                    <TableRow key={s.saleNumber}>
                      <TableCell className="font-medium">{s.saleNumber}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(s.createdAt)}
                      </TableCell>
                      <TableCell>{s.customerName}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {s.userName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {s.methods.map((m) => METHOD_LABELS[m] ?? m).join(" + ")}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(s.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventario" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard label="Valor del inventario" value={formatCurrency(inventoryValue)} />
            <SummaryCard
              label="Productos agotados"
              value={String(inventory.filter((i) => i.stock <= 0).length)}
            />
            <SummaryCard
              label="Productos con stock bajo"
              value={String(inventory.filter((i) => i.stock > 0 && i.stock <= i.stockMin).length)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  "reporte-inventario.csv",
                  ["Producto", "Código", "Categoría", "Stock", "Mínimo", "Valor"],
                  inventory.map((i) => [
                    i.name,
                    i.code,
                    i.categoryName,
                    i.stock,
                    i.stockMin,
                    i.value.toFixed(2),
                  ])
                )
              }
            >
              <Download className="size-4" />
              Exportar CSV
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="hidden sm:table-cell">Mínimo</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((i) => (
                  <TableRow key={i.code}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {i.categoryName}
                    </TableCell>
                    <TableCell>{i.stock}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {i.stockMin}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(i.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="compras" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryCard label="Total comprado" value={formatCurrency(purchasesTotal)} />
            <SummaryCard label="Compras confirmadas" value={String(purchases.length)} />
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  "reporte-compras.csv",
                  ["N° Compra", "Fecha", "Proveedor", "Total"],
                  purchases.map((p) => [
                    p.purchaseNumber,
                    formatDateTime(p.createdAt),
                    p.supplierName,
                    p.total.toFixed(2),
                  ])
                )
              }
            >
              <Download className="size-4" />
              Exportar CSV
            </Button>
          </div>
          {purchases.length === 0 ? (
            <EmptyState icon={FileBarChart} title="No hay compras confirmadas en el periodo" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Compra</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((p) => (
                    <TableRow key={p.purchaseNumber}>
                      <TableCell className="font-medium">{p.purchaseNumber}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(p.createdAt)}
                      </TableCell>
                      <TableCell>{p.supplierName}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="caja" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  "reporte-caja.csv",
                  ["Usuario", "Apertura", "Cierre", "Estado", "Inicial", "Esperado", "Contado", "Diferencia"],
                  cashRegisters.map((c) => [
                    c.userName,
                    formatDateTime(c.openedAt),
                    c.closedAt ? formatDateTime(c.closedAt) : "—",
                    c.status,
                    c.openingAmount.toFixed(2),
                    (c.expectedAmount ?? 0).toFixed(2),
                    (c.countedAmount ?? 0).toFixed(2),
                    (c.difference ?? 0).toFixed(2),
                  ])
                )
              }
            >
              <Download className="size-4" />
              Exportar CSV
            </Button>
          </div>
          {cashRegisters.length === 0 ? (
            <EmptyState icon={FileBarChart} title="No hay aperturas de caja en el periodo" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Apertura</TableHead>
                    <TableHead className="hidden sm:table-cell">Cierre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashRegisters.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.userName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(c.openedAt)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {c.closedAt ? formatDate(c.closedAt) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.status === "ABIERTA" ? "default" : "secondary"}>
                          {c.status === "ABIERTA" ? "Abierta" : "Cerrada"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={
                          !c.difference
                            ? "text-muted-foreground"
                            : c.difference > 0
                              ? "text-primary"
                              : "text-destructive"
                        }
                      >
                        {c.difference !== null ? formatCurrency(c.difference) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
