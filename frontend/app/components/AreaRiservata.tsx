"use client";

// Contenitore delle pagine riservate a un ruolo (segreteria, professore, studente).
// - Se il wallet non è connesso, o non ha il ruolo giusto, rimanda a /connetti
// - Mostra la barra in alto e, se serve, l'avviso "rete sbagliata"

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { IconAttenzione } from "../icons";
import { useWallet, type Ruoli } from "../WalletProvider";
import Avviso from "./Avviso";
import BarraApp from "./BarraApp";
import Bottone from "./Bottone";

type Props = {
  ruolo: keyof Ruoli;
  children: React.ReactNode;
};

export default function AreaRiservata({ ruolo, children }: Props) {
  const w = useWallet();
  const router = useRouter();

  const autorizzato = !!w.indirizzo && !!w.ruoli?.[ruolo];

  // Da rimandare a /connetti: nessun wallet connesso, oppure ruoli letti ma senza quello richiesto
  const daRimandare = w.pronto && (!w.indirizzo || (!!w.ruoli && !w.ruoli[ruolo]));

  useEffect(() => {
    if (daRimandare) router.replace("/connetti");
  }, [daRimandare, router]);

  if (w.erroreRuoli) {
    return (
      <div className="mx-auto mt-24 w-full max-w-[440px] px-5">
        <Avviso tipo="attenzione" titolo="Rete non raggiungibile" className="mb-4">
          Non è stato possibile leggere i ruoli dal contratto: il nodo di Sepolia non ha risposto.
        </Avviso>
        <Bottone variante="scuro" onClick={() => window.location.reload()} className="w-full">
          Riprova
        </Bottone>
      </div>
    );
  }

  // Mentre controlliamo (o mentre rimandiamo a /connetti) mostriamo solo una rotella
  if (!autorizzato) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accento-chiaro border-t-accento" />
      </div>
    );
  }

  return (
    <>
      <BarraApp ruolo={ruolo} />

      {!w.reteGiusta && (
        <div className="flex flex-wrap items-center justify-center gap-3.5 bg-rosso px-5 py-[11px] text-sm text-white">
          <IconAttenzione className="h-[17px] w-[17px]" />
          <span>
            <b>Rete sbagliata:</b> il wallet non è su Sepolia. Seleziona la rete Sepolia in MetaMask per poter
            firmare le transazioni.
          </span>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1180px] animate-comparsa px-4 pt-[30px] pb-[90px] md:px-8">
        {children}
      </main>
    </>
  );
}
