// Blocco grigio pulsante mostrato mentre i dati arrivano dalla blockchain.
// L'altezza si passa con className, ad esempio "h-16".

export default function Scheletro({ className = "" }: { className?: string }) {
  return <div className={"animate-pulse rounded-xl bg-scheletro " + className} />;
}
