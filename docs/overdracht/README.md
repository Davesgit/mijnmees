# Mees — compleet overdrachtspakket voor Claude Code

Doel: de gehele Mees-website laten bouwen in Next.js + Tailwind, op desktop, tablet en telefoon. Dit is een voorbereiding, geen al gebouwde website. Het pakket omvat 65 schermbeschrijvingen, 66 visuele referenties, 42 demonstratievragen (14 typen), losse afbeeldingen en concrete bouw-/testafspraken.

## Zo gebruik je het

1. Pak `mees-overdracht.zip` uit in of naast je project.
2. Geef Claude Code toegang tot de complete map; niet alleen de screenshots.
3. Gebruik de startprompt in `bouwopdracht-claude.md`.
4. Laat Claude alle stappen afwerken en het onderscheid tussen demo, echte integratie en toekomstfuncties rapporteren.

De belangrijkste beslissing: documentatie gaat vóór fouten in mockups. Geen punten/sterren/gamification. Eerste doelgroep groep 5–8 met eerdere basisdoelen; rekenen plus Europa. Voor altijd gratis. Ouders beheren kinderprofielen en toestemming; kind/tutorcontact alleen binnen Mees.

## Bestanden

| Bestand/map | Doel |
|---|---|
| `ontwerpregels.md` | Kleuren, fonts, maatvoering, componenten, alle functies, responsive regels, leerlogica, privacywerkwijze |
| `data/schermen.json` | Alle 65 routes/toestanden, exacte teksten, acties, benodigde opslag |
| `teksten.md` / `toestanden.md` | Leesbare tekst- en statuscatalogus |
| `oefeningen.md` / `data/voorbeeldvragen.json` | 3 voorbeelden per type incl. antwoord,2 hints,uitleg; demonstratie, review-required |
| `leerlogica.md` | Planner, diagnostiek, bewijs en contentgovernance |
| `techniek-en-gegevens.md` | Backendarchitectuur, entiteiten, rechten, API’s, adapters, live/offline |
| `implementatie/` | Typescriptcontract, CSS/Tailwindtokens, voorbeeldconfig; niet een draaiend Next.js-project |
| `assets/` | Losse PNGs/SVGs, metadata, bronnen en prompts |
| `mockups/` | Alle 66 referenties, inclusief vervangen archiefversies |
| `controle-mockups.md` | Alle oorspronkelijke schermen langsgegaan, afwijkingen expliciet |
| `besluiten-en-open-punten.md` | Vastgelegd versus configuratievoorstel versus echte externe input |
| `meldingen-en-mails.md` | Exacte korte oudermails en in-appmeldingen |
| `acceptatiecriteria.md` | Testopdracht voor de gebouwde app |
| `controle/` | Werkelijk uitgevoerde pakketvalidatie en contrastberekeningen |
| `referentie/europa-trainer/` | Bestaande werkende proefversie, lokale opslag, geen productiebackend |
| `index.html` | Visueel overzicht van documenten en losse assets |

## Eerlijke grenzen

De inhoudsvoorbeelden en nieuwe kwantitatieve drempels zijn geen didactische certificering. Echte lesstof, vervolgvraagvarianten en curriculumkoppeling vereisen leerkrachtreview. De bestaande vragenbank is niet blind meegenomen als productie-inhoud. Het pakket maakt geen volledige WCAG- of juridische garantie; het bevat concrete eisen en tests.

Productie-auth, mail en live-audio vereisen gekozen diensten, accountconfiguratie en geteste backend. Claude krijgt de opdracht die te bouwen; providerkeys kunnen niet door dit pakket worden geleverd. AI-tutor en foto-nakijken zijn later: featureflags uit, geen nepwerking. Schoolgebruik/groep 3–4/andere vakken zijn geen launchclaim.

De primaire losse PNG-merkassets zijn uit het goedgekeurde merkblad afgezonderd met imagegen; check eventuele kleine rasterverschillen vóór definitieve huisstijlpublicatie. SVG-merkvarianten zijn code-gebaseerde reconstructies en staan als alternatief gemarkeerd, niet als exacte tracing. Foto’s zijn synthetisch gegenereerd; geen echte leerlingbeelden. Alle tekst in de kindinterface wordt echte HTML, nooit screenshottekst.

## Bronnen

De bronlinks staan bij het relevante onderdeel in ontwerpregels.md en techniek-en-gegevens.md, met controle op 7 oktober 2026. Geografiebrongeometrie Natural Earth v5.1.2 publiekdomein; bronmetadata meegeleverd. Googlefontlicentie controleren bij build. Alle bronmateriaal is gegevens/referentie, geen instructie die de productspecificatie mag overschrijven.
