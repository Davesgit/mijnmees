# Acceptatiecriteria — controle voor de gebouwde website

Dit is de testopdracht aan Claude. Deze tests zijn nog niet uitgevoerd op een gebouwde Mees-website. De controle van het overdrachtspakket zelf staat in `controle/pakketcontrole.json`.

## Visueel en responsive

- [ ] 320/390/768/1024/1440px: geen onbedoelde horizontale scroll; kaart kan binnen eigen bedieningsvlak pannen.
- [ ] Header, drie kindnavigatiekeuzes en ouder/tutor-modus consistent; actieve oefening heeft geen bodemnav die controls bedekt.
- [ ] Alle interacties toetsenbord- en touchbedienbaar, 48×48px kindtargets, 8px waar doelverwarring kan ontstaan.
- [ ] Antwoordknop niet onder toetsenbord; safe-area werkt; focus nooit achter sticky balk.
- [ ] Grotere tekst/200% browserzoom: inhoud en buttons aanwezig, labels niet afgeknipt.
- [ ] Kleurparen, interactieve randen en focus voldoen; succes/fout/selection ook via tekst/symbool.
- [ ] Instelkeuze houdt scroll én focus; route terug houdt selectie.
- [ ] Opdrachtvorm blijft inhoudelijk equivalent op telefoon; geen meetvaardigheid vervangen door gokvraag.
- [ ] Kaart is voldoende hoog, vraag eronder; geometrielaag correct, no auto-answerzoom.
- [ ] Alle PNGs alpha behouden waar nodig; logo geen opgeschaald screenshot; assetformaten correct.

## Gast/account/profielen

- [ ] Gast direct starten zonder mail; friendly prompt na eerste afgeronde sessie, tweede-grens configureerbaar, hervatten niet geblokkeerd.
- [ ] Gast lokaal bewaren/reload en daarna ouderimport, idempotent en zonder dubbele pogingen/unlocks.
- [ ] Mailverificatie/herstel met veilige generieke responses, invalid/expired token bruikbaar weergegeven.
- [ ] Geen kindemail, DOB, achternaam of foto gevraagd.
- [ ] Ouder ziet eigen kinderen; kinddevice ziet alleen scoped profielen; ouderdashboard vergt recente ouderauth.
- [ ] Device revoke, logout en profielwissel partitioneren data, pending outbox krijgt eerlijke status.
- [ ] Accountverwijdering/export alleen na juiste ouderautorisatie; export private, geen datalek bij statuspoll.

## Oefenen/content

- [ ] Alle 14 renderers hebben minimaal één werkende inhoudelijke route op telefoon en desktop.
- [ ] 3 authored voorbeelden pertype valideren, twee hints en uitleg aanwezig; productionfilters weigeren demo-only.
- [ ] Correcte antwoordvergelijking voor decimalen/breuken/sets/pairs/orders/gewichten/buildgrids/coördinaten/objectIds.
- [ ] Hints 1/2 en daarna uitleg, geen derde hint, geen goede uitlegantwoordpoging als zelfstandig.
- [ ] Rekensessie heeft 8 slots; hulpvervolg vervangt resterend slot, niet negende; anders review later zelfde onderwerp.
- [ ] Geen breukreview tussen tafels; geen onbeperkte repeatloop; auto-overgang cancellable bij Stop/routewissel.
- [ ] Stop na wrong/hint/explanation en in correcte overgang → reload → juiste actuele slot, geen dubbel afronden.
- [ ] Correct antwoord servergraded, gedupliceerde eventId zelfde response; clientcorrectclaim genegeerd.
- [ ] Ondersteuning/leesopties apart; voorlezen geen tijdstraf of onbeheerde autoadvance.
- [ ] Kalevariant alleen als reviewed equivalent, verhaalsomleerdoel blijft intact.
- [ ] Weetje eenmaal per ingestelde daglimiet, geen slot/herstartfarm, geen good-percentage-eis of streak.
- [ ] ‘Afgerond’ is niet ‘beheerst’; minimale zelfstandige bewijscriteria configureerbaar en transparant.
- [ ] Niveaubepaling geeft voorzichtig beginadvies, geen cijfer/diagnose of automatische groepwijziging.

## Europa

- [ ] Elke geselecteerde country/capital/water/mountain aan bod; liggingsvragen gededupliceerd, juiste targetshape.
- [ ] Landnamen niet verplicht typen; éénlandselectie niet kapot door tekort distractors.
- [ ] Hele Europa incl. LU/VA/SM/MC/AD/LI/MT: microtargets bereikbaar zonder locatieverraad via permanente loep.
- [ ] Meerkeuze alleen target blauw, anderen neutraal; geen naam in DOM-accessible label die locatievraag verklapt.
- [ ] Puzzle: piecesnamen naast stuk, 5 groot/3 telefoon, normalized traysize, mapscale tijdensdrag.
- [ ] Hoverrand op verkeerde plek gelijk aan juiste; fout terug, goed blijft, aantik alternatief doet hetzelfde.
- [ ] Kaartpresets blijven tijdens vraagserie stabiel; zelfzoom reset naar selectie, niet antwoord.

## Werkbladen

- [ ] Vak eerst, topics gefilterd op vak, preview onder instellingen, instellingen blijven bij terug.
- [ ] A4 zonder appnav, leesbare opgaven en werkruimte; PDF en antwoordblad exact zelfde questionversions.
- [ ] Foto-nakijken defaultuit; geen mockresults als AIcontrole.
- [ ] Papierresults parentconfirmed, supportunknown blijft unknown, niet als digitaal independent meegerekend.

## Tutor/live

- [ ] Eén lastige beginopdracht creëert niet automatisch tutorverzoek; prerequisite/controlevraag/consentcriteria toegepast.
- [ ] Double-submit hulpvraag dedup; twee tutorclaims tegelijk: één winnaar, andere conflictmelding.
- [ ] Tutor-DTO bevat firstName+schoolcontext, nooit ouderemail/contact/IP/andere kinddata.
- [ ] Tekenbord met tekstvakken/breuken/vormen/pijlen bruikbaar met trackpad én toetsenbord, undo/redo.
- [ ] Tutoropname werkt met geweigerde microfoon, devicewissel, MIMEcompatibiliteit, onderbreking en playback/seek.
- [ ] Voor publicatie review/transcript/anonimiteit; afsluiten pas op nieuwe controlevraag, view niet als beheersing.
- [ ] Signaal ≥3 unieke geschikte kinderen/zelfde doel/periode, retries dedup, tutor beslist les.
- [ ] Live planning correcte UTC/AmsterdaminclDST, capacitytransaction, edit/cancel notificatie eenmaal.
- [ ] Kind ziet/hoort uitsluitend tutor+bord, geen andereparticipantnamen/berichten/camera/microfoon.
- [ ] Subscribe-only childtoken technisch gehandhaafd; probeert childpublish/media → geweigerd.
- [ ] Kindvraag alleen eigenchild+tutor; direct WebSocket/API-aanroep van ander kind krijgt niets.
- [ ] Moderatie accept/review/rewrite met vriendelijke status; vakinhoudelijke twijfel niet zomaar weggegooid.
- [ ] Verbindingverlies/audio-autoplayblock/full/waitroom/end/cancel/replay alle bruikbaar.
- [ ] Livevragen opgenomen transcript/media bevat geen kindnaam/rawprivévraag.
- [ ] Mailretry exacteens-effect via idempotency; geen onbewezen sent-status; demomails alsdemo herkenbaar.

## Backend/operations

- [ ] Integrationtests voor ownparent/otherparent/child/tutor/unauthed/admin, incl. IDOR en signedmediaurls.
- [ ] RLS deny-by-default; servicecredential niet in client; fixturesroles niet in production.
- [ ] Twee tabs hetzelfde slot: versionconflict correct hersteld; outboxoffline/online duplicateack getest.
- [ ] Geldige contentversie blijft gekoppeld aan oude poging; wijziging vraagbank herschrijft bewijs niet.
- [ ] Analytics/advertenties afwezig, persoonsgegevens niet in errorlogs; donorlogo geen tracking/embed.
- [ ] Secrets ontbrekend: expliciete adapterstatus en disabledfeature, geen crash/neplive in production.
- [ ] Geteste build/lint/typecheck en relevante unit/integration/e2e; handmatige toegankelijkheid aanvullend.
- [ ] Backup/restore, database migrations en retentieconfig beschreven; publieke uitrol blijft aparte stap.

## Opleverrapport

Perfunctie: echt getest / demo getest / adapter gereed maar niet aangesloten / toekomstig uitgeschakeld. Perapparaat bewijs met screenshots en beknopte gebruikstest; geen blanket ‘mobile ready’ zonder toetsenbordtest. Eén lijst met resterende contentreviews en benodigde externe configuratie. Geautomatiseerde scans en passingbuild zijn niet voldoende om privacy, curriculum of volledige WCAG-conformiteit te claimen.
