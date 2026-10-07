# Besluiten en open punten

## Vastgelegd

- Alle bestaande schermen meenemen, niet slechts negen. Kernnummering S01–S09 correspondeert met oorspronkelijke PNG02–10.
- Next.js + Tailwind, warme Mees-stijl, zelfstandig thuis, groep 5–8, rekenen plus Europa, eerdere leerdoelen waar nodig.
- Geen punten/sterren/streaks/badges; wel weetjes, zichtbare bewijsvoortgang en bewegen/stoppen.
- Standaard8 slots voor rekenen, volledige selectie voor Europa; hulpvervolg binnen gekozen onderwerp.
- Directe gaststart, ouderaccount voor bewaarbehoefte/persoonlijke begeleiding; dieravatars, geen foto's.
- Twee hints, uitleg, nieuwe soortgelijke vraag; menselijke tutor gefilterd via niveau/basisroute/consent.
- Stem+bord binnen Mees, tekstvakken via toetsenbord; geen kindcamera/microfoon/openchat.
- Live-doelsignaal, tutorbeslist, kind/ouder uitgenodigd, private tekstvragen met controle/review.
- Werkblad vak→onderwerp→onderdeel, preview onder, eerste registratie handmatig; foto-nakijken later.
- Voor altijd gratis, donor naam/logo, geen datatoegang/inhoudelijke invloed.

## Voorstel voor de bouw, configureerbaar

| Onderwerp | Voorstel | Waarom niet als vast feit presenteren |
|---|---|---|
| Gastlimiet | 2 afgeronde sessies; na1accountprompt; hervatten vrij | Gebruiker wilde beperkt maar niet precieze grens |
| Zelfgekozen aantal | 4–20, default8 | Verfijning voor duidelijke UI, nog te testen |
| Weetjesfrequentie | 1 per actieve afgeronde oefendag | Geen snelheids-/schermtijdprikkel, voorkeur nog aanpasbaar |
| Bewijsstatus | 4 onafhankelijke successen over2sessies + latere review | Didactische heuristiek, leerkracht moet afstellen |
| Reviews | 7 en daarna21dagen | Geen gevalideerd geheugenschema |
| Tutorcriteria | Twee verschillende oefendagen + hulp/controlevraag + basisroute | Schaalbaar beginvoorstel, geen diagnose |
| Live-doelsignaal | 3 unieke geschikte kinderen/14dagen | Tutorcapaciteit en observatie nog nodig |
| Livecapaciteit/duur | 20 plekken,15–30min | Operationele keuze, configureerbaar |
| Privévraaglengte | max300tekens + serverrate-limit | Gebruikstest/moderatie kan aanpassing vragen |
| Diensten | Supabase, SMTP, LiveKit achteradapters | Geen bestaandeaccounts/contracten; vervangbaar |
| Automatische overgang | 900ms minimum; handmatig via Rustig verder | Ondersteunt tempo, toetsenbord/screenreader moet testen |
| Apparaten | 48pxtargets, responsivebreekpunten768/1024 | Definitieve layout bepaald doorinhoud en echte gebruikstest |

## Nog echte input/configuratie nodig vóór productie

1. De leerkracht beoordeelt content, tweehints, uitlegmateriaal, vervolgvraagpools en curriculumkoppeling. De42demo’s dekken niet alleleerdoelen. Deexistingvragenbank blijft ongecontroleerd.
2. Echte provideraccounts/sleutels, opslagregio, maildomein, liveinfra en operationele tutorrooster. Claude kan adapters maken maar geen sleutels of beschikbaarheid verzinnen.
3. Privacyverklaring, organisatieverantwoordelijke/contactpunt, bewaartermijnen, toestemmings-/verwijderingsbeleid, processorafspraken en wettelijke beoordeling door de organisatie. Technische privacyafspraken zijn gespecificeerd; geen juridische garantie.
4. Donateurnamen/logo’s: fictieve voorbeeldbedrijven niet als echte sponsoren publiceren. Demo laat legekaart/duidelijk voorbeeld zien. Geen betaalprovider nodig in huidige scope.
5. Gereconstrueerde SVG-logo visueel beoordelen: dezelfde vogel/rondeletters, maar geen exacte tracing vanrasterlogo. Rasterreferentie blijft bewaard; nieuwe PNGposes zijn consistent gestileerd maar niet pixelidentiek.
6. AI-tutor en fotonakijken later. Nu featureflags uit, ports beschreven. Schoolgebruik/groep 3–4/anderevakken nog geen launchclaim.

## Geen open vragen die de demo hoeven te blokkeren

Claude bouwt volgens deze voorstellen, documenteert ze en levert een complete navigeerbare demo plus echte geteste integratie waar geconfigureerd. Productie blijft eerlijk afhankelijk vanbovenstaande goedkeuringen; een placeholder is geen werkendefeature. Nieuwe aanvullende pagina’s zonder rastermockup volgen de bestaande componenten en functies, geen nieuwe look.
