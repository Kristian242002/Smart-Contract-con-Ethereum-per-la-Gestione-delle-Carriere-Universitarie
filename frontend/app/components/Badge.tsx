// Etichetta colorata per lo stato di un corso, di un esame o di una carriera

export type Stato =
  | "APERTO"
  | "CHIUSO"
  | "PIENO"
  | "IN_ATTESA"
  | "ACCETTATO"
  | "RIFIUTATO"
  | "INSUFFICIENTE"
  | "LAUREATO"
  | "IN_CORSO";

const colori: Record<Stato, string> = {
  APERTO: "text-verde-scuro",
  CHIUSO: "text-grigio",
  PIENO: "text-ambra",
  IN_ATTESA: "text-ambra",
  ACCETTATO: "text-verde-scuro",
  RIFIUTATO: "text-grigio",
  INSUFFICIENTE: "text-rosso",
  LAUREATO: "text-verde-scuro",
  IN_CORSO: "text-ambra",
};

export default function Badge({ stato }: { stato: Stato }) {
  return (
    <span className={"text-xs font-semibold tracking-[.03em] whitespace-nowrap " + colori[stato]}>
      {stato.replace("_", " ")}
    </span>
  );
}
