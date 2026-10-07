"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icoon } from "./Icoon";

/** Modale dialoog met native <dialog>: focus-trap, Escape en focusherstel door de browser. */
export function Dialoog({
  open,
  onSluit,
  titel,
  children,
}: {
  open: boolean;
  onSluit: () => void;
  titel: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titelId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titelId}
      onClose={onSluit}
      onClick={(e) => {
        if (e.target === ref.current) onSluit();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-[20px] bg-wit p-0 text-inkt shadow-zwevend backdrop:bg-inkt/40"
    >
      <div className="p-6 tablet:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titelId} className="subtitel">
            {titel}
          </h2>
          <button
            type="button"
            onClick={onSluit}
            className="-m-2 grid size-12 shrink-0 place-items-center rounded-full text-inkt hover:bg-blauw-zacht"
            aria-label="Sluiten"
          >
            <Icoon naam="sluiten" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
