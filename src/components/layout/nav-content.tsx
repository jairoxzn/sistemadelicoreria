"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Wine } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-items";
import type { Role } from "@/generated/prisma/enums";
import { cn } from "cn";

export function NavContent({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
          <Wine className="size-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          LiquorFlow
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {items.map((item) => {
          const children = item.children?.filter((c) => c.roles.includes(role));
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          if (children && children.length > 1) {
            return (
              <NavGroup
                key={item.href}
                item={item}
                childItems={children}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive && "bg-sidebar-accent text-sidebar-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function NavGroup({
  item,
  childItems,
  pathname,
  onNavigate,
}: {
  item: (typeof NAV_ITEMS)[number];
  childItems: { label: string; href: string }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = pathname.startsWith(item.href);
  const [open, setOpen] = React.useState(isActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
          isActive && "text-sidebar-foreground"
        )}
      >
        <item.icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="mt-1 space-y-1 border-l border-sidebar-border pl-6">
          {childItems.map((child) => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-lg px-3 py-1.5 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  childActive && "bg-sidebar-accent text-sidebar-foreground"
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
