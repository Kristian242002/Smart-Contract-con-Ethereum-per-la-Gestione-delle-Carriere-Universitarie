import { IconAttenzione, IconInfo, IconLucchetto } from "../icons";

// Box colorato per messaggi: informazioni, avvertimenti, errori, blocchi

type Tipo = "info" | "attenzione" | "errore" | "bloccato";

type Props = {
  tipo?: Tipo;
  titolo?: string;
  children: React.ReactNode;
  className?: string;
};

const stili: Record<Tipo, { box: string; icona: string; Icona: typeof IconInfo }> = {
  info: { box: "bg-accento-chiaro text-testo-2", icona: "text-accento", Icona: IconInfo },
  attenzione: { box: "bg-ambra-chiaro text-ambra-scuro", icona: "text-ambra", Icona: IconAttenzione },
  errore: { box: "bg-rosso-chiaro text-rosso-scuro", icona: "text-rosso", Icona: IconAttenzione },
  bloccato: { box: "bg-rosso-chiaro text-rosso-scuro", icona: "text-rosso", Icona: IconLucchetto },
};

export default function Avviso({ tipo = "info", titolo, children, className = "" }: Props) {
  const { box, icona, Icona } = stili[tipo];

  return (
    <div className={"flex gap-2.5 rounded-xl p-3.5 text-[13px] leading-normal " + box + " " + className}>
      <Icona className={"mt-px h-4 w-4 shrink-0 " + icona} />
      <div>
        {titolo && <div className="mb-0.5 text-sm font-semibold">{titolo}</div>}
        {children}
      </div>
    </div>
  );
}
