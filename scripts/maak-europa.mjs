// Zet de kaartdata en vragenbank van de Europa-proefversie om naar content voor de site.
// Bron: mees-overdracht/referentie/europa-trainer/index.html (Natural Earth v5.1.2, publiek domein).
//
// Gebruik: node scripts/maak-europa.mjs "<pad naar mees-overdracht>"

import { readFileSync, writeFileSync } from "node:fs";

const bron = process.argv[2] ?? "../mees-overdracht";
const html = readFileSync(`${bron}/referentie/europa-trainer/index.html`, "utf8");
const begin = html.indexOf("const DATA") ;
const jsonStart = html.indexOf("{", begin);

// JSON-object uitlezen door haakjes te tellen (strings respecterend).
let diepte = 0, inString = false, escape = false, einde = jsonStart;
for (let i = jsonStart; i < html.length; i++) {
  const c = html[i];
  if (inString) {
    if (escape) escape = false;
    else if (c === "\\") escape = true;
    else if (c === '"') inString = false;
    continue;
  }
  if (c === '"') inString = true;
  else if (c === "{") diepte++;
  else if (c === "}" && --diepte === 0) {
    einde = i + 1;
    break;
  }
}
const DATA = JSON.parse(html.slice(jsonStart, einde));

const rond = (n) => Math.round(n * 10) / 10;
const kortPad = (d) => d.replace(/(\d+\.\d+)/g, (m) => String(rond(Number(m))));

// Achtergrond: niet-Europees land en meren uit de basiskaart.
const groep = (id) => {
  const m = DATA.baseSvg.match(new RegExp(`<g id="${id}"[^>]*>([\\s\\S]*?)</g>`));
  return m ? [...m[1].matchAll(/<path d="([^"]+)"/g)].map((p) => kortPad(p[1])) : [];
};

const kaart = {
  bron: "Natural Earth v5.1.2 (publiek domein), via de Mees Europa-trainer",
  viewBox: [0, 0, 1100, 720],
  context: groep("context"),
  meren: groep("lakes"),
  landen: DATA.countries.map((c) => ({
    id: c.id,
    naam: c.name,
    kleur: c.color,
    pad: kortPad(c.path),
    bbox: c.bbox.map(rond),
    midden: c.center.map(rond),
  })),
  hoofdsteden: DATA.capitals.map((c) => ({ id: c.id, land: c.countryCode, naam: c.capital, x: rond(c.x), y: rond(c.y) })),
  wateren: DATA.waters.map((w) => ({ id: w.id, naam: w.name, pad: kortPad(w.path), bbox: w.bbox?.map(rond), midden: w.center?.map(rond) })),
  rivieren: DATA.rivers.map((r) => ({ id: r.id, naam: r.name, pad: kortPad(r.path), landen: r.countries, bbox: r.bbox?.map(rond) })),
  gebergten: DATA.mountains.map((m) => ({ id: m.id, naam: m.name, pad: kortPad(m.path), bbox: m.bbox?.map(rond), midden: m.center?.map(rond) })),
  gebieden: DATA.regions,
};

// Windrichtingen in de bron gebruiken codes als "SE" en "NO": dat zijn ook landcodes (Zweden, Noorwegen).
// Geef richtingen een eigen code, zodat een land nooit een richting wordt (en andersom).
const RICHTINGEN = new Set(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]);
const isRichting = (q, id) => q.module === "relative" && RICHTINGEN.has(id) && (q.options ?? []).every((o) => RICHTINGEN.has(o.id));
const richtingId = (q, id) => (isRichting(q, id) ? `richting-${id.toLowerCase()}` : id);
for (const q of DATA.questions) {
  if (!q.options) continue;
  q.targetId = richtingId(q, q.targetId);
  q.options = q.options.map((o) => ({ ...o, id: richtingId(q, o.id) }));
}

const vragen = DATA.questions.map((q) => ({
  id: q.id,
  module: q.module,
  vaardigheid: q.skill,
  type: q.type,
  vraag: q.question,
  doel: q.targetId,
  hint: q.hint,
  ...(q.highlightId ? { markering: q.highlightId } : {}),
  ...(q.module === "relative" ? { opties: q.options, vereist: q.requiredCountries, referentie: q.referenceId, focus: q.focusId } : {}),
}));

// Klein namenbestand voor beoordeling en uitleg (ook op de server), zonder kaartvormen.
const namen = Object.fromEntries([
  ...kaart.landen.map((l) => [l.id, l.naam]),
  ...kaart.hoofdsteden.map((h) => [h.id, h.naam]),
  ...kaart.wateren.map((w) => [w.id, w.naam]),
  ...kaart.rivieren.map((r) => [r.id, r.naam]),
  ...kaart.gebergten.map((g) => [g.id, g.naam]),
]);
// Optielabels alleen toevoegen als de code nog geen naam heeft (nooit een land, stad of water overschrijven).
for (const q of DATA.questions) for (const o of q.options ?? []) if (!(o.id in namen)) namen[o.id] = o.label;
writeFileSync(new URL("../src/content/europa/namen.json", import.meta.url), JSON.stringify(namen, null, 1));

// Klein metabestand voor het samenstellen van sessies (zonder kaartvormen).
const meta = {
  gebieden: DATA.regions.regions.map((r) => ({ id: r.id, naam: r.name, basis: r.basic, extra: r.extra })),
  fysiek: DATA.regions.physicalRegions,
  rivierLanden: Object.fromEntries(DATA.rivers.map((r) => [r.id, r.countries])),
  wateren: DATA.waters.map((w) => w.id),
  rivieren: DATA.rivers.map((r) => r.id),
  gebergten: DATA.mountains.map((m) => m.id),
  landen: DATA.countries.map((c) => c.id),
};
writeFileSync(new URL("../src/content/europa/meta.json", import.meta.url), JSON.stringify(meta, null, 1));

writeFileSync(new URL("../src/content/europa/kaart.json", import.meta.url), JSON.stringify(kaart));
writeFileSync(new URL("../src/content/europa/vragen.json", import.meta.url), JSON.stringify(vragen, null, 1));
console.log(`${kaart.landen.length} landen, ${kaart.context.length} achtergrondvormen, ${vragen.length} vragen`);
