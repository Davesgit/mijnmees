import type { Metadata } from "next";
import { StartScherm } from "./StartScherm";

export const metadata: Metadata = { title: "Start" };

export default function Page() {
  return <StartScherm />;
}
