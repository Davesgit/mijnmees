// Hoe lang geleden een gesprek is bijgewerkt, in gewone woorden (voor het menu, zoeken en alle chats).

/** "Vandaag", "Gisteren" of de dag. */
export function wanneer(t: number) {
  const dag = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const verschil = Math.round((dag(new Date()) - dag(new Date(t))) / 86400000);
  if (verschil <= 0) return "Vandaag";
  if (verschil === 1) return "Gisteren";
  if (verschil < 7) return new Date(t).toLocaleDateString("nl-NL", { weekday: "long" });
  return new Date(t).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
}
