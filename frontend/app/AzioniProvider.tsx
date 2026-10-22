"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
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
import { IconAttenzione, IconCheck, IconGiu, IconX } from "./icons";
import { abbrevia, linkTransazione, type Indirizzo } from "./utils";
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
  | { tipo: "revert"; messaggio: string; hash?: Hash }
  | { tipo: "gas"; saldo: string | null }
  | { tipo: "errore"; messaggio: string }
  | { tipo: "interrotta" }; // la pagina è stata ricaricata prima della fine

// Un movimento = un'azione dell'utente (una o più firme), mostrata nel pannello in basso a sinistra
type Movimento = {
  id: number;
  passi: Passo[];
  indice: number; // passo attuale
  fase: Fase;
  messaggioOk: string; // es. "Voto registrato on-chain"
  ora: Date; // quando è partito
  chiave?: string; // identifica l'operazione (es. "chiudi-0x…"): serve a disabilitare il suo bottone
  ripristinato?: boolean; // letto dal browser dopo un refresh: non si può più riprovare
};

type Richiesta = {
  titolo: string;
  testo: string;
  avviso?: string; // box arancione, es. "Operazione irreversibile"
  cta: string; // testo del bottone di conferma
  pericolo?: boolean; // bottone rosso
};

type Azioni = {
  esegui: (passi: Passo[], messaggioOk: string, chiave?: string) => Promise<boolean>;
  inAttesa: (chiave: string) => boolean; // c'è un'operazione con questa chiave non ancora confermata?
  conferma: (richiesta: Richiesta) => Promise<boolean>;
  toast: (messaggio: string) => void;
};

// Testo mostrato passando sopra un bottone disabilitato perché la sua transazione è in corso
export const MOTIVO_IN_ATTESA = "Transazione in attesa di conferma";

const AzioniContext = createContext<Azioni | null>(null);

const FAUCET = "https://cloud.google.com/application/web3/faucet/ethereum/sepolia";

// Quanti movimenti tenere nel pannello
const MAX_MOVIMENTI = 10;

// Messaggi italiani per gli errori "custom" di OpenZeppelin
const erroriNoti: Record<string, string> = {
  AccessControlUnauthorizedAccount: "Il tuo indirizzo non ha il ruolo necessario per questa operazione",
};

// ---------- Salvataggio nel browser ----------
// I movimenti restano dopo un refresh. Ogni indirizzo ha il suo elenco.
// Le funzioni "invia" non si possono salvare: dopo un refresh il Riprova non è disponibile.

type MovimentoSalvato = Omit<Movimento, "passi" | "ora"> & { etichette: string[]; ora: string };

function chiave(indirizzo: Indirizzo) {
  return "cattedra-movimenti-" + indirizzo.toLowerCase();
}

function salva(indirizzo: Indirizzo, lista: Movimento[]) {
  const dati: MovimentoSalvato[] = lista.map(({ passi, ora, ...resto }) => ({
    ...resto,
    etichette: passi.map((p) => p.etichetta),
    ora: ora.toISOString(),
  }));
  try {
    // JSON non conosce i bigint (numero del blocco): li salviamo come testo
    localStorage.setItem(chiave(indirizzo), JSON.stringify(dati, (_, v) => (typeof v === "bigint" ? String(v) : v)));
  } catch {
    // Storage non disponibile (es. finestra privata): pazienza, il pannello funziona lo stesso
  }
}

function carica(indirizzo: Indirizzo): Movimento[] {
  try {
    const testo = localStorage.getItem(chiave(indirizzo));
    if (!testo) return [];

    return (JSON.parse(testo) as MovimentoSalvato[]).map(({ etichette, ora, ...resto }) => {
      let fase = resto.fase;
      if (fase.tipo === "confermata") fase = { ...fase, blocco: BigInt(fase.blocco) };
      // Era in attesa della firma: dopo il refresh non sappiamo se è stata firmata
      if (fase.tipo === "firma") fase = { tipo: "interrotta" };

      return {
        ...resto,
        fase,
        passi: etichette.map((etichetta) => ({
          etichetta,
          invia: () => Promise.reject(new Error("Ripeti l'azione dalla pagina")),
        })),
        ora: new Date(ora),
        ripristinato: true,
      };
    });
  } catch {
    return [];
  }
}

function inCorso(m: Movimento) {
  return m.fase.tipo === "firma" || m.fase.tipo === "inviata";
}

function fallito(m: Movimento) {
  return !inCorso(m) && m.fase.tipo !== "confermata";
}

export default function AzioniProvider({ children }: { children: React.ReactNode }) {
  const { indirizzo } = useWallet();

  // I movimenti (il più recente per primo) insieme all'indirizzo a cui appartengono
  const [movimenti, setMovimenti] = useState<{ per: Indirizzo | null; lista: Movimento[] }>({ per: null, lista: [] });
  const [pannelloAperto, setPannelloAperto] = useState(false);
  const [richiesta, setRichiesta] = useState<Richiesta | null>(null);
  const [messaggioToast, setMessaggioToast] = useState<string | null>(null);

  // Per ogni movimento, la funzione che "risponde" a chi ha chiamato esegui()
  const risolutori = useRef(new Map<number, (ok: boolean) => void>());
  const risolviConferma = useRef<((ok: boolean) => void) | null>(null);
  const timerToast = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // È cambiato l'account (o la pagina è appena stata aperta): carichiamo i suoi movimenti salvati
  if (movimenti.per !== indirizzo) {
    setMovimenti({ per: indirizzo, lista: indirizzo ? carica(indirizzo) : [] });
  }

  // A ogni cambiamento salviamo l'elenco nel browser
  useEffect(() => {
    if (movimenti.per) salva(movimenti.per, movimenti.lista);
  }, [movimenti]);

  // Dopo un refresh: le transazioni che erano "inviate" le ricontrolliamo sulla blockchain
  useEffect(() => {
    for (const m of movimenti.lista) {
      if (!m.ripristinato || m.fase.tipo !== "inviata") continue;
      const hash = m.fase.hash;

      publicClient
        .waitForTransactionReceipt({ hash })
        .then((ricevuta) => {
          if (ricevuta.status === "reverted") {
            aggiorna(m.id, m.indice, { tipo: "revert", messaggio: "Transazione annullata dal contratto", hash });
          } else if (m.indice < m.passi.length - 1) {
            // Confermata, ma le firme successive non sono mai partite
            aggiorna(m.id, m.indice, { tipo: "interrotta" });
          } else {
            aggiorna(m.id, m.indice, { tipo: "confermata", hash, blocco: ricevuta.blockNumber });
          }
        })
        .catch(() => {});
    }
    // Solo quando si caricano i movimenti di un indirizzo, non a ogni aggiornamento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movimenti.per]);

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

  // ---------- Movimenti ----------

  // Cambia la fase (e il passo) di un movimento
  function aggiorna(id: number, indice: number, fase: Fase) {
    setMovimenti((s) => ({ ...s, lista: s.lista.map((m) => (m.id === id ? { ...m, indice, fase } : m)) }));
  }

  // Avvia un movimento: NON blocca la pagina, l'avanzamento si vede nel pannello.
  // La promessa si risolve con true quando tutte le firme sono confermate
  // (anche dopo un "Riprova"), con false se l'utente rimuove il movimento fallito.
  // "chiave" (facoltativa) permette alla pagina di sapere, con inAttesa(), se l'operazione è ancora in corso.
  function esegui(passi: Passo[], messaggioOk: string, chiave?: string) {
    // Id unico anche rispetto ai movimenti salvati prima di un refresh
    const id = Date.now() + Math.random();
    const nuovo: Movimento = { id, passi, indice: 0, fase: { tipo: "firma" }, messaggioOk, ora: new Date(), chiave };

    setMovimenti((s) => ({ ...s, lista: [nuovo, ...s.lista].slice(0, MAX_MOVIMENTI) }));
    setPannelloAperto(true);

    return new Promise<boolean>((risolvi) => {
      risolutori.current.set(id, risolvi);
      eseguiDa(id, passi, 0, messaggioOk);
    });
  }

  // Esegue i passi di un movimento uno dopo l'altro, a partire da "inizio"
  async function eseguiDa(id: number, passi: Passo[], inizio: number, messaggioOk: string) {
    for (let i = inizio; i < passi.length; i++) {
      aggiorna(id, i, { tipo: "firma" });
      let hash: Hash | undefined;

      try {
        hash = await passi[i].invia(); // simulazione + firma in MetaMask
        aggiorna(id, i, { tipo: "inviata", hash });

        const ricevuta = await publicClient.waitForTransactionReceipt({ hash });
        if (ricevuta.status === "reverted") {
          aggiorna(id, i, { tipo: "revert", messaggio: "Transazione annullata dal contratto", hash });
          setPannelloAperto(true);
          return;
        }

        aggiorna(id, i, { tipo: "confermata", hash, blocco: ricevuta.blockNumber });
      } catch (err) {
        aggiorna(id, i, await faseErrore(err));
        setPannelloAperto(true); // l'errore deve vedersi anche se il pannello era chiuso
        return;
      }
    }

    // Tutti i passi confermati: chi ha chiamato esegui() può ricaricare i dati
    toast(messaggioOk);
    risolutori.current.get(id)?.(true);
    risolutori.current.delete(id);
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

  // L'operazione con questa chiave sta ancora aspettando la firma o la conferma?
  // (dopo un esito negativo torna false: il bottone si riattiva)
  function inAttesa(chiave: string) {
    return movimenti.lista.some((m) => m.chiave === chiave && inCorso(m));
  }

  // Riparte dal passo che è fallito
  function riprova(m: Movimento) {
    eseguiDa(m.id, m.passi, m.indice, m.messaggioOk);
  }

  // Toglie un movimento dal pannello. Se era fallito, l'azione non è andata a buon fine.
  function rimuovi(id: number) {
    setMovimenti((s) => ({ ...s, lista: s.lista.filter((m) => m.id !== id) }));
    risolutori.current.get(id)?.(false);
    risolutori.current.delete(id);
  }

  return (
    <AzioniContext.Provider value={{ esegui, inAttesa, conferma, toast }}>
      {children}
      {richiesta && <FinestraConferma richiesta={richiesta} onRisposta={rispondiConferma} />}
      {movimenti.lista.length > 0 && (
        <PannelloMovimenti
          movimenti={movimenti.lista}
          aperto={pannelloAperto}
          onApri={setPannelloAperto}
          onRiprova={riprova}
          onRimuovi={rimuovi}
        />
      )}
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

// ---------- Finestra di conferma ----------

function FinestraConferma({
  richiesta,
  onRisposta,
}: {
  richiesta: Richiesta;
  onRisposta: (ok: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex animate-comparsa items-center justify-center bg-navy/50 p-5 backdrop-blur-sm">
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
    </div>
  );
}

// ---------- Pannello dei movimenti (in basso a sinistra) ----------

type PropsPannello = {
  movimenti: Movimento[];
  aperto: boolean;
  onApri: (aperto: boolean) => void;
  onRiprova: (m: Movimento) => void;
  onRimuovi: (id: number) => void;
};

function PannelloMovimenti({ movimenti, aperto, onApri, onRiprova, onRimuovi }: PropsPannello) {
  const attivi = movimenti.filter(inCorso).length;
  const falliti = movimenti.filter(fallito).length;

  // Chiuso: solo una "pillola" con il riepilogo
  if (!aperto) {
    return (
      <button
        type="button"
        onClick={() => onApri(true)}
        className="fixed bottom-4 left-4 z-50 flex animate-comparsa items-center gap-2.5 rounded-full border border-bordo bg-white py-2.5 pr-4 pl-3 text-[13px] font-semibold shadow-[0_12px_32px_rgba(10,30,61,.16)]"
      >
        {attivi > 0 ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-accento-chiaro border-t-accento" />
        ) : (
          <span className={"h-2.5 w-2.5 rounded-full " + (falliti > 0 ? "bg-rosso" : "bg-verde")} />
        )}
        {attivi > 0 ? `${attivi} in corso` : "Ultimi movimenti"}
        {falliti > 0 && (
          <span className="rounded-full bg-rosso-chiaro px-2 py-0.5 text-[11px] text-rosso">{falliti} non riusciti</span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 flex max-h-[70vh] animate-comparsa flex-col overflow-hidden rounded-[16px] border border-bordo bg-white shadow-[0_20px_50px_rgba(10,30,61,.2)] sm:right-auto sm:w-[380px]">
      {/* Intestazione */}
      <div className="flex items-center justify-between border-b border-bordo px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-heading text-[15px] font-semibold">Ultimi movimenti</span>
          {attivi > 0 && <span className="text-xs font-semibold text-accento">{attivi} in corso</span>}
        </div>
        <button
          type="button"
          onClick={() => onApri(false)}
          aria-label="Riduci"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muto"
        >
          <IconGiu className="h-4 w-4" />
        </button>
      </div>

      {/* Elenco, il più recente in alto */}
      <div className="overflow-y-auto">
        {movimenti.map((m) => (
          <RigaMovimento key={m.id} m={m} onRiprova={() => onRiprova(m)} onRimuovi={() => onRimuovi(m.id)} />
        ))}
      </div>
    </div>
  );
}

function RigaMovimento({ m, onRiprova, onRimuovi }: { m: Movimento; onRiprova: () => void; onRimuovi: () => void }) {
  const { fase, passi, indice } = m;
  const hash = "hash" in fase ? fase.hash : undefined;
  const ora = m.ora.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex gap-3 border-b border-riga px-4 py-3 last:border-b-0">
      <IconaFase fase={fase} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-semibold">{passi[indice].etichetta}</span>
          <span className="shrink-0 text-[11px] text-muto">{ora}</span>
        </div>

        {passi.length > 1 && (
          <div className="text-[11px] text-muto">
            Firma {indice + 1} di {passi.length}
          </div>
        )}

        <DescrizioneFase fase={fase} />

        {hash && (
          <a
            href={linkTransazione(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-mono text-[11px] text-accento"
          >
            {abbrevia(hash)} ↗
          </a>
        )}

        {/* Esito negativo: Riprova / Rimuovi */}
        {fallito(m) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {m.ripristinato ? (
              <span className="text-[11px] text-muto">Pagina ricaricata: per riprovare ripeti l&apos;azione.</span>
            ) : (
              <Bottone piccolo variante="scuro" onClick={onRiprova}>
                Riprova
              </Bottone>
            )}
            <Bottone piccolo variante="secondario" onClick={onRimuovi}>
              Rimuovi
            </Bottone>
          </div>
        )}
      </div>

      {fase.tipo === "confermata" && (
        <button type="button" onClick={onRimuovi} aria-label="Rimuovi" className="self-start text-muto">
          <IconX className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function IconaFase({ fase }: { fase: Fase }) {
  if (fase.tipo === "firma") {
    return <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#FDEBD6] border-t-metamask" />;
  }
  if (fase.tipo === "inviata") {
    return <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-accento-chiaro border-t-accento" />;
  }
  if (fase.tipo === "confermata") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-verde-chiaro">
        <IconCheck className="h-3 w-3 text-verde-scuro" />
      </span>
    );
  }
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rosso-chiaro">
      <IconX className="h-3 w-3 text-rosso" />
    </span>
  );
}

// Una riga che spiega lo stato (e, se è fallito, il motivo)
function DescrizioneFase({ fase }: { fase: Fase }) {
  switch (fase.tipo) {
    case "firma":
      return <p className="text-xs text-[#9A6A2E]">Conferma la firma in MetaMask…</p>;
    case "inviata":
      return <p className="text-xs text-testo-3">Inviata, in attesa di inclusione in un blocco…</p>;
    case "confermata":
      return <p className="text-xs text-verde-scuro">Confermata · blocco #{fase.blocco.toLocaleString("it-IT")}</p>;
    case "rifiutata":
      return <p className="text-xs text-rosso">Firma rifiutata in MetaMask: nessun dato scritto on-chain.</p>;
    case "revert":
      return (
        <p className="text-xs break-words text-rosso">
          Rifiutata dal contratto: <span className="font-mono">{fase.messaggio}</span>
        </p>
      );
    case "gas":
      return (
        <p className="text-xs text-rosso">
          ETH di test insufficienti per il gas
          {fase.saldo !== null && <> (saldo {Number(fase.saldo).toFixed(4)} SepoliaETH)</>}.{" "}
          <a href={FAUCET} target="_blank" rel="noopener noreferrer" className="font-semibold text-accento">
            Apri faucet ↗
          </a>
        </p>
      );
    case "errore":
      return <p className="text-xs break-words text-rosso">Errore: {fase.messaggio}</p>;
    case "interrotta":
      return (
        <p className="text-xs text-rosso">
          Interrotta dal ricaricamento della pagina: controlla su Etherscan se è andata a buon fine.
        </p>
      );
  }
}

function Toast({ messaggio }: { messaggio: string }) {
  return (
    <div className="fixed bottom-[26px] left-1/2 z-70 flex -translate-x-1/2 animate-comparsa items-center gap-2.5 rounded-xl bg-navy px-[18px] py-3 text-sm font-medium text-white shadow-[0_16px_40px_rgba(10,30,61,.3)]">
      <IconCheck className="h-[15px] w-[15px] text-[#5BE39A]" />
      {messaggio}
    </div>
  );
}
