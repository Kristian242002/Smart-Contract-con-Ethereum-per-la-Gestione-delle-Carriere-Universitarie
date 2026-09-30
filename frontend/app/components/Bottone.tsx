// Bottone con le varianti del design.
// Se è disabilitato, "motivo" spiega perché (compare passandoci sopra il mouse).

type Variante = "primario" | "secondario" | "scuro" | "successo" | "pericolo" | "pericoloLeggero";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  variante?: Variante;
  piccolo?: boolean;
  disabilitato?: boolean;
  motivo?: string;
  type?: "button" | "submit";
  className?: string;
};

const colori: Record<Variante, string> = {
  primario: "bg-accento text-white",
  secondario: "bg-white text-navy border border-bordo-forte",
  scuro: "bg-navy text-white",
  successo: "bg-verde text-white",
  pericolo: "bg-rosso text-white",
  pericoloLeggero: "bg-white text-rosso border border-rosso-bordo",
};

export default function Bottone({
  children,
  onClick,
  variante = "primario",
  piccolo = false,
  disabilitato = false,
  motivo,
  type = "button",
  className = "",
}: Props) {
  const dimensione = piccolo
    ? "rounded-[9px] px-[15px] py-[9px] text-[13px]"
    : "rounded-[11px] px-5 py-[13px] text-sm";

  // Non usiamo l'attributo "disabled": un bottone disabled non mostra il title (il motivo).
  // Usiamo aria-disabled e ignoriamo il clic.
  return (
    <button
      type={disabilitato ? "button" : type} // disabilitato non deve inviare un form
      onClick={disabilitato ? undefined : onClick}
      aria-disabled={disabilitato}
      title={disabilitato ? motivo : undefined}
      className={
        "inline-flex items-center justify-center gap-2 font-semibold transition-opacity " +
        (disabilitato ? "cursor-not-allowed opacity-45 " : "hover:opacity-90 ") +
        colori[variante] + " " + dimensione + " " + className
      }
    >
      {children}
    </button>
  );
}
