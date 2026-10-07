# Mees — leidende ontwerp- en productspecificatie

Versie 1 · 7 oktober 2026 · werknaam Mees · domein mijnmees.nl. Dit document gaat vóór conflicterende teksten in mockups. Het pakket beschrijft het complete product en een uitvoerbare bouwopdracht; het is geen verklaring dat alle functies al gebouwd, juridisch getoetst of inhoudelijk goedgekeurd zijn.

## 1. Vastgelegde uitgangspunten

Mees is een gratis leer- en oefenplatform voor zelfstandig thuisgebruik. Eerste doelgroep: groep 5–8. Eerdere rekenleerdoelen blijven beschikbaar wanneer een kind ondersteuning nodig heeft. Groep 3–4 en overige vakken zijn toekomstige uitbreiding. Rekenen en de toegevoegde Europa-trainer zijn actieve vakonderdelen als er beoordeelde inhoud beschikbaar is. Schoolgebruik valt buiten deze bouwopdracht.

Geen punten, sterren, badges, streaks, ranglijsten, beloningsgeluiden of verplichte schermtijd. Wel zichtbare voortgang, rustige complimenten, passende oefenvoorstellen, vrijwillige beweegpauzes en weetjes. Elk kind mag stoppen; een afgebroken opdracht is geen mislukking. Mees blijft voor altijd gratis, inclusief beschikbare tutorhulp. Donaties veranderen niets aan inhoud of toegang. Donateurs krijgen uitsluitend naam en logo op een aparte pagina; geen kindgegevens, inhoudelijke invloed of commerciële acties in de kindomgeving.

Geen speculatieve ‘denkfouten’ uit AI-vragenbanken overnemen als feiten. Gebruik de bestaande vragenbank uitsluitend als ongecontroleerde bron. Publiceer pas na didactische controle van vraag, twee hints, uitleg, antwoord en geschikte vervolgvraag. Gebruik geen automatisch gegenereerde opgaven uit screenshots. `data/voorbeeldvragen.json` bevat demonstratievoorbeelden, geen volledig curriculum.

### Wat deze overdracht omvat

Negen volledig gespecificeerde kernschermen S01–S09, alle overige bestaande schermen, mobiele/tabletvarianten, aanvullende toestanden en routes. `data/schermen.json` is de machineleesbare route- en tekstcatalogus. De afbeeldingen zijn referentie; HTML-tekst, SVG-kaarten en wiskundige weergaven worden echte elementen. `controle-mockups.md` koppelt iedere oorspronkelijke afbeelding aan het juiste scherm en corrigeert inhoudelijke afwijkingen.

### Besluiten en expliciete bouwvoorstellen

De productkeuzes hierboven en eerder goedgekeurde hulproute zijn vastgelegd. Getalsmatige drempels voor beheersing, tutorselectie, gastgebruik, bewaartermijnen en live-groepering hieronder zijn **bouwvoorstellen**, configureerbaar en zichtbaar als zodanig. Claude mag hiermee de gehele demonstratie bouwen zonder ze als wetenschappelijke normen of wettelijke garanties te presenteren. Externe accounts, API-sleutels en rechtsgrond/beleid mogen niet worden verzonnen.

## 2. Kleuren — vaste namen

Gebruik uitsluitend onderstaande semantische namen in CSS, componenten en documentatie. De hex-codes zijn nu vastgelegde tokens; zij zijn niet nauwkeurig uit iedere rastermockup te reconstrueren.

| Naam | Hex | Gebruik |
|---|---|---|
| `merk-blauw` | #0789F8 | Vogel, illustraties, decoratieve vlakken; geen kleine witte tekst erop |
| `actie-blauw` | #005FCC | Primaire knoppen, tekstlinks, actieve velden |
| `actie-hover` | #0054B5 | Primaire knop bij hover |
| `actie-ingedrukt` | #00479A | Primaire knop bij indrukken |
| `inkt` | #111D55 | Titels, tekst, belangrijke iconen |
| `tekst-zacht` | #4A5878 | Uitleg, ondersteunende tekst |
| `wit` | #FFFFFF | Pagina, kaarten, tekst op primaire knop |
| `achtergrond-zacht` | #F6F9FD | Ouder/tutor-overzicht, oppervlakken |
| `blauw-zacht` | #EAF5FF | Selectie, voorstelkaart, uitlegvlak |
| `rand-zacht` | #C8DDF0 | Decoratieve kaarten en scheidingslijnen |
| `rand-interactief` | #66809E | Invoer- en antwoordranden die nodig zijn om de bediening te herkennen |
| `focus` | #111D55 | Buitenste focusring; binnenste 2px witte scheiding |
| `geel` | #FFBF24 | Kleine snavel-/illustratieaccenten, nooit primaire tekstkleur |
| `succes` | #166534 | Goed antwoord, met vink en tekst |
| `succes-zacht` | #ECFDF3 | Succesvlak |
| `probeer-opnieuw` | #854D0E | Vriendelijke foutfeedback, met tekst en symbool |
| `probeer-opnieuw-zacht` | #FFF7E6 | Vlak bij opnieuw proberen |
| `fout` | #B91C1C | Technische fout of formulierfout, niet voor strafgevoel |
| `fout-zacht` | #FEF2F2 | Technische foutvlak |
| `uitgeschakeld-vlak` | #E2E8F0 | Disabled knopvlak |
| `uitgeschakeld-tekst` | #475569 | Disabled tekst, met uitleg waarom |
| `vak-rekenen` | #005FCC | Rekenaccent; naam/pictogram blijft zichtbaar |
| `vak-aardrijkskunde` | #0F766E | Aardrijkskundeaccent |
| `vak-taal` | #6D28D9 | Toekomstige taalaccenten, nog geen actieve lege tegels |

Zachte randen zijn decoratief. Een antwoordveld krijgt `rand-interactief` als de rand de enige zichtbare affordance is. Geen algehele opacity op tekst of actieve bediening. Contrasttest staat in `controle/contrast.json`. WCAG AA vraagt ten minste 4,5:1 voor normale tekst en 3:1 voor grote tekst; deze grens is ontleend aan [W3C](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Kleurparen en uiteindelijke interface moeten afzonderlijk getest worden; de tokens alleen garanderen geen volledige WCAG-conformiteit.

## 3. Typografie

Google Font: **Nunito Sans**, gewichten 400, 600, 700 en 800; fallback `system-ui, sans-serif`. Gebruik `next/font/google` met Latin/Latin Extended en `display: swap`, zodat bezoekers de fontbestanden van Mees ontvangen, zonder runtime-verzoek aan Google. Definitieve licentie en bron: [Google Fonts-repository](https://github.com/google/fonts/tree/main/ofl/nunitosans). Wordmark is een apart SVG, geen herbruikbare tekstfont. Geen claims dat een specifiek font dyslexie oplost.

| Token | Telefoon | Tablet | Desktop | Gewicht / regelhoogte |
|---|---|---|---|---|
| `titel-pagina` | 28px | 32px | 36px | 800 / 1,2 |
| `titel-oefening` | 24px | 28px | 30px | 800 / 1,3 |
| `subtitel` | 20px | 22px | 24px | 700 / 1,35 |
| `tekst` | 18px | 18px | 18px | 400 / 1,6 |
| `knoptekst` | 16px | 16px | 16px | 700 / 1,3 |
| `tekst-klein` | 16px | 16px | 16px | 400 / 1,5 |
| `tekst-volwassene` | 16px | 16px | 16px | 400 / 1,5 |
| `som` | 40–56px | 48–64px | 56–72px | 700 / 1,2 |

Geen kindgerichte informatie kleiner dan 16px. Tekstvergroting naar 125% en 150%, browserzoom 200% zonder verlies; reflow op 320px. Maximaal 60–70 tekens per regel; vraagtekst liefst 45–55. Links onderstreept waar ze in tekst staan. Breuken semantisch opbouwen met toegankelijk gesproken alternatief, geen rastertekst. Decimale komma’s en Nederlandse notatie.

## 4. Afstanden, hoeken, schaduwen

Schaal: `ruimte-1` 4, `ruimte-2` 8, `ruimte-3` 12, `ruimte-4` 16, `ruimte-6` 24, `ruimte-8` 32, `ruimte-12` 48px. Icon-label 8; veldlabel-veld 8; antwoordrijen 12; kaartpadding 16 telefoon/24 tablet/desktop; sectiegap 24 telefoon/32 groter; paginamarges 16/24/32; contentverticaal 24/32/48. Geen willekeurige marges per pagina.

`hoek-invoer` 12px, `hoek-kaart` 16px, `hoek-dialoog` 20px, `hoek-pil` 999px. Knoppen mogen pilvormig zijn, maar tekstvelden niet. Rand 1px decoratief, 2px bij selectie. `schaduw-kaart`: geen standaard schaduw. `schaduw-zwevend`: 0 8px 24px rgba(17,29,85,.10) voor dialoog/menu; geen glanzende 3D-look.

## 5. Componenten en toestanden

Gebruik overal exact: `MeesHeader`, `KindNavigatie`, `OuderNavigatie`, `TutorNavigatie`, `PrimaireKnop`, `SecundaireKnop`, `TekstKnop`, `OnderwerpTegel`, `VoorstelKaart`, `KeuzeKaart`, `InvoerVeld`, `VoortgangBalk`, `VraagVlak`, `AntwoordKeuze`, `HulpPaneel`, `OefenBediening`, `WeetjeKaart`, `KaartVlak`, `LandStuk`, `TutorBord`, `Melding`, `StatusVlak`, `Dialoog`.

| Component | Normaal | Hover (alleen aanwijzer) | Ingedrukt/geselecteerd | Uitgeschakeld |
|---|---|---|---|---|
| `PrimaireKnop` | actie-blauw/wit; min hoogte 48px; padding 12px 24px | actie-hover | actie-ingedrukt; geen verspringing | uitgeschakeld-vlak/tekst; klik geblokkeerd, reden zichtbaar |
| `SecundaireKnop` | wit/actie-blauw; 1px rand-interactief | blauw-zacht | blauw-zacht/2px actie-blauw | disabled tokens; reden zichtbaar |
| `TekstKnop` | actie-blauw, min vlak 48px | lichte achtergrond | inkt + lichte achtergrond | disabled tokens |
| `OnderwerpTegel` | wit, hoek-kaart, rand-zacht; icon+naam | blauw-zacht | 2px actie-blauw, vink/tekst | toont ‘Nog niet beschikbaar’, als toekomstige tegel nodig is |
| `KeuzeKaart` / `AntwoordKeuze` | wit + rand-interactief | blauw-zacht | blauw-zacht, 2px actie-blauw, geselecteerd symbool | ongewijzigde layout met disabled tokens |
| `InvoerVeld` | wit, rand-interactief, label boven; min 48px | rand actie-blauw | focusring; waarde blijft staan | disabled tokens; readonly apart aangeven |
| `VoorstelKaart` | blauw-zacht, inkt, kleine illustratie | alleen knop reageert | alleen gekozen actie reageert | geen voorstel: vriendelijke lege toestand |

Radio’s/checkboxes zijn echte controls, geen div met clickhandler. Componentfocus: 3px `focus` buiten + 2px `wit` ertussen, zichtbaar op alle achtergronden. Formulierfout: icoon+tekst, `aria-describedby`, geen kleur als enige aanwijzing. Loading knop toont label ‘Even wachten…’ en spinner; breedte blijft gelijk. Dubbele verzending voorkomen met idempotency key, niet alleen disabled UI.

## 6. Responsive indeling en bediening

Telefoon: <768px. Tablet: 768–1023px. Desktop: ≥1024px. Dit zijn indelingsgrenzen, geen detectie van apparaat/type. Touchalternatief beschikbaar op alle breedtes; hybride laptop met touchscreen blijft bruikbaar.

| Regel | Telefoon | Tablet | Desktop |
|---|---|---|---|
| Content | 100%, 16px zijmarge | 100%, 24px | max 1200px, gecentreerd, 32px |
| Overzichtstegels | 2 kolommen; 1 als labels niet passen | 2–3 | 3–4 |
| Formulier | 1 kolom; max 640px | 1 kolom | max 640px |
| Oefening | 1 kolom, rustige header | centraal, max 1000px | centraal, max 1100px |
| Kaart | 50–60dvh, min 320px; scroll mag | 55–65dvh, min 400px | 55–65dvh, max 720px |
| Antwoorden | 2 per rij; breuktekens 3 | 2–4 per rij | 4 per rij |
| Puzzel | kaart, daarna 3 grote landstukken; nieuwe vervangt geplaatst | kaart met 5 stukken rechts bij voldoende breedte; portret onder | 5 stukken rechts |
| Kindnavigatie | onder: Start, Voortgang, Weetjesboek | boven; compact | boven |
| Actieve oefening | geen globale bodemnavigatie | geen afleidende globale links | compacte header |
| Dashboard | kaarten, filters in paneel | 1–2 kolommen | 2–3 kolommen; echte tabel waar nuttig |
| Werkbladpreview | onder, opklapbaar | onder | onder, nooit naast instellingen |

`OefenBediening` komt na antwoordgebied op een voorspelbare plek, op korte schermen sticky aan onderkant waar dit geen inhoud/focus bedekt. Reserveer de echte hoogte incl. `env(safe-area-inset-bottom)`. Maak bij geopend schermtoetsenbord de knop bereikbaar boven het toetsenbord met `visualViewport` als progressive enhancement; geen harde `100vh`, geen scrollblokkade. Hints staan vóór bediening en zijn scrollbaar. Bij een hint of fout geen onverwachte sprong naar paginatop. Bij instelkeuzes geen routewissel en geen scrollreset; behoud ook toetsenbordfocus op de bediende control.

De Europa-vraag staat onder de kaart. Bij rekenen staat de vraag centraal boven de som. Handmatig zoomen/pannen van kaarten, geen autozoom naar het juiste antwoord. Kleine landen krijgen neutrale markers en vergrote hitvlakken, zonder labels die het antwoord verraden. Kaartmarkers vermijden elkaar; bij overlap opent een neutrale keuze voor de nabijgelegen gebieden, niet automatisch het goede land. Genummerde kaartlijst ondersteunt toetsenbordbediening; echte kaartnamen niet verraden tijdens locatievragen.

Slepen: altijd ook ‘kies onderdeel → kies bestemming’, plus keyboardselectie. Hover/doelrand is neutraal ongeacht juistheid; pas na plaatsen feedback. Geen tooltip-only informatie. Meten/wegen/bouwen behouden hun handeling op mobiel; ze worden niet zomaar vervangen door een meerkeuzevraag die een ander leerdoel toetst.

## 7. Negen kernschermen — functies en bewaren

De nummering S01–S09 is productnummering, **niet** de oorspronkelijke PNG-prefix. De oorspronkelijke 01 is een merkblad. De kern bestaat uit originele 02–10. Overige schermen staan hieronder en in `data/schermen.json`.

| ID / route | Wat het kind ziet | Acties en bestemming | Bewaren |
|---|---|---|---|
| S01 `/kind/start` | Groet, één gericht voorstel, kies zelf, tafeltrainer; kleine Mees | Start voorstel → S05 met automatisch passende setup; Kies zelf → S02; Tafeltrainer → T01; navigatie → S08/S09; avatar → profielkiezer | actief profiel; open oefening; voorstelbron en gekozen voorstel, geen indrukken voor engagement |
| S02 `/kind/rekenen` | ‘Rekenen’, ‘Wat wil je oefenen?’, overzicht met pictogrammen | Breuken → S03; andere onderwerpen → overeenkomstige onderdelenroute; terug → S01 | gekozen vak; filters alleen indien gebruikt |
| S03 `/kind/rekenen/breuken` | Onderdelen binnen breuken, korte kindnamen | ‘Breuken vergelijken’ → S04; terug → S02 | onderwerp en onderdeel; geen beheersing door klik |
| S04 `/kind/oefening/instellen` | Op scherm/papier, Makkelijk/Past bij mij/Uitdagend, standaard 8 vragen | Start → S05; Op papier → W01 met vak/onderwerp ingevuld; aanpassen blijft op pagina; terug → S03 | selectie en niveau; sessie pas bij start; aantal 4–20 als bouwvoorstel |
| S05 `/kind/oefenen/[sessie]` | Vraag, som/interactie, antwoord, voortgang, hulp, leesopties | Selectie → controleknop actief; controle → correct automatisch volgende; fout → opnieuw/hint; hint → S06 als paneel; Stop → S01 met hervatten; laatste → S07 | iedere poging, vraagversie, hulp, antwoord, zelfstandig/ondersteund; server-save status; lopende sessie |
| S06 S05 met `HulpPaneel` | Hint 1, hint 2 of uitleg, geen aparte pagina | verder proberen; na uitleg soortgelijke vraag binnen de 8; leesopties; Stop → S01 | welke hint en op welk moment; uitleg bekeken; vervolg gekoppeld aan doel; geen verzonnen oorzaak |
| S07 `/kind/oefening/[sessie]/afgerond` | Korte terugblik, compact weetje, drie keuzes | Verder oefenen → S04 gericht voorstel; bewegen → korte pauzetekst met hervatlink; klaar → S01; weetje → S09/detail | sessie eenmaal afronden; weetje eenmaal ontgrendelen; geen beloning voor extra schermtijd |
| S08 `/kind/voortgang` | Rustig overzicht per onderwerp: ‘Aan het oefenen’, ‘Gaat zelfstandig’, ‘Nog eens oefenen’ | onderwerpdetail → passende oefeningen/S04; hervatten → S05; terug → S01 | geen aparte score; toont afgeleide bewijsstatus, digitaal/papier apart |
| S09 `/kind/weetjesboek` | Avontuurlijke compacte fototegels, titel, ondertitel, knop; ontdekt/nog te ontdekken | open ontdekt weetje → B01; categorie filter; gesloten weetje → neutrale uitleg zonder druk | unlock-id, moment, bron; leesgeschiedenis niet nodig |

Op S01 is een knop voor schermvrij leren niet nodig: die keuze verschijnt in S04/W01. Het kind bepaalt zelf een onderdeel; alleen het gerichte voorstel kiest Mees geheel zelf. Voortgangstermen moeten met feitelijke bewijzen overeenkomen. Niet ‘beheerst’ tonen na één goed antwoord.

## 8. Oefenlogica, hulp en voortgang

### Normale opdracht

Standaard acht **vraagplaatsen** (slots), niet acht pogingen. Een kind kiest aantal/niveau als het zelf instelt. Een gerichte opdracht gebruikt het aanbevolen leerdoel en passende basis. Timer alleen optioneel in tafeltrainer; nooit standaard bij andere vakken. Kind mag altijd stoppen en later dezelfde vraagplaats hervatten. Stoppen na een goed antwoord in de automatische overgang hervat bij de volgende vraag, zonder dubbeltelling.

Hulpladder per vraagplaats:

1. Eerste fout: ‘Dit is nog niet goed. Kijk nog eens naar de vraag.’ Antwoord blijft zichtbaar/bewerkbaar; geen foutgeluid.
2. Tweede fout: automatisch hint 1. De eerste hint geeft richting, geen antwoord.
3. Derde fout: automatisch hint 2, concretere denkstap.
4. Vierde fout: uitleg met juiste antwoord, kind klikt ‘Verder’. Geen verplichte eindeloze retries.

Handmatig hulp vragen slaat wachttijd over: hint 1 → hint 2 → uitleg. De hulpstatus is voor tutor en voortgang zichtbaar. Na uitleg geen direct gegeven antwoord als zelfstandig tellen. Bij twijfel kan kind meteen hulp openen; deze ladder is geen straf.

Wanneer hint, uitleg of herhaald fout is gebruikt, reserveert de planner een vergelijkbare vraag over **hetzelfde leerdoel/onderwerp** in een resterende slot na liefst twee andere vragen. Vervang één nog niet getoonde vraag; voeg geen negende slot toe. Geen eindeloze herhaling of iedere hulpvraag opnieuw een vervolgketen. Als onvoldoende slots over zijn: maak een review-item voor de volgende sessie van dat onderwerp. Een breuk komt niet tussen tafels; nooit onderwerpgrenzen overschrijden zonder expliciet nieuw voorstel. Geen herhaling van exact dezelfde getallen als ‘begrepen’-bewijs.

Een sessie is `afgerond` als alle ingestelde slots zijn afgehandeld, ook als sommige alleen met uitleg lukten. Een onderdeel/leerdoel is een andere entiteit; ‘afgerond’ bewijst geen beheersing. Bouwvoorstel bewijsstatus: ‘Gaat zelfstandig’ na ≥4 zelfstandige correcte eerste pogingen op verschillende vragen, verdeeld over ≥2 sessies, waarvan ≥1 later herhaalde vraag. Na 7 dagen een review-voorstel, daarna bij zelfstandige review 21 dagen; andere uitkomsten passen voorstel aan. Dit is een configureerbare heuristiek, geen diagnose. Toon weinig details aan kind; ouder/tutor zien de bewijscontext.

‘Makkelijk’ vraagt eenvoudigere varianten of eerdere doelen binnen het gekozen onderwerp; ‘Past bij mij’ gebruikt bewijs; ‘Uitdagend’ geeft complexere toepassing binnen het onderwerp. Nooit automatisch de hele groep wijzigen. Voorstel ‘Een tussenstap kan helpen’ leidt naar expliciet vooraf gekoppeld prerequisite-doel en legt kort uit waarom. Geen verborgen willekeurige niveauverschuiving.

### Europa

Doorloop de volledige geselecteerde verzameling, niet acht vragen. Eén vraag per geselecteerd object/module, liggingvragen als aparte deduplicated sleutel. Gemengde landen/hoofdsteden/wateren/gebergten/ligging lopen door de selectie. Lastige onderdelen maximaal eenmaal later herhalen; totaal/‘behandeld’ telt unieke object-doelsleutels, een extra poging vergroot niet stilzwijgend het aantal te behandelen landen. Standaard Landen, Afwisselend oefenen. Gebieden combineerbaar, eigen landen optioneel. Geen spellingtoets: selecteren/aanwijzen, niet verplichte landnamen typen. Puzzel hoeft niet gesleept te worden. Voor correcte inhoud gebruik `referentie/europa-trainer` en de meegeleverde kaartdata. Bestaande HTML is een prototype, geen backend of definitief beheersingsmodel.

### Weetjes

Bouwvoorstel: maximaal één nieuw weetje per kalenderdag waarop een zinvolle oefensessie is afgerond, onafhankelijk van het percentage goed. Kalenderdag in profiel-tijdzone Europe/Amsterdam, server bepaalt. Niet iedere korte herstart een nieuw weetje. Geen bericht ‘kom morgen terug’ of deadline. Toon het kort op S07 en bewaar in S09; bij geen nieuw weetje eventueel bestaand passend weetje zonder beloningsclaim. Papier kan meetellen als ouder afronding bevestigt. Geen straf als kind stopt, geen verlies of relock, geen ranking. Deze frequentie is configureerbaar; zij stimuleert geen schermtijd.

### Tafeltrainer

Eigen selectie tafels 1–12 als bouwvoorstel, vermenigvuldigen en optioneel delen, met of zonder tijd. Standaard zonder tijd. Tijdmodus toont rustige elapsed-time, geen afteller die antwoorden wist. Opgeven/timeout mag als onbeantwoord worden geregistreerd, nooit automatisch fout door netwerk- of schermlezervertraging. Meet alleen actieve antwoordtijd; pauze, voorlezen en netwerk tellen niet mee. Snelheid en nauwkeurigheid apart; selectie doel ‘automatiseren’ pas na inhoudelijke review van de leerkracht. Bediening input met numeriek toetsenbord, altijd controleknop en Enter als alternatief.

## 9. Vraagtypen en contentcontract

Iedere vraag heeft: stabiel `id`, immutable `version`, `type`, `subjectId`, `topicId`, `learningGoalId`, prerequisite-doelen, `groupRange`, cognitieve `difficulty`, tekstversies, context/kale variant indien didactisch gelijkwaardig, antwoordcontract, twee gelaagde hints, uitleg, visuele data, beoordelingsregels, `followUpPool`, curriculumbron/version/status en inhoudelijke goedkeuring. Curriculumkoppeling is niet ‘groep = wettelijk doel’. Leerdoelen en leerlijnen moeten apart worden gekoppeld en beoordeeld.

| Type | Uiterlijk/bediening op groot scherm | Telefoonvariant met hetzelfde doel |
|---|---|---|
| `meerkeuze` | 2–4 antwoordkaarten, één selectie + controle | 2 kaarten per rij, dezelfde opties |
| `meerdere-antwoorden` | checkboxes, ‘Kies alle…’ | grote checkboxkaarten; aantal niet verraden |
| `invullen` | numeriek veld, breukvelden of korte tekst | passende inputmode; geen spellingbeoordeling tenzij leerdoel |
| `waar-onwaar` | twee knoppen, geen voorselectie | dezelfde grote knoppen |
| `koppelen` | twee lijsten met verbindingen | tik links → tik rechts, koppelingen zichtbaar en wijzigbaar |
| `ordenen` | objecten in volgorde slepen | selecteer object → omhoog/omlaag of tik bestemming |
| `plaatsen` | objecten plaatsen in benoemde vakken | kies object → kies vak; geen drag-only |
| `kaart-aanwijzen` | kaartplek selecteren, controle | handmatig zoom + tap, grote neutrale hitvlakken |
| `landenpuzzel` | vijf stukjes met namen ernaast | drie stukken in tray, kiezen → kaartplek; dezelfde landvormen |
| `meten` | digitale liniaal verschuiven langs object | vergroot meetvlak, liniaal met stapsgewijze controls; echte handeling |
| `wegen` | gewichten op balans/waarde bepalen | gewicht kiezen → links/rechts plaatsen; resetmogelijk |
| `bouwen` | blokken op rooster, aanzichten | selecteer cel, voeg toe/verwijder; draaien met knoppen |
| `coordinaten` | roosterpunt plaatsen | rooster zoombaar met assenlabels, tap/keyboardcel |
| `model-vullen` | gelijke delen van strook/cirkel kleuren | delen aantikken; gelijke oppervlakken daadwerkelijk gelijk |

Drie volledig gestructureerde voorbeeldvragen per type staan in `oefeningen.md` en `data/voorbeeldvragen.json`: 42 voorbeelden, met twee hints en uitleg. Ze zijn demonstratie-inhoud; de definitieve groepskoppeling wordt door de leerkracht gecontroleerd. `implementatie/types.ts` definieert het datacontract. Slechts controleerbare gesloten antwoorden worden automatisch beoordeeld; open uitleg krijgt geen verzonnen score.

Context uitzetten kan alleen als een vooraf geschreven `bareEquivalent` hetzelfde leerdoel en alle noodzakelijke gegevens behoudt. Bij ‘de som uit een verhaal halen’ verwijdert dat de getoetste vaardigheid: bied dan voorlezen/kortere equivalente context, geen kale variant als gelijkwaardige toets. Beide leesopties en voorlezen zijn beschikbaar en worden als ondersteuning gelogd zonder ze automatisch als rekenhint te tellen.

## 10. Teksten en groepsvariatie

Letterlijke schermteksten staan in `data/schermen.json` en leesbaar in `teksten.md`; vraag/hint/uitleg in `oefeningen.md`. Geen lorem ipsum. Variabelen met `{voornaam}`, `{aantal}`, `{onderwerp}`, `{datum}`, `{tijd}` worden veilig als tekst gerenderd. Meervoudregels via ICU of gelijkwaardige pluralisatie, geen ‘1 vragen’. Geen ruwe HTML uit gebruikersinvoer.

Groep 5–8: korte gewone Nederlandse woorden, jij-vorm, geen neerbuigende babytaal. Basistekst gelijk tussen groepen; verschillen zitten in content en complexiteit. Groep 3–4: later aparte beoordeelde korte teksten en prominent voorlezen; nu geen claim dat de interface voor deze groepen al getest is. Gebruik groep niet als exact leesniveau. Grootte/voorlezen staat beschikbaar voor ieder kind. Voorbeelden: regulier ‘Kies het juiste teken.’; toekomstig kort ‘Kies een teken.’ Labels met vaktaal krijgen simpele verklaring wanneer nodig.

| Sleutel | Letterlijke tekst |
|---|---|
| `antwoord-goed` | Goed gevonden! |
| `antwoord-goed-met-hulp` | Goed gevonden. Je hebt de aanwijzing gebruikt. |
| `antwoord-eerste-fout` | Dit is nog niet goed. Kijk nog eens naar de vraag. |
| `antwoord-hint-een` | Probeer het met deze aanwijzing. |
| `antwoord-hint-twee` | Hier is nog een aanwijzing. |
| `antwoord-uitleg` | Lees de uitleg rustig. Daarna kun je verder. |
| `stap-terug` | Een tussenstap kan helpen. Wil je die proberen? |
| `herhaling` | Laten we kijken of dit nog lukt. |
| `pauze` | Even bewegen of stoppen is ook een goede keuze. |
| `geen-internet` | Je bent even niet verbonden. Je antwoord blijft op dit apparaat bewaard. |
| `opslaan-wacht` | Nog niet opgeslagen. We proberen het opnieuw zodra er verbinding is. |
| `opslaan-mislukt` | Bewaren lukt nu niet. Sluit dit scherm nog niet. |
| `hervatten` | Je kunt verder waar je was. |
| `tutor-aanvraag` | Je ouder kan bekijken of tutorhulp passend is. |
| `gast-account` | Met een gratis account bewaart Mees je voortgang en helpt het je op jouw niveau. |

Geen ‘Alles goed!’ als dat niet klopt. Compliment over inzet/handeling, geen ‘slim kind’ of vergelijking. Niet ‘geen internet’ tonen als de backend een validatiefout gaf. Vermijd ‘volledig veilig’ als absolute garantie: leg concreet uit dat kinderen elkaar niet zien en vragen privé naar de tutor gaan.

## 11. Toestanden

Elke schermbeschrijving bevat lege, laad-, offline-, technische fout-, succes- en afgeronde toestand. Bij niet-vraagpagina’s is goed/fout antwoord niet van toepassing; niet fictief toevoegen. `data/schermen.json` en `toestanden.md` zijn leidend.

Algemeen: eerste load skeleton met vaste maten; niet de volledige pagina laten flikkeren na één toggle. Back/forward behoudt selectie. Fouten behouden invoer. Offline geen extern tutorverzoek, betaling of live-deelname simuleren; aanbod komt uit cache waar mogelijk, toelichting is expliciet. Een opgestarte gecachte oefening kan antwoorden lokaal in een outbox bewaren; status is ‘wacht op synchronisatie’, niet ‘veilig opgeslagen op je account’. Niet in dit pakket aanwezig als werkende functie: Claude moet dit bouwen en testen.

Oefening: geen antwoord gekozen, geselecteerd, valideren, correct, onjuist-1, hint-1, hint-2, uitleg, controlevraag, wachten-op-sync, gestopt, hervatten, afgerond. Correctfeedback minimaal 900ms; ‘Rustig verder’ maakt overgang handmatig met knop ‘Volgende vraag’. Verandert focus naar nieuwe vraag en kondigt via rustige live-region aan; geen auto-overgang tijdens voorlezen. Undo vóór controle; correctpoging achteraf immutable.

Live: uitgenodigd, vol, wachtlijst, gepland, wachtkamer, live, audio-geblokkeerd, verbinding-verloren, reconnect, geannuleerd, gewijzigd, afgerond, opname-in-beoordeling, opname-beschikbaar. Vraag: draft → controleren → doorgestuurd/in-beoordeling/aanpassen → beantwoord. Moderatie is geen openbaar chatkanaal.

## 12. Beweging en geluid

Alleen subtiel: hover 120ms, focus direct, paneel 160ms opacity/hoogte met layoutbehoud, kaartselectie 120ms, voortgang 200ms. Optionele vriendelijke posewisseling van Mees bij afronding; geen springend karakter bij ieder antwoord, geen particle effects. Illustraties zijn statische PNGs; geen animatiebestand meegeleverd. Als gebouwd: posewisseling maximaal 300ms, geen mechanische vervorming van losse rasterafbeelding.

`prefers-reduced-motion` en eigen ‘Rustige overgangen’ schakelen alle niet-noodzakelijke animatie uit. Geen knippering. Correct/fout heeft standaard **geen geluid**. Voorlezen en tutorstem alleen op expliciete actie; stop/pauze/volume beschikbaar. Geen automatische audio, microfoon of camera bij kind. ‘Geluid uit’ pauzeert stem/tutoraudio; transcript/boardtekst blijft zichtbaar. Microfoontoestemming alleen tutor bij bewust starten van opname/live, met test en foutstatus. Geen geluid-assets nodig; systeemstem met fallback naar tekst. Persoonlijke transcripties worden vóór hergebruik geanonimiseerd.

## 13. Toegankelijkheid en zelfstandigheid

Doel WCAG 2.2 AA met strengere productafspraak: alle kindcontrols minimaal **48×48 CSS-pixels**, ook icoonknoppen. WCAG AA zelf gebruikt voor 2.5.8 een lagere minimumgrens en uitzonderingen; 48px is onze eigen keuze, zie [W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Minimaal 8px ruimte waar aanrakingen verward kunnen worden. SVG-iconen zijn 24px binnen een 48px control. Geen verborgen hoveractie, drag-only handeling of kleur-only betekenis.

Semantische HTML, lang=nl, skiplink, één h1 per scherm, echte labels, focusvolgorde, toetsenbordroutes, dialog focus-trap en herstel, geen focus onder sticky balk. Antwoorden vormen radio/checkboxgroepen met naam. Beschrijving van som en kaart afzonderlijk toegankelijk; kaartalternatief mag geen antwoord verklappen. Announce alleen nieuwe vraag/feedback; niet iedere pan/zoom. Borduitleg krijgt transcript/captions met wiskundig correcte spreektekst. Zoom/screenreadergebruik mag geen tijdstraf veroorzaken.

Leesopties: grotere tekst, rustige overgangen, voorlezen, alleen aantoonbaar equivalente kortere context. Geen claim van een dyslexiecertificaat. Contrast, 200% tekstvergroting, reflow 320px, Safari VoiceOver/Chrome toetsenbord, portrait/landscape en schermtoetsenbord daadwerkelijk testen. Automatische scan is aanvullend, geen vervanging voor handmatig testen.

## 14. Gast, ouderaccount en kinderprofielen

Een kind kan zonder account starten; bouwvoorstel maximaal twee voltooide gastopdrachten (16 slots bij standaard), limiet op voltooide sessies en niet op één fout/stopactie. Na eerste afronding vriendelijk accountvoorstel, overslaan mogelijk; na tweede nieuwe starts blokkeren met duidelijke ouderroute. Hervatten van bestaande sessie blijft mogelijk. Gastprofiel/data lokaal, met melding dat apparaten niet synchroniseren en browserwissen data verwijdert. Niet ‘sluiten wist alles’ beweren.

Een ouder maakt/verifieert het account; kind vult geen e-mailadres, achternaam, geboortedatum of foto in. Kinderprofiel: voornaam, groep 5–8, avatar-id, oudertoestemming en leerinstellingen. Geen kindwachtwoord. Ouder logt apparaat in en kiest profiel; wisselen via profielkiezer zoals streamingapps. Ouderdashboard blijft beschermd door een recente ouderauthenticatie/extra bevestiging, niet bereikbaar door alleen avatar wisselen. Tutorrol uitsluitend uitnodiging door beheerder, geen zelftoekenning via requestbody.

Gast→accountmigratie: ouder krijgt profielkoppeling bevestigd; idempotent import met event-id, inhoud en versies; geen dubbelen, geen onbekende oude events als zelfstandig verklaren. Uitloggen waarschuwt voor nog niet gesynchroniseerde antwoorden en verwijdert gedeelde-apparaatcache van profielgegevens na beveiligde verwerking. Auth, synchronisatie en toegangscontrole worden server-side gebouwd.

## 15. Tutorhulp en live-lessen

Tutorhulp volgt niet automatisch na één lastige opdracht. Configureerbaar bouwvoorstel: hetzelfde leerdoel heeft op twee verschillende sessies/kalenderdagen hulp en een onjuiste zelfstandige controlevraag gehad; relevante prerequisite-route is geprobeerd of leerkracht onderbouwt waarom niet nodig; tutorcriteria voldaan; actieve oudertoestemming. Regel voorkomt starts op verkeerd niveau. Ouder ziet een suggestie en kan **geschikte** aanvraag doorzetten, niet een onbeperkte tutor-chat openen. Eén open aanvraag per kind/doel. Voor uitzonderlijke hulp is beoordeling/overrule door tutor mogelijk met reden, niet door verborgen kindknop. Wel vriendelijk tussenstapadvies aan kind.

Tutor ziet uitsluitend voornaam als identiteitsgegeven, plus noodzakelijke onderwijskundige context: groep, doel, vraagversies, antwoorden, gebruikte hulp, vervolgresultaat en feitelijk systeemadvies. Geen e-mailadres, contactgegevens, IP-adressen, oudernaam, foto's of andere profielgegevens. Dus niet claimen ‘verder niets’ als de tutor ook oefencontext nodig heeft. Kind/tutorcontact blijft in Mees, stem plus bord. Geen kindcamera/microfoon of privécontact buiten het platform.

Tutor pakt aanvraag atomair op (claim met conflictstatus), maakt uitleg met getypte tekst/breuken/vormen/pijlen en optioneel trackpadtekenen, neemt alleen eigen stem+bord op, controleert voorbeeld/transcript en verzendt. Kind oefent daarna nieuwe soortgelijke vraag; zien/luisteren telt niet als beheersing. Tutor sluit op bewijs af of vervolgt dezelfde aanvraag. E-mail aan ouder kort, geen opgave/antwoord/achterstandslabel in onderwerp of body.

Live-groepering bouwvoorstel: ≥3 verschillende geschikte kinderen op één learningGoalId binnen 14 dagen. Dedupe per kind; geen dubbeletelling van retries en geen automatische diagnoses. Tutor beslist, geen automatische publicatie. Lesplanner: leerdoel, titel, start in Europe/Amsterdam (database UTC), 15–30 minuten bouwvoorstel, capaciteit bijv. 20, uitnodiging-preview, parent-consent-check. Alleen passende kinderen/ouders uitgenodigd; geen automatische deelname; één rustige optionele herinnering. Wijzigen/annuleren informeert alle bestaande uitnodigingen, idempotent. Vol: wachtlijst of terugkijken, niet eindeloos refreshen.

Live kind: alleen tutorstem en bord. Geen namenlijst, anderekindberichten, camera of microfoon. Vragen privé per tekst, max 300 tekens als configureerbaar voorstel, server-side rate-limit, contactgegevens/spam/onveilige inhoud check; twijfel naar tutor-review zonder blind hard blokkeren. ‘Je vraag wordt bekeken’ of ‘Pas je vraag even aan’ zichtbaar, oorspronkelijke inhoud blijft voor kind bewerkbaar. Tutor kan vragen anoniem beantwoorden en status wijzigen; geen raw kindvraag/naam in opname. Tijdelijke beperking van vraagzenden verandert niet kijktoegang; reden en oudermelding zichtbaar.

Opname is een private draft, daarna inhoud/anonimiteit/transcript controleren en expliciet publiceren aan bijbehorend doel. Audio en bordsync zijn externe infrastructuur: `bouwopdracht-claude.md` vraagt echte adapter plus lokale demonstratie, met aantoonbare featurestatus. Als provider niet geconfigureerd is, geen live-knop die succes verzint. Meer technische contracten staan in `techniek-en-gegevens.md`.

## 16. Werkbladen en schermvrij leren

Vak → onderwerp(en) van dat vak → onderdelen → niveau/aantal → preview **onder** instellingen → print/PDF, optioneel antwoordblad voor ouder. Alleen actief beoordeelde vakinhoud. Vraag- en antwoordblad delen dezelfde immutable worksheet-id en vraagversies; niet apart willekeurig genereren. Print schoon A4, geen menubalk, voldoende antwoordruimte, geen tutor-/accountgegevens. Gebruik sessie-unieke onpersoonlijke koppeling, geen voornaam nodig op blad.

Eerste versie: kind of ouder markeert gedaan; ouder registreert aantallen goed/onduidelijk/hulp en corrigeert. Papierresultaat telt als oefenactiviteit met onbekende zelfstandigheid tenzij ouder expliciet observeerde; niet als digitaal bewezen beheersing. Foto-upload voor nakijken is toekomstige feature, zichtbaar als uitgeschakeld featureflag, geen nep-AI-nakijkresultaten. Als later: private storage, EXIF strip, geen gezichten meenemen, ouderverificatie per onzekere opgave, verwijderbare foto, confidence/bron loggen. Avatar blijft altijd een gekozen dier, nooit een uploadfoto.

## 17. Bouw- en controleafspraken

Alle routes bouwen, met lokale demonstratiemodus en echte geïntegreerde mode waar services geconfigureerd zijn. Geen productieauth zelf verzinnen, geen lokale voortgang claimen als accountopslag, geen statische kaartbeelden als oefening. Content- en externeproviders via adapters/featureflags; pending functies expliciet vermelden. Volledige bouwvolgorde, testmatrix en definition of done staan in de overige documenten.

Nieuwe aanvullende routes: oudermailverificatie, apparaat koppelen, profielwisselbeveiliging, lege/foutstaten, meldingen, live-vol/wachtkamer/afgelopen/terugkijken, privacy/accountbeheer, tutor-contentcontrole en curriculumreview. Deze missen soms een eigen rastermockup: gebruik de beschreven componenten, geen eigen andere visuele stijl. Donatiebetaling valt niet in scope; een donateurpagina met beheerde naam/logo wel. Beheerder krijgt geen openbare navigatietegel.

### Bronnen en curriculummoment

Op 7 oktober 2026 gecontroleerd: SLO beschrijft nieuwe rekenkerndoelen en overgang vanaf augustus 2026; oude TULE-uitwerkingen alleen als benoemde historische voorbeelden gebruiken. Zie [SLO kerndoelen rekenen](https://www.slo.nl/thema/meer/actualisatie-kerndoelen-examenprogramma/actualisatie-kerndoelen/definitieve-conceptkerndoelen-rekenen/) en [SLO leerlijnen](https://www.slo.nl/thema/vakspecifieke-thema/rekenen-wiskunde/leerlijnen/). Europa sluit inhoudelijk aan op kaartkennis/topografie, maar de meegeleverde regionale lijsten zijn onze lesindeling, niet een verplicht landenschema van de overheid; [SLO aanboddoelen kaart/topografie](https://www.slo.nl/publish/pages/16854/ojw-po-kerndoelen-met-aanbodsdoelen06-2020.pdf). Vraag-/groepkoppelingen blijven review-required. Geen onbeoordeelde bank als officieel gecertificeerde lesstof presenteren.


## 18. Volledige schermcatalogus naast S01–S09

Per scherm staat hieronder de concrete handeling. Alle toestanden en volledige tekst staan ook in data/schermen.json en teksten.md. `S06` is een paneel op de bestaande oefenroute; hashes duiden een toestand aan, geen tweede sessie.

### B01 — Een octopus heeft drie harten

Route `/kind/weetjes/[weetjeId]` · rol `kind`.

Ziet: Bijzonder, toch? Twee harten pompen bloed naar de kieuwen. Het derde pompt bloed naar de rest van het lichaam. Leesbron wordt vóór publicatie gecontroleerd.

- **Weetjesboek** → S09: Terug naar overzicht.
- **Voorlezen** → B01: Lees weetje.

Bewaren: geen tracking nodig. Leeg: Dit weetje is nog niet ontdekt. Afgerond/succes: Dit weetje is bewaard.

### T01 — Tafeltrainer

Route `/kind/tafeltrainer` · rol `kind`.

Ziet: Welke tafels wil je oefenen? Kies één of meer tafels. Met tijd oefenen is niet verplicht.

- **Start oefenen** → T02: Maak tafelopdracht.
- **Op papier** → W01: Maak tafelwerkblad.
- **Start** → S01: Terug.

Bewaren: tafels, delen/vermenigvuldigen, timerkeuze, aantal. Leeg: Kies eerst een tafel. Afgerond/succes: Je tafelopdracht staat klaar.

### T02 — Wat is 7 × 8?

Route `/kind/tafeltrainer/[sessieId]` · rol `kind`.

Ziet: Vul het antwoord in. Vraag {nummer} van {aantal} Tijd is alleen zichtbaar als je die zelf aanzette.

- **Controleer antwoord** → T02: Beoordeel numeriek en volg hulpladder.
- **Bekijk een hint** → S06: Zelfde sessiepanel met tafelhint.
- **Stop voor nu** → S01: Pauzeer actieve antwoordtijd en bewaar.

Bewaren: pogingen, actieve antwoordduur, nauwkeurigheid. Leeg: Kies eerst je tafels. Afgerond/succes: Goed gevonden!

### N01 — Wat past bij jou?

Route `/kind/niveaubepaling` · rol `kind`.

Ziet: Mees kijkt waarmee je kunt beginnen. Je hoeft nog niet alles te kunnen. Je kunt ook direct een onderwerp kiezen.

- **Start niveaubepaling** → N02: Start korte diagnostische reeks.
- **Kies zelf** → S02: Sla bepaling over.

Bewaren: diagnostische selectie, geen groeplabelwijziging. Leeg: Je kunt kiezen hoe je begint. Afgerond/succes: Je kunt beginnen.

### N02 — Vergelijk de breuken

Route `/kind/niveaubepaling/[sessieId]` · rol `kind`.

Ziet: Kies het juiste teken. Dit helpt Mees een passend begin te kiezen.

- **Controleer antwoord** → N02: Diagnostisch bewijs; gebruik van hulp maakt antwoord ondersteund.
- **Bekijk een hint** → S06: Toon hulp; geen toetsstraf.
- **Stop voor nu** → S01: Bewaar diagnostiek.

Bewaren: diagnostische pogingen, gebruikte hulp, onzekerheid. Leeg: Er staat geen vraag klaar. Afgerond/succes: Je hebt deze vraag geprobeerd.

### N03 — Een passend begin

Route `/kind/niveaubepaling/advies` · rol `kind`.

Ziet: Mees stelt voor: breuken herkennen. Je kunt dit proberen of zelf iets kiezen. Dit is een beginadvies, geen toetscijfer.

- **Probeer dit** → S04: Open aanbevolen onderdeel.
- **Kies zelf** → S02: Kind kiest zelf.

Bewaren: advies met bewijs en onzekerheid. Leeg: Er is nog te weinig informatie voor een voorstel. Afgerond/succes: Je beginadvies staat klaar.

### W01 — Maak een werkblad

Route `/werkbladen/samenstellen` · rol `kind-of-ouder`.

Ziet: Kies wat je op papier wilt oefenen. Kies eerst een vak. Daarna kies je onderwerpen en onderdelen. Bekijk voorbeeld

- **Bekijk voorbeeld** → W01: Klap preview onder instellingen open.
- **Maak werkblad** → W02: Genereer gekoppelde vraag- en antwoordset.
- **Terug** → S04: Terug naar digitale instellingen.

Bewaren: worksheet-id, vraag-id+version, selectie, seed. Leeg: Kies eerst een vak en onderwerp. Afgerond/succes: Je werkblad staat klaar.

### W02 — Je werkblad

Route `/werkbladen/[werkbladId]` · rol `kind-of-ouder`.

Ziet: Kijk even of alles past. Antwoorden staan op een apart blad.

- **Print werkblad** → W03: Open printweergave.
- **Download PDF** → W02: Exporteer exact dezelfde set.
- **Antwoordblad** → W04: Ouder ziet antwoordset.
- **Pas aan** → W01: Behoud selectie; nieuw blad krijgt nieuwe id.

Bewaren: print/pdf gebeurtenissen optioneel. Leeg: Je werkblad is nog niet gemaakt. Afgerond/succes: Het werkblad is klaar om te printen.

### W03 — Rekenen · Breuken vergelijken

Route `/werkbladen/[werkbladId]/print` · rol `kind-of-ouder`.

Ziet: Werkblad Schrijf je antwoorden bij de vragen.

- **Printen** → W03: Browserprint, @page A4 zonder appnav.
- **Resultaten invullen** → O04: Ouder registreert papierwerk.

Bewaren: worksheet-id. Leeg: Dit werkblad is niet beschikbaar. Afgerond/succes: Geprint of gedownload bewijst nog geen oefening.

### W04 — Antwoordblad

Route `/ouder/werkbladen/[werkbladId]/antwoorden` · rol `ouder`.

Ziet: Dit hoort bij hetzelfde werkblad. Controleer de antwoorden samen.

- **Print antwoordblad** → W04: Print gekoppelde set.
- **Resultaten invullen** → O04: Handmatige registratie.

Bewaren: geen automatische nakijkclaim. Leeg: Dit antwoordblad is niet beschikbaar. Afgerond/succes: Je kunt de resultaten registreren.

### H01 — Extra uitleg kan helpen

Route `/kind/hulp/[doelId]` · rol `kind`.

Ziet: Je ouder kan meekijken. Je hebt de aanwijzingen en een soortgelijke vraag geprobeerd. Je ouder kan bekijken of tutorhulp passend is.

- **Laat mijn ouder weten** → O03: Maak private oudermelding, nog geen tutorclaim.
- **Probeer een tussenstap** → S04: Open passend basisdoel.

Bewaren: geschiktheidsbewijs, oudermelding-id. Leeg: Probeer eerst de uitleg en een tussenstap. Afgerond/succes: Je ouder krijgt een melding.

### H02 — Je hulpvraag

Route `/kind/hulpvragen/[hulpvraagId]` · rol `kind`.

Ziet: De tutor kijkt ernaar. Je kunt ondertussen iets anders oefenen.

- **Kies iets anders** → S02: Verlaat aanvraag zonder annuleren.
- **Bekijk uitleg** → H03: Alleen wanneer uitleg beschikbaar is.

Bewaren: status, geen harde antwoordtijdgarantie. Leeg: Er staat nog geen hulpvraag open. Afgerond/succes: Je uitleg staat klaar.

### H03 — Uitleg voor jou

Route `/kind/uitleg/[uitlegId]` · rol `kind`.

Ziet: Breuken vergelijken Stem en tekenbord Een soortgelijke vraag.

- **Afspelen** → H03: Start tutorstem+bord.
- **Pauze** → H03: Pauzeer beide gesynchroniseerd.
- **Volledig scherm** → H03: Vergroot bord.
- **Probeer het zelf** → S05: Start nieuwe gekoppelde controlevraag.

Bewaren: bekeken zonder beheersingsclaim, controle-resultaat. Leeg: De tutor werkt nog aan je uitleg. Afgerond/succes: Je kunt nu zelf een vraag proberen.

### P01 — Even bewegen

Route `/kind/pauze` · rol `kind`.

Ziet: Loop even een rondje. Je kunt straks weer verder.

- **Verder oefenen** → S01: Ga terug zonder deadline.
- **Klaar voor nu** → S01: Bewaar open sessie.

Bewaren: geen beweegtracking. Leeg: Even stoppen is ook goed. Afgerond/succes: Je kunt weer kiezen wat je wilt doen.

### P02 — Wie gaat oefenen?

Route `/profielen` · rol `ouder-of-gekoppeld-apparaat`.

Ziet: Kies je profiel. Voor ouders

- **Open profiel** → S01: Server controleert device scope; zet actief kind.
- **Voor ouders** → O01: Recente ouderauth vereist.
- **Kind toevoegen** → A05: Alleen ouder.

Bewaren: actief profiel. Leeg: Voeg eerst een kinderprofiel toe. Afgerond/succes: Profiel gekozen.

### P03 — Jouw profiel

Route `/kind/profiel` · rol `kind`.

Ziet: Kies een dier dat bij je past. Vos Uil Kat Beer Konijn Panda

- **Bewaar avatar** → S01: Alleen avatar-id wijzigen; voornaam wijzigen via ouder.
- **Wissel profiel** → P02: Profielkiezer.

Bewaren: avatar-id. Leeg: Kies een avatar. Afgerond/succes: Je avatar is bewaard.

### P04 — Probeer Mees

Route `/proberen` · rol `gast`.

Ziet: Je kunt meteen beginnen. Een gratis account helpt Mees je voortgang te bewaren.

- **Direct oefenen** → S02: Maak lokale gastcontext.
- **Gratis account** → A01: Ouderaccount-route.

Bewaren: lokale gast-id, geen email van kind. Leeg: Kies hoe je wilt beginnen. Afgerond/succes: Je kunt beginnen met oefenen.

### P05 — Bewaar je voortgang

Route `/voortgang-bewaren` · rol `gast`.

Ziet: Vraag je ouder om een gratis account. Mees kan je dan helpen op jouw niveau. Zonder account blijft deze proefvoortgang alleen in deze browser.

- **Vraag mijn ouder** → A01: Ouder neemt over, migratie bevestigen.
- **Nog even proberen** → S01: Alleen als gastlimiet niet bereikt; hervatten blijft mogelijk.

Bewaren: gastgrens, migratieclaim. Leeg: Je hebt nog geen oefening gemaakt. Afgerond/succes: Je voortgang is aan je profiel gekoppeld.

### A00 — Leren op jouw niveau

Route `/` · rol `publiek`.

Ziet: Voor ieder kind. Voor altijd gratis. Mees helpt kinderen oefenen, met uitleg wanneer dat nodig is. Gratis dankzij donaties. Donateurs krijgen geen gegevens en geen invloed op de lesinhoud.

- **Probeer Mees** → P04: Gaststart.
- **Gratis account** → A01: Ouder registreert.
- **Bekijk hoe Mees werkt** → A06: Rustige ouderuitleg.
- **Onze donateurs** → A07: Naam/logo overzicht.

Bewaren: geen advertentietracking. Leeg: Mees maakt leren toegankelijk. Afgerond/succes: Welkom bij Mees.

### A06 — Zo werkt Mees

Route `/hoe-mees-werkt` · rol `publiek`.

Ziet: Rustig oefenen. Hulp als dat nodig is. 1. Kies wat je wilt oefenen. 2. Oefen met hints en uitleg. 3. Kijk wat zelfstandig lukt. Ook op papier. Gratis dankzij donaties.

- **Probeer het voorbeeld** → A06: Lokale demonstratie van echte hulpladder, geen profiel nodig.
- **Maak een gratis account** → A01: Ouderregistratie.
- **Werkbladen** → W01: Open schermvrije route.

Bewaren: geen demoantwoord naar productprofiel zonder migratie. Leeg: Bekijk een voorbeeld. Afgerond/succes: Het voorbeeld is afgerond.

### A07 — Onze donateurs

Route `/donateurs` · rol `publiek`.

Ziet: Samen maken we leren toegankelijk. Mees is voor altijd gratis. Deze organisaties helpen dat mogelijk te maken. Donateurs krijgen geen gegevens en geen invloed op de lesinhoud.

- **Terug** → A00: Terug naar ouderlanding.

Bewaren: alleen beheerde donor naam+logo. Leeg: Hier komen de namen en logo’s van onze donateurs. Afgerond/succes: Dank aan iedereen die Mees mogelijk maakt.

### A01 — Maak een gratis ouderaccount

Route `/ouder/account-aanmaken` · rol `publiek`.

Ziet: Bewaar de voortgang van je kind. Mees blijft voor altijd gratis. Je kind heeft geen eigen e-mailadres nodig.

- **Maak account** → A08: Authprovider valideert, mailverificatie.
- **Ik heb al een account** → A02: Login.

Bewaren: ouderaccount, verificatie, versie ouderverklaring. Leeg: Vul je gegevens in. Afgerond/succes: Controleer je e-mail.

### A02 — Welkom terug

Route `/ouder/inloggen` · rol `publiek`.

Ziet: Log in als ouder. Je kind kiest daarna het eigen profiel.

- **Inloggen** → P02: Geverifieerde sessie + veilige redirect.
- **Wachtwoord vergeten** → A03: Herstelroute.
- **Maak account** → A01: Registratie.

Bewaren: veilige sessiecookie. Leeg: Vul je e-mailadres en wachtwoord in. Afgerond/succes: Je bent ingelogd.

### A03 — Wachtwoord vergeten?

Route `/ouder/wachtwoord-herstellen` · rol `publiek`.

Ziet: We helpen je weer inloggen. Als er een account bij dit adres hoort, krijg je een herstelmail.

- **Stuur herstelmail** → A03: Generic bevestiging voorkomt accountenumeratie.
- **Terug naar inloggen** → A02: Terug.

Bewaren: rate-limit poging, geen wachtwoordlog. Leeg: Vul je e-mailadres in. Afgerond/succes: Als er een account bij dit adres hoort, is een herstelmail verstuurd.

### A04 — Kies een nieuw wachtwoord

Route `/ouder/nieuw-wachtwoord` · rol `publiek`.

Ziet: Gebruik de link uit je herstelmail. De link is tijdelijk geldig.

- **Bewaar wachtwoord** → A02: Provider reset; herstel-token ongeldig maken.

Bewaren: provider-reset. Leeg: Open een geldige herstelmail. Afgerond/succes: Je wachtwoord is gewijzigd.

### A05 — Voeg een kind toe

Route `/ouder/kind-toevoegen` · rol `ouder`.

Ziet: Alleen een voornaam en een avatar. Je kunt de groep later wijzigen. Eerdere leerdoelen blijven beschikbaar.

- **Bewaar profiel** → P02: Maak profiel gekoppeld aan ingelogde ouder.
- **Kies avatar** → A05: Open dierkeuze.

Bewaren: voornaam, groep, avatar-id, toestemming. Leeg: Voeg je eerste kinderprofiel toe. Afgerond/succes: Het profiel is bewaard.

### A08 — Controleer je e-mail

Route `/ouder/verifieer-e-mail` · rol `publiek`.

Ziet: Open de link om je account te bevestigen. Geen mail? Kijk ook bij ongewenste berichten.

- **Stuur opnieuw** → A08: Rate-limit; alleen zelfde pendingaccount.
- **Account bevestigd** → A05: Token server controleren, niet clientclaim.

Bewaren: verificatietoken provider. Leeg: De link is niet geldig of is verlopen. Afgerond/succes: Je account is bevestigd.

### A09 — Koppel dit apparaat

Route `/ouder/apparaat-koppelen` · rol `ouder`.

Ziet: Daarna kan je kind een profiel kiezen. Op een gedeeld apparaat log je na het oefenen uit.

- **Koppel apparaat** → P02: Maak beperkte device session.
- **Annuleren** → O01: Geen koppeling.

Bewaren: device session, profielscope, revocation. Leeg: Er is nog geen apparaat gekoppeld. Afgerond/succes: Dit apparaat is gekoppeld.

### O01 — Overzicht voor ouders

Route `/ouder` · rol `ouder`.

Ziet: Kijk hoe het oefenen gaat. Oefeningen Voortgang Uitleg Meldingen Werkbladen

- **Bekijk voortgang** → O02: Selecteer eigen kind.
- **Bekijk hulpvraag** → O03: Open geschiktheid/aanvraag.
- **Werkbladen** → W01: Maak blad.
- **Instellingen** → O05: Beheer eigen gezin.

Bewaren: geen nieuwe voortgang door bezoek. Leeg: Hier verschijnt het oefenen van je kind. Afgerond/succes: Het overzicht is bijgewerkt.

### O02 — Voortgang van {voornaam}

Route `/ouder/kind/[kindId]/voortgang` · rol `ouder`.

Ziet: Breuken vergelijken Zelfstandig Met hulp Nog eens oefenen Papierwerk Bekeken uitleg is geen bewijs van beheersing.

- **Oefening bekijken** → O02: Toon immutable vraag/antwoord/hulp.
- **Bekijk tutoradvies** → O03: Alleen als criteria gehaald.
- **Terug** → O01: Overzicht.

Bewaren: geen nieuwe beheersing. Leeg: Er zijn nog geen resultaten voor dit onderdeel. Afgerond/succes: De resultaten zijn bijgewerkt.

### O03 — Extra uitleg voor {voornaam}

Route `/ouder/hulp/[doelId]` · rol `ouder`.

Ziet: Bekijk wat al is geprobeerd. Hint 1 Hint 2 Uitleg Soortgelijke vraag Een tutor ziet alleen de voornaam en de oefencontext.

- **Stuur naar een tutor** → H02: Servercriteria/toestemming, dedupe open aanvraag.
- **Open bestaande hulpvraag** → H02: Geen tweede aanvraag.
- **Probeer eerst een tussenstap** → S04: Basisroute.

Bewaren: consentversion, aanvraag-id, geschiktheidsbewijs. Leeg: Er is nog geen tutoradvies. Probeer eerst de passende oefenroute. Afgerond/succes: De hulpvraag is verstuurd.

### O04 — Papierwerk registreren

Route `/ouder/werkbladen/[werkbladId]/resultaten` · rol `ouder`.

Ziet: Kijk samen wat is gelukt. Papierwerk staat apart van digitale antwoorden. We weten niet altijd hoeveel hulp nodig was.

- **Bewaar resultaten** → O02: Idempotent papierrecord met bron en onzekerheid.
- **Pas een antwoord aan** → O04: Handmatige correctieversie.
- **Werkblad bekijken** → W02: Zelfde worksheet-id.

Bewaren: gedaan, goed, onduidelijk, hulp ja/nee/onbekend, ouderbevestiging. Leeg: Er zijn nog geen papierresultaten. Afgerond/succes: De papierresultaten zijn bewaard.

### O05 — Instellingen

Route `/ouder/instellingen` · rol `ouder`.

Ziet: Jij regelt het gebruik van Mees. Tutorhulp Meldingen in Mees Korte e-mailmeldingen Apparaten Privacy

- **Bewaar instellingen** → O05: Server toetst ouder; consentversie vastleggen.
- **Beheer apparaten** → A09: Bekijken/revoken.
- **Privacy en gegevens** → O06: Export/verwijdering.

Bewaren: tutortoestemming, meldingsvoorkeur, consent history. Leeg: Stel je voorkeuren in. Afgerond/succes: Je instellingen zijn bewaard.

### O06 — Privacy en gegevens

Route `/ouder/privacy` · rol `ouder`.

Ziet: Beheer de gegevens van je gezin. Een tutor ziet geen contactgegevens. Je kunt een overzicht aanvragen of een profiel verwijderen.

- **Download gegevens** → O06: Recente ouderauth; private export van eigen gezin.
- **Verwijder profiel** → O06: Heldere bevestiging en verwijderprocedure.
- **Uitloggen** → A02: Intrek sessie, let op pending outbox.

Bewaren: export job, deletion request, audit minimal. Leeg: Er staat geen verzoek open. Afgerond/succes: Je verzoek is ontvangen.

### M01 — Meldingen

Route `/meldingen` · rol `kind-of-ouder`.

Ziet: Hier vind je nieuwe uitleg en lessen. Nog ongelezen Eerder bekeken

- **Open uitleg** → H03: Controleer eigenaarschap.
- **Open les** → L02: Kinduitnodiging, ouder naar L03.
- **Markeer gelezen** → M01: Wijzig readAt zonder leerbewijs.

Bewaren: readAt. Leeg: Je hebt geen nieuwe meldingen. Afgerond/succes: Melding gelezen.

### U01 — Tutordashboard

Route `/tutor` · rol `tutor`.

Ziet: Hulpvragen, lessen en uitleg. Nieuwe hulpvragen Lesvoorstellen Mijn lessen Uitleg controleren

- **Open werkvoorraad** → U02: Filter aanvragen.
- **Bekijk lesvoorstel** → U09: Feitelijke doelaggregatie.
- **Les inplannen** → L01: Planner.
- **Uitlegbibliotheek** → U10: Beoordeelde eigen/content items.

Bewaren: filter, claimstatus. Leeg: Er zijn nu geen nieuwe hulpvragen of lesvoorstellen. Afgerond/succes: Het overzicht is bijgewerkt.

### U02 — Hulpvragen

Route `/tutor/hulpvragen` · rol `tutor`.

Ziet: Pak een vraag op waar je bij kunt helpen. Nieuw In behandeling Wacht op controlevraag Afgerond

- **Oppakken** → U03: Atomaire claim, conflict geeft bestaande status.
- **Open** → U03: Eigen/authorized bestaande claim.
- **Filter** → U02: Leerdoel en status.

Bewaren: claim owner, claimedAt, lease. Leeg: Er staan geen passende hulpvragen open. Afgerond/succes: De hulpvraag is aan jou toegewezen.

### U03 — Hulpvraag van {voornaam}

Route `/tutor/hulpvragen/[hulpvraagId]` · rol `tutor`.

Ziet: Breuken vergelijken Wat is gedaan Welke hulp is gebruikt Nieuwe controlevraag Voorstel voor uitleg Conclusies zijn gebaseerd op antwoorden, niet op veronderstelde denkfouten.

- **Maak uitleg** → U04: Open bord met inhoudelijk doel.
- **Gebruik bestaande uitleg** → U10: Alleen beoordeelde passende inhoud.
- **Plan een les** → L01: Vanuit doel, niet openbaar kindnaam.

Bewaren: feitelijk advies, annotatie met auteur. Leeg: De hulpvraag is niet beschikbaar of al opgepakt. Afgerond/succes: Je kunt uitleg voorbereiden.

### U04 — Maak uitleg

Route `/tutor/uitleg/[uitlegId]/bewerken` · rol `tutor`.

Ziet: Stem en tekenbord Tekst toevoegen Breuk Vorm Pijl Tekenen Ongedaan maken

- **Tekst toevoegen** → U04: Type en plaats tekstvak; toetsenbord vereist, muistekenen niet.
- **Start opname** → U04: Microfooncheck; neem stem en bord-events op.
- **Stop opname** → U05: Bewaar private draft.
- **Bewaar concept** → U04: Geen versturing.

Bewaren: bordmodel, eventtimeline, audio draft, transcript draft. Leeg: Begin met een tekstvak of een model. Afgerond/succes: Je concept is bewaard.

### U05 — Controleer de uitleg

Route `/tutor/uitleg/[uitlegId]/controle` · rol `tutor`.

Ziet: Bekijk en luister vóór je verstuurt. Controleer de som, de uitleg en het transcript. De uitleg bevat geen kindnamen of privévragen.

- **Pas aan** → U04: Bewerk draft.
- **Stuur uitleg** → H02: Publiceer authorized persoonlijke uitleg en oudermelding.
- **Bewaar concept** → U05: Nog niet publiceren.

Bewaren: reviewstatus, publishedversion, notification idempotency. Leeg: Er staat nog geen opname klaar. Afgerond/succes: De uitleg is verstuurd.

### U06 — Na de uitleg

Route `/tutor/hulpvragen/[hulpvraagId]/resultaat` · rol `tutor`.

Ziet: Kijk wat zelfstandig lukt. Controlevraag Zelfstandig gelukt Nog niet gecontroleerd Nog hulp nodig

- **Rond hulpvraag af** → U02: Alleen onderbouwd resultaat; reden bewaren.
- **Vervolg hulpvraag** → U03: Zelfde dossier, geen dubbelaanvraag.

Bewaren: reviewantwoord, afsluitreden. Leeg: Het kind heeft de controlevraag nog niet gemaakt. Afgerond/succes: De hulpvraag is afgerond.

### U09 — Samen uitleg kan helpen

Route `/tutor/lesvoorstellen/[doelId]` · rol `tutor`.

Ziet: Meerdere kinderen oefenen hetzelfde onderdeel. {aantal} verschillende kinderen Periode: {periode} Doorlopen hulp Eerdere leerdoelen

- **Plan live les** → L01: Tutor beslist, geen automatische les.
- **Gebruik bestaande uitleg** → U10: Passende doelinhoud.
- **Nog geen les nodig** → U01: Snooze met feitelijke reden.

Bewaren: signal window, unique child count, beslissing. Leeg: Er zijn nog niet genoeg passende signalen. Afgerond/succes: Je keuze is bewaard.

### U10 — Uitlegbibliotheek

Route `/tutor/uitlegbibliotheek` · rol `tutor`.

Ziet: Uitleg per leerdoel Goedgekeurd Concept Nog controleren

- **Open uitleg** → U05: Review/open versie.
- **Koppel aan hulpvraag** → U03: Controleer doel en passende context.

Bewaren: goal linkage, reviewversion. Leeg: Er is nog geen beoordeelde uitleg voor dit doel. Afgerond/succes: Uitleg gekoppeld.

### L01 — Plan een live les

Route `/tutor/lessen/inplannen` · rol `tutor`.

Ziet: Geef samen uitleg over één onderdeel. Uitnodiging bekijken Alleen passende kinderen en hun ouders krijgen een uitnodiging.

- **Bekijk uitnodiging** → L01: Preview, nog geen verzending.
- **Plan en verstuur** → L02: Persist lesson+outbox notifications; atomic capacity and consentchecks.
- **Annuleren** → U01: Geen les publiceren.

Bewaren: doel, startUTC, tijdzone, duur, capaciteit, opnamekeuze, invitations. Leeg: Kies eerst een leerdoel. Afgerond/succes: De les is gepland.

### L02 — Een les over breuken

Route `/kind/lessen/[lesId]` · rol `kind`.

Ziet: Je kunt meedoen of later terugkijken. {datum} om {tijd} Je ziet en hoort de tutor. Je vragen gaan alleen naar de tutor.

- **Ik wil meedoen** → L04: Check oudertoestemming/capaciteit; reserveer plek.
- **Later terugkijken** → L06: Alleen wanneer opname gepubliceerd; anders belangstelling zonder belofte.
- **Niet nu** → S01: Geen nadelige gevolgen.

Bewaren: RSVP, parentconsent snapshot. Leeg: Er is geen passende uitnodiging. Afgerond/succes: Je plek is gereserveerd.

### L03 — Een les voor {voornaam}

Route `/ouder/lessen/[lesId]` · rol `ouder`.

Ziet: Breuken vergelijken Kinderen zien elkaar niet. Vragen gaan privé naar de tutor. De opname bevat alleen tutorstem en bord.

- **Deelname toestaan** → L03: Sla optionele specifieke consent op; respecteer gezinsinstelling.
- **Bekijk les** → L02: Geef kindroute alleen binnen scope.
- **Niet deelnemen** → O01: Weiger deelname zonder leerstraf.

Bewaren: ouderconsent, invitatie gelezen. Leeg: Er is geen uitnodiging voor je kind. Afgerond/succes: De keuze is bewaard.

### L04 — Live uitleg

Route `/kind/lessen/[lesId]/live` · rol `kind`.

Ziet: Breuken vergelijken Stem en tekenbord Stel je vraag aan de tutor. Je vraag is alleen zichtbaar voor de tutor.

- **Start geluid** → L04: Expliciete audioplay, geen kindmicrofoon.
- **Stuur vraag** → L04: Private queue + moderationstatus.
- **Verlaat les** → S01: Geen leerstraf; reconnect mogelijk.
- **Probeer het zelf** → S05: Na les optionele doelvraag.

Bewaren: attendance zonder beheersing, private questions, moderation states. Leeg: De les begint om {tijd}. Afgerond/succes: De les is afgelopen.

### L05 — Live les geven

Route `/tutor/lessen/[lesId]/live` · rol `tutor`.

Ziet: Breuken vergelijken Tekst toevoegen Vragen Nog beoordelen Beantwoord

- **Start les** → L05: Providerstate + media/boardcheck, expliciet.
- **Beantwoord vraag** → L05: Anonieme uitleg; status bijwerken.
- **Zet apart** → L05: Review, geen publieke doorgifte.
- **Pauzeer vragen** → L05: Tijdelijk met reden, kijktoegang blijft.
- **Beëindig les** → L07: Recording draft naar review.

Bewaren: board sequence, audio timestamps, private queue statuses. Leeg: Er zijn nog geen vragen. Afgerond/succes: De les is beëindigd.

### L06 — Kijk de uitleg terug

Route `/kind/lessen/[lesId]/terugkijken` · rol `kind`.

Ziet: Stem en tekenbord Deze uitleg hoort bij het onderdeel dat je oefent.

- **Afspelen** → L06: Gepubliceerde geanonimiseerde opname.
- **Probeer het zelf** → S05: Nieuwe gekoppelde vraag.

Bewaren: bekeken, geen beheersing. Leeg: De opname is nog niet beschikbaar. Afgerond/succes: Je kunt nu zelf oefenen.

### L07 — Controleer de lesopname

Route `/tutor/lessen/[lesId]/opname` · rol `tutor`.

Ziet: Klaar om later te gebruiken? Geen kindnamen, privévragen of contactgegevens in de opname. Controleer ook het transcript.

- **Publiceer opname** → U10: Review verplicht; koppel leerdoel.
- **Bewerk opname** → L07: Trim/anonimiseren, nieuwe versie.
- **Niet publiceren** → U01: Private draft behouden/verwijderprocedure.

Bewaren: review, doelen, transcript, privacycheck. Leeg: Er is geen opname gemaakt. Afgerond/succes: De opname is gepubliceerd.

### G01 — Europa

Route `/kind/aardrijkskunde/europa` · rol `kind`.

Ziet: Stel je oefening samen. Welk gebied wil je oefenen? Wat wil je oefenen? Hoe wil je oefenen? Je oefent tot alles uit je selectie aan bod is geweest.

- **Kies zelf landen** → G01: Open multi-selectdialog, bewaar scroll/focus.
- **Start oefenen** → G02: Maak volledige selectiequeue; choice→G03, puzzle→G04.
- **Op papier** → W01: Maak kaartwerkblad alleen met echte printSVG.

Bewaren: regions, objecttypes, ids, mode. Leeg: Kies een gebied en een onderwerp. Afgerond/succes: Je selectie staat klaar.

### G02 — Waar ligt {land}?

Route `/kind/aardrijkskunde/europa/[sessieId]` · rol `kind`.

Ziet: Tik een plek aan en controleer je antwoord. {behandeld} van {aantal} onderdelen behandeld

- **Controleer antwoord** → G02: Beoordeel object-id, juiste → volgende G02/G03 of S07.
- **Inzoomen** → G02: Handmatig, geen answerfocus.
- **Heel gebied** → G02: Herstel selectie-extent.
- **Bekijk een hint** → S06: Geo-hints binnen zelfde sessie.
- **Stop voor nu** → S01: Bewaar gehele selectie.

Bewaren: geo-object-key, selectiequeue, pogingen, hulp. Leeg: Er is geen kaartselectie. Afgerond/succes: Goed gevonden!

### G03 — Welk land is gekleurd?

Route `/kind/aardrijkskunde/europa/[sessieId]#meerkeuze` · rol `kind`.

Ziet: Kies de juiste naam. België Frankrijk Duitsland Spanje

- **Controleer antwoord** → G02: Zelfde queue, volgende mode.
- **Bekijk een hint** → S06: Geen antwoord vooraf verklappen.
- **Stop voor nu** → S01: Bewaar.

Bewaren: object-id, antwoord-id, hulp. Leeg: Er staat geen kaartvraag klaar. Afgerond/succes: Goed gevonden!

### G04 — Leg de landen op hun plek

Route `/kind/aardrijkskunde/europa/[sessieId]#puzzel` · rol `kind`.

Ziet: Tik een land aan en tik daarna op de kaart. {geplaatst} van {aantal} landen geplaatst Kies een land Na het plaatsen verschijnt een nieuw stukje.

- **Kies landstuk** → G04: Selecteer; label naast stuk.
- **Kies plek** → G04: Plaats direct, correct blijft, fout keert terug; hover neutraal.
- **Bekijk een hint** → G04: Hulp voor geselecteerd land.
- **Stop voor nu** → S01: Bewaar geplaatst en attempts.

Bewaren: placed ids, piece order, puzzle attempts/help. Leeg: Kies eerst landen om te puzzelen. Afgerond/succes: Alle landen uit je selectie zijn geplaatst.

### I01 — Privacy bij Mees

Route `/privacy` · rol `publiek`.

Ziet: We gebruiken alleen gegevens die nodig zijn. Je kind gebruikt een voornaam en een gekozen avatar. Tutorhulp blijft binnen Mees. Donateurs krijgen geen gegevens. De definitieve privacyverklaring wordt vóór publicatie vastgesteld.

- **Voor ouders** → A00: Terug.

Bewaren: geen tracking. Leeg: De definitieve verklaring volgt vóór publicatie. Afgerond/succes: Je kunt de uitleg rustig nalezen.

### C01 — Inhoud beoordelen

Route `/beheer/inhoud` · rol `beheerder`.

Ziet: Vraag, hints en uitleg horen bij elkaar. Concept Nog beoordelen Goedgekeurd Gearchiveerd

- **Publiceer versie** → C01: Alleen approved, vastleggen reviewer en bron.
- **Archiveer versie** → C01: Nieuwe sessies gebruiken niet meer; bestaande bewijzen immutable.

Bewaren: contentversion, reviewer, curriculum mapping. Leeg: Er is nog geen beoordeelde inhoud. Afgerond/succes: De inhoudsversie is gepubliceerd.



## Aanvullingen op routecatalogus

S02 biedt onder Kies zelf ook de vakkeuze Aardrijkskunde → G01. Geen lege toekomstige vakken. S03 gebruikt /kind/rekenen/[onderwerp]; Breuken is de mockupvariant. Na de eerste profielkeuze kan een kind direct starten of N01 kiezen. Bij S07 offline luidt de tekst: ‘Je opdracht is afgerond op dit apparaat. Synchroniseren lukt zodra je weer verbinding hebt.’ Toon ‘Je voortgang is bewaard’ alleen bij bevestigde opslag. De machineleesbare catalogus bevat deze aanvullingen.


## 19. Voorbeelden, assets en definitieve levering

De afbeeldingentabel staat in assets/afbeeldingen.md met alle 65 losse assets, werkelijkepixelmaten en gebruik. Favicons32/180 en sociale1200×630-export zijn afzonderlijk geleverd. Kleuren en componentnamen volgen de vaste tokens; SVG-illustraties mogen blauwe schaduwtinten hebben als decoratie. Nieuwe PNG-poses zijn statisch; de animatiespecificatie is een bouwafspraak, geen meegeleverde animatie.

De 42 voorbeeldvragen vormen geen complete vragenbank. Alle opgegeven typen hebben3 voorbeelden; ontbrekende authored-vervolgvragen zijn in controle/pakketcontrole.json aangegeven. Claude bouwt renderer en scheduler, en toont eerlijk een review later als geen variant beschikbaar is. De leerkracht moet de content uitbreiden/beoordelen voordat algemene beheersingsclaims mogelijk zijn.
