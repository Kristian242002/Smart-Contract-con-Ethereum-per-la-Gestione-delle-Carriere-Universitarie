"use client";

import { useEffect, useState } from "react";

// Carica dei dati dalla blockchain e li tiene aggiornati.

export function useDati<T>(leggi: () => Promise<T>, dipendenze: unknown[]) {
  const [versione, setVersione] = useState(0);
  const [risultato, setRisultato] = useState<{ chiave: string; dati?: T; errore: boolean } | null>(null);

  // Chiave che identifica "questa" lettura
  const chiave = JSON.stringify(dipendenze);

  useEffect(() => {
    let attuale = true; 

    leggi()
      .then((dati) => attuale && setRisultato({ chiave, dati, errore: false }))
      .catch((err) => {
        console.error(err);
        if (attuale) setRisultato({ chiave, errore: true });
      });

    return () => {
      attuale = false;
    };
  }, [chiave, versione]);

  const valido = risultato?.chiave === chiave;

  return {
    dati: valido ? risultato.dati : undefined,
    caricamento: !valido,
    errore: valido && risultato.errore,
    ricarica: () => setVersione((v) => v + 1),
  };
}
