// Regels voor live-lessen (beginvoorstel uit de overdracht; configureerbaar, geen diagnose).

export const lesConfig = {
  versie: 1,
  /** Lesvoorstel: zoveel verschillende kinderen binnen de periode. */
  signaalKinderen: 3,
  signaalDagen: 14,
  standaardCapaciteit: 20,
  maxCapaciteit: 20,
  minDuur: 15,
  maxDuur: 30,
  /** De tutor kan de les zoveel minuten voor de begintijd starten. */
  startVensterMin: 15,
  /** Na het einde van de geplande tijd blijft meedoen nog zo lang mogelijk. */
  uitloopMin: 30,
  maxVragenPerKind: 5,
  vraagPauzeSec: 20,
} as const;

export const TIJDZONE = "Europe/Amsterdam";

/** Verschil (ms) tussen Amsterdamse tijd en UTC op een moment. */
function verschil(utcMs: number) {
  const delen = new Intl.DateTimeFormat("en-US", {
    timeZone: TIJDZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const d = Object.fromEntries(delen.map((p) => [p.type, p.value]));
  return Date.UTC(+d.year, +d.month - 1, +d.day, +d.hour, +d.minute, +d.second) - utcMs;
}

/** "2026-10-20T15:30" (Amsterdamse tijd, uit een datetime-local veld) → UTC ISO. Null bij ongeldige invoer. */
export function amsterdamNaarUtc(lokaal: string): string | null {
  const m = lokaal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  const alsUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let utc = alsUtc - verschil(alsUtc);
  utc = alsUtc - verschil(utc); // tweede stap rond de zomertijdwissel
  return Number.isNaN(utc) ? null : new Date(utc).toISOString();
}

const lesDatum = new Intl.DateTimeFormat("nl-NL", { timeZone: TIJDZONE, weekday: "long", day: "numeric", month: "long" });
const lesTijd = new Intl.DateTimeFormat("nl-NL", { timeZone: TIJDZONE, hour: "2-digit", minute: "2-digit" });
export const formatLesDatum = (iso: string) => lesDatum.format(new Date(iso));
export const formatLesTijd = (iso: string) => lesTijd.format(new Date(iso));

export type LesStatus = "gepland" | "live" | "afgelopen" | "geannuleerd";

/** Mag de tutor de les nu starten? */
export function kanStarten(startOp: string, duurMin: number, nu = Date.now()) {
  const start = Date.parse(startOp);
  return nu >= start - lesConfig.startVensterMin * 60_000 && nu <= start + (duurMin + lesConfig.uitloopMin) * 60_000;
}

/** Mag een kind (nog) meedoen met een lopende les? */
export function kanMeedoen(status: LesStatus, startOp: string, duurMin: number, nu = Date.now()) {
  return status === "live" && nu <= Date.parse(startOp) + (duurMin + lesConfig.uitloopMin) * 60_000;
}

/**
 * Privévragen: geen contactgegevens of links. Zulke vragen gaan apart ("Nog beoordelen"),
 * niet direct in de lijst van de tutor. Geen automatisch oordeel over de inhoud zelf.
 */
export function modereerVraag(tekst: string): { status: "nieuw" | "apart"; reden?: string } {
  const t = tekst.toLowerCase();
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(t)) return { status: "apart", reden: "E-mailadres" };
  if (/(https?:\/\/|www\.|\.(nl|com|be|org|net)\b)/.test(t)) return { status: "apart", reden: "Link" };
  if (/(\+?\d[\s-]?){8,}/.test(t)) return { status: "apart", reden: "Telefoonnummer" };
  if (/(instagram|snapchat|tiktok|whatsapp|discord|telegram|adres|woon ik|mijn huis)/.test(t)) return { status: "apart", reden: "Contact of privégegevens" };
  return { status: "nieuw" };
}

export type SignaalPoging = { kindId: string; leerdoelId: string; op: string };

/**
 * Lesvoorstel: per leerdoel het aantal verschillende kinderen dat in de periode de uitleg nodig had.
 * Alleen tellen, geen namen: de tutor ziet feitelijke aantallen.
 */
export function lesSignalen(pogingen: SignaalPoging[], nu = Date.now()) {
  const vanaf = nu - lesConfig.signaalDagen * 86_400_000;
  const perDoel = new Map<string, Set<string>>();
  for (const p of pogingen) {
    if (Date.parse(p.op) < vanaf) continue;
    perDoel.set(p.leerdoelId, (perDoel.get(p.leerdoelId) ?? new Set()).add(p.kindId));
  }
  return [...perDoel]
    .map(([leerdoelId, kinderen]) => ({ leerdoelId, kinderen: [...kinderen] }))
    .filter((s) => s.kinderen.length >= lesConfig.signaalKinderen)
    .sort((a, b) => b.kinderen.length - a.kinderen.length);
}
