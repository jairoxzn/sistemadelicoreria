import type { Role } from "@/generated/prisma/enums";
import { NavContent } from "@/components/layout/nav-content";

export function AppSidebar({ role }: { role: Role }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
      <NavContent role={role} />
    </aside>
  );
}
