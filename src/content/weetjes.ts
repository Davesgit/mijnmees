export type Weetje = {
  id: string;
  categorie: "Dieren" | "Natuur" | "Wereld";
  titel: string;
  kort: string;
  vraag: string;
  tekst: string;
  foto: string;
  alt: string;
  /** Bron moet vóór publicatie door een redacteur gecontroleerd worden. */
  bronGecontroleerd: boolean;
};

// Volgorde = volgorde waarin weetjes ontdekt worden.
export const weetjes: Weetje[] = [
  {
    id: "octopus",
    categorie: "Dieren",
    titel: "Drie harten",
    kort: "Een octopus heeft drie harten.",
    vraag: "Waarom heeft een octopus er zoveel?",
    tekst:
      "Een octopus heeft twee harten die bloed naar de kieuwen pompen. Daar neemt het bloed zuurstof op. Het derde hart pompt het bloed met zuurstof naar de rest van het lichaam.",
    foto: "/assets/fotos/weetje-octopus.jpg",
    alt: "Een oranjebruine octopus zwemt boven koraal op de zeebodem.",
    bronGecontroleerd: false,
  },
  {
    id: "uil",
    categorie: "Dieren",
    titel: "Een draaiend hoofd",
    kort: "Een uil kan zijn hoofd heel ver draaien.",
    vraag: "Hoe kijkt een uil achter zich?",
    tekst:
      "De ogen van een uil kunnen niet bewegen in hun kassen. Daarom draait een uil zijn hele hoofd. Hij kan zijn hoofd bijna helemaal rond draaien, tot ongeveer driekwart van een rondje.",
    foto: "/assets/fotos/weetje-uil.jpg",
    alt: "Een bruine bosuil zit op een bemoste tak in het bos.",
    bronGecontroleerd: false,
  },
  {
    id: "bergen",
    categorie: "Natuur",
    titel: "Groeiende bergen",
    kort: "De Alpen worden nog steeds een beetje hoger.",
    vraag: "Hoe kan een berg groeien?",
    tekst:
      "De Alpen zijn ontstaan doordat twee stukken aardkorst tegen elkaar aan duwen. Dat duwen gaat nog steeds door. Daardoor worden sommige bergen elk jaar ongeveer een millimeter hoger. Regen, ijs en wind slijten de bergen tegelijk weer af.",
    foto: "/assets/fotos/weetje-bergen.jpg",
    alt: "Besneeuwde bergtoppen boven een groen bergdal met bloemen.",
    bronGecontroleerd: false,
  },
];

/** Aantal plekken in het weetjesboek, inclusief nog te ontdekken plekken. */
export const weetjesPlekken = weetjes.length;

export function vindWeetje(id: string) {
  return weetjes.find((w) => w.id === id) ?? null;
}
