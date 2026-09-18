import "server-only";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CountableDelegate = { count: (args?: any) => Promise<number> };

/** Genera un correlativo tipo "V-000123" contando los registros existentes dentro de la transacción. */
export async function nextNumber(
  delegate: CountableDelegate,
  prefix: string,
  padding = 6
): Promise<string> {
  const count = await delegate.count();
  return `${prefix}-${String(count + 1).padStart(padding, "0")}`;
}
