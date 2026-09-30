"use client";

import { useEffect, useState } from "react";

// Carica dei dati dalla blockchain e li tiene aggiornati.
//
//   const { dati, caricamento, errore, ricarica } = useDati(() => leggiCorsi(), []);
//
// - caricamento: true solo al primo caricamento (poi si mostrano i dati vecchi mentre arrivano i nuovi)
// - ricarica(): rilegge i dati, da chiamare dopo una transazione confermata
// - dipendenze: se cambiano (es. l'indirizzo cercato), i dati vengono riletti da capo

export function useDati<T>(leggi: () => Promise<T>, dipendenze: unknown[]) {
  const [versione, setVersione] = useState(0);
  const [risultato, setRisultato] = useState<{ chiave: string; dati?: T; errore: boolean } | null>(null);

  // Chiave che identifica "questa" lettura
  const chiave = JSON.stringify(dipendenze);

  useEffect(() => {
    let attuale = true; // se nel frattempo parte un'altra lettura, ignoriamo questa

    leggi()
      .then((dati) => attuale && setRisultato({ chiave, dati, errore: false }))
      .catch((err) => {
        console.error(err);
        if (attuale) setRisultato({ chiave, errore: true });
      });

    return () => {
      attuale = false;
    };
    // "leggi" cambia a ogni render: rileggiamo solo quando cambiano chiave o versione
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiave, versione]);

  const valido = risultato?.chiave === chiave;

  return {
    dati: valido ? risultato.dati : undefined,
    caricamento: !valido,
    errore: valido && risultato.errore,
    ricarica: () => setVersione((v) => v + 1),
  };
}
