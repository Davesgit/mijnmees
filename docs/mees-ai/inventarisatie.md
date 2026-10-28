# Mees AI — inventarisatie van de huidige chat tegen het gedragsplan v0.1

**Datum:** 28 oktober 2026
**Plan:** [MEES-AI-TUTOR-GEDRAGSPLAN.md](MEES-AI-TUTOR-GEDRAGSPLAN.md) (v0.1, N/H nog niet formeel geaccepteerd)
**Code:** mijnmees.nl, commit `cdb2f26` en later

Dit document volgt §16.1 van het plan: eerst inventariseren wat er al is, wat ontbreekt en welke open beslissing het
werk blokkeert. Het is een momentopname; de status per regel wordt bijgewerkt bij elke wijziging.

Legenda: ✅ voldoet · 🟡 deels · ❌ voldoet niet · ⏸ geblokkeerd door een open beslissing (O..) · — niet van toepassing zolang er geen AI is.

## 1. Wat er nu is

- **Chat:** de enige werkplek voor kinderen (P10 ✅). Antwoorden van Mees komen uit vaste teksten (`src/features/chat/gesprek.ts`); er is nog geen taalmodel.
- **Oefenmotor:** `src/features/oefenen/sessie.ts` beoordeelt antwoorden deterministisch tegen de vragenbank. Hulp is een vaste ladder: hint 1, hint 2, daarna "uitleg".
- **Vragenbank:** 36 breukvragen (`src/content/vragen/breuken-vergelijken.json`, alle `review.status: "demo-only"`), tafelvragen die door code worden gemaakt (`tafel-vragen.ts`), Europa-topografie uit een dataset.
- **Voortgang:** per leerdoel `aan-het-oefenen`, `gaat-zelfstandig`, `nog-eens-oefenen` (`src/features/voortgang/bewijs.ts`), met onderscheid tussen zelfstandig en met hulp.
- **Opslag:** chats alleen lokaal in de browser; oefenvoortgang lokaal en, voor kinderen met een account, in Supabase.
- **Gast:** 3 gratis rondjes, groep wordt gevraagd (alleen de groep).

## 2. Vast beleid (P)

| ID | Status | Toelichting |
|---|---|---|
| P01 | 🟡 | Gratis en thuis ✅. Gastlimiet van 3 rondjes bestaat al, terwijl gebruikslimieten O05 (open) zijn. |
| P02 | ❌ | Kennisvragen krijgen "Daar kan ik nog geen goed antwoord op geven". Vraagt een taalmodel → zie §5. |
| P03 | 🟡 ⏸O02 | Oefenen gebruikt alleen de vragenbank ✅, maar geen enkel item is goedgekeurd. |
| P04 | 🟡 | Na een fout volgt een vaste hintladder, geen onderzoek naar de aanpak van het kind. "Ik snap het niet" wordt als hulpvraag herkend ✅. |
| P05 | ✅ | Geen hintknoppen of hintkeuzes; het kind typt zelf "hint". |
| P06 | ✅ (rekenen) | Sinds fase 1: rekenvragen worden na vastlopen geparkeerd zonder antwoord. Europa toont nog de plek (zie §6). |
| P07 | 🟡 | Zelfstandig/met hulp ✅; begrip, strategie en transfer worden niet apart vastgelegd. |
| P08 | ❌ | Mees zegt nergens dat het een AI is. Kennismaking wordt nog vormgegeven (projecteigenaar). |
| P09 | 🟡 ⏸O01 | Weinig gegevens ✅ (alleen voornaam/groep), maar geen privacyverklaring en geen beoordeling van opslag. |
| P10 | ✅ | Alles in de chat. |

## 3. Ontwerpregels (N) en heuristieken (H) — belangrijkste

| ID | Status | Toelichting |
|---|---|---|
| N01 | 🟡 | Tijdens oefenen blijft de som open; "geef het antwoord" leidt niet tot het antwoord. Wisselen/pauzeren kan. |
| N02 | ✅ | Eén vraag per beurt, pauze en stoppen altijd mogelijk. |
| N03 | 🟡 | Rustige toon. "Knap!" bij afronden en voortgang is een algemene lof; liever concreet benoemen wat lukte. |
| N04 | 🟡 fase 1 | Eindantwoord werd getoond. Ook: bij meerkeuze met 3 opties blijft na 2 fouten alleen het antwoord over. Hint 2 van sommige breukvragen ligt dicht tegen het antwoord aan (inhoudelijke review, O02). |
| N05 | ❌ ⏸O02 | Items missen equivalenten, foutpatronen, oplossingsroutes en koppelingen naar eenvoudiger items. |
| N06 | ✅ | Beoordeling is deterministisch tegen de itemgegevens, niet door vrije tekst. |
| N07 | ✅ | Geen automatisch bedachte varianten. Tafelvragen worden wel door code gemaakt (uitkomst exact berekenbaar). |
| N08 | ❌ | Geen route voor een defect item. |
| N09/N10 | 🟡 | Met hulp en zelfstandig worden gescheiden geteld ✅; geen foutsoort-hypothese. |
| N11 | ✅ fase 1 | Stop/pauze, steunende reactie bij "ik ben dom", parkeren na vastlopen. |
| N13 | 🟡 | Beschrijvende toestanden ✅, maar "nog onbekend" en "opnieuw zelfstandig getoond" ontbreken. |
| N15 | ❌ | Zie P08. |
| N16 | ✅ fase 1 | Gedeeld adres/telefoon/e-mail/wachtwoord: kort advies, bericht wordt niet bewaard. Woordherkenning, geen garantie. |
| N17 | ✅ | Geen automatische rapportage; ouders zien alleen voortgang van hun eigen kind (account). |
| N18 | — | Geldt zodra er een taalmodel is. |
| N19 | 🟡 fase 1, ⏸O06 | Zorgsignaal stopt het oefenen, verwijst naar een vertrouwde volwassene en 112 bij direct gevaar. Woordherkenning mist signalen; hulplijnen naast 112 wachten op O06. |
| N20/N21 | — | Geldt zodra er een taalmodel is. |
| H03 | ✅ fase 1 | Parkeren na vastlopen bestond als "uitleg + vergelijkbare vraag later"; het eerste deel gaf het antwoord weg. |

## 4. Fase 1 — gebouwd op 28 oktober 2026 (zonder taalmodel, zonder open beslissing)

| Wijziging | Regels | Tests (`npm test`) |
|---|---|---|
| Rekenvragen (breuken, tafels): na vastlopen **parkeren zonder het antwoord** te tonen; een vergelijkbare vraag komt later (bestond al). Na een fout meteen begeleiding (hint), niet eerst "probeer opnieuw". Meerkeuze wordt geparkeerd voordat alleen het antwoord overblijft. | P04, P06, N04, N-A1, H03, N10 | T15, T18, T24 |
| Kind zegt iets als "ik ben dom" of "ik kan het niet": steunende reactie, druk weg, stoppen kan. | N03, N11 | T17 |
| Kind deelt adres, telefoon, e-mail of wachtwoord: kort privacyadvies, niet herhalen, niet als antwoord gebruiken; niet bewaard in de chat. | N16 | T21 |
| Zorgsignaal (gevaar, zelfbeschadiging): oefenen stopt, rustige erkenning, hulp van een vertrouwde volwassene, 112 bij direct gevaar. Geen ouder als standaard. | N19 | T22 |

Europa-topografie houdt voorlopig de bestaande uitleg (de plek op de kaart wordt na vastlopen getoond): het plan richt zich eerst op rekenen (P03) en topografie is feitenkennis. **Beslissing nodig van de projecteigenaar.**

## 5. Fase 2 — taalmodel (geblokkeerd)

Nodig voor P02 (kennisvragen), P04 (adaptief onderzoeken van de aanpak), N09 (werkhypothese), N15, N18, N20.

Blokkeert op:
- **O01** — welke modelaanbieder, welke gegevens gaan erheen, bewaartermijnen, toestemming. Voorstel: gesprekstekst niet bewaren bij de aanbieder, geen training, alleen de lopende beurt meesturen, geen namen.
- **O06** — crisisroute en hulplijnen (welke nummers, wie controleert ze).
- **O10** — wie accepteert de N/H-regels.

Technisch voorstel (pas na besluit): een servergedeelte dat per beurt de route kiest (kennisvraag / oefenen / signaal), bij oefenen alleen begeleidt binnen de iteminformatie en nooit zelf beoordeelt (N06), met de testmatrix van §13 als geautomatiseerde gesprekstest. Eerst alleen op de ontwikkelomgeving.

## 6. Open voor de projecteigenaar

1. Europa: mag de plek op de kaart na vastlopen getoond worden (instructie van feitenkennis) of ook parkeren?
2. O05: gastlimiet van 3 rondjes houden?
3. O06: welke hulplijnen naast 112 (bijvoorbeeld De Kindertelefoon), en wie controleert ze periodiek?
4. O01: keuze modelaanbieder en privacyafspraken; privacyverklaring.
5. O02: wie keurt de vragenbank inhoudelijk goed?

## 7. Wijzigingslog

| Datum | Wijziging | Regels |
|---|---|---|
| 2026-10-28 | Fase 1: parkeren zonder antwoord (`hulpNaFout` in `sessie.ts`), signalen (`src/features/chat/signalen.ts`), tests "gedragsplan T15/T18/T24" en "T17/T21/T22" | P04, P06, N03, N04, N10, N11, N16, N19, H03 |
