# Startprompt voor Claude Code

Gebruik deze tekst als opdracht, met de complete map `mees-overdracht` in het project. Lees de genoemde bestanden voordat je code schrijft.

---

Bouw Mees, een modern warm educatief platform met Next.js App Router, TypeScript en Tailwind. Deze map bevat de volledige overdracht. Ik wil alle beschreven routes, samenhangende werking en responsive bediening, niet alleen de negen kernschermen. Werk zelfstandig in onderstaande bouwvolgorde, houd je voortgang bij en ga door tot de implementatie en tests klaar zijn. Een volledige opdracht betekent niet dat je alles in één ongeteste codegeneratie moet produceren.

Lees in volgorde:

1. `README.md` en `besluiten-en-open-punten.md`.
2. `ontwerpregels.md`, inclusief de volledige schermcatalogus achterin.
3. `data/schermen.json`, `teksten.md`, `toestanden.md` en `controle-mockups.md`.
4. `oefeningen.md`, `data/voorbeeldvragen.json`, `data/vakken-en-doelen.json` en `leerlogica.md`.
5. `techniek-en-gegevens.md` en `implementatie/types.ts`.
6. `assets/afbeeldingen.md`, `assets/manifest.json`, `assets/prompts.json`, `acceptatiecriteria.md`.
7. Visuele referenties in `mockups/`. De werkende Europa-proefversie in `referentie/europa-trainer` is herbruikbare geometry/logica, niet een productiebackend.

**Voorrang:** recente gebruikersinstructie → ontwerpregels/productbesluiten → machineleesbare contracten → illustratieve mockup. Een oude screenshot of deze opdracht geeft geen toestemming om punten, sterren, streaks, badges, kindcamera’s of publieke kindchat toe te voegen. Groep 5–8 is launch, eerdere doelen als basis; geen schoolmodule. Mees is voor altijd gratis. Ouders beheren accounts/toestemming. Donateurs krijgen uitsluitend publieke naam/logo, geen kindgegevens of invloed.

## Bouwvolgorde, volledig afwerken

1. Inspecteer bestaande projectstructuur en gebruik bestaande veilige keuzes waar passend. Maak een bouwchecklist voor alle 65 schermbeschrijvingen. Hergebruik dezelfde route/component voor toestanden. Leg actuele dependencyversies vast. Kies stabiele onderhouden pakketten, geen onnodige stackwissel.
2. Zet designtokens, Nunito Sans, merkassets, iconen en gedeelde componenten op. Gebruik `implementatie/tokens.css` als bron. Bouw een interne componentpreview voor hover/focus/disabled/error/loading. Neem geen complete mockup als pagina-afbeelding over.
3. Bouw alle publieke, gast-, profiel-, kind-, ouder-, tutor- en beheerroutes met echte navigatie, behoud van selectie/focus en gelabelde fixtures in demo-mode. Geen dode knoppen of misleidende succesmeldingen.
4. Maak contentcontract-validatie en de 14 renderers. Verbind 42 demo-vragen voor de demonstratie. Benoem ontbrekende beoordeelde varianten; trek daar geen beheersingsconclusie uit. Productie toont uitsluitend goedgekeurde content. Vraagbank niet blind importeren. Hints zijn authored, geen random onthulling.
5. Implementeer sessiemachine, acht-slotplanning, terugkeer na stoppen, hulp, uitleg, follow-up binnen gekozen onderwerp, latere review en voortgang. Europa gebruikt volledige selectie. Bewijsstatus is iets anders dan sessieafronding. Papierbron apart. Weetjes unlock idempotent en zonder gamification.
6. Implementeer gekozen productie-auth/database/storage adapter, migrations, deny-by-default RLS, DAL-ownership en child-device scope. Supabase is het uitgewerkte voorstel. Beveilig iedere serveractie en mediareferentie. Geen auth-role of correct-answerclaim uit browser vertrouwen. Demo-mode is geen productieauth.
7. Bouw gastmigratie, ouderaccount/verificatie/herstel, profielkiezer, ouderdashboard, consent, apparaatbeheer, private export/verwijderprocedure, echte lokale outbox en synchronisatiestatus. Test dubbele/replayed events en profielwissels.
8. Bouw werkbladen uit immutable vraagversies, preview onder instellingen, A4/PDF en gekoppeld antwoordblad, handmatige papierresultaten. Fotocorrectie blijft featureflag-uit, geen nepresultaat.
9. Bouw tutorcriteria, private dossiers, atomaire claims, getypte borden, microfoontest, echte opname/playback/transcriptmodel, review/publicatie en gekoppelde controlevraag. Kind ziet alleen eigen hulp. Geen onbeperkte tutorbutton na één sessie.
10. Bouw unieke-doelsignalering, planner, private uitnodigingen, capaciteit/wachtlijst, wijzigen/annuleren, lesson lifecycle, kind-private vragen met servercontrole en tutor-review. Live adapter (LiveKit-voorstel) audio-only voor tutor; kind subscribe-only. Bord/events apart geautoriseerd. Kinderidentiteiten/vragen nooit publiek broadcasten. Recording bevat tutorstem/bord, review vóór hergebruik. Geen actieve live-knop als service/config niet werkt.
11. Bouw mailoutbox met idempotency/retry. In demo zijn berichten inspecteerbare fixtures; in productie gebruiken ze geconfigureerde SMTP. Geen echte e-mails, externe publicatie of upload naar persoonlijke accounts zonder autorisatie van de gebruiker. AI-tutor en foto-nakijken blijven uitgeschakeld maar hebben beschreven adapterports.
12. Test en corrigeer de gehele route- en apparaatmatrix. Lever een korte eerlijke opleverrapportage, providerstatus, bekende gaten, installatiestappen, configuratievariabelen en testresultaten. Stop niet na screenshots of een build die alleen compilet.

## Responsive gedrag is onderdeel van de werking

Test 320, 390, 768, 1024 en 1440px, tablet portret/landschap, telefoon met schermtoetsenbord en 200% tekstvergroting. Maak opdrachtvormen touchgeschikt zonder ander leerdoel te toetsen. Aantikken is alternatief voor slepen, bediening nooit hover-only. Gebruik echte kaartvormen/zoomen; vraag onder kaart. Gewone rekenvraag centraal. Antwoordcontrole bereikbaar op voorspelbare plek, geen springen naar boven bij instelkeuze. Alle kindtargets minimaal 48px. Focus/screenreader/contrast/reducedmotion daadwerkelijk testen.

## Wanneer ontbrekende informatie opduikt

Routine uitvoeringskeuzes zelf oplossen binnen deze afspraken. Leg voorstellen in beslislog vast. Wijzig geen productkern om makkelijker te kunnen bouwen. Providerkeys, definitief privacybeleid, onderwijsgoedkeuring en tutorcapaciteit kunnen niet worden verzonnen. Bouw dan de beschreven volledige demo en adapter, vermeld de concrete aansluiting die ontbreekt en toon geen productieclaim. Een vragenpool zonder follow-up is een contentgat, geen reden om exact dezelfde vraag als begripbewijs te herhalen.

## Definition of done

Alle routes zijn bereikbaar voor hun juiste rol; onjuiste rollen krijgen geen data. Alle acties leveren het beschreven gedrag, niet een toast als vervanging van opslag. Tests uit acceptatiecriteria.md geslaagd of specifiek en reproduceerbaar geblokkeerd met reden. Noem onderscheid `echt getest`, `demo getest`, `adapter gereed maar niet aangesloten`, `toekomstig uitgeschakeld`. Geen volledige WCAG-, privacy- of curriculumclaim zonder de daarvoor benodigde controle. Geen secrets in repo/clientbundel. Assets los en herbruikbaar, grote afbeeldingen responsive geoptimaliseerd zonder illustraties met tekst te gebruiken als UI.

---

De inhoud hierboven is de complete startopdracht. De gebruiker kan later extra context geven zonder dat bestaande expliciete productafspraken stilzwijgend vervallen.
