"use client";

// Segreteria · Dettaglio di un corso (l'indirizzo del contratto Corso è nell'URL)

import { useParams } from "next/navigation";
import DettaglioCorso from "../../../components/DettaglioCorso";

export default function PaginaCorso() {
  const { indirizzo } = useParams<{ indirizzo: string }>();

  return (
    <DettaglioCorso
      indirizzo={indirizzo}
      ruolo="segreteria"
      indietro={{ href: "/segreteria/corsi", etichetta: "Torna ai corsi" }}
    />
  );
}
