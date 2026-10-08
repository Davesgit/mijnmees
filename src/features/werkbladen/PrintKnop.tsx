"use client";

import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop } from "@/components/mees/Knoppen";

export function PrintKnop({ children = "Print" }: { children?: React.ReactNode }) {
  return (
    <PrimaireKnop onClick={() => window.print()}>
      <Icoon naam="printer" />
      {children}
    </PrimaireKnop>
  );
}
