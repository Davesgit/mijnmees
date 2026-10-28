// Signalen in wat een kind typt, die vóór oefenen gaan (gedragsplan §9 en §12). Zonder taalmodel is dit een
// eenvoudige herkenning op woorden: hij mist dingen en kan zich vergissen. Daarom zijn de reacties rustig en
// algemeen, en stopt Mees bij twijfel liever even dan dat hij doorvraagt.

export type Signaal = "zorg" | "privacy" | "ontmoedigd";

const schoon = (t: string) =>
  ` ${t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.!?,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;

/** N19: gevaar, zelfbeschadiging, mishandeling of pesten. */
const ZORG =
  / (ik wil dood|ik wil niet meer leven|zelfmoord|mezelf (pijn doen|snijden|iets aandoen)|ik snijd mezelf|ik word (geslagen|geschopt|mishandeld|misbruikt|bedreigd|gepest)|(slaat|schopt|bedreigt) (mij|me) |ik ben niet veilig|niet veilig thuis|ik ben bang thuis|iemand doet (mij|me) pijn)/;

/** N16: gegevens die nodig zijn om iemand te vinden of in te loggen. */
const PRIVE = [
  /[\w.+-]+@[\w-]+\.[\w.]+/, // e-mailadres
  /(\+31|\b0)[1-9](?:[\s-]?\d){8}\b/, // telefoonnummer
  /\b[1-9]\d{3}\s?[a-z]{2}\b/i, // postcode
];
const PRIVE_WOORDEN = / (wachtwoord|password|pincode|ik woon (in|op|aan)|mijn adres|mijn achternaam|mijn telefoonnummer|mijn e ?mail)/;

/** N03/N11: het kind praat negatief over zichzelf of geeft aan het niet meer te zien zitten. */
const ONTMOEDIGD = / (ik ben (zo )?(dom|stom|slecht|een loser)|ik kan (niks|niets)|ik kan dit nooit|ik ga het nooit snappen|ik snap er niks van|ik haat (rekenen|dit|mezelf))/;

export function herkenSignaal(tekst: string): Signaal | null {
  const t = schoon(tekst);
  if (ZORG.test(t)) return "zorg";
  if (PRIVE_WOORDEN.test(t) || PRIVE.some((p) => p.test(tekst))) return "privacy";
  if (ONTMOEDIGD.test(t)) return "ontmoedigd";
  return null;
}

/** Wat er in de chat komt te staan in plaats van een bericht met persoonsgegevens (N16: niet herhalen, niet bewaren). */
export const WEGGELATEN = "(bericht weggelaten: er stonden persoonlijke gegevens in)";

export const SIGNAAL_TEKST: Record<Signaal, string> = {
  // Geen ouder als vanzelfsprekende hulp: het kind kan juist thuis onveiligheid beschrijven. 112 alleen bij direct gevaar.
  zorg: "Wat je vertelt is belangrijk, en goed dat je het zegt. Ik ben een computerprogramma, dus ik kan je hier niet goed mee helpen. Vertel het aan een volwassene die je vertrouwt, bijvoorbeeld je juf of meester, iemand uit je familie of een andere volwassene bij wie je je veilig voelt. Ben je nu in gevaar? Bel dan 112.",
  privacy: "Dat hoef je mij niet te vertellen. Om te oefenen heb ik je adres, telefoonnummer, e-mail of wachtwoord niet nodig. Houd dat liever voor jezelf. Daarom heb ik je bericht niet in de chat bewaard.",
  ontmoedigd: "Deze stap lukt nog niet. Dat zegt niet dat je dom bent: oefenen is juist voor dingen die nog lastig zijn. We kunnen ook even stoppen. Typ dan pauze.",
};
