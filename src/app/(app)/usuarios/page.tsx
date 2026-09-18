import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { UserTable } from "./user-table";

export default async function UsuariosPage() {
  const [users, branches] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: { branch: { select: { name: true } } },
    }),
    prisma.branch.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Usuarios" description="Cuentas y roles del sistema." />
      <UserTable
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          branchId: u.branchId,
          branchName: u.branch?.name ?? null,
          active: u.active,
        }))}
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
