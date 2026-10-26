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
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  kader: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  lijst: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  slot: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  uitloggen: '<path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/>',
  persoon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  delen: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M8 10H6v10h12V10h-2"/>',
  prullenbak: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  // Chat (ontwerp versie 6)
  pen: '<path d="m4 16 12-12 4 4L8 20l-5 1 1-5Zm10-10 4 4M14 21h7"/>',
  klok: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
  chat: '<path d="M20 11.5c0 4.1-3.6 7.5-8 7.5-1.2 0-2.4-.2-3.4-.7L4 20l1.3-3.7A7.2 7.2 0 0 1 4 11.5C4 7.4 7.6 4 12 4s8 3.4 8 7.5Z"/><path d="M9 11.5h6"/>',
  boek: '<path d="M12 6C9.5 4 6 3.5 3 4.5v14c3-1 6.5-.5 9 1.5 2.5-2 6-2.5 9-1.5v-14C18 3.5 14.5 4 12 6Zm0 0v14"/>',
  herhaal: '<path d="M4 10a8 8 0 0 1 14-4l2 2M20 4v4h-4M20 14a8 8 0 0 1-14 4l-2-2M4 20v-4h4"/>',
  microfoon: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>',
  verstuur: '<path d="m3 11 18-8-8 18-2-8-8-2Zm8 2 10-10"/>',
  "paneel-in": '<path d="m14 6-6 6 6 6"/>',
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
