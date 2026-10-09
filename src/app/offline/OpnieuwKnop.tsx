"use client";

import { PrimaireKnop } from "@/components/mees/Knoppen";

export function OpnieuwKnop() {
  return <PrimaireKnop onClick={() => window.location.reload()}>Probeer opnieuw</PrimaireKnop>;
}
