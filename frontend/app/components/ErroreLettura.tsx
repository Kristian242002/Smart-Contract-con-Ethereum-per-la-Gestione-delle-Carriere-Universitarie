import Avviso from "./Avviso";
import Bottone from "./Bottone";

// Mostrato quando la lettura dalla blockchain fallisce (di solito il nodo non risponde)

export default function ErroreLettura({ onRiprova }: { onRiprova: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Avviso tipo="attenzione" titolo="Rete non raggiungibile" className="w-full">
        Il nodo di Sepolia non ha risposto: i dati non sono stati letti.
      </Avviso>
      <Bottone variante="scuro" piccolo onClick={onRiprova}>
        Riprova
      </Bottone>
    </div>
  );
}
