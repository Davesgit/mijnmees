import type { Metadata } from "next";
import { ProfielScherm } from "./ProfielScherm";

export const metadata: Metadata = { title: "Jouw profiel" };

export default function Page() {
  return <ProfielScherm />;
}
