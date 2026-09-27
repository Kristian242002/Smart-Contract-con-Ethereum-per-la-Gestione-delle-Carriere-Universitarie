import Link from "next/link";
import Logo from "./Logo";

// Segnaposto per le pagine che costruiremo nei prossimi passi

export default function InCostruzione({ titolo }: { titolo: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 py-4 md:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-5 pb-20 text-center">
        <h1 className="font-heading text-[28px] font-bold">{titolo}</h1>
        <p className="text-sm text-testo-3">Questa pagina arriva nei prossimi passi.</p>
        <Link href="/" className="text-sm font-semibold text-accento">
          ← Torna al frontespizio
        </Link>
      </main>
    </div>
  );
}
