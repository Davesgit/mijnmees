import { PubliekHeader, PubliekeVoet } from "@/components/mees/PubliekHeader";

export default function TutorToegangLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PubliekHeader />
      <main id="inhoud" className="flex flex-1 flex-col">
        {children}
      </main>
      <PubliekeVoet />
    </>
  );
}
