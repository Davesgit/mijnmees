// Gesprek met Mees (chat als hoofdingang voor kinderen). Nog zonder AI: Mees antwoordt met vaste teksten en keuzes
// die naar de bestaande oefeningen leiden. Pure functies, zodat dit later achter een AI-route kan blijven werken:
// een AI mag teksten schrijven, maar keuzes/acties blijven uit deze vaste lijst komen.

export type Keuze =
  | { label: string; soort: "ga"; href: string }
  | { label: string; soort: "voorstel" }
  | { label: string; soort: "hervat" }
  | { label: string; soort: "vervolg"; onderwerp: Onderwerp };

export type Bericht = { id: string; van: "kind" | "mees"; tekst: string; keuzes?: Keuze[]; t: number };

export type Gesprek = { id: string; titel: string; berichten: Bericht[]; bijgewerkt: number };

/** Waar een gesprek over kan gaan (vaste lijst; ook de uitkomst van het herkennen van getypte tekst). */
export type Onderwerp = "leren" | "oefenen" | "vraag" | "rekenen" | "tafels" | "europa" | "weetjes" | "werkblad" | "voortgang" | "groet" | "onbekend";

/** Wat Mees weet over het kind om een voorstel te doen (uit de lokale oefenopslag). */
export type Context = {
  /** Naam van een oefening die nog openstaat. */
  open: string | null;
  /** Naam van het voorgestelde onderdeel. */
  voorstel: string;
  aantal: number;
};

export const MAX_GESPREKKEN = 20;
const MAX_TITEL = 40;

export const startkaarten = [
  { onderwerp: "leren", titel: "Iets leren", tekst: "Ontdek nieuwe stof", kindTekst: "Ik wil iets leren." },
  { onderwerp: "oefenen", titel: "Verder oefenen", tekst: "Kies een onderwerp", kindTekst: "Ik wil verder oefenen." },
  { onderwerp: "vraag", titel: "Stel een vraag", tekst: "Krijg duidelijke uitleg", kindTekst: "Ik wil een vraag stellen." },
] as const satisfies readonly { onderwerp: Onderwerp; titel: string; tekst: string; kindTekst: string }[];

const ga = {
  rekenen: { label: "Rekenen", soort: "ga", href: "/kind/rekenen" },
  tafels: { label: "Tafeltrainer", soort: "ga", href: "/kind/tafeltrainer" },
  europa: { label: "Topo Europa", soort: "ga", href: "/kind/aardrijkskunde/europa" },
  weetjes: { label: "Weetjesboek", soort: "ga", href: "/kind/weetjesboek" },
  niveau: { label: "Wat past bij mij?", soort: "ga", href: "/kind/niveaubepaling" },
  werkblad: { label: "Werkblad maken", soort: "ga", href: "/werkbladen/samenstellen" },
  voortgang: { label: "Mijn voortgang", soort: "ga", href: "/kind/voortgang" },
} as const satisfies Record<string, Keuze>;

const onderwerpKeuzes: Keuze[] = [ga.rekenen, ga.tafels, ga.europa, ga.weetjes];

/** Herkent waar een getypte of ingesproken tekst over gaat. Eenvoudige woordherkenning; geen AI. */
export function herken(tekst: string): Onderwerp {
  const t = ` ${tekst.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")} `;
  const heeft = (...woorden: string[]) => woorden.some((w) => t.includes(w));
  if (heeft("tafel", " keer ", "maal", "vermenigvuldig", " x ")) return "tafels";
  if (heeft("europa", "land", "hoofdstad", "topo", "kaart", "aardrijkskunde", "rivier", "gebergte")) return "europa";
  if (heeft("breuk", "procent", "kommagetal", "decimaal", "rekenen", " som ", "sommen", "plus", "min ", "delen", "gedeeld", "meten", "geld", "tijd", "klok")) return "rekenen";
  if (heeft("weetje", "weetjes", "wist je")) return "weetjes";
  if (heeft("werkblad", "printen", "papier")) return "werkblad";
  if (heeft("voortgang", "hoe goed", "wat heb ik")) return "voortgang";
  if (heeft("oefen")) return "oefenen";
  if (heeft("leren", "leer ", "uitleg", "snap", "begrijp")) return "leren";
  if (/^\s*(hoi|hallo|hey|hee|goedemorgen|goedemiddag|dag|hai)\b/.test(t)) return "groet";
  return "onbekend";
}

/** Het antwoord van Mees op een onderwerp. */
export function antwoord(onderwerp: Onderwerp, ctx: Context): Pick<Bericht, "tekst" | "keuzes"> {
  switch (onderwerp) {
    case "leren":
      return {
        tekst: "Leuk! Wat wil je leren? Kies hieronder een onderwerp, of typ wat je wilt weten. Bij elke oefening krijg je hints en uitleg als je die nodig hebt.",
        keuzes: [...onderwerpKeuzes, ga.niveau],
      };
    case "oefenen":
      if (ctx.open)
        return {
          tekst: `Je was bezig met ${ctx.open}. Wil je daar verder mee? Je mag ook iets anders kiezen.`,
          keuzes: [{ label: "Verder waar ik was", soort: "hervat" }, ...onderwerpKeuzes, ga.werkblad],
        };
      return {
        tekst: `Mijn voorstel: ${ctx.voorstel}, ${ctx.aantal} vragen. Je mag ook zelf iets kiezen.`,
        keuzes: [{ label: "Start het voorstel", soort: "voorstel" }, ...onderwerpKeuzes, ga.werkblad],
      };
    case "vraag":
      return { tekst: "Stel je vraag maar! Typ hem hieronder of tik op de microfoon om te praten. Ik kan nog niet alles beantwoorden, maar ik help je graag op weg." };
    case "rekenen":
      return { tekst: "Rekenen! Kies zelf wat je wilt oefenen: breuken, procenten, kommagetallen en meer.", keuzes: [ga.rekenen, ga.tafels, ga.niveau] };
    case "tafels":
      return { tekst: "Tafels oefenen gaat het best met de tafeltrainer. Kies welke tafels je wilt doen.", keuzes: [ga.tafels] };
    case "europa":
      return { tekst: "Op de kaart van Europa oefen je landen, hoofdsteden, rivieren en gebergten.", keuzes: [ga.europa] };
    case "weetjes":
      return { tekst: "In je weetjesboek staan alle weetjes die je al hebt verzameld.", keuzes: [ga.weetjes] };
    case "werkblad":
      return { tekst: "Je kunt een werkblad maken om op papier te oefenen.", keuzes: [ga.werkblad] };
    case "voortgang":
      return { tekst: "Bij je voortgang zie je wat je al goed kunt en wat je nog oefent.", keuzes: [ga.voortgang] };
    case "groet":
      return { tekst: "Hoi! Fijn dat je er bent. Wat wil je doen: iets leren, oefenen of een vraag stellen?", keuzes: [{ label: "Iets leren", soort: "vervolg", onderwerp: "leren" }, { label: "Oefenen", soort: "vervolg", onderwerp: "oefenen" }] };
    case "onbekend":
      return {
        tekst: "Daar kan ik nog geen goed antwoord op geven. Ik leer nog! Wil je samen iets oefenen?",
        keuzes: [{ label: "Ja, oefenen", soort: "vervolg", onderwerp: "oefenen" }, ...onderwerpKeuzes],
      };
  }
}

const VRAAGWOORDEN = /^\s*(wat|wie|waar|waarom|wanneer|hoe|hoeveel|welke?|kun|kan|mag|is|zijn|weet)\b/i;

/** Antwoord op getypte of ingesproken tekst. Een echte vraag kan Mees nog niet zelf beantwoorden: dat zegt hij eerlijk. */
export function reageer(tekst: string, ctx: Context): Pick<Bericht, "tekst" | "keuzes"> {
  const onderwerp = herken(tekst);
  const r = antwoord(onderwerp, ctx);
  const isVraag = tekst.includes("?") || VRAAGWOORDEN.test(tekst);
  if (!isVraag || onderwerp === "onbekend" || onderwerp === "groet" || onderwerp === "oefenen" || onderwerp === "leren") return r;
  return { ...r, tekst: `Op die vraag kan ik nog geen eigen antwoord geven. Maar ik kan je wel helpen oefenen! ${r.tekst}` };
}

export function maakTitel(tekst: string) {
  const t = tekst.trim().replace(/\s+/g, " ");
  return t.length > MAX_TITEL ? `${t.slice(0, MAX_TITEL - 1).trimEnd()}…` : t || "Gesprek met Mees";
}

/** Voegt een gesprek toe of werkt het bij: nieuwste bovenaan, hooguit MAX_GESPREKKEN. */
export function bewaarGesprek(lijst: Gesprek[], gesprek: Gesprek): Gesprek[] {
  return [gesprek, ...lijst.filter((g) => g.id !== gesprek.id)].slice(0, MAX_GESPREKKEN);
}
