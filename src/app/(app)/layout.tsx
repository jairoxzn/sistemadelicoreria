import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { getAdminAlerts } from "@/lib/alerts";
import { Role } from "@/generated/prisma/enums";

const ALERT_ROLES: Role[] = [Role.ADMINISTRADOR, Role.SUPERVISOR, Role.ALMACENERO];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const canSeeAlerts = ALERT_ROLES.includes(session.user.role);

  const [branch, alerts] = await Promise.all([
    session.user.branchId
      ? prisma.branch.findUnique({
          where: { id: session.user.branchId },
          select: { name: true },
        })
      : Promise.resolve(null),
    canSeeAlerts ? getAdminAlerts() : Promise.resolve([]),
  ]);

  return (
    <div className="flex h-svh overflow-hidden">
      <AppSidebar role={session.user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          name={session.user.name ?? session.user.email ?? "Usuario"}
          role={session.user.role}
          branchName={branch?.name ?? null}
          alerts={alerts}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
