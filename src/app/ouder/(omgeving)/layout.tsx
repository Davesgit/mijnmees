import { OuderNavigatie } from "@/components/mees/OuderNavigatie";

export default function OuderOmgevingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OuderNavigatie />
      <main id="inhoud" className="flex flex-1 flex-col bg-achtergrond-zacht">
        {children}
      </main>
    </>
  );
}
