import { OuderSchil } from "@/features/ouderchat/OuderSchil";

/** De ouderomgeving: dezelfde chatschil als bij kinderen (zijmenu met chats), met de ouderzaken vast onderin. */
export default function OuderOmgevingLayout({ children }: { children: React.ReactNode }) {
  return <OuderSchil>{children}</OuderSchil>;
}
