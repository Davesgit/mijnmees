// Gesprek met Mees: de chat is de enige plek waar een kind werkt. Nog zonder AI: Mees antwoordt met vaste teksten,
// keuzes en kaarten (tafels kiezen, oefenen, voortgang, weetjes) die in het gesprek zelf werken. Pure functies, zodat
// dit later achter een AI-route kan blijven werken: een AI mag teksten schrijven, maar acties komen uit deze vaste lijst.

/** Een kaart in een bericht van Mees: iets om te kiezen of te bekijken, binnen het gesprek. */
export type Kaart =
  | { soort: "voorstel"; standaard: string }
  | { soort: "tafels"; tafels: number[]; bewerking?: "x" | ":" | "beide" }
  | { soort: "europa"; vorm?: "afwisselend" | "puzzel"; onderwerpen?: string[] }
  | { soort: "voortgang" }
  | { soort: "weetjes" }
  | { soort: "weetje"; id: string };

export type Keuze =
  /** Alleen voor het bewaren van gastvoortgang (een pagina voor de ouder). */
  | { label: string; soort: "ga"; href: string }
  | { label: string; soort: "voorstel" }
  | { label: string; soort: "hervat" }
  | { label: string; soort: "vervolg"; onderwerp: Onderwerp }
  /** Mees antwoordt met deze tekst en kaart. */
  | { label: string; soort: "kaart"; tekst: string; kaart: Kaart };

/** Oud formaat van het oefenvoorstel (bewaarde gesprekken); nieuw is `kaart`. */
export type Voorstel = { standaard: string };

/** Oefenen in het gesprek: toont de vraagplaatsen [vanaf, tot) van een sessie. Zonder tot is dit het actieve blok. */
export type OefenVerwijzing = { sessieId: string; vanaf: number; tot?: number };

export type Bericht = {
  id: string;
  van: "kind" | "mees";
  tekst: string;
  keuzes?: Keuze[];
  kaart?: Kaart;
  voorstel?: Voorstel;
  oefening?: OefenVerwijzing;
  t: number;
};

export type Antwoord = Pick<Bericht, "tekst" | "keuzes" | "kaart">;

export type Gesprek = { id: string; titel: string; berichten: Bericht[]; bijgewerkt: number };

/** Waar een gesprek over kan gaan (vaste lijst; ook de uitkomst van het herkennen van getypte tekst). */
export type Onderwerp = "leren" | "oefenen" | "vraag" | "rekenen" | "tafels" | "europa" | "weetjes" | "werkblad" | "voortgang" | "groet" | "onbekend";

/** Wat Mees weet over het kind om een voorstel te doen (uit de lokale oefenopslag). */
export type Context = {
  /** Naam van een oefening die nog openstaat. */
  open: string | null;
  /** Naam en keuze-id van het voorgestelde onderdeel. */
  voorstel: string;
  voorstelId: string;
  aantal: number;
};

export const MAX_GESPREKKEN = 20;
const MAX_TITEL = 40;

export const startkaarten = [
  { onderwerp: "leren", titel: "Iets leren", tekst: "Ontdek nieuwe stof", kindTekst: "Ik wil iets leren." },
  { onderwerp: "oefenen", titel: "Verder oefenen", tekst: "Kies een onderwerp", kindTekst: "Ik wil verder oefenen." },
  { onderwerp: "vraag", titel: "Stel een vraag", tekst: "Krijg duidelijke uitleg", kindTekst: "Ik wil een vraag stellen." },
] as const satisfies readonly { onderwerp: Onderwerp; titel: string; tekst: string; kindTekst: string }[];

const keuze = {
  rekenen: { label: "Rekenen", soort: "vervolg", onderwerp: "rekenen" },
  tafels: { label: "Tafels", soort: "vervolg", onderwerp: "tafels" },
  europa: { label: "Topo Europa", soort: "vervolg", onderwerp: "europa" },
  weetjes: { label: "Mijn weetjes", soort: "vervolg", onderwerp: "weetjes" },
  voortgang: { label: "Mijn voortgang", soort: "vervolg", onderwerp: "voortgang" },
} as const satisfies Record<string, Keuze>;

const onderwerpKeuzes: Keuze[] = [keuze.rekenen, keuze.tafels, keuze.europa, keuze.weetjes];

/** Herkent waar een getypte of ingesproken tekst over gaat. Eenvoudige woordherkenning; geen AI. */
export function herken(tekst: string): Onderwerp {
  const t = ` ${tekst.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")} `;
  const heeft = (...woorden: string[]) => woorden.some((w) => t.includes(w));
  if (heeft("tafel", " keer ", "maal", "vermenigvuldig", " x ")) return "tafels";
  if (heeft("puzzel")) return "europa";
  if (heeft("europa", "land", "hoofdstad", "topo", "kaart", "aardrijkskunde", "rivier", "gebergte")) return "europa";
  if (heeft("breuk", "procent", "kommagetal", "decimaal", "rekenen", " som ", "sommen", "plus", "min ", "delen", "gedeeld", "meten", "geld", "tijd", "klok")) return "rekenen";
  if (heeft("weetje", "weetjes", "wist je")) return "weetjes";
  if (heeft("werkblad", "printen", "papier")) return "werkblad";
  if (heeft("voortgang", "hoe goed", "wat heb ik", "hoe gaat het met mijn")) return "voortgang";
  if (heeft("oefen", "trainen", "train ")) return "oefenen";
  if (heeft("leren", "leer ", "uitleg", "snap", "begrijp")) return "leren";
  if (/^\s*(hoi|hallo|hey|hee|goedemorgen|goedemiddag|dag|hai)\b/.test(t)) return "groet";
  return "onbekend";
}

/** Tafels die in de tekst genoemd worden ("de tafel van 7 en 8" → [7, 8]). */
export function tafelsUit(tekst: string): number[] {
  const getallen = [...tekst.matchAll(/\b(1[0-2]|[1-9])\b/g)].map((m) => Number(m[1]));
  return [...new Set(getallen)].sort((a, b) => a - b);
}

/** Het antwoord van Mees op een onderwerp. */
export function antwoord(onderwerp: Onderwerp, ctx: Context, tafels: number[] = []): Antwoord {
  switch (onderwerp) {
    case "leren":
      return {
        tekst: "Leuk! Wat wil je leren? Kies hieronder een onderwerp, of typ wat je wilt weten. Bij elke oefening krijg je hints en uitleg als je die nodig hebt.",
        keuzes: onderwerpKeuzes,
      };
    case "oefenen":
      if (ctx.open)
        return {
          tekst: `Je was bezig met ${ctx.open}. Wil je daar verder mee? Je mag ook iets anders kiezen.`,
          keuzes: [{ label: "Verder waar ik was", soort: "hervat" }, ...onderwerpKeuzes],
        };
      return {
        tekst: `Mijn voorstel: ${ctx.voorstel}. Zullen we samen een rondje oefenen? Je mag ook zelf iets kiezen.`,
        keuzes: [{ label: "Ja, samen oefenen", soort: "voorstel" }, ...onderwerpKeuzes],
      };
    case "vraag":
      return { tekst: "Stel je vraag maar! Typ hem hieronder of tik op de microfoon om te praten. Ik kan nog niet alles beantwoorden, maar ik help je graag op weg." };
    case "rekenen":
      return { tekst: "Rekenen! Kies wat je wilt oefenen en hoeveel vragen.", kaart: { soort: "voorstel", standaard: ctx.voorstelId } };
    case "tafels":
      return {
        tekst: tafels.length ? `De tafel${tafels.length > 1 ? "s" : ""} van ${tafels.join(", ")}. Kies nog hoe je wilt oefenen.` : "Welke tafels wil je trainen? Kies er één of meer.",
        kaart: { soort: "tafels", tafels },
      };
    case "europa":
      return { tekst: "Op de kaart van Europa! Kies welk gebied, wat je wilt oefenen, en of je vragen wilt of een puzzel.", kaart: { soort: "europa" } };
    case "weetjes":
      return { tekst: "Dit zijn de weetjes die je al hebt verzameld. Tik op een weetje om het te lezen.", kaart: { soort: "weetjes" } };
    case "werkblad":
      return { tekst: "Werkbladen maken kan nog niet in de chat. Zullen we samen oefenen?", keuzes: [{ label: "Ja, samen oefenen", soort: "voorstel" }, keuze.tafels] };
    case "voortgang":
      return { tekst: "Dit heb je al geoefend. Mees kijkt naar meerdere oefenmomenten.", kaart: { soort: "voortgang" } };
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
export function reageer(tekst: string, ctx: Context): Antwoord {
  const onderwerp = herken(tekst);
  const r = antwoord(onderwerp, ctx, onderwerp === "tafels" ? tafelsUit(tekst) : []);
  const isVraag = tekst.includes("?") || VRAAGWOORDEN.test(tekst);
  if (!isVraag || ["onbekend", "groet", "oefenen", "leren", "voortgang", "weetjes"].includes(onderwerp)) return r;
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
