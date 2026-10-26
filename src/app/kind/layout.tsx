import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Laden } from "@/components/mees/Bouwstenen";
import { LeesinstellingenToepasser } from "@/components/mees/Leesopties";
import { KindSchil } from "@/features/chat/KindSchil";
import { ProfielProvider } from "@/components/mees/Profiel";
import { haalActiefKind, haalOuder } from "@/lib/server/dal";

export default function KindLayout({ children }: LayoutProps<"/kind">) {
  return (
    <Suspense
      fallback={
        <main id="inhoud" className="flex flex-1 flex-col">
          <Laden />
        </main>
      }
    >
      <MetProfiel>{children}</MetProfiel>
    </Suspense>
  );
}

async function MetProfiel({ children }: { children: ReactNode }) {
  const [ouder, kind] = await Promise.all([haalOuder(), haalActiefKind()]);
  // Een ingelogde ouder zonder gekozen profiel kiest eerst wie er gaat oefenen.
  if (ouder && !kind) redirect("/profielen");

  return (
    <ProfielProvider kind={kind} ouderIngelogd={Boolean(ouder)}>
      <LeesinstellingenToepasser />
      <KindSchil>{children}</KindSchil>
    </ProfielProvider>
  );
}
