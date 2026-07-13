export function todayKey() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
}

export function fmtDate(dateKey) {
  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" });
}
