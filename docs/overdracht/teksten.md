# Letterlijke schermteksten en acties

Variabelen tussen accolades worden als gewone tekst ingevuld. Alle kindteksten zijn voor groep 5–8; de groep 3–4-versies zijn nog geen launch-inhoud. Document ontwerpregels.md blijft leidend bij een conflict.

## S01 — /kind/start

Titel: **Hoi {voornaam}**

Ondertitel: Wat wil je oefenen?

- Mees helpt je op weg.
- Mees stelt voor
- Breuken vergelijken
- Oefen welke breuk groter is.
- 8 vragen
- Een kort oefenmoment is ook waardevol.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Start oefenen | S05 | Start gerichte sessie; Mees kiest inhoud. |
| Kies zelf | S02 | Kies een onderwerp. |
| Tafeltrainer | T01 | Open tafelinstellingen. |
| Verder oefenen | S05 | Hervat lopende sessie. |

## S02 — /kind/rekenen

Titel: **Rekenen**

Ondertitel: Wat wil je oefenen?

- Kies een onderwerp.
- Tafels
- Breuken
- Kommagetallen
- Procenten
- Meten
- Tijd en geld

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Breuken | S03 | Open breukonderdelen. |
| Tafels | T01 | Open tafeltrainer. |
| Start | S01 | Ga terug. |

## S03 — /kind/rekenen/breuken

Titel: **Breuken**

Ondertitel: Wat wil je oefenen?

- Breuken herkennen
- Breuken vergelijken
- Gelijkwaardige breuken
- Rekenen met breuken

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Breuken vergelijken | S04 | Vul onderdeel vooraf in. |
| Rekenen | S02 | Terug naar onderwerpen. |

## S04 — /kind/oefening/instellen

Titel: **Breuken vergelijken**

Ondertitel: Stel je oefening in.

- Hoe wil je oefenen?
- Welk niveau?
- Hoeveel vragen?
- Je kunt altijd stoppen.

Veld: **Niveau** — Makkelijk, Past bij mij, Uitdagend

Veld: **Aantal vragen**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Op het scherm | S04 | Selecteer digitale mode zonder scrollreset. |
| Op papier | W01 | Open werkblad met selectie. |
| Start oefenen | S05 | Valideer en maak sessie. |
| Breuken | S03 | Terug. |

## S05 — /kind/oefenen/[sessieId]

Titel: **Welk teken hoort ertussen?**

Ondertitel: Kies het juiste teken.

- Vraag {nummer} van {aantal}
- 1/2
- 3/4
- Je kunt twee hints bekijken.

Veld: **Antwoord** — <, =, >

Veld: **Grotere tekst**

Veld: **Rustige overgangen**

Veld: **Rustig verder**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Controleer antwoord | S05 | Beoordeel poging; goed volgende slot, laatste naar S07. |
| Bekijk een hint | S06 | Open hulp in dezelfde route. |
| Voorlezen | S05 | Lees vraag na bewuste klik. |
| Leesopties | S05 | Open tekstinstellingen. |
| Stop voor nu | S01 | Bewaar sessie en ga terug. |

## S06 — /kind/oefenen/[sessieId]#hulp

Titel: **Hint 1**

Ondertitel: Kijk naar gelijke delen.

- De helft kun je ook als twee kwarten schrijven.
- Hint 2
- Vergelijk 2/4 met 3/4. Bij gelijke noemers kijk je naar de teller.
- Uitleg
- 1/2 is hetzelfde als 2/4. Twee kwarten is minder dan drie kwarten. Dus 1/2 < 3/4.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Nog een hint | S06 | Hint 2 tonen. |
| Bekijk de uitleg | S06 | Uitleg met antwoord tonen, ondersteund registreren. |
| Verder | S05 | Volgende slot; vervolg plannen binnen resterende slots. |
| Voorlezen | S06 | Lees alleen zichtbare hulp. |

## S07 — /kind/oefening/[sessieId]/afgerond

Titel: **Goed geoefend, {voornaam}!**

Ondertitel: {zelfstandig} van de {aantal} vragen zonder hulp.

- Wist je dat?
- Een octopus heeft drie harten.
- Bewaard in je weetjesboek.
- Breuken: een tussenstap.
- Loop even een rondje.
- Je voortgang is bewaard.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Verder oefenen | S04 | Open gericht voorstel, geen automatische start. |
| Even bewegen | P01 | Toon pauze zonder timerdruk. |
| Klaar voor nu | S01 | Ga naar start. |
| Bekijk het weetje | B01 | Open ontdekt weetje. |

## S08 — /kind/voortgang

Titel: **Jouw voortgang**

Ondertitel: Kijk wat je al hebt geoefend.

- Aan het oefenen
- Gaat zelfstandig
- Nog eens oefenen
- Papierwerk staat apart.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Oefen dit onderdeel | S04 | Open geselecteerd leerdoel. |
| Verder oefenen | S05 | Hervat open sessie. |
| Start | S01 | Terug. |

## S09 — /kind/weetjesboek

Titel: **Je weetjesboek**

Ondertitel: Ontdek iets nieuws.

- Ontdekt
- Nog te ontdekken
- Dieren
- Natuur
- Wereld

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Bekijk weetje | B01 | Open alleen ontgrendelde kaart. |
| Nog te ontdekken | S09 | Toon rustige uitleg zonder teller/deadline. |
| Start | S01 | Terug. |

## B01 — /kind/weetjes/[weetjeId]

Titel: **Een octopus heeft drie harten**

Ondertitel: Bijzonder, toch?

- Twee harten pompen bloed naar de kieuwen. Het derde pompt bloed naar de rest van het lichaam.
- Leesbron wordt vóór publicatie gecontroleerd.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Weetjesboek | S09 | Terug naar overzicht. |
| Voorlezen | B01 | Lees weetje. |

## T01 — /kind/tafeltrainer

Titel: **Tafeltrainer**

Ondertitel: Welke tafels wil je oefenen?

- Kies één of meer tafels.
- Met tijd oefenen is niet verplicht.

Veld: **Tafels** — 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12

Veld: **Oefenen op tijd**

Veld: **Aantal vragen**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Start oefenen | T02 | Maak tafelopdracht. |
| Op papier | W01 | Maak tafelwerkblad. |
| Start | S01 | Terug. |

## T02 — /kind/tafeltrainer/[sessieId]

Titel: **Wat is 7 × 8?**

Ondertitel: Vul het antwoord in.

- Vraag {nummer} van {aantal}
- Tijd is alleen zichtbaar als je die zelf aanzette.

Veld: **Antwoord**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Controleer antwoord | T02 | Beoordeel numeriek en volg hulpladder. |
| Bekijk een hint | S06 | Zelfde sessiepanel met tafelhint. |
| Stop voor nu | S01 | Pauzeer actieve antwoordtijd en bewaar. |

## N01 — /kind/niveaubepaling

Titel: **Wat past bij jou?**

Ondertitel: Mees kijkt waarmee je kunt beginnen.

- Je hoeft nog niet alles te kunnen.
- Je kunt ook direct een onderwerp kiezen.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Start niveaubepaling | N02 | Start korte diagnostische reeks. |
| Kies zelf | S02 | Sla bepaling over. |

## N02 — /kind/niveaubepaling/[sessieId]

Titel: **Vergelijk de breuken**

Ondertitel: Kies het juiste teken.

- Dit helpt Mees een passend begin te kiezen.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Controleer antwoord | N02 | Diagnostisch bewijs; gebruik van hulp maakt antwoord ondersteund. |
| Bekijk een hint | S06 | Toon hulp; geen toetsstraf. |
| Stop voor nu | S01 | Bewaar diagnostiek. |

## N03 — /kind/niveaubepaling/advies

Titel: **Een passend begin**

Ondertitel: Mees stelt voor: breuken herkennen.

- Je kunt dit proberen of zelf iets kiezen.
- Dit is een beginadvies, geen toetscijfer.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Probeer dit | S04 | Open aanbevolen onderdeel. |
| Kies zelf | S02 | Kind kiest zelf. |

## W01 — /werkbladen/samenstellen

Titel: **Maak een werkblad**

Ondertitel: Kies wat je op papier wilt oefenen.

- Kies eerst een vak.
- Daarna kies je onderwerpen en onderdelen.
- Bekijk voorbeeld

Veld: **Vak** — Rekenen, Aardrijkskunde

Veld: **Onderwerpen**

Veld: **Onderdelen**

Veld: **Niveau** — Makkelijk, Past bij mij, Uitdagend

Veld: **Aantal vragen**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Bekijk voorbeeld | W01 | Klap preview onder instellingen open. |
| Maak werkblad | W02 | Genereer gekoppelde vraag- en antwoordset. |
| Terug | S04 | Terug naar digitale instellingen. |

## W02 — /werkbladen/[werkbladId]

Titel: **Je werkblad**

Ondertitel: Kijk even of alles past.

- Antwoorden staan op een apart blad.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Print werkblad | W03 | Open printweergave. |
| Download PDF | W02 | Exporteer exact dezelfde set. |
| Antwoordblad | W04 | Ouder ziet antwoordset. |
| Pas aan | W01 | Behoud selectie; nieuw blad krijgt nieuwe id. |

## W03 — /werkbladen/[werkbladId]/print

Titel: **Rekenen · Breuken vergelijken**

Ondertitel: Werkblad

- Schrijf je antwoorden bij de vragen.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Printen | W03 | Browserprint, @page A4 zonder appnav. |
| Resultaten invullen | O04 | Ouder registreert papierwerk. |

## W04 — /ouder/werkbladen/[werkbladId]/antwoorden

Titel: **Antwoordblad**

Ondertitel: Dit hoort bij hetzelfde werkblad.

- Controleer de antwoorden samen.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Print antwoordblad | W04 | Print gekoppelde set. |
| Resultaten invullen | O04 | Handmatige registratie. |

## H01 — /kind/hulp/[doelId]

Titel: **Extra uitleg kan helpen**

Ondertitel: Je ouder kan meekijken.

- Je hebt de aanwijzingen en een soortgelijke vraag geprobeerd.
- Je ouder kan bekijken of tutorhulp passend is.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Laat mijn ouder weten | O03 | Maak private oudermelding, nog geen tutorclaim. |
| Probeer een tussenstap | S04 | Open passend basisdoel. |

## H02 — /kind/hulpvragen/[hulpvraagId]

Titel: **Je hulpvraag**

Ondertitel: De tutor kijkt ernaar.

- Je kunt ondertussen iets anders oefenen.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Kies iets anders | S02 | Verlaat aanvraag zonder annuleren. |
| Bekijk uitleg | H03 | Alleen wanneer uitleg beschikbaar is. |

## H03 — /kind/uitleg/[uitlegId]

Titel: **Uitleg voor jou**

Ondertitel: Breuken vergelijken

- Stem en tekenbord
- Een soortgelijke vraag.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Afspelen | H03 | Start tutorstem+bord. |
| Pauze | H03 | Pauzeer beide gesynchroniseerd. |
| Volledig scherm | H03 | Vergroot bord. |
| Probeer het zelf | S05 | Start nieuwe gekoppelde controlevraag. |

## P01 — /kind/pauze

Titel: **Even bewegen**

Ondertitel: Loop even een rondje.

- Je kunt straks weer verder.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Verder oefenen | S01 | Ga terug zonder deadline. |
| Klaar voor nu | S01 | Bewaar open sessie. |

## P02 — /profielen

Titel: **Wie gaat oefenen?**

Ondertitel: Kies je profiel.

- Voor ouders

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Open profiel | S01 | Server controleert device scope; zet actief kind. |
| Voor ouders | O01 | Recente ouderauth vereist. |
| Kind toevoegen | A05 | Alleen ouder. |

## P03 — /kind/profiel

Titel: **Jouw profiel**

Ondertitel: Kies een dier dat bij je past.

- Vos
- Uil
- Kat
- Beer
- Konijn
- Panda

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Bewaar avatar | S01 | Alleen avatar-id wijzigen; voornaam wijzigen via ouder. |
| Wissel profiel | P02 | Profielkiezer. |

## P04 — /proberen

Titel: **Probeer Mees**

Ondertitel: Je kunt meteen beginnen.

- Een gratis account helpt Mees je voortgang te bewaren.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Direct oefenen | S02 | Maak lokale gastcontext. |
| Gratis account | A01 | Ouderaccount-route. |

## P05 — /voortgang-bewaren

Titel: **Bewaar je voortgang**

Ondertitel: Vraag je ouder om een gratis account.

- Mees kan je dan helpen op jouw niveau.
- Zonder account blijft deze proefvoortgang alleen in deze browser.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Vraag mijn ouder | A01 | Ouder neemt over, migratie bevestigen. |
| Nog even proberen | S01 | Alleen als gastlimiet niet bereikt; hervatten blijft mogelijk. |

## A00 — /

Titel: **Leren op jouw niveau**

Ondertitel: Voor ieder kind. Voor altijd gratis.

- Mees helpt kinderen oefenen, met uitleg wanneer dat nodig is.
- Gratis dankzij donaties.
- Donateurs krijgen geen gegevens en geen invloed op de lesinhoud.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Probeer Mees | P04 | Gaststart. |
| Gratis account | A01 | Ouder registreert. |
| Bekijk hoe Mees werkt | A06 | Rustige ouderuitleg. |
| Onze donateurs | A07 | Naam/logo overzicht. |

## A06 — /hoe-mees-werkt

Titel: **Zo werkt Mees**

Ondertitel: Rustig oefenen. Hulp als dat nodig is.

- 1. Kies wat je wilt oefenen.
- 2. Oefen met hints en uitleg.
- 3. Kijk wat zelfstandig lukt.
- Ook op papier.
- Gratis dankzij donaties.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Probeer het voorbeeld | A06 | Lokale demonstratie van echte hulpladder, geen profiel nodig. |
| Maak een gratis account | A01 | Ouderregistratie. |
| Werkbladen | W01 | Open schermvrije route. |

## A07 — /donateurs

Titel: **Onze donateurs**

Ondertitel: Samen maken we leren toegankelijk.

- Mees is voor altijd gratis.
- Deze organisaties helpen dat mogelijk te maken.
- Donateurs krijgen geen gegevens en geen invloed op de lesinhoud.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Terug | A00 | Terug naar ouderlanding. |

## A01 — /ouder/account-aanmaken

Titel: **Maak een gratis ouderaccount**

Ondertitel: Bewaar de voortgang van je kind.

- Mees blijft voor altijd gratis.
- Je kind heeft geen eigen e-mailadres nodig.

Veld: **E-mailadres**

Veld: **Wachtwoord**

Veld: **Ik ben ouder of verzorger en heb de privacyinformatie gelezen.**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Maak account | A08 | Authprovider valideert, mailverificatie. |
| Ik heb al een account | A02 | Login. |

## A02 — /ouder/inloggen

Titel: **Welkom terug**

Ondertitel: Log in als ouder.

- Je kind kiest daarna het eigen profiel.

Veld: **E-mailadres**

Veld: **Wachtwoord**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Inloggen | P02 | Geverifieerde sessie + veilige redirect. |
| Wachtwoord vergeten | A03 | Herstelroute. |
| Maak account | A01 | Registratie. |

## A03 — /ouder/wachtwoord-herstellen

Titel: **Wachtwoord vergeten?**

Ondertitel: We helpen je weer inloggen.

- Als er een account bij dit adres hoort, krijg je een herstelmail.

Veld: **E-mailadres**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Stuur herstelmail | A03 | Generic bevestiging voorkomt accountenumeratie. |
| Terug naar inloggen | A02 | Terug. |

## A04 — /ouder/nieuw-wachtwoord

Titel: **Kies een nieuw wachtwoord**

Ondertitel: Gebruik de link uit je herstelmail.

- De link is tijdelijk geldig.

Veld: **Nieuw wachtwoord**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Bewaar wachtwoord | A02 | Provider reset; herstel-token ongeldig maken. |

## A05 — /ouder/kind-toevoegen

Titel: **Voeg een kind toe**

Ondertitel: Alleen een voornaam en een avatar.

- Je kunt de groep later wijzigen.
- Eerdere leerdoelen blijven beschikbaar.

Veld: **Voornaam**

Veld: **Groep** — 5, 6, 7, 8

Veld: **Avatar** — Vos, Uil, Kat, Beer, Konijn, Panda

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Bewaar profiel | P02 | Maak profiel gekoppeld aan ingelogde ouder. |
| Kies avatar | A05 | Open dierkeuze. |

## A08 — /ouder/verifieer-e-mail

Titel: **Controleer je e-mail**

Ondertitel: Open de link om je account te bevestigen.

- Geen mail? Kijk ook bij ongewenste berichten.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Stuur opnieuw | A08 | Rate-limit; alleen zelfde pendingaccount. |
| Account bevestigd | A05 | Token server controleren, niet clientclaim. |

## A09 — /ouder/apparaat-koppelen

Titel: **Koppel dit apparaat**

Ondertitel: Daarna kan je kind een profiel kiezen.

- Op een gedeeld apparaat log je na het oefenen uit.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Koppel apparaat | P02 | Maak beperkte device session. |
| Annuleren | O01 | Geen koppeling. |

## O01 — /ouder

Titel: **Overzicht voor ouders**

Ondertitel: Kijk hoe het oefenen gaat.

- Oefeningen
- Voortgang
- Uitleg
- Meldingen
- Werkbladen

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Bekijk voortgang | O02 | Selecteer eigen kind. |
| Bekijk hulpvraag | O03 | Open geschiktheid/aanvraag. |
| Werkbladen | W01 | Maak blad. |
| Instellingen | O05 | Beheer eigen gezin. |

## O02 — /ouder/kind/[kindId]/voortgang

Titel: **Voortgang van {voornaam}**

Ondertitel: Breuken vergelijken

- Zelfstandig
- Met hulp
- Nog eens oefenen
- Papierwerk
- Bekeken uitleg is geen bewijs van beheersing.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Oefening bekijken | O02 | Toon immutable vraag/antwoord/hulp. |
| Bekijk tutoradvies | O03 | Alleen als criteria gehaald. |
| Terug | O01 | Overzicht. |

## O03 — /ouder/hulp/[doelId]

Titel: **Extra uitleg voor {voornaam}**

Ondertitel: Bekijk wat al is geprobeerd.

- Hint 1
- Hint 2
- Uitleg
- Soortgelijke vraag
- Een tutor ziet alleen de voornaam en de oefencontext.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Stuur naar een tutor | H02 | Servercriteria/toestemming, dedupe open aanvraag. |
| Open bestaande hulpvraag | H02 | Geen tweede aanvraag. |
| Probeer eerst een tussenstap | S04 | Basisroute. |

## O04 — /ouder/werkbladen/[werkbladId]/resultaten

Titel: **Papierwerk registreren**

Ondertitel: Kijk samen wat is gelukt.

- Papierwerk staat apart van digitale antwoorden.
- We weten niet altijd hoeveel hulp nodig was.

Veld: **Goed beantwoord**

Veld: **Onduidelijk**

Veld: **Hulp gebruikt** — Ja, Nee, Onbekend

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Bewaar resultaten | O02 | Idempotent papierrecord met bron en onzekerheid. |
| Pas een antwoord aan | O04 | Handmatige correctieversie. |
| Werkblad bekijken | W02 | Zelfde worksheet-id. |

## O05 — /ouder/instellingen

Titel: **Instellingen**

Ondertitel: Jij regelt het gebruik van Mees.

- Tutorhulp
- Meldingen in Mees
- Korte e-mailmeldingen
- Apparaten
- Privacy

Veld: **Tutorhulp toestaan**

Veld: **E-mail bij uitleg of lesuitnodiging**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Bewaar instellingen | O05 | Server toetst ouder; consentversie vastleggen. |
| Beheer apparaten | A09 | Bekijken/revoken. |
| Privacy en gegevens | O06 | Export/verwijdering. |

## O06 — /ouder/privacy

Titel: **Privacy en gegevens**

Ondertitel: Beheer de gegevens van je gezin.

- Een tutor ziet geen contactgegevens.
- Je kunt een overzicht aanvragen of een profiel verwijderen.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Download gegevens | O06 | Recente ouderauth; private export van eigen gezin. |
| Verwijder profiel | O06 | Heldere bevestiging en verwijderprocedure. |
| Uitloggen | A02 | Intrek sessie, let op pending outbox. |

## M01 — /meldingen

Titel: **Meldingen**

Ondertitel: Hier vind je nieuwe uitleg en lessen.

- Nog ongelezen
- Eerder bekeken

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Open uitleg | H03 | Controleer eigenaarschap. |
| Open les | L02 | Kinduitnodiging, ouder naar L03. |
| Markeer gelezen | M01 | Wijzig readAt zonder leerbewijs. |

## U01 — /tutor

Titel: **Tutordashboard**

Ondertitel: Hulpvragen, lessen en uitleg.

- Nieuwe hulpvragen
- Lesvoorstellen
- Mijn lessen
- Uitleg controleren

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Open werkvoorraad | U02 | Filter aanvragen. |
| Bekijk lesvoorstel | U09 | Feitelijke doelaggregatie. |
| Les inplannen | L01 | Planner. |
| Uitlegbibliotheek | U10 | Beoordeelde eigen/content items. |

## U02 — /tutor/hulpvragen

Titel: **Hulpvragen**

Ondertitel: Pak een vraag op waar je bij kunt helpen.

- Nieuw
- In behandeling
- Wacht op controlevraag
- Afgerond

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Oppakken | U03 | Atomaire claim, conflict geeft bestaande status. |
| Open | U03 | Eigen/authorized bestaande claim. |
| Filter | U02 | Leerdoel en status. |

## U03 — /tutor/hulpvragen/[hulpvraagId]

Titel: **Hulpvraag van {voornaam}**

Ondertitel: Breuken vergelijken

- Wat is gedaan
- Welke hulp is gebruikt
- Nieuwe controlevraag
- Voorstel voor uitleg
- Conclusies zijn gebaseerd op antwoorden, niet op veronderstelde denkfouten.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Maak uitleg | U04 | Open bord met inhoudelijk doel. |
| Gebruik bestaande uitleg | U10 | Alleen beoordeelde passende inhoud. |
| Plan een les | L01 | Vanuit doel, niet openbaar kindnaam. |

## U04 — /tutor/uitleg/[uitlegId]/bewerken

Titel: **Maak uitleg**

Ondertitel: Stem en tekenbord

- Tekst toevoegen
- Breuk
- Vorm
- Pijl
- Tekenen
- Ongedaan maken

Veld: **Tekst op het bord**

Veld: **Titel**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Tekst toevoegen | U04 | Type en plaats tekstvak; toetsenbord vereist, muistekenen niet. |
| Start opname | U04 | Microfooncheck; neem stem en bord-events op. |
| Stop opname | U05 | Bewaar private draft. |
| Bewaar concept | U04 | Geen versturing. |

## U05 — /tutor/uitleg/[uitlegId]/controle

Titel: **Controleer de uitleg**

Ondertitel: Bekijk en luister vóór je verstuurt.

- Controleer de som, de uitleg en het transcript.
- De uitleg bevat geen kindnamen of privévragen.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Pas aan | U04 | Bewerk draft. |
| Stuur uitleg | H02 | Publiceer authorized persoonlijke uitleg en oudermelding. |
| Bewaar concept | U05 | Nog niet publiceren. |

## U06 — /tutor/hulpvragen/[hulpvraagId]/resultaat

Titel: **Na de uitleg**

Ondertitel: Kijk wat zelfstandig lukt.

- Controlevraag
- Zelfstandig gelukt
- Nog niet gecontroleerd
- Nog hulp nodig

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Rond hulpvraag af | U02 | Alleen onderbouwd resultaat; reden bewaren. |
| Vervolg hulpvraag | U03 | Zelfde dossier, geen dubbelaanvraag. |

## U09 — /tutor/lesvoorstellen/[doelId]

Titel: **Samen uitleg kan helpen**

Ondertitel: Meerdere kinderen oefenen hetzelfde onderdeel.

- {aantal} verschillende kinderen
- Periode: {periode}
- Doorlopen hulp
- Eerdere leerdoelen

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Plan live les | L01 | Tutor beslist, geen automatische les. |
| Gebruik bestaande uitleg | U10 | Passende doelinhoud. |
| Nog geen les nodig | U01 | Snooze met feitelijke reden. |

## U10 — /tutor/uitlegbibliotheek

Titel: **Uitlegbibliotheek**

Ondertitel: Uitleg per leerdoel

- Goedgekeurd
- Concept
- Nog controleren

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Open uitleg | U05 | Review/open versie. |
| Koppel aan hulpvraag | U03 | Controleer doel en passende context. |

## L01 — /tutor/lessen/inplannen

Titel: **Plan een live les**

Ondertitel: Geef samen uitleg over één onderdeel.

- Uitnodiging bekijken
- Alleen passende kinderen en hun ouders krijgen een uitnodiging.

Veld: **Leerdoel**

Veld: **Titel**

Veld: **Datum**

Veld: **Tijd**

Veld: **Duur in minuten**

Veld: **Aantal plekken**

Veld: **Opname maken**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Bekijk uitnodiging | L01 | Preview, nog geen verzending. |
| Plan en verstuur | L02 | Persist lesson+outbox notifications; atomic capacity and consentchecks. |
| Annuleren | U01 | Geen les publiceren. |

## L02 — /kind/lessen/[lesId]

Titel: **Een les over breuken**

Ondertitel: Je kunt meedoen of later terugkijken.

- {datum} om {tijd}
- Je ziet en hoort de tutor. Je vragen gaan alleen naar de tutor.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Ik wil meedoen | L04 | Check oudertoestemming/capaciteit; reserveer plek. |
| Later terugkijken | L06 | Alleen wanneer opname gepubliceerd; anders belangstelling zonder belofte. |
| Niet nu | S01 | Geen nadelige gevolgen. |

## L03 — /ouder/lessen/[lesId]

Titel: **Een les voor {voornaam}**

Ondertitel: Breuken vergelijken

- Kinderen zien elkaar niet.
- Vragen gaan privé naar de tutor.
- De opname bevat alleen tutorstem en bord.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Deelname toestaan | L03 | Sla optionele specifieke consent op; respecteer gezinsinstelling. |
| Bekijk les | L02 | Geef kindroute alleen binnen scope. |
| Niet deelnemen | O01 | Weiger deelname zonder leerstraf. |

## L04 — /kind/lessen/[lesId]/live

Titel: **Live uitleg**

Ondertitel: Breuken vergelijken

- Stem en tekenbord
- Stel je vraag aan de tutor.
- Je vraag is alleen zichtbaar voor de tutor.

Veld: **Jouw vraag**

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Start geluid | L04 | Expliciete audioplay, geen kindmicrofoon. |
| Stuur vraag | L04 | Private queue + moderationstatus. |
| Verlaat les | S01 | Geen leerstraf; reconnect mogelijk. |
| Probeer het zelf | S05 | Na les optionele doelvraag. |

## L05 — /tutor/lessen/[lesId]/live

Titel: **Live les geven**

Ondertitel: Breuken vergelijken

- Tekst toevoegen
- Vragen
- Nog beoordelen
- Beantwoord

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Start les | L05 | Providerstate + media/boardcheck, expliciet. |
| Beantwoord vraag | L05 | Anonieme uitleg; status bijwerken. |
| Zet apart | L05 | Review, geen publieke doorgifte. |
| Pauzeer vragen | L05 | Tijdelijk met reden, kijktoegang blijft. |
| Beëindig les | L07 | Recording draft naar review. |

## L06 — /kind/lessen/[lesId]/terugkijken

Titel: **Kijk de uitleg terug**

Ondertitel: Stem en tekenbord

- Deze uitleg hoort bij het onderdeel dat je oefent.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Afspelen | L06 | Gepubliceerde geanonimiseerde opname. |
| Probeer het zelf | S05 | Nieuwe gekoppelde vraag. |

## L07 — /tutor/lessen/[lesId]/opname

Titel: **Controleer de lesopname**

Ondertitel: Klaar om later te gebruiken?

- Geen kindnamen, privévragen of contactgegevens in de opname.
- Controleer ook het transcript.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Publiceer opname | U10 | Review verplicht; koppel leerdoel. |
| Bewerk opname | L07 | Trim/anonimiseren, nieuwe versie. |
| Niet publiceren | U01 | Private draft behouden/verwijderprocedure. |

## G01 — /kind/aardrijkskunde/europa

Titel: **Europa**

Ondertitel: Stel je oefening samen.

- Welk gebied wil je oefenen?
- Wat wil je oefenen?
- Hoe wil je oefenen?
- Je oefent tot alles uit je selectie aan bod is geweest.

Veld: **Gebied** — Heel Europa, Noord-Europa, West-Europa, Zuid-Europa, Oost-Europa, Midden-Europa, Zuidoost-Europa

Veld: **Onderwerpen** — Landen, Hoofdsteden, Wateren, Gebergten, Ligging

Veld: **Oefenvorm** — Afwisselend oefenen, Landenpuzzel

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Kies zelf landen | G01 | Open multi-selectdialog, bewaar scroll/focus. |
| Start oefenen | G02 | Maak volledige selectiequeue; choice→G03, puzzle→G04. |
| Op papier | W01 | Maak kaartwerkblad alleen met echte printSVG. |

## G02 — /kind/aardrijkskunde/europa/[sessieId]

Titel: **Waar ligt {land}?**

Ondertitel: Tik een plek aan en controleer je antwoord.

- {behandeld} van {aantal} onderdelen behandeld

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Controleer antwoord | G02 | Beoordeel object-id, juiste → volgende G02/G03 of S07. |
| Inzoomen | G02 | Handmatig, geen answerfocus. |
| Heel gebied | G02 | Herstel selectie-extent. |
| Bekijk een hint | S06 | Geo-hints binnen zelfde sessie. |
| Stop voor nu | S01 | Bewaar gehele selectie. |

## G03 — /kind/aardrijkskunde/europa/[sessieId]#meerkeuze

Titel: **Welk land is gekleurd?**

Ondertitel: Kies de juiste naam.

- België
- Frankrijk
- Duitsland
- Spanje

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Controleer antwoord | G02 | Zelfde queue, volgende mode. |
| Bekijk een hint | S06 | Geen antwoord vooraf verklappen. |
| Stop voor nu | S01 | Bewaar. |

## G04 — /kind/aardrijkskunde/europa/[sessieId]#puzzel

Titel: **Leg de landen op hun plek**

Ondertitel: Tik een land aan en tik daarna op de kaart.

- {geplaatst} van {aantal} landen geplaatst
- Kies een land
- Na het plaatsen verschijnt een nieuw stukje.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Kies landstuk | G04 | Selecteer; label naast stuk. |
| Kies plek | G04 | Plaats direct, correct blijft, fout keert terug; hover neutraal. |
| Bekijk een hint | G04 | Hulp voor geselecteerd land. |
| Stop voor nu | S01 | Bewaar geplaatst en attempts. |

## I01 — /privacy

Titel: **Privacy bij Mees**

Ondertitel: We gebruiken alleen gegevens die nodig zijn.

- Je kind gebruikt een voornaam en een gekozen avatar.
- Tutorhulp blijft binnen Mees.
- Donateurs krijgen geen gegevens.
- De definitieve privacyverklaring wordt vóór publicatie vastgesteld.

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Voor ouders | A00 | Terug. |

## C01 — /beheer/inhoud

Titel: **Inhoud beoordelen**

Ondertitel: Vraag, hints en uitleg horen bij elkaar.

- Concept
- Nog beoordelen
- Goedgekeurd
- Gearchiveerd

| Knop/actie | Naar | Gedrag |
|---|---|---|
| Publiceer versie | C01 | Alleen approved, vastleggen reviewer en bron. |
| Archiveer versie | C01 | Nieuwe sessies gebruiken niet meer; bestaande bewijzen immutable. |



## Aanvullingen op routecatalogus

S02 biedt onder Kies zelf ook de vakkeuze Aardrijkskunde → G01. Geen lege toekomstige vakken. S03 gebruikt /kind/rekenen/[onderwerp]; Breuken is de mockupvariant. Na de eerste profielkeuze kan een kind direct starten of N01 kiezen. Bij S07 offline luidt de tekst: ‘Je opdracht is afgerond op dit apparaat. Synchroniseren lukt zodra je weer verbinding hebt.’ Toon ‘Je voortgang is bewaard’ alleen bij bevestigde opslag. De machineleesbare catalogus bevat deze aanvullingen.
