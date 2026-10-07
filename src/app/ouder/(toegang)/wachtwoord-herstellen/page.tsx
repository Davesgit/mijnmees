import type { Metadata } from "next";
import { SmalKader } from "@/components/mees/SmalKader";
import { HerstelFormulier } from "./HerstelFormulier";

export const metadata: Metadata = { title: "Wachtwoord vergeten" };

export default function HerstellenPage() {
  return (
    <SmalKader titel="Wachtwoord vergeten?" ondertitel="We helpen je weer inloggen." pose="denkt-na">
      <HerstelFormulier />
    </SmalKader>
  );
}
