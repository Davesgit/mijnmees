import type { Onderdeel } from "@/content/onderwerpen";

/** Cirkel met gekleurde delen: `delen` gelijke stukken, waarvan `gevuld` blauw. */
function Taart({ cx, cy, r, delen, gevuld }: { cx: number; cy: number; r: number; delen: number; gevuld: number }) {
  const punt = (i: number) => {
    const hoek = (i / delen) * Math.PI * 2 - Math.PI / 2;
    return [cx + r * Math.cos(hoek), cy + r * Math.sin(hoek)];
  };
  const stukken = Array.from({ length: delen }, (_, i) => {
    const [x1, y1] = punt(i);
    const [x2, y2] = punt(i + 1);
    const groot = 1 / delen > 0.5 ? 1 : 0;
    return (
      <path
        key={i}
        d={`M${cx} ${cy}L${x1} ${y1}A${r} ${r} 0 ${groot} 1 ${x2} ${y2}Z`}
        fill={i < gevuld ? "currentColor" : "#fff"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    );
  });
  return <g>{stukken}</g>;
}

/** Klein pictogram per onderdeel; de getoonde breuken kloppen met het teken. */
export function OnderdeelPictogram({ soort }: { soort: Onderdeel["pictogram"] }) {
  const tekst = { fill: "currentColor", fontWeight: 800, fontSize: 14, textAnchor: "middle" as const, fontFamily: "inherit" };
  return (
    <svg viewBox="0 0 64 32" className="w-16" aria-hidden focusable="false">
      {soort === "herkennen" && <Taart cx={32} cy={16} r={13} delen={4} gevuld={1} />}
      {soort === "getallenlijn" && (
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 16h52M10 11v10M32 11v10M54 11v10" />
          <circle cx="21" cy="16" r="3.5" fill="currentColor" />
        </g>
      )}
      {soort === "vergelijken" && (
        <>
          <Taart cx={12} cy={16} r={10} delen={2} gevuld={1} />
          <text x="32" y="21" {...tekst}>&lt;</text>
          <Taart cx={52} cy={16} r={10} delen={4} gevuld={3} />
        </>
      )}
      {soort === "gelijk" && (
        <>
          <Taart cx={12} cy={16} r={10} delen={2} gevuld={1} />
          <text x="32" y="21" {...tekst}>=</text>
          <Taart cx={52} cy={16} r={10} delen={4} gevuld={2} />
        </>
      )}
      {soort === "rekenen" && (
        <>
          <Taart cx={12} cy={16} r={10} delen={4} gevuld={1} />
          <text x="32" y="21" {...tekst}>+</text>
          <Taart cx={52} cy={16} r={10} delen={4} gevuld={2} />
        </>
      )}
    </svg>
  );
}
