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

  const bottone = (
    <button
      type={type}
      onClick={onClick}
      disabled={disabilitato}
      className={
        "inline-flex items-center justify-center gap-2 font-semibold transition-opacity hover:opacity-90 " +
        "disabled:cursor-not-allowed disabled:opacity-45 " +
        colori[variante] + " " + dimensione + " " + className
      }
    >
      {children}
    </button>
  );

  // Un bottone disabilitato non mostra il title: lo mettiamo su un contenitore
  if (disabilitato && motivo) {
    return (
      <span title={motivo} className="inline-flex">
        {bottone}
      </span>
    );
  }

  return bottone;
}
