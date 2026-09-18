import Link from "next/link";
import { AlertTriangle, PackageX, Truck, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Role } from "@/generated/prisma/enums";

export function AlertsCard({
  lowStock,
  outOfStock,
  pendingPurchases,
  role,
}: {
  lowStock: number;
  outOfStock: number;
  pendingPurchases: number;
  role: Role;
}) {
  const canSeeInventory = role === Role.ADMINISTRADOR || role === Role.SUPERVISOR || role === Role.ALMACENERO;
  const canSeeCompras = role === Role.ADMINISTRADOR || role === Role.SUPERVISOR || role === Role.ALMACENERO;

  const alerts = [
    lowStock > 0 && {
      icon: AlertTriangle,
      text: `${lowStock} producto${lowStock === 1 ? "" : "s"} tiene${lowStock === 1 ? "" : "n"} stock bajo`,
      href: canSeeInventory ? "/inventario" : undefined,
      tone: "warning" as const,
    },
    outOfStock > 0 && {
      icon: PackageX,
      text: `${outOfStock} producto${outOfStock === 1 ? "" : "s"} está${outOfStock === 1 ? "" : "n"} agotado${outOfStock === 1 ? "" : "s"}`,
      href: canSeeInventory ? "/inventario" : undefined,
      tone: "destructive" as const,
    },
    pendingPurchases > 0 && {
      icon: Truck,
      text: `${pendingPurchases} compra${pendingPurchases === 1 ? "" : "s"} pendiente${pendingPurchases === 1 ? "" : "s"} de confirmar`,
      href: canSeeCompras ? "/compras" : undefined,
      tone: "warning" as const,
    },
  ].filter(Boolean) as { icon: typeof AlertTriangle; text: string; href?: string; tone: "warning" | "destructive" }[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Alertas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Todo en orden. No hay alertas pendientes.
          </div>
        ) : (
          alerts.map((alert, i) => {
            const content = (
              <div
                className={
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm " +
                  (alert.tone === "destructive"
                    ? "border-destructive/20 bg-destructive/5 text-destructive"
                    : "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400")
                }
              >
                <alert.icon className="size-4 shrink-0" />
                {alert.text}
              </div>
            );
            return alert.href ? (
              <Link key={i} href={alert.href} className="block transition-opacity hover:opacity-80">
                {content}
              </Link>
            ) : (
              <div key={i}>{content}</div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
