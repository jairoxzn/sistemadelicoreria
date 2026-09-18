"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/format";

type LogRow = {
  id: string;
  userName: string;
  action: string;
  module: string;
  description: string | null;
  createdAt: string;
};

export function AuditTable({
  logs,
  modules,
  total,
  page,
  pageSize,
  filters,
}: {
  logs: LogRow[];
  modules: string[];
  total: number;
  page: number;
  pageSize: number;
  filters: { modulo: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!("page" in next)) params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <Select
        value={filters.modulo || "all"}
        onValueChange={(v) => updateParams({ modulo: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder="Módulo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los módulos</SelectItem>
          {modules.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {logs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No hay registros de auditoría" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="hidden sm:table-cell">Módulo</TableHead>
                  <TableHead className="hidden sm:table-cell">Acción</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{log.userName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{log.module}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {log.action}
                    </TableCell>
                    <TableCell className="max-w-md truncate">{log.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              {total} registro{total === 1 ? "" : "s"} · Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Siguiente
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
