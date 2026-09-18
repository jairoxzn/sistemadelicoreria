/** Peru no observa horario de verano: UTC-5 todo el año. */
const LIMA_OFFSET_HOURS = 5;

function limaShifted(): Date {
  return new Date(Date.now() - LIMA_OFFSET_HOURS * 60 * 60 * 1000);
}

/** Instante UTC que corresponde al inicio del día actual en hora de Lima. */
export function startOfTodayLima(): Date {
  const lima = limaShifted();
  return new Date(
    Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), lima.getUTCDate(), LIMA_OFFSET_HOURS, 0, 0, 0)
  );
}

/** Instante UTC que corresponde al inicio del mes actual en hora de Lima. */
export function startOfMonthLima(): Date {
  const lima = limaShifted();
  return new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), 1, LIMA_OFFSET_HOURS, 0, 0, 0));
}

export function daysAgoStartLima(days: number): Date {
  return new Date(startOfTodayLima().getTime() - days * 24 * 60 * 60 * 1000);
}
