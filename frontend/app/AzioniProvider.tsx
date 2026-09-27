"use client";

// Contesto per le azioni che l'utente fa sul contratto. Fornisce:
//   esegui(passi, messaggio) -> apre la finestra della transazione (firma -> invio -> conferma)
//   conferma({...})          -> chiede "Sei sicuro?" prima di un'azione irreversibile
//   toast(messaggio)         -> messaggio breve in basso dopo un'azione riuscita
// Si usa così:  const { esegui, conferma, toast } = useAzioni();

import { createContext, useContext, useRef, useState } from "react";
import {
  BaseError,
  ContractFunctionRevertedError,
  formatEther,
  InsufficientFundsError,
  UserRejectedRequestError,
  type Hash,
} from "viem";
import { publicClient } from "./client";
import Bottone from "./components/Bottone";
import { IconAttenzione, IconCheck, IconX } from "./icons";
import { abbrevia, linkTransazione } from "./utils";
import { useWallet } from "./WalletProvider";

// Un passo = una transazione da firmare.
// "invia" chiede la firma e restituisce l'hash (di solito: () => scriviContratto(...))
export type Passo = {
  etichetta: string; // es. "Registra voto 27 · Programmazione"
  invia: () => Promise<Hash>;
};

type Fase =
  | { tipo: "firma" }
  | { tipo: "inviata"; hash: Hash }
  | { tipo: "confermata"; hash: Hash; blocco: bigint }
  | { tipo: "rifiutata" }
  | { tipo: "revert"; messaggio: string }
  | { tipo: "gas"; saldo: string | null }
  | { tipo: "errore"; messaggio: string };

type Transazione = {
  passi: Passo[];
  indice: number; // passo attuale
  fase: Fase;
};

type Richiesta = {
  titolo: string;
  testo: string;
  avviso?: string; // box arancione, es. "Operazione irreversibile"
  cta: string; // testo del bottone di conferma
  pericolo?: boolean; // bottone rosso
};

type Azioni = {
  esegui: (passi: Passo[], messaggioOk: string) => Promise<boolean>;
  conferma: (richiesta: Richiesta) => Promise<boolean>;
  toast: (messaggio: string) => void;
};

const AzioniContext = createContext<Azioni | null>(null);

const FAUCET = "https://cloud.google.com/application/web3/faucet/ethereum/sepolia";

function pausa(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Messaggi italiani per gli errori "custom" di OpenZeppelin
const erroriNoti: Record<string, string> = {
  AccessControlUnauthorizedAccount: "Il tuo indirizzo non ha il ruolo necessario per questa operazione",
};

export default function AzioniProvider({ children }: { children: React.ReactNode }) {
  const { indirizzo } = useWallet();

  const [tx, setTx] = useState<Transazione | null>(null);
  const [richiesta, setRichiesta] = useState<Richiesta | null>(null);
  const [messaggioToast, setMessaggioToast] = useState<string | null>(null);

  // Funzioni per "rispondere" a chi ha chiamato esegui() / conferma()
  const risolviTx = useRef<((ok: boolean) => void) | null>(null);
  const risolviConferma = useRef<((ok: boolean) => void) | null>(null);
  const messaggioOk = useRef("");
  const timerToast = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ---------- Toast ----------

  function toast(messaggio: string) {
    clearTimeout(timerToast.current);
    setMessaggioToast(messaggio);
    timerToast.current = setTimeout(() => setMessaggioToast(null), 2600);
  }

  // ---------- Conferma ----------

  function conferma(r: Richiesta) {
    setRichiesta(r);
    return new Promise<boolean>((risolvi) => {
      risolviConferma.current = risolvi;
    });
  }

  function rispondiConferma(ok: boolean) {
    setRichiesta(null);
    risolviConferma.current?.(ok);
  }

  // ---------- Transazioni ----------

  function esegui(passi: Passo[], messaggio: string) {
    messaggioOk.current = messaggio;
    return new Promise<boolean>((risolvi) => {
      risolviTx.current = risolvi;
      eseguiDa(passi, 0);
    });
  }

  // Esegue i passi uno dopo l'altro, a partire da "inizio"
  async function eseguiDa(passi: Passo[], inizio: number) {
    for (let i = inizio; i < passi.length; i++) {
      setTx({ passi, indice: i, fase: { tipo: "firma" } });

      try {
        const hash = await passi[i].invia(); // simulazione + firma in MetaMask
        setTx({ passi, indice: i, fase: { tipo: "inviata", hash } });

        const ricevuta = await publicClient.waitForTransactionReceipt({ hash });
        if (ricevuta.status === "reverted") {
          setTx({ passi, indice: i, fase: { tipo: "revert", messaggio: "Transazione annullata dal contratto" } });
          return;
        }

        setTx({ passi, indice: i, fase: { tipo: "confermata", hash, blocco: ricevuta.blockNumber } });

        // Se ci sono altre firme, lasciamo vedere la conferma un attimo
        if (i < passi.length - 1) await pausa(1300);
      } catch (err) {
        setTx({ passi, indice: i, fase: await faseErrore(err) });
        return;
      }
    }

    // Tutti i passi confermati: chi ha chiamato esegui() può ricaricare i dati
    risolviTx.current?.(true);
    risolviTx.current = null;
  }

  // Capisce che tipo di errore è arrivato da viem / MetaMask
  async function faseErrore(err: unknown): Promise<Fase> {
    if (err instanceof BaseError) {
      if (err.walk((e) => e instanceof UserRejectedRequestError)) return { tipo: "rifiutata" };

      if (err.walk((e) => e instanceof InsufficientFundsError)) {
        const saldo = indirizzo
          ? await publicClient.getBalance({ address: indirizzo }).then(formatEther).catch(() => null)
          : null;
        return { tipo: "gas", saldo };
      }

      const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
      if (revert instanceof ContractFunctionRevertedError) {
        const nomeErrore = revert.data?.errorName ?? "";
        const messaggio = erroriNoti[nomeErrore] ?? revert.reason ?? revert.shortMessage;
        return { tipo: "revert", messaggio };
      }

      return { tipo: "errore", messaggio: err.shortMessage };
    }

    // MetaMask a volte restituisce direttamente { code: 4001 } se l'utente rifiuta
    if ((err as { code?: number }).code === 4001) return { tipo: "rifiutata" };

    return { tipo: "errore", messaggio: err instanceof Error ? err.message : "Errore sconosciuto" };
  }

  function chiudiTx() {
    const completata = tx?.fase.tipo === "confermata" && tx.indice === tx.passi.length - 1;
    setTx(null);

    if (completata) {
      toast(messaggioOk.current);
    } else {
      // Chiusa dopo un errore: l'azione non è andata a buon fine
      risolviTx.current?.(false);
      risolviTx.current = null;
    }
  }

  function riprova() {
    if (tx) eseguiDa(tx.passi, tx.indice);
  }

  return (
    <AzioniContext.Provider value={{ esegui, conferma, toast }}>
      {children}
      {richiesta && <FinestraConferma richiesta={richiesta} onRisposta={rispondiConferma} />}
      {tx && <FinestraTransazione tx={tx} onChiudi={chiudiTx} onRiprova={riprova} />}
      {messaggioToast && <Toast messaggio={messaggioToast} />}
    </AzioniContext.Provider>
  );
}

export function useAzioni() {
  const azioni = useContext(AzioniContext);
  if (!azioni) {
    throw new Error("useAzioni va usato dentro <AzioniProvider>");
  }
  return azioni;
}

// ---------- Parti grafiche ----------

// Sfondo scuro sfocato dietro le finestre
function Sfondo({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-60 flex animate-comparsa items-center justify-center bg-navy/50 p-5 backdrop-blur-sm">
      {children}
    </div>
  );
}

function FinestraConferma({
  richiesta,
  onRisposta,
}: {
  richiesta: Richiesta;
  onRisposta: (ok: boolean) => void;
}) {
  return (
    <Sfondo>
      <div className="w-full max-w-[420px] rounded-[18px] bg-white p-[26px] shadow-[0_30px_70px_rgba(10,30,61,.3)]">
        <h2 className="mb-2 font-heading text-[19px] font-bold">{richiesta.titolo}</h2>
        <p className="mb-3.5 text-sm leading-[1.55] text-testo-2">{richiesta.testo}</p>
        {richiesta.avviso && (
          <div className="mb-4 flex gap-2.5 rounded-[11px] bg-ambra-chiaro px-3.5 py-3 text-[13px] leading-normal text-ambra-scuro">
            <IconAttenzione className="mt-px h-4 w-4 shrink-0 text-ambra" />
            <span>{richiesta.avviso}</span>
          </div>
        )}
        <div className="flex gap-2.5">
          <Bottone variante="secondario" onClick={() => onRisposta(false)} className="flex-1">
            Annulla
          </Bottone>
          <Bottone
            variante={richiesta.pericolo ? "pericolo" : "primario"}
            onClick={() => onRisposta(true)}
            className="flex-[1.3]"
          >
            {richiesta.cta}
          </Bottone>
        </div>
      </div>
    </Sfondo>
  );
}

function FinestraTransazione({
  tx,
  onChiudi,
  onRiprova,
}: {
  tx: Transazione;
  onChiudi: () => void;
  onRiprova: () => void;
}) {
  const { fase, passi, indice } = tx;
  const etichetta = passi[indice].etichetta;
  const ultimo = indice === passi.length - 1;

  // Colore delle 3 barre (Firma, Invio, Conferma)
  const avanzamento = { firma: 0, inviata: 1, confermata: 2 } as Record<string, number>;
  const punto = avanzamento[fase.tipo]; // undefined se c'è un errore
  function coloreBarra(i: number) {
    if (punto === undefined) return i === 0 ? "bg-rosso" : "bg-bordo-medio";
    if (fase.tipo === "confermata" || i < punto) return "bg-verde";
    if (i === punto) return "bg-accento";
    return "bg-bordo-medio";
  }

  return (
    <Sfondo>
      <div className="w-full max-w-[440px] overflow-hidden rounded-[18px] bg-white shadow-[0_30px_70px_rgba(10,30,61,.3)]">
        {/* Intestazione */}
        <div className="flex items-center justify-between border-b border-bordo px-[22px] py-4">
          <span className="text-[13px] font-semibold text-testo-2">
            {passi.length > 1 ? `Firma ${indice + 1} di ${passi.length}` : "Transazione"}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-testo-3">
            <span className="h-[7px] w-[7px] rounded-full bg-verde" />
            Sepolia
          </span>
        </div>

        {/* Barre di avanzamento */}
        <div className="flex gap-1.5 px-[22px] pt-4">
          {["Firma", "Invio", "Conferma"].map((nome, i) => (
            <div key={nome} className="flex-1">
              <div className={"h-1 rounded-full " + coloreBarra(i)} />
              <div className="mt-1.5 text-[11px] text-muto">{nome}</div>
            </div>
          ))}
        </div>

        <div className="p-[26px] text-center">
          {fase.tipo === "firma" && (
            <>
              <Rotella colore="border-[#FDEBD6] border-t-metamask" />
              <Titolo>Conferma in MetaMask</Titolo>
              <Testo>In attesa della tua firma nel popup del wallet.</Testo>
              <div className="rounded-[10px] bg-sfondo px-3.5 py-3 text-left">
                <div className="mb-1 text-[11px] font-semibold tracking-[.05em] text-muto">AZIONE</div>
                <div className="text-sm font-semibold">{etichetta}</div>
              </div>
            </>
          )}

          {fase.tipo === "inviata" && (
            <>
              <Rotella colore="border-accento-chiaro border-t-accento" />
              <Titolo>Transazione inviata</Titolo>
              <Testo>In attesa di inclusione in un blocco…</Testo>
              <Dettagli etichetta={etichetta} hash={fase.hash} />
            </>
          )}

          {fase.tipo === "confermata" && (
            <>
              <Cerchio colore="bg-verde-chiaro">
                <IconCheck className="h-[26px] w-[26px] text-verde-scuro" />
              </Cerchio>
              <Titolo>Confermata</Titolo>
              <Testo>{etichetta}</Testo>
              <Dettagli hash={fase.hash} blocco={fase.blocco} />
              {ultimo ? (
                <Bottone onClick={onChiudi} className="mt-4 w-full">
                  Chiudi
                </Bottone>
              ) : (
                <p className="mt-4 animate-pulse text-[13px] font-semibold text-accento">
                  Preparazione della firma successiva…
                </p>
              )}
            </>
          )}

          {fase.tipo === "rifiutata" && (
            <>
              <Cerchio colore="bg-rosso-chiaro">
                <IconX className="h-6 w-6 text-rosso" />
              </Cerchio>
              <Titolo>Firma rifiutata</Titolo>
              <Testo>Hai annullato la firma in MetaMask. Nessun dato è stato scritto on-chain.</Testo>
              <div className="flex gap-2.5">
                <Bottone variante="scuro" onClick={onRiprova} className="flex-1">
                  Riprova
                </Bottone>
                <Bottone variante="secondario" onClick={onChiudi} className="flex-1">
                  Annulla
                </Bottone>
              </div>
            </>
          )}

          {fase.tipo === "revert" && (
            <>
              <Cerchio colore="bg-rosso-chiaro">
                <IconAttenzione className="h-6 w-6 text-rosso" />
              </Cerchio>
              <Titolo>Rifiutata dal contratto</Titolo>
              <Testo>La transazione è stata annullata (revert). Nessun dato modificato.</Testo>
              <div className="mb-[18px] rounded-[10px] bg-rosso-chiaro px-3.5 py-3 text-left">
                <div className="mb-1 text-[11px] font-semibold tracking-[.05em] text-[#A2302A]">
                  MESSAGGIO DEL CONTRATTO
                </div>
                <div className="font-mono text-[13px] break-words text-rosso-scuro">{fase.messaggio}</div>
              </div>
              <Bottone variante="scuro" onClick={onChiudi} className="w-full">
                Chiudi
              </Bottone>
            </>
          )}

          {fase.tipo === "gas" && (
            <>
              <Cerchio colore="bg-ambra-chiaro">
                <IconAttenzione className="h-6 w-6 text-ambra" />
              </Cerchio>
              <Titolo>ETH di test insufficienti</Titolo>
              <Testo>
                Il saldo del wallet non copre il gas della transazione. Ricarica SepoliaETH gratuitamente
                da un faucet.
              </Testo>
              {fase.saldo !== null && (
                <div className="mb-[18px] flex justify-between rounded-[10px] bg-sfondo px-3.5 py-3 text-[13px]">
                  <span className="text-testo-3">Saldo attuale</span>
                  <span className="font-mono">{Number(fase.saldo).toFixed(4)} SepoliaETH</span>
                </div>
              )}
              <div className="flex gap-2.5">
                <a
                  href={FAUCET}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-[11px] bg-accento py-[13px] text-sm font-semibold text-white"
                >
                  Apri faucet ↗
                </a>
                <Bottone variante="secondario" onClick={onChiudi} className="flex-1">
                  Chiudi
                </Bottone>
              </div>
            </>
          )}

          {fase.tipo === "errore" && (
            <>
              <Cerchio colore="bg-rosso-chiaro">
                <IconAttenzione className="h-6 w-6 text-rosso" />
              </Cerchio>
              <Titolo>Qualcosa è andato storto</Titolo>
              <p className="mb-[18px] text-sm break-words text-testo-3">{fase.messaggio}</p>
              <div className="flex gap-2.5">
                <Bottone variante="scuro" onClick={onRiprova} className="flex-1">
                  Riprova
                </Bottone>
                <Bottone variante="secondario" onClick={onChiudi} className="flex-1">
                  Chiudi
                </Bottone>
              </div>
            </>
          )}
        </div>
      </div>
    </Sfondo>
  );
}

// Riquadro grigio con hash (link a Etherscan) e numero del blocco
function Dettagli({ etichetta, hash, blocco }: { etichetta?: string; hash: Hash; blocco?: bigint }) {
  return (
    <div className="flex flex-col gap-2 rounded-[10px] bg-sfondo px-3.5 py-3 text-left">
      {etichetta && <div className="text-[13px] font-semibold">{etichetta}</div>}
      <div className="flex justify-between">
        <span className="text-xs text-muto">Tx hash</span>
        <a href={linkTransazione(hash)} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-accento">
          {abbrevia(hash)} ↗
        </a>
      </div>
      {blocco !== undefined && (
        <div className="flex justify-between">
          <span className="text-xs text-muto">Blocco</span>
          <span className="font-mono text-xs">#{blocco.toLocaleString("it-IT")}</span>
        </div>
      )}
    </div>
  );
}

function Rotella({ colore }: { colore: string }) {
  return <div className={"mx-auto mb-[18px] h-[54px] w-[54px] animate-spin rounded-full border-4 " + colore} />;
}

function Cerchio({ colore, children }: { colore: string; children: React.ReactNode }) {
  return (
    <div className={"mx-auto mb-[18px] flex h-[54px] w-[54px] items-center justify-center rounded-full " + colore}>
      {children}
    </div>
  );
}

function Titolo({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-1.5 font-heading text-[19px] font-bold">{children}</h2>;
}

function Testo({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-sm leading-normal text-testo-3">{children}</p>;
}

function Toast({ messaggio }: { messaggio: string }) {
  return (
    <div className="fixed bottom-[26px] left-1/2 z-70 flex -translate-x-1/2 animate-comparsa items-center gap-2.5 rounded-xl bg-navy px-[18px] py-3 text-sm font-medium text-white shadow-[0_16px_40px_rgba(10,30,61,.3)]">
      <IconCheck className="h-[15px] w-[15px] text-[#5BE39A]" />
      {messaggio}
    </div>
  );
}
