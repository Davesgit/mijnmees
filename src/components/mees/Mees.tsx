import Image from "next/image";

const poses = {
  blij: { w: 521, h: 434 },
  "denkt-na": { w: 458, h: 452 },
  helpt: { w: 595, h: 328 },
  juicht: { w: 512, h: 417 },
  "op-boeken": { w: 433, h: 454 },
  zwaait: { w: 497, h: 395 },
} as const;

export type MeesPose = keyof typeof poses;

/** De mascotte Mees in een vaste pose. Decoratief: geen alt-tekst. */
export function Mees({
  pose,
  breedte,
  className = "",
  prioriteit = false,
}: {
  pose: MeesPose;
  /** Weergavebreedte in CSS-pixels (op desktop). */
  breedte: number;
  className?: string;
  prioriteit?: boolean;
}) {
  const { w, h } = poses[pose];
  return (
    <Image
      src={`/assets/mascotte/mees-${pose}.png`}
      alt=""
      width={w}
      height={h}
      sizes={`${breedte}px`}
      priority={prioriteit}
      loading={prioriteit ? undefined : "eager"}
      className={`h-auto max-w-full select-none ${className}`}
      style={className.includes("w-") ? undefined : { width: breedte }}
      draggable={false}
    />
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/assets/merk/logo-liggend.png"
      alt="Mees"
      width={627}
      height={206}
      sizes="140px"
      priority
      className={`h-10 w-auto tablet:h-11 ${className}`}
    />
  );
}
