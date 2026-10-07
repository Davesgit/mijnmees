# Techniek en gegevens — opdracht voor Claude Code

Dit is een ontwerpcontract. Het pakket bevat geen werkende backend, database-migraties of gekoppelde leveranciers. Claude bouwt en test die. Next.js App Router + TypeScript + Tailwind zijn de gevraagde stack. Gebruik ondersteunde stabiele versies, leg de gekozen versies vast in lockfile/README en controleer officiële documentatie. Geen onnodige Next.js major-migratie als er al een project bestaat.

## 1. Architectuurvoorstel

Voorgestelde productie-adapters: Supabase Auth + PostgreSQL + private objectstorage, SMTP voor korte transactionele e-mail en LiveKit voor eenzijdig tutoraudio. Het voorstel is geen bestaande aansluiting of opgezet account. Supabase kan vervangen worden door gelijkwaardige auth/database/storage-adapters, maar bouw geen eigen wachtwoordcryptografie. LiveKit kan self-hosted of gecontracteerde dienst zijn; providerregio en verwerkersafspraken moeten vóór echt kindgebruik gekozen worden. Geen analytics of advertentie-SDK.

Lokale `demo` mode: alle routes en interacties bruikbaar, lokale fixture accounts met zichtbare ‘Demonstratie’-markering, geen echte e-mails of tutorclaims naar derden. MediaRecorder en bordopslag moeten op localhost echt werken; live-demo kan met tutor- en kindvenster een echte private eventverbinding gebruiken. Zonder media/providerconfig: meld expliciet dat live-geluid niet aangesloten is. `production` mode: geen demo-auth of nepresponse; server faalt gesloten bij ontbrekende vereiste configuratie. Demo is nooit bewijs voor productiebeveiliging.

Gebruik Server Components voor niet-interactieve content. Client Components voor oefenrenderer, bord, kaart, outbox, browserstem en toetsenbordmetingen. Server-side DAL voor autorisatie op **ieder** gegevenspad, Server Action en Route Handler; routemiddleware/proxy is aanvullend. Officiële basis: [Next.js auth-guide](https://nextjs.org/docs/app/guides/authentication), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Gebruik verifieerbare authclaims, niet een ongevalideerde clientrol. Cache nooit persoonsgegevens als publieke ISR-pagina.

## 2. Indeling

```text
src/app/(publiek)/...           landing, proberen, account, privacy, donateurs
src/app/(kind)/kind/...         oefenroute, voortgang, weetjes, Europa
src/app/(ouder)/ouder/...       dashboard, profielen, consent, papier, privacy
src/app/(tutor)/tutor/...       werkvoorraad, bord, lessen, bibliotheek
src/app/(beheer)/beheer/...     private contentreview en tutoruitnodigingen
src/components/mees/...        vaste namen uit ontwerpregels.md
src/features/exercises/...     state machine, renderers, scoring
src/features/progress/...      bewijsstatus, prerequisiteplanner, reviews
src/features/geography/...     echte geometry en spatial hit-testing
src/features/tutoring/...      dossier, eligibility, claims
src/features/live/...          boardsync, audio, private vragen
src/lib/server/dal/...         ownership/rolechecks
src/lib/providers/...          Auth, Database, Mail, Media, Live, AiTutor
src/lib/outbox/...             IndexedDB, retries, dedupe, migratie
public/assets/...              meegeleverde assets, nooit complete mockups
supabase/migrations/...        Claude maakt geteste schema+RLS-migraties
tests/unit, tests/integration, tests/e2e
```

`implementatie/types.ts` is het startcontract, geen volledig draaiende implementatie. Valideer invoer runtime met schema’s. `schermen.json` hashes vertegenwoordigen UI-states binnen één route. Parameter-routes delen componenten, niet per screenshot nieuwe markup. Neem de bron-Europa data over met gevalideerde ids; source questions zijn aanvullend ongecontroleerde content, geen officiële curriculumtoekenning.

## 3. Gegevensmodel

| Tabel/entiteit | Essentiële velden | Sleutels en gedrag |
|---|---|---|
| `parent_accounts` | id/authSubject, email bij authprovider, verifiedAt, createdAt | auth subject uniek; geen kindemail |
| `child_profiles` | id, parentId, firstName, group, avatarId, timezone, createdAt, deletedAt | parent-owner; groepen 5–8 launch; geen DOB/achternaam |
| `device_sessions` | id, tokenHash, parentId, childScopeIds, selectedChildId, expiresAt, revokedAt | beperkt token, geen raw token in database/log |
| `parent_consents` | id, parentId, childId, tutoringAllowed, liveAllowed, policyVersion, grantedAt, revokedAt | historie, optionele lessonId-specific override |
| `learning_goals` | id, subjectId, topicId, childLabel, prerequisiteIds, source/version, reviewedAt | prerequisite graph acyclisch; teacherreview |
| `question_versions` | questionId+version, type, goalId, groupRange, payload, privateAnswer, hints, explanation, status, reviewer | immutable zodra gebruikt; goedkeuring verplicht voor productie |
| `exercise_sessions` | id, childId of guestId, subject/topic, mode, config, slots, index, state, version, startedAt, completedAt | optimistic lock op version; server gekozen queue |
| `attempt_events` | eventId, sessionId, slotId, questionId+version, answerPayload, serverResult, supportState, inputMode, activeDurationMs, timestamp | eventId uniek; append-only; answer grading server-side |
| `slot_followups` | id, sessionId, originSlotId, goalId, replacementSlotId of dueReviewId | één vervolg per origin; max ingestelde slots rekenen |
| `goal_evidence` | childId+goalId, independentCount, assistedCount, recentEvidence, confidence, dueAt, heuristicVersion | afgeleide view/job; idempotent eventverwerking |
| `fact_catalog` | id, title, copy, imageAsset, categories, sourceUrl, reviewedAt | correcte bron/licentie; geen AI feit zonder review |
| `fact_unlocks` | childId+factId, sessionId, unlockedAt, localDate | unieke child+fact en child+localDate voor voorgestelde daglimiet |
| `worksheets` | id, childId optioneel, ownerId/guestId, subjectId, questionVersions, immutableSeed, printVersion | vraag- en antwoordblad dezelfde set |
| `paper_results` | id, worksheetId, childId, markedByParentId, correct/unknown, support=unknown/observed, version | source=paper; correcties als versies, geen digitale independentfalse→true-upgrade |
| `help_requests` | id, childId, goalId, evidenceSnapshot, eligibilityVersion, status, tutorId, lease, createdAt | partial unique child+goal zolang open; atomic claim |
| `tutor_profiles` | id/authSubject, role grantedByAdmin, enabledAt, suspendedAt | geen zelfregistratie/rol vanuit browser |
| `explanations` | id, tutorId, goalId, requestId optioneel, boardSnapshot/events, privateAudioKey, transcript, status, version | draft → reviewed → published; signed playbackurls |
| `live_lessons` | id, tutorId, goalId, title, startUTC, timezone, durationMinutes, capacity, status, recordingChoice | scheduled/live/ended/cancelled; geen ongewenste autobroadcast |
| `lesson_invitations` | lessonId+childId, parentId, consentSnapshot, response, notifiedVersion | uniek, wijzigingen versieerbaar |
| `lesson_reservations` | lessonId+childId, status, reservedAt | capaciteit transactioneel, waitlist idempotent |
| `lesson_questions` | id, lessonId, childId, body, moderationState, moderationReasons, tutorResponseState, createdAt | uitsluitend eigen kind/authorized tutor; nooit gezamenlijke subscription |
| `board_events` | lessonId+sequence, actorTutorId, operation, serverTimestamp | alleen tutor schrijft; monotone volgorde, reconnectsnapshot |
| `notifications` | id, recipientKind/Id, category, payloadRef, readAt | eigen ontvanger; geen leerlingdata in mailpayload |
| `mail_outbox` | eventId+recipientId+templateVersion, status, attempts, nextAttemptAt | idempotent retry, succes pas na providerack |
| `donors` | id, name, reviewedLogoAsset, active | geen toegang tot kindtabellen |
| `audit_events` | id, actor, operation, objectId, at | minimale feiten; geen antwoordtekst/contactdata in log |

Natuurlijke identifiers zoals ‘Sam’ zijn geen unieke sleutels. Toon datum/tijd Europe/Amsterdam; persist UTC en gekozen tijdzone. Oude contentversies blijven raadpleegbaar voor het bewijs van een bestaand antwoord. Verwijdering/pseudonimisering volgt ouderverzoek en formeel vastgestelde bewaartermijnen; automatische retentie is configureerbaar. Voorstel vóór review: raw moderatievragen 30 dagen na les, hulpcontext 90 dagen na afsluiting, privé-opnamedrafts 30 dagen; voortgang tot profielverwijdering. Dit zijn **voorstellen**, geen wettelijke termijnclaims. Geen productie-retentie activeren zonder expliciete organisatiebeslissing in configuratie.

## 4. Rechten

| Actor | Lezen | Schrijven | Nooit |
|---|---|---|---|
| Gast | beoordeelde publieke demo-vragen, eigen lokale sessie | eigen lokaal bewijs | ouder/tutor/live kindgegevens |
| Kind-device | eigen geselecteerde childscope, goedgekeurde inhoud, eigen uitnodigingen/uitleg | eigen antwoorden/avatar/privévraag/RSVP binnen consent | ander profiel buiten scope, oudermail, tutorcontactgegevens, rol wijzigen |
| Ouder | eigen gezin en bijbehorend bewijs | eigen profielen, consent, papier, geschikte aanvragen | gegevens van andere gezinnen; tutorclaimrollen |
| Tutor | geclaimd dossier via gereduceerde view, passende signalaggregatie, eigen lessen/uitleg | claim, uitleg, eigen les, eigen private vragenqueue | contactgegevens gezin, kindcamera/microfoon, onbeperkte leerlingzoekfunctie |
| Beheerder | noodzakelijke operations en inhoudreview | tutoruitnodigingen, content, donors | algemene exports zonder doel/autorisatie |
| Donateur | publieke donateurpagina | geen applicatierechten | kind-/ouder-/tutor-/lesdata |

Tabel-RLS standaard deny. Servercredentials mogen RLS passeren maar voeren altijd dezelfde DAL-ownershipchecks uit; ‘service key dus alles mag’ is verboden. Secret/service-role keys blijven server-only, nooit `NEXT_PUBLIC_*`. Tutor readmodel heeft allowlistvelden. Test expliciet IDOR door een ander kindId, lesId en uitlegId te injecteren. Ouderunlock recent auth/step-up serverproof; profielwissel in localStorage is geen toestemming. Devices kunnen ingetrokken worden.

## 5. API/actiecontracten

Elke mutatie: verificatie actor → runtimevalidate → autorisatie resource → transaction → idempotency → audit beperkt → veilige response. Client meldt nooit zelf `correct=true` of `role=tutor`. Geen GET voor wijzigen. Geef op autorisatiefout geen inhoud prijs. CSRF/same-origin en provider sessiechecks toepassen.

| Actie | Request | Response / bijzonderheid |
|---|---|---|
| `startSession` | subject/topic/goal, count, difficulty, modes | authorized session, slots met private antwoorden verborgen |
| `submitAttempt` | eventId, sessionId, slotId, questionVersion, answer, clientSessionVersion, supportEvents | beoordeeld result, actuele sessieversie, nextaction; duplicate hetzelfderesult |
| `requestHint` | sessionId, slotId, level | volgende toegestane hint, serversupportevent |
| `revealExplanation` | sessionId, slotId | uitleg+antwoord na expliciet verzoek/fourthwrong, supported=true |
| `pause/resumeSession` | sessionId+version | exact slotstate; pending correcttransition niet dupliceren |
| `syncOutbox` | bounded events, guestMigrationClaim indien nodig | ack per eventId, conflicts expliciet, retrybare errors apart |
| `submitHelpRequest` | goalId, parentconfirm, idempotencykey | eligibility computed server, bestaande aanvraag terug bijduplicate |
| `claimHelpRequest` | requestId, expectedStatus | claim of 409 conflict, geen dubbele tutors |
| `saveExplanation` | authorized tutor, boardmodel, private uploadrefs | draftversion; approved/published apart |
| `plan/update/cancelLesson` | goal/time/capacity/version, selected valid recipients | lessonversion + transactionele outboxevents |
| `reserveLesson` | lessonId+childId+consentversion | confirmed/full/waitlist, transaction/capacitylock |
| `requestLiveToken` | lessonId, scopedactor | kort geldig servergeneratedtoken met beperkte grants |
| `submitLessonQuestion` | questionId, lessonId, body | accepted/review/rewrite; private ack, rate-limit zichtbaar |
| `publishRecording` | lessonId, reviewversions | alleen geanonimiseerde reviewed content zichtbaar |
| `generateWorksheet` | selected content ids/version, count, level | immutable worksheetset en gekoppeld answerdocument |
| `savePaperResults` | worksheetId, parentrecord, expectedVersion | bronpaper, unknownsupport blijft unknown |
| `requestAccountExport/Delete` | reauthenticatedparent, ownresource | privatejob status, idempotent correctcleanup |

Antwoordcontract onderscheidt {status: accepted/duplicate/conflict/invalid/unauthorized/retryable}; nooit onder HTTP200 een technische mislukking als ‘Gelukt’ tonen. Op submit fout blijft ingetypt antwoord/selection bewaard. Limieten en rate-limits server-side, met toegankelijke melding. Upload-bestandtypes/sizes/EXIF en signedurl scope controleren; avatars geen upload.

## 6. Sessiemachine

`ready → answering → submitting → correct → advancing → answering|completed`

`submitting → incorrect → hint1 → answering → hint2 → answering → explanation → advancing`

Hints ook direct vanuit answering. `paused`, `offline-pending` en `sync-conflict` zijn orthogonale opslag-/sessiestates, geen correct/fout. UI gebruikt expliciete reducer/state machine, geen losse timers die na Stop alsnog finish uitvoeren. Bij autoavance pendingNextSlot opslaan en timer cancelen op pauze/unmount. Een answercorrectevent is niet hetzelfde als voltooid-sessieevent. Alle backendderived metrics rekenen op unieke eventId en servergrading.

## 7. Live stem en tekenbord

Voorgesteld LiveKit-token voor tutor: roomJoin, audio-only publishing (microphone), subscriber indien nodig. Kind: subscribe-only, **geen audio/video publishing en geen algemene data publishing**. Server valideert les/uitnodiging/consent/startvenster. Grantgedrag verifiëren aan [LiveKit token-grants](https://docs.livekit.io/frontends/reference/tokens-grants/). Niet alle participantmetadata of roomidentities aan kindfrontend doorgeven; deelnemerslijst wordt niet gebouwd. Roomidentities random scoped tokens, geen voornamen in publiek mediametadata.

Bord via afzonderlijk geautoriseerd WebSocket/SSE-kanaal: alleen tutorops; kind ontvangt boardversion+sequence. Privévragen via server endpoint en uitsluitend tutor/private ownchild subscription. Gebruik geen shared broadcasttopic voor kindvragen. Rate-limit/richtingsgrant ook bij reconnect. Snapshot + events voor nieuwe verbinding, dedupe en sequencegaprequest, server authoritative. Opname: alleen tutoraudio + bord-eventtimeline; geen leerlingenstream. Sync op tijdstempels, pause/seek/herconnect geteste tolerantie. Getypte tekstvakken, undo/redo, breukmodellen, lijnen/vormen, vrij tekenen optioneel.

Audio opnemen: MediaRecorder featuredetect, ondersteund MIME bepalen (geen hardcoded Chrome-only webm); progressivechunk upload naar private objectstorage, recoverable draft bij onderbreking. Live playback mag geen zelfgeschreven geheim in browser hebben. Verbinding controleren, microfoontest, devicewissel, toestemming geweigerd-status, autoplayknop kind. Bord/transcript blijven beschikbaar bij geluiduit. Tutorrecording/transcript expliciet reviewen vóórpublicatie; geen onbewerkt livebericht opnemen. Privacy- en moderatieconfig is niet optioneel voor production.

## 8. AI en foto-nakijken

Featureflags default **uit**. AI-tutor komt later na hints/uitleg; geen onbeperkte kindchat en geen advertentieprovider. Geen foto-nakijken-resultaten verzinnen. Definieer `AiTutorProvider` en `WorksheetReviewProvider` ports, toon in deze release geen actieveknop zolang configuratie/contentbeleid niet gereed is. Geen review-required-content stilzwijgend naar provider sturen. Niet verantwoordelijkheidsclaims zoals ‘AI begrijpt jouw denkfout’. Kindgegevens/promptretentie/providerregio moeten vooraf geregeld zijn. Reëel onvoldoende hulp volgt de bestaande geschiktheidsroute naar menselijke tutor; AI is geen voorwaarde om deze eerste tutorroute te laten werken.

## 9. Offline, cache en beveiliging

IndexedDB outbox met schemaVersion, unieke eventIds, replay alleennaar eigenidentity, compacte gecachte sessie, retryexponentiëlebackoff. Geen `localStorage` voor productieauthtokens. Cache geen ouder/tutor/privémedia serviceworker responses. Accountwissel/uitloggen verwijdert/partitioneert cache en waarschuwt voor unsentdata. Een anderapparaat kan geen lokalependingdatazien. UI vertelt waarheid: lokaal opgeslagen vs gesynchroniseerd. Test sessieconflict als twee tabs tegelijk dezelfde sessie veranderen. Geen hele contentbankmetantwoorden naar client vooronlinegrading; volledigofflinecontent brengt lokaleantwoorddata mee en geeft daarom geen veiligstakesassessmentclaim.

ContentSecurityPolicy waar uitvoerbaar, geautoriseerde veiligeupload, geen willekeurigeHTML uit vragen/tutorvelden, serverlogsredaction, privatebuckets/signedURLs, TLS productie, dependencieslockfile. Geen publiekemediaURLs met voornaam inpad. Donorlogo alleenbeheerdergevalideerd bestand, geen embedscript of pixeltracker.

## 10. Externe configuratie

`implementatie/.env.example` bevat namen, geen keys. Claude legt opstart uit voor localdemo en echte services. Bij ontbreken services eindigt de app niet met onduidelijkeerror: demo werkt; productionconfig faalt duidelijk. De eindrapportage bevat perfunctionaliteit status `echt getest`, `demo getest`, `adapter gereed maar niet aangesloten` of `toekomstig uitgeschakeld`. Geen ‘volledig klaar’ claim bij ongeconfigureerde live/auth/mail of onbeoordeelde inhoud.
