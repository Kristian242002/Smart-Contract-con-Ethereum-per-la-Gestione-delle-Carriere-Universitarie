"use client";

// Professore · Dettaglio di un suo corso: lista iscritti e registrazione voti

import { useParams } from "next/navigation";
import DettaglioCorso from "../../../components/DettaglioCorso";

export default function PaginaCorso() {
  const { indirizzo } = useParams<{ indirizzo: string }>();

  return (
    <DettaglioCorso
      indirizzo={indirizzo}
      ruolo="professore"
      indietro={{ href: "/professore", etichetta: "I miei corsi" }}
    />
  );
}
