"use client";

// Campo "incolla l'indirizzo dello studente" + bottone Verifica.
// Porta alla pagina /verifica/<indirizzo>, così il risultato ha un link condivisibile.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconCerca } from "../icons";
import { indirizzoValido } from "../utils";

export default function FormVerifica({ iniziale = "" }: { iniziale?: string }) {
  const router = useRouter();
  const [testo, setTesto] = useState(iniziale);
  const [errore, setErrore] = useState(false);

  function verifica(e: React.FormEvent) {
    e.preventDefault();
    const q = testo.trim();
    if (!indirizzoValido(q)) {
      setErrore(true);
      return;
    }
    setErrore(false);
    router.push("/verifica/" + q);
  }

  return (
    <form onSubmit={verifica} className="mb-6">
      <div className="flex flex-wrap gap-2.5">
        <input
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder="0x… indirizzo studente"
          spellCheck={false}
          className="min-w-0 flex-[1_1_260px] rounded-[10px] border border-bordo-forte bg-white px-3.5 py-3 font-mono text-[13px] placeholder:text-segnaposto"
        />
        <button
          type="submit"
          className="flex flex-none items-center justify-center gap-2 rounded-[10px] bg-accento px-[22px] py-3 text-sm font-semibold text-white"
        >
          <IconCerca className="h-[15px] w-[15px]" />
          Verifica
        </button>
      </div>
      {errore && (
        <p className="mt-1.5 text-xs text-rosso">Formato non valido: servono 0x seguito da 40 caratteri esadecimali</p>
      )}
    </form>
  );
}
