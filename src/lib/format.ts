/**
 * Node y el navegador pueden traer versiones distintas de ICU, que a veces
 * formatean fechas/monedas con espacios distintos (U+00A0, U+202F) para el
 * mismo locale. Normalizamos a espacio comun para evitar errores de hidratacion.
 */
function normalizeSpaces(value: string): string {
  return value.replace(/[  ]/g, " ");
}

export function formatCurrency(value: number | string | { toString(): string }): string {
  const num = typeof value === "number" ? value : Number(value.toString());
  return normalizeSpaces(
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(num)
  );
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return normalizeSpaces(
    new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d)
  );
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return normalizeSpaces(
    new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  );
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return normalizeSpaces(
    new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      day: "2-digit",
      month: "short",
    }).format(d)
  );
}
