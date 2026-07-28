export function todayKey(): string {
  // Day boundary is 3am, not midnight — shift back 3h before reading the calendar date.
  const shifted = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return shifted.toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
}

export function fmtDate(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" });
}
