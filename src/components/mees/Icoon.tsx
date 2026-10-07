import { iconen, type IcoonNaam } from "./iconen";

// Aanvullende iconen in dezelfde stijl (24px, lijn 1.8, currentColor) voor bediening die in het pakket ontbrak.
const extra = {
  "pijl-rechts": '<path d="M5 12h14M13 6l6 6-6 6"/>',
  "pijl-links": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  "chevron-rechts": '<path d="m9 6 6 6-6 6"/>',
  "chevron-omlaag": '<path d="m6 9 6 6 6-6"/>',
  huis: '<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  min: '<path d="M5 12h14"/>',
  printer: '<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><path d="M7 14h10v6H7z"/>',
  scherm: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  document: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  pauze: '<path d="M9 5v14M15 5v14"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
} as const;

export type AlleIcoonNamen = IcoonNaam | keyof typeof extra;

export function Icoon({
  naam,
  className = "size-6",
  label,
}: {
  naam: AlleIcoonNamen;
  className?: string;
  /** Alleen gebruiken als het icoon zelf betekenis draagt; anders is het decoratief. */
  label?: string;
}) {
  const binnen =
    naam in extra
      ? `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${extra[naam as keyof typeof extra]}</g>`
      : iconen[naam as IcoonNaam];
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: binnen }}
    />
  );
}
