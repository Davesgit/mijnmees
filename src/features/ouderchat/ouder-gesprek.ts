// De ouderchat: Mees als gesprekspartner voor ouders. Voortgang per kind, samengevat in gewone woorden, met
// suggesties voor thuis. Pure functies (geen opslag of React), zodat ze te testen zijn en later achter een AI-route
// kunnen blijven werken: een AI mag teksten schrijven, de stappen komen uit de vaste lijst (OuderStap).

import type { Antwoord, Keuze, OuderStap, VoortgangKeuze } from "@/features/chat/gesprek";
import { leerdoelNaam, leerdoelSoort, type LeerdoelSoort } from "@/features/oefenen/weergave";
import type { LeerdoelBewijs } from "@/features/voortgang/bewijs";

/** Wat de ouderchat van een kind weet (van de server). */
export type OuderKind = {
  id: string;
  voornaam: string;
  bewijs: LeerdoelBewijs[];
  /** Oefenen in de afgelopen 7 dagen. */
  week: { momenten: number; vragen: number; zelfGoed: number };
};

const soortNaam: Record<LeerdoelSoort, string> = { breuken: "Breuken", tafels: "Tafels", europa: "Topo Europa" };
const soortIn: Record<LeerdoelSoort, string> = { breuken: "bij breuken", tafels: "bij de tafels", europa: "bij topo Europa" };

const ouder = (label: string, doe: OuderStap): Keuze => ({ label, soort: "ouder", doe });

export const ouderStartkaarten = (kinderen: OuderKind[]) => [
  {
    titel: kinderen.length === 1 ? `Hoe gaat het met ${kinderen[0]!.voornaam}?` : "Hoe gaat het met de kinderen?",
    tekst: "Voortgang en deze week",
    icoon: "voortgang" as const,
    vraag: kinderen.length === 1 ? `Hoe gaat het met ${kinderen[0]!.voornaam}?` : "Hoe gaat het met de kinderen?",
    stap: { stap: "voortgang" as const, kindId: kinderen.length === 1 ? kinderen[0]!.id : undefined },
  },
  { titel: "Samen oefenen thuis", tekst: "Tips per onderwerp", icoon: "boek" as const, vraag: "Hoe kan ik thuis helpen met oefenen?", stap: { stap: "thuis" as const } },
  { titel: "Instellingen en privacy", tekst: "Kinderen, tutorhulp, gegevens", icoon: "slot" as const, vraag: "Waar vind ik de instellingen?", stap: { stap: "instellingen" as const } },
];

const schoon = (t: string) => ` ${t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.!?,]/g, " ")} `;

/** Wat bedoelt de ouder? Eenvoudige woordherkenning; geen AI. */
export function herkenOuder(tekst: string, kinderen: OuderKind[]): OuderStap | null {
  const t = schoon(tekst);
  const heeft = (...w: string[]) => w.some((x) => t.includes(x));
  const kind = kinderen.find((k) => t.includes(` ${schoon(k.voornaam).trim()} `));
  const soort: LeerdoelSoort | undefined = heeft("tafel", "keersom", "deelsom") ? "tafels" : heeft("breuk") ? "breuken" : heeft("europa", "topo", "land", "aardrijkskunde") ? "europa" : undefined;
  if (heeft("tip", "thuis", "helpen", "help ", "samen oefenen", "hoe kan ik")) return { stap: "tips", soort };
  if (heeft("werkblad", "printen", "papier")) return { stap: "ga", href: soort === "tafels" ? "/werkbladen/samenstellen?onderwerpen=tafels" : "/werkbladen/samenstellen" };
  if (heeft("kind toevoegen", "nieuw kind", "profiel toevoegen")) return { stap: "ga", href: "/ouder/kind-toevoegen" };
  if (heeft("instelling", "privacy", "account", "tutorhulp", "gegevens", "wachtwoord")) return { stap: "instellingen" };
  if (kind || soort || heeft("voortgang", "hoe gaat", "resultaat", "geoefend", "hoe doet", "gaat het")) return { stap: "voortgang", kindId: kind?.id, filter: soort };
  return null;
}

const opsomming = (namen: string[]) => (namen.length <= 1 ? (namen[0] ?? "") : `${namen.slice(0, -1).join(", ")} en ${namen.at(-1)}`);
const kort = (namen: string[], max = 3) => (namen.length > max ? `${opsomming(namen.slice(0, max))} en nog ${namen.length - max} andere` : opsomming(namen));
const naam = (b: LeerdoelBewijs) => leerdoelNaam(b.leerdoelId).replace(/^De /, "de ");

/** Wat er deze week gebeurde, in één zin. */
export function weekZin(kind: OuderKind): string {
  const { momenten, vragen, zelfGoed } = kind.week;
  if (momenten === 0) return `${kind.voornaam} heeft de afgelopen week niet geoefend.`;
  return `${kind.voornaam} heeft de afgelopen week ${momenten === 1 ? "één keer" : `${momenten} keer`} geoefend: ${vragen} ${vragen === 1 ? "vraag" : "vragen"}, waarvan ${zelfGoed} in één keer zelf goed.`;
}

/** Samenvatting voor de ouder, in de derde persoon. */
export function ouderSamenvatting(kind: OuderKind, items: LeerdoelBewijs[], filter: VoortgangKeuze): string {
  if (items.length === 0) return `${kind.voornaam} heeft ${filter === "alles" ? "nog niet geoefend" : `${soortIn[filter]} nog niet geoefend`}.`;
  const zelf = items.filter((b) => b.status === "gaat-zelfstandig").map(naam);
  const bezig = items.filter((b) => b.status === "aan-het-oefenen").map(naam);
  const terug = items.filter((b) => b.status === "nog-eens-oefenen").map(naam);
  const zinnen: string[] = [];
  const waar = filter === "alles" ? "" : ` ${soortIn[filter]}`;
  if (zelf.length && !bezig.length && !terug.length) zinnen.push(`Alles wat ${kind.voornaam}${waar} heeft geoefend, gaat zelfstandig.`);
  else if (zelf.length) zinnen.push(`${hoofdletter(kort(zelf))} ${zelf.length === 1 ? "gaat" : "gaan"} al zelfstandig.`);
  if (bezig.length) zinnen.push(`Met ${kort(bezig)} is ${kind.voornaam} nog aan het oefenen.`);
  if (terug.length) zinnen.push(`${hoofdletter(kort(terug))} is al even geleden: goed om te herhalen.`);
  return zinnen.join(" ");
}

const hoofdletter = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Voortgang van één kind, alleen het gekozen onderdeel; volgorde: eerst wat aandacht vraagt. */
export function ouderItems(kind: OuderKind, filter: VoortgangKeuze): LeerdoelBewijs[] {
  const volgorde = { "nog-eens-oefenen": 0, "aan-het-oefenen": 1, "gaat-zelfstandig": 2 } as const;
  return kind.bewijs
    .filter((b) => filter === "alles" || leerdoelSoort(b.leerdoelId) === filter)
    .sort((a, b) => volgorde[a.status] - volgorde[b.status] || b.laatstGeoefend.localeCompare(a.laatstGeoefend));
}

const soortenVan = (kind: OuderKind) => (["breuken", "tafels", "europa"] as const).filter((s) => kind.bewijs.some((b) => leerdoelSoort(b.leerdoelId) === s));

/** Werkblad bij een leerdoel (tafels of breuken); Europa heeft (nog) geen werkbladen. */
function werkbladLink(leerdoelId: string): string | null {
  const t = leerdoelId.match(/^(tafel|deeltafel)-(\d+)$/);
  if (t) return `/werkbladen/samenstellen?onderwerpen=tafels&tafels=${t[2]}&bewerkingen=${t[1] === "tafel" ? "x" : ":"}&aantal=12`;
  if (leerdoelSoort(leerdoelId) === "breuken") return "/werkbladen/samenstellen?onderwerpen=breuken&aantal=12";
  return null;
}

/** Tips voor thuis, per onderwerp. Kort en concreet. */
export const tipsPerSoort: Record<LeerdoelSoort, string[]> = {
  tafels: [
    "Oefen kort maar vaak: vijf minuten per dag werkt beter dan een half uur per week.",
    "Begin met de sommen die al lukken (×1, ×2, ×5, ×10) en bouw van daaruit op.",
    "Vraag eerst op volgorde, daarna door elkaar. In de auto of aan tafel kan prima.",
    "Gebruik de omgekeerde som: 7 × 8 = 56, dus 56 : 8 = 7.",
  ],
  breuken: [
    "Verdeel samen een pizza, taart of reep: wat is meer, 1/3 of 1/4?",
    "Laat je kind breuken vergelijken door de stukjes even groot te maken (bijvoorbeeld 1/2 = 2/4).",
    "Gebruik een maatbeker bij het koken: 1/2 liter, 1/4 liter.",
    "Vraag hardop hoe je kind het aanpakt; uitleggen helpt het onthouden.",
  ],
  europa: [
    "Hang een kaart van Europa op een plek waar je vaak komt, bijvoorbeeld in de keuken.",
    "Zoek samen op de kaart waar vakantielanden, familie of voetbalclubs vandaan komen.",
    "Doe een korte quiz in de auto: wat is de hoofdstad van Spanje?",
    "Let op vormen en buurlanden: Italië lijkt op een laars, Nederland grenst aan België en Duitsland.",
  ],
};

/** Het antwoord van Mees op een stap van de ouder. */
export function antwoordOuder(stap: OuderStap, kinderen: OuderKind[]): Antwoord {
  switch (stap.stap) {
    case "voortgang": {
      if (kinderen.length === 0)
        return { tekst: "Je hebt nog geen kind toegevoegd. Voeg eerst een kinderprofiel toe, dan kan je kind meteen beginnen.", keuzes: [ouder("Kind toevoegen", { stap: "ga", href: "/ouder/kind-toevoegen" })] };
      const kind = kinderen.find((k) => k.id === stap.kindId) ?? (kinderen.length === 1 ? kinderen[0] : undefined);
      if (!kind) return { tekst: "Van wie wil je de voortgang zien?", keuzes: kinderen.map((k) => ouder(k.voornaam, { stap: "voortgang", kindId: k.id, filter: stap.filter })) };
      const soorten = soortenVan(kind);
      if (soorten.length === 0)
        return {
          tekst: `${weekZin(kind)} Er is nog geen voortgang te zien. Zodra ${kind.voornaam} oefent, zie je hier wat goed gaat en wat nog aandacht vraagt.`,
          keuzes: [ouder(`Laat ${kind.voornaam} oefenen`, { stap: "ga", href: "/profielen" }), ouder("Tips om samen te oefenen", { stap: "thuis" })],
        };
      const filter = stap.filter ?? (soorten.length === 1 ? soorten[0] : undefined);
      if (!filter)
        return {
          tekst: `${weekZin(kind)} Wat wil je bekijken?`,
          keuzes: [ouder("Alles", { stap: "voortgang", kindId: kind.id, filter: "alles" }), ...soorten.map((s) => ouder(soortNaam[s], { stap: "voortgang", kindId: kind.id, filter: s }))],
        };
      const items = ouderItems(kind, filter);
      const aandacht = items.find((b) => b.status !== "gaat-zelfstandig");
      const werkblad = aandacht ? werkbladLink(aandacht.leerdoelId) : null;
      const keuzes: Keuze[] = [
        ...(aandacht ? [ouder(`Tips voor ${naam(aandacht)}`, { stap: "tips", leerdoelId: aandacht.leerdoelId })] : []),
        ...(aandacht && werkblad ? [ouder(`Werkblad: ${naam(aandacht)}`, { stap: "ga", href: werkblad })] : []),
        ouder(`Laat ${kind.voornaam} oefenen`, { stap: "ga", href: "/profielen" }),
        ...(soorten.length > 1 ? [ouder("Ander onderdeel", { stap: "voortgang", kindId: kind.id })] : []),
        ...(kinderen.length > 1 ? [ouder("Ander kind", { stap: "voortgang" })] : []),
      ];
      return {
        tekst: `${filter === "alles" ? weekZin(kind) + " " : ""}${ouderSamenvatting(kind, items, filter)}`,
        kaart: items.length ? { soort: "ouderVoortgang", kindId: kind.id, filter } : undefined,
        keuzes,
      };
    }
    case "tips": {
      const soort = stap.leerdoelId ? leerdoelSoort(stap.leerdoelId) : stap.soort;
      if (!soort) return { tekst: "Waarmee wil je thuis helpen?", keuzes: (["tafels", "breuken", "europa"] as const).map((s) => ouder(soortNaam[s], { stap: "tips", soort: s })) };
      const over = stap.leerdoelId ? naam({ leerdoelId: stap.leerdoelId } as LeerdoelBewijs) : soortIn[soort].replace(/^bij /, "");
      return {
        tekst: `Zo kun je thuis helpen met ${over}:\n\n${tipsPerSoort[soort].map((t) => `• ${t}`).join("\n")}\n\nHoud het kort en luchtig: vijf minuten is genoeg.`,
        keuzes: [ouder("Tips voor iets anders", { stap: "tips" }), ouder("Bekijk de voortgang", { stap: "voortgang" })],
      };
    }
    case "thuis":
      return {
        tekst: "Samen oefenen werkt het best als het kort, vaak en gezellig is. Waarmee wil je helpen?",
        keuzes: (["tafels", "breuken", "europa"] as const).map((s) => ouder(soortNaam[s], { stap: "tips", soort: s })),
      };
    case "instellingen":
      return {
        tekst: "Wat wil je regelen? Instellingen en privacy staan voorlopig nog op een eigen pagina.",
        keuzes: [
          ouder("Instellingen", { stap: "ga", href: "/ouder/instellingen" }),
          ouder("Privacy en gegevens", { stap: "ga", href: "/ouder/privacy" }),
          ouder("Kind toevoegen", { stap: "ga", href: "/ouder/kind-toevoegen" }),
        ],
      };
    case "ga":
      return { tekst: "Ik open het voor je." };
  }
}

/** Antwoord op getypte tekst van de ouder. */
export function reageerOuder(tekst: string, kinderen: OuderKind[]): Antwoord {
  const stap = herkenOuder(tekst, kinderen);
  if (stap) return antwoordOuder(stap, kinderen);
  return {
    tekst: "Daar kan ik nog geen goed antwoord op geven, ik leer nog. Ik kan je wel laten zien hoe het gaat, of tips geven om thuis te oefenen.",
    keuzes: [ouder("Hoe gaat het?", { stap: "voortgang" }), ouder("Tips voor thuis", { stap: "thuis" }), ouder("Instellingen", { stap: "instellingen" })],
  };
}
