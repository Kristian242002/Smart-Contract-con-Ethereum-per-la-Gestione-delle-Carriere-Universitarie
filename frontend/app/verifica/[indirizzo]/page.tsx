"use client";

// Verifica pubblica di una carriera: /verifica/<indirizzo studente>
// È la pagina aperta dal QR. Legge getQRCode() dal contratto Universita, senza wallet.

import { useParams } from "next/navigation";
import { useState } from "react";
import { CONTRACT_ADDRESS } from "../../client";
import Avatar from "../../components/Avatar";
import Avviso from "../../components/Avviso";
import BarraProgresso from "../../components/BarraProgresso";
import Bottone from "../../components/Bottone";
import Card from "../../components/Card";
import FormVerifica from "../../components/FormVerifica";
import Indirizzo from "../../components/Indirizzo";
import Scheletro from "../../components/Scheletro";
import { IconAttenzione, IconCheck, IconX } from "../../icons";
import { leggiVerifica, type Carriera } from "../../letture";
import { useDati } from "../../useDati";
import { indirizzoValido, iniziali, mostraVoto } from "../../utils";

// Quanti esami mostrare prima di "Mostra tutti"
const PRIMI = 6;

export default function VerificaCarriera() {
  const { indirizzo } = useParams<{ indirizzo: string }>();
  const valido = indirizzoValido(indirizzo);

  const { dati, caricamento, errore, ricarica } = useDati(
    () => (valido ? leggiVerifica(indirizzo) : Promise.resolve(null)),
    [indirizzo]
  );

  return (
    <div>
      <h1 className="mb-1 font-heading text-[26px] font-bold">Verifica una carriera</h1>
      <p className="mb-[18px] text-sm leading-normal text-testo-3">
        I dati vengono letti direttamente dalla blockchain, senza intermediari.
      </p>
      <FormVerifica key={indirizzo} iniziale={indirizzo} />

      {!valido && <Avviso tipo="errore">L&apos;indirizzo nel link non è valido.</Avviso>}

      {valido && caricamento && (
        <div className="flex flex-col gap-3.5">
          <Scheletro className="h-[150px] rounded-2xl" />
          <Scheletro className="h-[46px]" />
          <Scheletro className="h-[46px]" />
          <Scheletro className="h-[46px]" />
          <p className="text-center text-xs text-muto">Lettura di getQRCode() su Sepolia…</p>
        </div>
      )}

      {errore && <ReteNonRaggiungibile onRiprova={ricarica} />}
      {valido && dati === null && <NonTrovata indirizzo={indirizzo} />}
      {dati && <Risultato carriera={dati.carriera} blocco={dati.blocco} />}
    </div>
  );
}

function Risultato({ carriera, blocco }: { carriera: Carriera; blocco: bigint }) {
  const [tutti, setTutti] = useState(false);

  // Alla verifica interessano solo gli esami accettati (quelli che contano per la laurea)
  const accettati = carriera.esami.filter((e) => e.stato === "ACCETTATO");
  const visibili = tutti ? accettati : accettati.slice(0, PRIMI);

  return (
    <>
      {/* Intestazione scura: chi è, che laurea, a che punto */}
      <div className="mb-4 rounded-2xl bg-navy p-[22px] text-white">
        <div className="mb-[18px] flex flex-wrap items-center gap-3.5">
          <Avatar indirizzo={carriera.studente} testo={iniziali(carriera.nome, carriera.cognome)} dimensione={50} />
          <div className="min-w-0 flex-[1_1_180px]">
            <div className="font-heading text-xl font-bold">
              {carriera.nome} {carriera.cognome}
            </div>
            <div className="text-xs text-[#8FA6CC]">
              <Indirizzo indirizzo={carriera.studente} /> ·{" "}
              {carriera.tipo === "TRIENNALE" ? "Laurea triennale" : "Laurea magistrale"}
            </div>
          </div>
          {carriera.laureato ? (
            <div className="flex items-center gap-2 text-[13px] font-bold tracking-[.03em] text-[#7FE6AC]">
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-[#5BE39A]">
                <IconCheck className="h-3 w-3" />
              </span>
              LAUREATO
            </div>
          ) : (
            <div className="text-[13px] font-bold tracking-[.03em] text-[#F2C46B]">
              IN CORSO · {carriera.cfu}/{carriera.soglia} CFU
            </div>
          )}
        </div>
        <div className="mb-2 flex justify-between text-[13px] text-[#8FA6CC]">
          <span>CFU accettati / soglia</span>
          <span className="font-mono text-white">
            {carriera.cfu} / {carriera.soglia}
          </span>
        </div>
        <BarraProgresso
          valore={carriera.cfu}
          massimo={carriera.soglia}
          colore="bg-[linear-gradient(90deg,#22A557,#5BE39A)]"
          alta
          suScuro
        />
      </div>

      {/* Esami accettati */}
      <Card className="mb-4 px-5! pt-1.5! pb-2.5!">
        <div className="flex items-center justify-between pt-3.5 pb-2.5">
          <h2 className="font-heading text-base font-semibold">Esami accettati · {accettati.length}</h2>
          <span className="text-xs text-muto">Voto · CFU</span>
        </div>

        {accettati.length === 0 && (
          <p className="border-t border-riga py-5 text-center text-sm text-testo-3">Nessun esame accettato.</p>
        )}

        {visibili.map((e) => (
          <div key={e.id} className="flex items-center gap-3 border-t border-riga py-3">
            <span className="min-w-0 flex-1 text-sm font-medium">{e.nome}</span>
            <span className="w-10 text-right font-heading text-base font-bold">{mostraVoto(e.voto)}</span>
            <span className="w-[52px] text-right text-xs text-muto">{e.cfu} CFU</span>
          </div>
        ))}

        {accettati.length > PRIMI && (
          <button
            type="button"
            onClick={() => setTutti(!tutti)}
            className="w-full border-t border-riga pt-3 pb-1 text-center text-[13px] font-semibold text-accento"
          >
            {tutti ? "Mostra meno" : `Mostra tutti (${accettati.length})`}
          </button>
        )}
      </Card>

      {/* Da dove vengono i dati: chiunque può ricontrollarli su Etherscan */}
      <Card className="px-5! py-[18px]!">
        <p className="mb-2.5 text-[11px] font-semibold tracking-[.06em] text-muto">PROVENIENZA DEI DATI</p>
        <RigaProvenienza etichetta="Contratto Universita">
          <Indirizzo indirizzo={CONTRACT_ADDRESS} etherscan />
        </RigaProvenienza>
        <RigaProvenienza etichetta="Contratto carriera">
          <Indirizzo indirizzo={carriera.contratto} etherscan />
        </RigaProvenienza>
        <RigaProvenienza etichetta="Rete">
          <span className="font-semibold">Ethereum Sepolia</span>
        </RigaProvenienza>
        <RigaProvenienza etichetta="Blocco letto">
          <span className="font-mono">#{blocco.toLocaleString("it-IT")}</span>
        </RigaProvenienza>
        <p className="mt-2 text-xs leading-normal text-muto">
          Sono mostrati solo gli esami accettati. Il contratto non registra date né la data di laurea.
        </p>
      </Card>
    </>
  );
}

function RigaProvenienza({ etichetta, children }: { etichetta: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2.5 py-2 text-[13px]">
      <span className="text-testo-3">{etichetta}</span>
      {children}
    </div>
  );
}

function NonTrovata({ indirizzo }: { indirizzo: string }) {
  return (
    <Card className="rounded-2xl px-6! py-9! text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rosso-chiaro">
        <IconX className="h-6 w-6 text-rosso" />
      </div>
      <h2 className="mb-2 font-heading text-[19px] font-bold">Nessuna carriera trovata</h2>
      <p className="mb-2.5 font-mono text-xs break-all text-testo-3">{indirizzo}</p>
      <p className="mx-auto max-w-[420px] text-sm leading-normal text-testo-3">
        Questo indirizzo non ha un contratto carriera registrato nel contratto Universita. Controlla di averlo copiato
        correttamente.
      </p>
    </Card>
  );
}

function ReteNonRaggiungibile({ onRiprova }: { onRiprova: () => void }) {
  return (
    <Card className="rounded-2xl px-6! py-9! text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ambra-chiaro">
        <IconAttenzione className="h-6 w-6 text-ambra" />
      </div>
      <h2 className="mb-2 font-heading text-[19px] font-bold">Rete non raggiungibile</h2>
      <p className="mx-auto mb-[18px] max-w-[420px] text-sm leading-normal text-testo-3">
        Il nodo RPC di Sepolia non ha risposto. Non è un problema della carriera: i dati non sono stati letti.
      </p>
      <Bottone onClick={onRiprova}>Riprova</Bottone>
    </Card>
  );
}
