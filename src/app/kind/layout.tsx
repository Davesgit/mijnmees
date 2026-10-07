import { LeesinstellingenToepasser } from "@/components/mees/Leesopties";
import { KindOnderNavigatie, MeesHeader } from "@/components/mees/MeesHeader";

export default function KindLayout({ children }: LayoutProps<"/kind">) {
  return (
    <>
      <LeesinstellingenToepasser />
      <MeesHeader />
      <main id="inhoud" className="flex flex-1 flex-col">
        {children}
      </main>
      <KindOnderNavigatie />
    </>
  );
}
