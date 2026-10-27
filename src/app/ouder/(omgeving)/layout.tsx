import { Suspense } from "react";
import { OuderSchil } from "@/features/ouderchat/OuderSchil";
import { haalOuder } from "@/lib/server/dal";

/** De ouderomgeving: dezelfde chatschil als bij kinderen (zijmenu met chats), met de ouderknop onderin. */
export default function OuderOmgevingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <MetOuder>{children}</MetOuder>
    </Suspense>
  );
}

async function MetOuder({ children }: { children: React.ReactNode }) {
  const ouder = await haalOuder();
  return <OuderSchil email={ouder?.email ?? null}>{children}</OuderSchil>;
}
