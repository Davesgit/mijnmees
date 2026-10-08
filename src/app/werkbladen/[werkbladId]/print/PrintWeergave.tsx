"use client";

import { Laden } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, TekstKnop } from "@/components/mees/Knoppen";
import { WerkbladBlad } from "@/features/werkbladen/WerkbladBlad";
import { useWerkblad } from "@/features/werkbladen/useWerkblad";

/** W03: alleen het blad, klaar voor A4. De knoppen verdwijnen bij het printen. */
export function PrintWeergave({ id }: { id: string }) {
  const staat = useWerkblad(id);
  if (staat.status === "laden") return <Laden />;
  if (staat.status === "niet-gevonden") {
    return (
      <div className="mees-content py-10">
        <h1 className="titel-pagina">Dit werkblad is niet gevonden</h1>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 py-6 print:py-0">
      <div className="mees-content flex flex-wrap items-center justify-between gap-3 print:hidden">
        <TekstKnop href={`/werkbladen/${id}`}>
          <Icoon naam="pijl-links" />
          Terug
        </TekstKnop>
        <PrimaireKnop onClick={() => window.print()}>
          <Icoon naam="printer" />
          Print nu
        </PrimaireKnop>
      </div>
      <p className="mees-content tekst-klein text-tekst-zacht print:hidden">Tip: kies A4 en zet kop- en voetteksten van de browser uit.</p>
      <div className="px-2 tablet:px-6 print:px-0">
        <WerkbladBlad werkblad={staat.werkblad} />
      </div>
    </div>
  );
}
