/** URL publica del sitio, usada para generar enlaces compartibles (ej. el QR del catalogo). */
export function getSiteUrl(): string {
  return process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export function getCatalogUrl(): string {
  return `${getSiteUrl()}/catalogo`;
}
