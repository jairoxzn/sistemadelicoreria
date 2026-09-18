"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu, LogOut, User, Bell, AlertTriangle, PackageX, Truck, CheckCircle2 } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/rbac";
import type { AdminAlert } from "@/lib/alerts";
import { NavContent } from "@/components/layout/nav-content";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "cn";

const ALERT_ICONS: Record<string, typeof AlertTriangle> = {
  "Producto agotado": PackageX,
  "Stock bajo": AlertTriangle,
  "Compra pendiente de confirmar": Truck,
};

export function AppHeader({
  name,
  role,
  branchName,
  alerts,
}: {
  name: string;
  role: Role;
  branchName: string | null;
  alerts: AdminAlert[];
}) {
  const [open, setOpen] = React.useState(false);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <NavContent role={role} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        {branchName && (
          <span className="hidden text-sm text-muted-foreground sm:inline">{branchName}</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
              {alerts.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {alerts.length > 9 ? "9+" : alerts.length}
                </span>
              )}
              <span className="sr-only">Notificaciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-w-[90vw]">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alerts.length === 0 ? (
              <div className="flex items-center gap-2 px-1.5 py-3 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                No tienes notificaciones pendientes.
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {alerts.map((alert) => {
                  const Icon = ALERT_ICONS[alert.title] ?? AlertTriangle;
                  return (
                    <DropdownMenuItem key={alert.id} asChild>
                      <Link href={alert.href} className="flex-col items-start gap-0.5 py-2">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 text-sm font-medium",
                            alert.tone === "destructive" ? "text-destructive" : "text-amber-700 dark:text-amber-400"
                          )}
                        >
                          <Icon className="size-3.5 shrink-0" />
                          {alert.title}
                        </span>
                        <span className="pl-5 text-xs text-muted-foreground">
                          {alert.description}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials || <User className="size-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none">{name}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
