const dagFormaat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Amsterdam",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Kalenderdag (jjjj-mm-dd) in de tijdzone Europe/Amsterdam. */
export function dagInAmsterdam(datum: Date) {
  return dagFormaat.format(datum);
}

export function dagenGeleden(iso: string, nu = new Date()) {
  return Math.floor((nu.getTime() - new Date(iso).getTime()) / 86_400_000);
}
