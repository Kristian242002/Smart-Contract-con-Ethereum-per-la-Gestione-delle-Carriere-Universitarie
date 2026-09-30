import Logo from "../components/Logo";

// Pagine di verifica pubblica: aperte a tutti, senza wallet (es. un'azienda che scansiona il QR)
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-comparsa">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-bordo bg-white px-5 py-3.5">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-[880px] px-4 pt-[30px] pb-[90px] md:px-8">{children}</main>
    </div>
  );
}
