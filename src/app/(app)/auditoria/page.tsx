import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { AuditTable } from "./audit-table";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 30;

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ modulo?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const modulo = params.modulo ?? "";

  const where: Prisma.AuditLogWhereInput = modulo ? { module: modulo } : {};

  const [logs, total, modules] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true } } },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ distinct: ["module"], select: { module: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Auditoría" description="Registro de acciones realizadas en el sistema." />
      <AuditTable
        logs={logs.map((l) => ({
          id: l.id,
          userName: l.user?.name ?? "Sistema",
          action: l.action,
          module: l.module,
          description: l.description,
          createdAt: l.createdAt.toISOString(),
        }))}
        modules={modules.map((m) => m.module)}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        filters={{ modulo }}
      />
    </div>
  );
}
