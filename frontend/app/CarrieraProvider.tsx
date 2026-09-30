"use client";

// Contesto con la carriera dello studente connesso.
// È montato in studente/layout.tsx: tutte le pagine dello studente (e la barra in alto,
// per il numero di esami in attesa) usano la stessa lettura, e dopo accetta/rifiuta
// basta un ricarica() per aggiornare tutto.

import { createContext, useContext } from "react";
import { leggiCarriera, type Carriera } from "./letture";
import { useDati } from "./useDati";
import { useWallet } from "./WalletProvider";

type ContestoCarriera = {
  carriera: Carriera | null | undefined; // undefined = in caricamento, null = nessuna carriera
  errore: boolean;
  ricarica: () => void;
};

const CarrieraContext = createContext<ContestoCarriera | null>(null);

export default function CarrieraProvider({ children }: { children: React.ReactNode }) {
  const { indirizzo } = useWallet();

  const { dati, errore, ricarica } = useDati(
    () => (indirizzo ? leggiCarriera(indirizzo) : Promise.resolve(null)),
    [indirizzo]
  );

  return <CarrieraContext.Provider value={{ carriera: dati, errore, ricarica }}>{children}</CarrieraContext.Provider>;
}

export function useCarriera() {
  const contesto = useContext(CarrieraContext);
  if (!contesto) {
    throw new Error("useCarriera va usato dentro <CarrieraProvider>");
  }
  return contesto;
}

// Per i componenti usati anche fuori dall'area studente (es. la barra in alto)
export function useCarrieraSeDisponibile() {
  return useContext(CarrieraContext);
}

// ---------- Calcoli sulla carriera ----------

// Media ponderata sui CFU degli esami accettati (30 e lode conta 30). null se nessun esame.
export function mediaPonderata(carriera: Carriera) {
  const accettati = carriera.esami.filter((e) => e.stato === "ACCETTATO");
  const cfu = accettati.reduce((tot, e) => tot + e.cfu, 0);
  if (cfu === 0) return null;
  const somma = accettati.reduce((tot, e) => tot + Math.min(e.voto, 30) * e.cfu, 0);
  return (somma / cfu).toFixed(2).replace(".", ",");
}
