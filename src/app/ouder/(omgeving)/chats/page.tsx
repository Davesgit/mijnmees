import type { Metadata } from "next";
import { EerdereChats } from "@/features/chat/EerdereChats";

export const metadata: Metadata = { title: "Alle chats" };

/** Alle chats van de ouder en het archief (de ouderschil levert de juiste chatgeschiedenis). */
export default function Page() {
  return <EerdereChats />;
}
