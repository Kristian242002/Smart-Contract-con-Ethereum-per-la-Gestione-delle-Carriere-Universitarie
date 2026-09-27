import AreaRiservata from "../components/AreaRiservata";

// Tutte le pagine sotto /studente sono visibili solo a chi ha il ruolo studente
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AreaRiservata ruolo="studente">{children}</AreaRiservata>;
}
