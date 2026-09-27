"use client";

import { useState } from "react";
import { abbrevia, linkIndirizzo } from "../utils";
import { IconCheck, IconCopia, IconLinkEsterno } from "../icons";

// Mostra un indirizzo abbreviato (0x4D8e…c93A).
// Passandoci sopra si vede quello completo; cliccando si copia.

type Props = {
  indirizzo: string;
  etherscan?: boolean; // mostra anche il link a Etherscan
  className?: string;
};

export default function Indirizzo({ indirizzo, etherscan = false, className = "" }: Props) {
  const [copiato, setCopiato] = useState(false);

  async function copia() {
    await navigator.clipboard.writeText(indirizzo);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 1500);
  }

  return (
    <span className={"inline-flex items-center gap-1.5 font-mono whitespace-nowrap " + className}>
      <button
        type="button"
        onClick={copia}
        title={indirizzo}
        className="inline-flex cursor-pointer items-center gap-1.5"
      >
        {abbrevia(indirizzo)}
        {copiato ? (
          <IconCheck className="h-3 w-3 text-verde" />
        ) : (
          <IconCopia className="h-3 w-3 text-muto" />
        )}
      </button>

      {etherscan && (
        <a
          href={linkIndirizzo(indirizzo)}
          target="_blank"
          rel="noopener noreferrer"
          title="Vedi su Etherscan"
          className="text-accento"
        >
          <IconLinkEsterno className="h-3 w-3" />
        </a>
      )}
    </span>
  );
}
