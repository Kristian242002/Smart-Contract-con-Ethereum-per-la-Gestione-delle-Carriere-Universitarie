import CarrieraProvider from "../CarrieraProvider";
import AreaRiservata from "../components/AreaRiservata";

// Tutte le pagine sotto /studente sono visibili solo a chi ha il ruolo studente.
// CarrieraProvider sta fuori da AreaRiservata così anche la barra in alto legge la carriera.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CarrieraProvider>
      <AreaRiservata ruolo="studente">{children}</AreaRiservata>
    </CarrieraProvider>
  );
}
