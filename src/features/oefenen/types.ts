import type { Niveau } from "./vragen";

/** Hoe een vraagplaats is afgehandeld. */
export type SlotUitkomst = "zelfstandig" | "met-hulp" | "met-uitleg";

export type SlotHulp = {
  /** Aantal getoonde hints (0, 1 of 2). */
  hints: 0 | 1 | 2;
  uitleg: boolean;
  fouten: number;
};

export type Slot = {
  id: string;
  vraagId: string;
  vraagVersie: number;
  /** Gezet als dit een vervolgvraag is na hulp bij een eerdere vraagplaats. */
  herhalingVan?: string;
  /** Gezet op de oorspronkelijke vraagplaats zodra er een vervolg is gepland. */
  vervolgGepland?: boolean;
  hulp: SlotHulp;
  uitkomst?: SlotUitkomst;
  /** Laatst gekozen antwoord, zodat het na hervatten zichtbaar blijft. */
  antwoord?: string;
  /** Antwoordopties die voor deze sessie zijn gekozen (Europa-meerkeuze). */
  opties?: { id: string; label: string }[];
};

export type SessieSoort = "oefening" | "tafels" | "europa" | "puzzel" | "niveau" | "controle";

export type SessieInstellingen = {
  /** Tafeltrainer */
  tafels?: number[];
  bewerkingen?: ("x" | ":")[];
  metTijd?: boolean;
  /** Europa */
  gebieden?: string[];
  landen?: string[];
  onderwerpen?: string[];
  /** Niveaubepaling: gebied waarvoor een beginadvies wordt gezocht. */
  niveauGebied?: string;
  /** Controlevraag na tutoruitleg: de hulpvraag waar deze sessie bij hoort. */
  controleVoor?: string;
};

export type Sessie = {
  id: string;
  /** Ontbreekt bij oudere sessies: dan is het een gewone oefening. */
  soort?: SessieSoort;
  instellingen?: SessieInstellingen;
  leerdoelId: string;
  onderdeelId: string;
  onderwerpId: string;
  niveau: Niveau;
  aantal: number;
  bron: "voorstel" | "zelf";
  slots: Slot[];
  /** Index van de huidige vraagplaats. */
  index: number;
  /** Ophogen bij iedere wijziging; voorkomt dat twee tabbladen elkaar overschrijven. */
  versie: number;
  status: "bezig" | "afgerond";
  gestartOp: string;
  afgerondOp?: string;
};

export type Poging = {
  eventId: string;
  sessieId: string;
  slotId: string;
  vraagId: string;
  vraagVersie: number;
  leerdoelId: string;
  antwoord: string;
  resultaat: "goed" | "fout";
  /** Eerste poging op deze vraagplaats. */
  eerstePoging: boolean;
  /** Hulp die al gebruikt was vóór deze poging. */
  hulpVooraf: { hints: number; uitleg: boolean };
  /** Actieve antwoordtijd (tafeltrainer); pauze en voorlezen tellen niet mee. */
  actieveDuurMs?: number;
  op: string;
};

export type WeetjeOntdekt = {
  weetjeId: string;
  sessieId: string;
  /** Kalenderdag in Europe/Amsterdam (jjjj-mm-dd). */
  dag: string;
  op: string;
};

export type ReviewItem = {
  leerdoelId: string;
  vanSessieId: string;
  op: string;
};

export type Leesinstellingen = {
  groteTekst: boolean;
  rustigeOvergangen: boolean;
  /** Na een goed antwoord niet automatisch door, maar met de knop Volgende vraag. */
  rustigVerder: boolean;
};

export type OpslagData = {
  schemaVersie: 1;
  gastId: string;
  sessies: Record<string, Sessie>;
  pogingen: Poging[];
  weetjes: WeetjeOntdekt[];
  reviews: ReviewItem[];
  instellingen: Leesinstellingen;
};
