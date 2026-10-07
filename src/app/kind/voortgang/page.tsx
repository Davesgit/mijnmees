import type { Metadata } from "next";
import { VoortgangScherm } from "./VoortgangScherm";

export const metadata: Metadata = { title: "Jouw voortgang" };

export default function Page() {
  return <VoortgangScherm />;
}
