// Campo di testo con etichetta e messaggio di errore

type Props = {
  etichetta?: string;
  valore: string;
  onCambia: (valore: string) => void;
  segnaposto?: string;
  errore?: string;
  mono?: boolean; // font monospazio, per gli indirizzi
  className?: string;
};

export default function Campo({ etichetta, valore, onCambia, segnaposto, errore, mono, className = "" }: Props) {
  return (
    <label className={"block " + className}>
      {etichetta && <span className="mb-[7px] block text-[13px] font-semibold text-testo-2">{etichetta}</span>}
      <input
        value={valore}
        onChange={(e) => onCambia(e.target.value)}
        placeholder={segnaposto}
        spellCheck={false}
        className={
          "w-full rounded-[10px] border bg-campo px-3.5 py-3 text-sm outline-accento/25 placeholder:text-segnaposto " +
          (errore ? "border-[#E8A59C] " : "border-bordo-forte ") +
          (mono ? "font-mono text-[13px]" : "")
        }
      />
      {errore && <span className="mt-1.5 block text-xs text-rosso">{errore}</span>}
    </label>
  );
}
