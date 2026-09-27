import Card from "./Card";

// Segnaposto dentro l'area riservata, per le pagine dei prossimi passi

export default function Segnaposto({ titolo, descrizione }: { titolo: string; descrizione: string }) {
  return (
    <div>
      <h1 className="font-heading text-[28px] font-bold">{titolo}</h1>
      <p className="mt-1 text-sm text-testo-3">{descrizione}</p>
      <Card className="mt-6 text-sm text-muto">Questa pagina arriva nei prossimi passi.</Card>
    </div>
  );
}
