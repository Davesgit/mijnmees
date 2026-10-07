# Mees

Gratis leren en oefenen voor kinderen van groep 5 tot en met 8 — [mijnmees.nl](https://mijnmees.nl).

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Vercel.

## Starten

```bash
npm install
cp .env.example .env.local   # vul de Supabase-sleutels in
npm run dev
```

Open http://localhost:3000/kind/start.

## Stand van zaken

**Fase 1 — kindroute als gast (klaar)**

| Scherm | Route |
|---|---|
| S01 Start | `/kind/start` |
| S02 Rekenen | `/kind/rekenen` |
| S03 Onderdelen | `/kind/rekenen/[onderwerp]` |
| S04 Instellen | `/kind/oefening/instellen?onderdeel=…` |
| S05/S06 Oefenen + hulp | `/kind/oefenen/[sessieId]` |
| S07 Afgerond | `/kind/oefening/[sessieId]/afgerond` |
| S08 Voortgang | `/kind/voortgang` |
| S09 Weetjesboek | `/kind/weetjesboek` |
| B01 Weetje | `/kind/weetjes/[weetjeId]` |
| P01 Pauze | `/kind/pauze` |

Voortgang van gasten staat in `localStorage` (`src/lib/opslag/lokaal.ts`). De oefenlogica
(`src/features/oefenen/sessie.ts`) werkt op pure data, zodat fase 3 dezelfde functies server-side kan gebruiken.

Volgende fasen: 3 ouderaccounts + Supabase, 2 Europa/tafeltrainer/niveaubepaling, 4 werkbladen, 5 tutorhulp en live-lessen.

## Inhoud

- Vragen: `src/content/vragen/breuken-vergelijken.json`, gemaakt met `node scripts/maak-breuken-vergelijken.mjs`.
  Status `demo-only`: een leerkracht moet vragen, hints en uitleg nog beoordelen.
- Weetjes: `src/content/weetjes.ts` (bronnen nog te controleren).
- Ontwerp- en productspecificatie: `docs/overdracht/` (mockups staan buiten de repo).
