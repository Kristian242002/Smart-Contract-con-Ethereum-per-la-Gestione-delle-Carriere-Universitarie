"use client";

// Ricerca di una carriera per indirizzo.
// Il contratto non espone un elenco degli studenti: si può solo chiedere "questo indirizzo ha una carriera?"

import { useState } from "react";
import { IconCerca } from "../icons";
import { leggiCarriera } from "../letture";
import { useDati } from "../useDati";
import { indirizzoValido, iniziali, type Indirizzo as TipoIndirizzo } from "../utils";
import Avatar from "./Avatar";
import BarraProgresso from "./BarraProgresso";
import Badge from "./Badge";
import Indirizzo from "./Indirizzo";
import Scheletro from "./Scheletro";

export default function CercaCarriera() {
  const [testo, setTesto] = useState("");
  const [cercato, setCercato] = useState<TipoIndirizzo | null>(null);
  const [formatoErrato, setFormatoErrato] = useState(false);

  const { dati: carriera, caricamento, errore } = useDati(
    () => (cercato ? leggiCarriera(cercato) : Promise.resolve(null)),
    [cercato]
  );

  function cerca(e: React.FormEvent) {
    e.preventDefault();
    const q = testo.trim();
    if (!indirizzoValido(q)) {
      setFormatoErrato(true);
      return;
    }
    setFormatoErrato(false);
    setCercato(q);
  }

  return (
    <div>
      <form onSubmit={cerca} className="flex gap-2">
        <input
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder="0x… indirizzo"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-[10px] border border-bordo-forte bg-campo px-3 py-2.5 font-mono text-xs placeholder:text-segnaposto"
        />
        <button type="submit" aria-label="Cerca" className="flex items-center rounded-[10px] bg-navy px-3.5 text-white">
          <IconCerca className="h-[15px] w-[15px]" />
        </button>
      </form>

      {formatoErrato && (
        <p className="mt-2.5 text-xs text-rosso">
          Formato non valido: servono 0x seguito da 40 caratteri esadecimali
        </p>
      )}

      {cercato && !formatoErrato && (
        <div className="mt-3">
          {caricamento && <Scheletro className="h-[74px]" />}
          {errore && <p className="text-xs text-rosso">Lettura non riuscita: il nodo non ha risposto.</p>}

          {!caricamento && !errore && carriera === null && (
            <div className="rounded-[11px] bg-campo p-3.5 text-[13px] text-testo-3">
              Nessuna carriera per <span className="font-mono text-navy">{cercato}</span>
            </div>
          )}

          {!caricamento && carriera && (
            <div className="rounded-[11px] border border-bordo p-3.5">
              <div className="mb-2.5 flex items-center gap-[11px]">
                <Avatar indirizzo={carriera.studente} testo={iniziali(carriera.nome, carriera.cognome)} dimensione={34} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {carriera.nome} {carriera.cognome}
                  </div>
                  <div className="text-[11px] text-muto">
                    <Indirizzo indirizzo={carriera.studente} /> ·{" "}
                    {carriera.tipo === "TRIENNALE" ? "Triennale" : "Magistrale"}
                  </div>
                </div>
                <Badge stato={carriera.laureato ? "LAUREATO" : "IN_CORSO"} />
              </div>
              <div className="mb-1.5 flex justify-between text-xs text-testo-3">
                <span>CFU accettati</span>
                <span className="font-mono text-navy">
                  {carriera.cfu} / {carriera.soglia}
                </span>
              </div>
              <BarraProgresso valore={carriera.cfu} massimo={carriera.soglia} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

