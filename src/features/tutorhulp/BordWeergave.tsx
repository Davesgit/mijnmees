import type { PointerEvent as ReactPointerEvent, Ref } from "react";
import { BORD, bordKleuren, type BordElement } from "./bord";

/** Sector van een cirkel (breukmodel). */
function sector(cx: number, cy: number, r: number, i: number, n: number) {
  if (n === 1) return null;
  const hoek = (k: number) => (k / n) * Math.PI * 2 - Math.PI / 2;
  const [x1, y1] = [cx + r * Math.cos(hoek(i)), cy + r * Math.sin(hoek(i))];
  const [x2, y2] = [cx + r * Math.cos(hoek(i + 1)), cy + r * Math.sin(hoek(i + 1))];
  return `M${cx} ${cy}L${x1} ${y1}A${r} ${r} 0 ${1 / n > 0.5 ? 1 : 0} 1 ${x2} ${y2}Z`;
}

function Element({ e, geselecteerd }: { e: BordElement; geselecteerd: boolean }) {
  const kleur = bordKleuren[e.kleur];
  const rand = geselecteerd ? { filter: "drop-shadow(0 0 4px #ffbf24)" } : undefined;
  switch (e.soort) {
    case "tekst":
      return (
        <text x={e.x} y={e.y} fill={kleur} fontSize={e.groot ? 52 : 34} fontWeight={700} dominantBaseline="middle" style={rand}>
          {e.tekst}
        </text>
      );
    case "breuk": {
      const breedte = Math.max(e.teller.length, e.noemer.length) * 26 + 20;
      return (
        <g fill={kleur} fontSize={44} fontWeight={800} textAnchor="middle" style={rand}>
          <text x={e.x} y={e.y - 30} dominantBaseline="middle">
            {e.teller}
          </text>
          <rect x={e.x - breedte / 2} y={e.y - 3} width={breedte} height={5} rx={2} />
          <text x={e.x} y={e.y + 32} dominantBaseline="middle">
            {e.noemer}
          </text>
        </g>
      );
    }
    case "rechthoek":
      return (
        <g style={rand}>
          {Array.from({ length: e.delen }, (_, i) => (
            <rect key={i} x={e.x + (e.b / e.delen) * i} y={e.y} width={e.b / e.delen} height={e.h} fill={i < e.gevuld ? kleur : "#fff"} fillOpacity={i < e.gevuld ? 0.85 : 1} stroke={kleur} strokeWidth={3} />
          ))}
        </g>
      );
    case "cirkel":
      return (
        <g style={rand}>
          {e.delen === 1 ? (
            <circle cx={e.x} cy={e.y} r={e.r} fill={e.gevuld ? kleur : "#fff"} fillOpacity={e.gevuld ? 0.85 : 1} stroke={kleur} strokeWidth={3} />
          ) : (
            Array.from({ length: e.delen }, (_, i) => <path key={i} d={sector(e.x, e.y, e.r, i, e.delen)!} fill={i < e.gevuld ? kleur : "#fff"} fillOpacity={i < e.gevuld ? 0.85 : 1} stroke={kleur} strokeWidth={3} strokeLinejoin="round" />)
          )}
        </g>
      );
    case "pijl": {
      const hoek = Math.atan2(e.y2 - e.y1, e.x2 - e.x1);
      const punt = (d: number) => `${e.x2 - 26 * Math.cos(hoek + d)},${e.y2 - 26 * Math.sin(hoek + d)}`;
      return (
        <g stroke={kleur} strokeWidth={6} strokeLinecap="round" fill={kleur} style={rand}>
          <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
          <polygon points={`${e.x2},${e.y2} ${punt(0.45)} ${punt(-0.45)}`} strokeLinejoin="round" />
        </g>
      );
    }
    case "pen":
      return <polyline points={e.punten.map((p) => p.join(",")).join(" ")} fill="none" stroke={kleur} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" style={rand} />;
  }
}

/** Het bord als schaalbare SVG (16:10). Wordt gebruikt in de editor, in het voorbeeld en bij het kind. */
export function BordWeergave({
  elementen,
  geselecteerdId,
  label,
  svgRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  className = "",
  bezig = false,
}: {
  elementen: BordElement[];
  geselecteerdId?: string | null;
  label: string;
  svgRef?: Ref<SVGSVGElement>;
  onPointerDown?: (e: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerMove?: (e: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: ReactPointerEvent<SVGSVGElement>) => void;
  className?: string;
  bezig?: boolean;
}) {
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${BORD.breedte} ${BORD.hoogte}`}
      role="img"
      aria-label={label}
      className={`block aspect-[16/10] w-full touch-none select-none rounded-[16px] border border-rand-zacht bg-wit ${bezig ? "cursor-crosshair" : ""} ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      fontFamily="var(--font-mees)"
    >
      <defs>
        <pattern id="bord-ruit" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M50 0H0V50" fill="none" stroke="#eaf5ff" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width={BORD.breedte} height={BORD.hoogte} fill="url(#bord-ruit)" />
      {elementen.map((e) => (
        <Element key={e.id} e={e} geselecteerd={e.id === geselecteerdId} />
      ))}
    </svg>
  );
}
