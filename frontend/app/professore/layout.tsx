import AreaRiservata from "../components/AreaRiservata";

// Tutte le pagine sotto /professore sono visibili solo a chi ha il ruolo professore
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AreaRiservata ruolo="professore">{children}</AreaRiservata>;
}
