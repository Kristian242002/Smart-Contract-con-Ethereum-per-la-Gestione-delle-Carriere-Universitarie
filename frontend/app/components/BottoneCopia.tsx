"use client";

import { useState } from "react";
import { IconCheck, IconCopia } from "../icons";

// Bottone che copia un testo negli appunti e per un attimo mostra "Copiato"

type Props = {
  testo: string;
  etichetta?: string;
  className?: string;
};

export default function BottoneCopia({ testo, etichetta = "Copia", className = "" }: Props) {
  const [copiato, setCopiato] = useState(false);

  async function copia() {
    await navigator.clipboard.writeText(testo);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copia}
      className={"inline-flex items-center justify-center gap-2 font-semibold " + className}
    >
      {copiato ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopia className="h-3.5 w-3.5" />}
      {copiato ? "Copiato" : etichetta}
    </button>
  );
}
