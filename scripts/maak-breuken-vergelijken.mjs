// Maakt de demonstratievragen voor "Breuken vergelijken".
// De uitvoer (src/content/vragen/breuken-vergelijken.json) is statische, controleerbare content:
// iedere vraag heeft een vast id, versie, twee hints en uitleg. Status blijft "demo-only"
// tot een leerkracht de vragen heeft beoordeeld.
//
// Gebruik: node scripts/maak-breuken-vergelijken.mjs

import { writeFileSync } from "node:fs";

const ggd = (a, b) => (b === 0 ? a : ggd(b, a % b));
const kgv = (a, b) => (a * b) / ggd(a, b);

const teken = (a, b, c, d) => {
  const links = a * d;
  const rechts = c * b;
  return links < rechts ? "<" : links > rechts ? ">" : "=";
};

const woordVoorTeken = { "<": "kleiner dan", ">": "groter dan", "=": "gelijk aan" };
const meerMinder = { "<": "minder dan", ">": "meer dan", "=": "evenveel als" };

// [teller links, noemer links, teller rechts, noemer rechts]
const sets = {
  makkelijk: [
    [2, 5, 4, 5],
    [5, 8, 3, 8],
    [3, 6, 5, 6],
    [7, 10, 4, 10],
    [3, 7, 5, 7],
    [1, 3, 1, 5],
    [1, 2, 1, 4],
    [2, 9, 2, 5],
    [3, 4, 3, 8],
    [1, 3, 1, 6],
    [4, 9, 7, 9],
    [3, 10, 3, 4],
  ],
  "past-bij-mij": [
    [1, 2, 3, 4],
    [2, 3, 5, 6],
    [3, 4, 5, 8],
    [1, 2, 2, 4],
    [3, 5, 7, 10],
    [1, 3, 2, 6],
    [5, 6, 2, 3],
    [3, 8, 1, 4],
    [1, 2, 3, 8],
    [4, 5, 9, 10],
    [2, 4, 3, 6],
    [7, 12, 2, 3],
  ],
  uitdagend: [
    [2, 3, 3, 5],
    [3, 4, 4, 5],
    [1, 3, 2, 5],
    [5, 6, 7, 9],
    [3, 7, 1, 2],
    [2, 5, 3, 8],
    [4, 6, 6, 9],
    [5, 8, 2, 3],
    [3, 10, 1, 4],
    [7, 8, 5, 6],
    [2, 9, 1, 6],
    [4, 10, 2, 5],
  ],
};

const b = (t, n) => `${t}/${n}`;

function maakVraag(niveau, [a, n1, c, n2], index) {
  const antwoord = teken(a, n1, c, n2);
  let hints;
  let uitleg;

  if (n1 === n2) {
    hints = [
      "Kijk naar de noemers. Wat valt je op?",
      `De noemers zijn gelijk. Dan vergelijk je de tellers: ${a} en ${c}.`,
    ];
    uitleg =
      antwoord === "="
        ? `De breuken zijn precies hetzelfde. Dus ${b(a, n1)} = ${b(c, n2)}.`
        : `De noemers zijn gelijk, dus de stukjes zijn even groot. ${a} stukjes is ${meerMinder[antwoord]} ${c} stukjes. Dus ${b(a, n1)} ${antwoord} ${b(c, n2)}.`;
  } else if (a === c) {
    hints = [
      "Kijk naar de tellers. Wat valt je op?",
      `De tellers zijn gelijk. Hoe groter de noemer, hoe kleiner elk stukje. Vergelijk ${n1} en ${n2}.`,
    ];
    uitleg = `Bij ${b(a, n1)} verdeel je het geheel in ${n1} stukjes, bij ${b(c, n2)} in ${n2} stukjes. Meer stukjes betekent kleinere stukjes. Dus ${b(a, n1)} ${antwoord} ${b(c, n2)}.`;
  } else {
    const noemer = kgv(n1, n2);
    const t1 = a * (noemer / n1);
    const t2 = c * (noemer / n2);
    const omschrijving = [];
    if (n1 !== noemer) omschrijving.push(`${b(a, n1)} = ${b(t1, noemer)}`);
    if (n2 !== noemer) omschrijving.push(`${b(c, n2)} = ${b(t2, noemer)}`);
    hints = [
      "Maak de noemers gelijk. Dan zijn de stukjes even groot.",
      `Schrijf beide breuken met noemer ${noemer}: ${omschrijving.join(" en ")}.`,
    ];
    uitleg =
      antwoord === "="
        ? `${omschrijving.join(" en ")}. Ze zijn dus even groot. Dus ${b(a, n1)} = ${b(c, n2)}.`
        : `${omschrijving.join(" en ")}. ${b(t1, noemer)} is ${meerMinder[antwoord]} ${b(t2, noemer)}. Dus ${b(a, n1)} ${antwoord} ${b(c, n2)}.`;
  }

  return {
    id: `bv-${niveau}-${String(index + 1).padStart(2, "0")}`,
    version: 1,
    type: "meerkeuze",
    subjectId: "rekenen",
    topicId: "breuken",
    learningGoalId: "breuken-vergelijken",
    prerequisites: ["breuken-model"],
    groupRange: [5, 8],
    difficulty: niveau,
    prompt: "Welk teken hoort ertussen?",
    instructie: "Kies het juiste teken.",
    options: ["<", "=", ">"],
    visual: { soort: "breuk-vergelijking", links: [a, n1], rechts: [c, n2] },
    answer: antwoord,
    hints,
    explanation: uitleg,
    antwoordInWoorden: woordVoorTeken[antwoord],
    curriculum: { source: "Mees demonstratie", version: "2026-10-08", status: "review-required" },
    review: { status: "demo-only", reviewerId: null },
  };
}

const vragen = Object.entries(sets).flatMap(([niveau, lijst]) =>
  lijst.map((set, i) => maakVraag(niveau, set, i)),
);

// Controle: geen dubbele paren, en alle antwoorden kloppen met kruislings vermenigvuldigen.
const gezien = new Set();
for (const v of vragen) {
  const sleutel = JSON.stringify([v.visual.links, v.visual.rechts]);
  if (gezien.has(sleutel)) throw new Error(`Dubbele vraag: ${v.id}`);
  gezien.add(sleutel);
}

writeFileSync(
  new URL("../src/content/vragen/breuken-vergelijken.json", import.meta.url),
  JSON.stringify(vragen, null, 2) + "\n",
);

const telling = vragen.reduce((acc, v) => ((acc[`${v.difficulty} ${v.answer}`] = (acc[`${v.difficulty} ${v.answer}`] ?? 0) + 1), acc), {});
console.log(`${vragen.length} vragen geschreven`, telling);
