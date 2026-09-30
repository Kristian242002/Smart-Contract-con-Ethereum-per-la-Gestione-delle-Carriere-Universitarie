// Riquadro tratteggiato per le liste vuote ("Nessun professore abilitato", …)

type Props = {
  titolo: string;
  testo?: string;
  icona?: React.ReactNode;
};

export default function StatoVuoto({ titolo, testo, icona }: Props) {
  return (
    <div className="rounded-[14px] border border-dashed border-bordo-forte bg-white px-6 py-10 text-center">
      {icona && <div className="mb-2.5 flex justify-center text-segnaposto">{icona}</div>}
      <div className="font-heading text-base font-semibold">{titolo}</div>
      {testo && <div className="mt-1 text-[13px] text-testo-3">{testo}</div>}
    </div>
  );
}
