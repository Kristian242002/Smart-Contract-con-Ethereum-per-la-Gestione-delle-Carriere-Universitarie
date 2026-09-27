import AreaRiservata from "../components/AreaRiservata";

// Tutte le pagine sotto /segreteria sono visibili solo a chi ha il ruolo segreteria
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AreaRiservata ruolo="segreteria">{children}</AreaRiservata>;
}
