// Gedeelde gegevens over kinderprofielen (client en server).

export const avatars = [
  { id: "vos", naam: "Vos" },
  { id: "uil", naam: "Uil" },
  { id: "kat", naam: "Kat" },
  { id: "beer", naam: "Beer" },
  { id: "konijn", naam: "Konijn" },
  { id: "panda", naam: "Panda" },
] as const;

export type AvatarId = (typeof avatars)[number]["id"];

export const groepen = [5, 6, 7, 8] as const;

export type Kind = {
  id: string;
  voornaam: string;
  groep: number;
  avatar: AvatarId;
};

/** Versie van de ouderverklaring bij registratie. Verhogen zodra de definitieve privacyverklaring er is. */
export const OUDERVERKLARING_VERSIE = "concept-2026-10-08";
/** Versie van het beleid waaronder tutortoestemming wordt gegeven. */
export const TOESTEMMING_VERSIE = "concept-2026-10-08";
