/** Validate user-supplied zones before parsing or saving any timestamps. */
export const isTimeZone = (value: unknown): value is string => {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Format an instant in the journal zone, with an unambiguous date and 24-hour time. */
export const formatTimestamp = (iso: string, timeZone: string): string => {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`;
};

/** Indonesian names for the zones most of our users are in. */
const INDONESIAN_ZONES: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Pontianak": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

/**
 * Names a zone unambiguously for AI prompts, e.g. "Asia/Jakarta (WIB, UTC+07:00)",
 * so the model never has to guess which clock a time is on.
 */
export const timeZoneLabel = (timeZone: string, at = new Date()): string => {
  const offset =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(at)
      .find((part) => part.type === "timeZoneName")
      ?.value.replace("GMT", "UTC") ?? "UTC";
  const local = INDONESIAN_ZONES[timeZone];
  return `${timeZone} (${local ? `${local}, ` : ""}${offset === "UTC" ? "UTC+00:00" : offset})`;
};

/** "YYYY-MM-DD HH:MM" in the given zone, for AI prompts. */
export const formatForAi = (iso: string, timeZone: string): string =>
  formatTimestamp(iso, timeZone).slice(0, 16);
