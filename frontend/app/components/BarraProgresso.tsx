// Barra orizzontale di avanzamento (CFU, posti occupati, voti registrati…)

type Props = {
  valore: number;
  massimo: number;
  colore?: string; // classe Tailwind della parte piena, es. "bg-verde"
  alta?: boolean;
  suScuro?: boolean; // barra dentro una card scura (navy)
};

export default function BarraProgresso({ valore, massimo, colore = "bg-verde", alta = false, suScuro = false }: Props) {
  const percentuale = massimo > 0 ? Math.min(100, (valore / massimo) * 100) : 0;
  return (
    <div
      className={
        "overflow-hidden rounded-full " + (suScuro ? "bg-white/12 " : "bg-[#EEF1F6] ") + (alta ? "h-2.5" : "h-1.5")
      }
    >
      <div className={"h-full rounded-full " + colore} style={{ width: percentuale + "%" }} />
    </div>
  );
}
