"use client";

// Professore · I miei corsi
// Il contratto non ha "i corsi di un professore": leggiamo tutti i corsi e teniamo
// quelli con professore = indirizzo connesso. Poi li dividiamo in tre gruppi.

import Link from "next/link";
import BarraProgresso from "../components/BarraProgresso";
import Badge from "../components/Badge";
import ErroreLettura from "../components/ErroreLettura";
import Indirizzo from "../components/Indirizzo";
import Scheletro from "../components/Scheletro";
import StatoVuoto from "../components/StatoVuoto";
import { IconBookOpen } from "../icons";
import { leggiCorsi, type Corso } from "../letture";
import { useDati } from "../useDati";
import { useWallet } from "../WalletProvider";

export default function MieiCorsi() {
  const { indirizzo: io } = useWallet();
  const { dati: corsi, caricamento, errore, ricarica } = useDati(() => leggiCorsi(), []);

  const miei = (corsi ?? []).filter((c) => !!io && c.professore.toLowerCase() === io.toLowerCase());

  // Chiuso con voti mancanti -> da valutare; aperto -> in attesa; chiuso e tutti votati -> completato
  const daValutare = miei.filter((c) => c.stato === "CHIUSO" && c.voti < c.iscritti.length);
  const aperti = miei.filter((c) => c.stato === "APERTO");
  const completati = miei.filter((c) => c.stato === "CHIUSO" && c.voti >= c.iscritti.length);

  return (
    <div>
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[28px] font-bold">I miei corsi</h1>
          <p className="mt-[3px] text-sm text-testo-3">
            Corsi del contratto Universita con professore = il tuo indirizzo.
          </p>
        </div>
        {io && (
          <div className="rounded-[9px] border border-bordo-medio bg-white px-3 py-2 text-[13px]">
            <Indirizzo indirizzo={io} />
          </div>
        )}
      </div>

      {caricamento && (
        <div className="flex flex-col gap-2.5">
          <Scheletro className="h-6 w-[180px]" />
          <Scheletro className="h-24" />
          <Scheletro className="h-24" />
        </div>
      )}

      {errore && <ErroreLettura onRiprova={ricarica} />}

      {corsi && miei.length === 0 && (
        <StatoVuoto
          titolo="Nessun corso assegnato"
          testo="Quando la segreteria creerà un corso con il tuo indirizzo, apparirà qui."
          icona={<IconBookOpen className="h-[34px] w-[34px]" />}
        />
      )}

      {corsi && miei.length > 0 && (
        <div className="flex flex-col gap-[26px]">
          <Gruppo titolo="Da valutare" numero={daValutare.length} colore="text-ambra" vuoto="Nessun corso da valutare.">
            {daValutare.map((c) => (
              <CardDaValutare key={c.indirizzo} corso={c} />
            ))}
          </Gruppo>

          <Gruppo
            titolo="Iscrizioni aperte"
            numero={aperti.length}
            colore="text-verde-scuro"
            vuoto="Nessun corso con iscrizioni aperte."
          >
            {aperti.map((c) => (
              <CardCorso key={c.indirizzo} corso={c}>
                <p className="text-[13px] text-testo-3">
                  {c.cfu} CFU · {c.iscritti.length}/{c.max} iscritti
                </p>
                <p className="text-xs text-muto">Sola lettura: in attesa che la segreteria chiuda le iscrizioni.</p>
              </CardCorso>
            ))}
          </Gruppo>

          <Gruppo titolo="Completati" numero={completati.length} colore="text-grigio" vuoto="Nessun corso completato.">
            {completati.map((c) => (
              <CardCorso key={c.indirizzo} corso={c} completato>
                <p className="text-[13px] text-testo-3">{c.cfu} CFU · tutti i voti registrati</p>
              </CardCorso>
            ))}
          </Gruppo>
        </div>
      )}
    </div>
  );
}

// Titolo del gruppo + griglia di card (o frase se il gruppo è vuoto)
function Gruppo({
  titolo,
  numero,
  colore,
  vuoto,
  children,
}: {
  titolo: string;
  numero: number;
  colore: string;
  vuoto: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2.5">
        <h2 className="font-heading text-[17px] font-semibold">{titolo}</h2>
        <span className={"text-[13px] font-semibold " + colore}>{numero}</span>
      </div>
      {numero === 0 ? (
        <p className="text-[13px] text-muto">{vuoto}</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">{children}</div>
      )}
    </section>
  );
}

function link(corso: Corso) {
  return `/professore/corsi/${corso.indirizzo}`;
}

// Card per i corsi chiusi con voti ancora da registrare
function CardDaValutare({ corso }: { corso: Corso }) {
  const mancanti = corso.iscritti.length - corso.voti;
  return (
    <div className="flex flex-col gap-3 rounded-[13px] border border-bordo bg-white p-[18px]">
      <div className="flex justify-between gap-2.5">
        <span className="text-[15px] font-semibold">{corso.nome}</span>
        <Badge stato="CHIUSO" />
      </div>
      <p className="text-[13px] text-testo-3">
        {corso.cfu} CFU · {corso.iscritti.length} iscritti ·{" "}
        <b className="text-ambra">{mancanti === 1 ? "1 voto mancante" : `${mancanti} voti mancanti`}</b>
      </p>
      <BarraProgresso valore={corso.voti} massimo={corso.iscritti.length} />
      <Link href={link(corso)} className="rounded-[10px] bg-accento p-[11px] text-center text-sm font-semibold text-white">
        Registra voti →
      </Link>
    </div>
  );
}

// Card cliccabile per i corsi aperti o completati
function CardCorso({
  corso,
  completato,
  children,
}: {
  corso: Corso;
  completato?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={link(corso)}
      className="flex flex-col gap-2.5 rounded-[13px] border border-bordo bg-white p-[18px] hover:border-bordo-forte"
    >
      <div className="flex justify-between gap-2.5">
        <span className="text-[15px] font-semibold">{corso.nome}</span>
        {completato ? (
          <span className="text-xs font-semibold text-verde-scuro">
            ✓ {corso.voti}/{corso.iscritti.length}
          </span>
        ) : (
          <Badge stato={corso.stato} />
        )}
      </div>
      {children}
    </Link>
  );
}
