import { Suspense } from "react";
import { TutorNavigatie } from "@/components/mees/TutorNavigatie";
import { isBeheerder } from "@/lib/server/rollen";

export default function TutorOmgevingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<TutorNavigatie />}>
        <Navigatie />
      </Suspense>
      <main id="inhoud" className="flex flex-1 flex-col bg-achtergrond-zacht">
        {children}
      </main>
    </>
  );
}

async function Navigatie() {
  return <TutorNavigatie beheerder={await isBeheerder()} />;
}
