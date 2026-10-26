import type { Metadata } from "next";
import { EerdereChats } from "@/features/chat/EerdereChats";

export const metadata: Metadata = { title: "Eerdere chats" };

export default function Page() {
  return <EerdereChats />;
}
