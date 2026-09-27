"use client";

// Pagina di connessione del wallet.
// Il ruolo NON si sceglie: viene letto dal contratto Universita in base all'indirizzo.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Avviso from "../components/Avviso";
import Bottone from "../components/Bottone";
import BottoneCopia from "../components/BottoneCopia";
import Indirizzo from "../components/Indirizzo";
import Logo from "../components/Logo";
import { IconBookOpen, IconCheck, IconGraduationCap, IconLandmark, IconX } from "../icons";
import { useWallet, type Ruoli } from "../WalletProvider";

// I tre ruoli, con la pagina a cui porta ciascuno
const RUOLI = [
  { chiave: "segreteria", nome: "Segreteria", Icona: IconLandmark, pagina: "/segreteria" },
  { chiave: "professore", nome: "Professore", Icona: IconGraduationCap, pagina: "/professore" },
  { chiave: "studente", nome: "Studente", Icona: IconBookOpen, pagina: "/studente" },
] as const;

type ChiaveRuolo = keyof Ruoli;

export default function Connetti() {
  return (
    <div className="flex min-h-screen flex-col animate-comparsa">
      <header className="flex items-center justify-between px-5 py-4 md:px-8">
        <Logo />
        <Link href="/" className="text-[13px] text-testo-3">
          ← Frontespizio
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pt-5 pb-16">
        <div className="w-full max-w-[470px] rounded-[18px] border border-bordo bg-white p-[30px] shadow-[0_24px_60px_rgba(10,30,61,.1)]">
          <h1 className="mb-1.5 font-heading text-2xl font-bold">Accedi con il wallet</h1>
          <p className="mb-[22px] text-sm leading-[1.55] text-testo-3">
            Il ruolo non si sceglie: viene letto dal contratto Universita in base all&apos;indirizzo
            connesso.
          </p>

          <Contenuto />
        </div>
      </main>
    </div>
  );
}

// Sceglie cosa mostrare in base allo stato del wallet
function Contenuto() {
  const w = useWallet();

  if (!w.haMetaMask) return <MetaMaskAssente />;
  if (!w.pronto) return <Caricamento testo="Controllo del wallet…" />;
  if (w.statoConnessione === "in_corso") return <ConnessioneInCorso />;

  if (!w.indirizzo) {
    if (w.statoConnessione === "rifiutata") return <Rifiutata onRiprova={w.connetti} />;
    return <Pronto errore={w.statoConnessione === "errore"} onConnetti={w.connetti} />;
  }

  if (!w.reteGiusta) return <ReteSbagliata idRete={w.idRete} onCambia={w.passaASepolia} />;
  if (w.erroreRuoli) return <ErroreRuoli />;
  if (!w.ruoli) return <Caricamento testo="Lettura dei ruoli dal contratto…" />;

  const ruoli = w.ruoli;
  const posseduti = RUOLI.filter((r) => ruoli[r.chiave]).map((r) => r.chiave);

  if (posseduti.length === 0) return <NessunRuolo indirizzo={w.indirizzo} />;
  if (posseduti.length > 1) return <PiuRuoli indirizzo={w.indirizzo} posseduti={posseduti} />;
  return <RuoloRilevato indirizzo={w.indirizzo} ruolo={posseduti[0]} />;
}

// ---------- I singoli stati ----------

function MetaMaskAssente() {
  return (
    <>
      <Avviso tipo="errore" titolo="MetaMask non rilevato" className="mb-4">
        Per firmare le transazioni serve l&apos;estensione MetaMask nel browser.
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block font-semibold text-rosso"
        >
          Installa MetaMask ↗
        </a>
      </Avviso>
      <Bottone variante="scuro" disabilitato motivo="Installa prima MetaMask" className="w-full">
        <RomboMetaMask piccolo /> Connetti MetaMask
      </Bottone>
    </>
  );
}

function Pronto({ errore, onConnetti }: { errore: boolean; onConnetti: () => void }) {
  return (
    <>
      {errore && (
        <Avviso tipo="errore" className="mb-4">
          Impossibile connettersi al wallet. Riprova.
        </Avviso>
      )}
      <button
        type="button"
        onClick={onConnetti}
        className="mb-3.5 flex w-full items-center gap-[13px] rounded-[13px] border-[1.5px] border-metamask bg-ambra-chiaro px-[18px] py-4 text-left"
      >
        <RomboMetaMask />
        <span className="flex-1">
          <span className="block text-base font-semibold">Connetti MetaMask</span>
          <span className="block text-[13px] text-[#9A6A2E]">Estensione rilevata nel browser</span>
        </span>
        <span className="text-lg text-metamask">→</span>
      </button>
      <p className="text-center text-xs text-muto">Rete richiesta: Sepolia · chainId 11155111</p>
    </>
  );
}

function ConnessioneInCorso() {
  return (
    <div className="pt-2.5 text-center">
      <div className="mx-auto mb-[18px] h-[52px] w-[52px] animate-spin rounded-full border-4 border-[#FDEBD6] border-t-metamask" />
      <p className="mb-1.5 font-heading text-[17px] font-semibold">Connessione in corso…</p>
      <p className="text-sm text-testo-3">Approva la richiesta nel popup di MetaMask.</p>
    </div>
  );
}

function Caricamento({ testo }: { testo: string }) {
  return (
    <div className="py-4 text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-accento-chiaro border-t-accento" />
      <p className="text-sm text-testo-3">{testo}</p>
    </div>
  );
}

function Rifiutata({ onRiprova }: { onRiprova: () => void }) {
  return (
    <div className="pt-1.5 text-center">
      <div className="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-rosso-chiaro">
        <IconX className="h-6 w-6 text-rosso" />
      </div>
      <p className="mb-1.5 font-heading text-[17px] font-semibold">Connessione rifiutata</p>
      <p className="mb-[18px] text-sm text-testo-3">
        Hai rifiutato la richiesta in MetaMask. Nessun dato è stato condiviso.
      </p>
      <Bottone onClick={onRiprova} className="w-full">
        Riprova
      </Bottone>
    </div>
  );
}

function ReteSbagliata({ idRete, onCambia }: { idRete: number | null; onCambia: () => void }) {
  return (
    <>
      <Avviso tipo="errore" titolo="Rete sbagliata" className="mb-4">
        Il wallet è sulla rete con chainId {idRete ?? "sconosciuto"}. I contratti di Cattedra sono
        su Sepolia (chainId 11155111).
      </Avviso>
      <Bottone onClick={onCambia} className="w-full">
        Passa a Sepolia
      </Bottone>
    </>
  );
}

function ErroreRuoli() {
  return (
    <>
      <Avviso tipo="attenzione" titolo="Rete non raggiungibile" className="mb-4">
        Non è stato possibile leggere i ruoli dal contratto: il nodo di Sepolia non ha risposto.
      </Avviso>
      <Bottone variante="scuro" onClick={() => window.location.reload()} className="w-full">
        Riprova
      </Bottone>
    </>
  );
}

// Riga grigia "● Connesso   0x4D8e…c93A"
function Connesso({ indirizzo }: { indirizzo: string }) {
  return (
    <div className="mb-[18px] flex items-center gap-2.5 rounded-[11px] bg-sfondo px-[13px] py-[11px]">
      <span className="h-2 w-2 rounded-full bg-verde" />
      <span className="text-[13px] text-testo-3">Connesso</span>
      <Indirizzo indirizzo={indirizzo} className="ml-auto text-[13px]" />
    </div>
  );
}

function RuoloRilevato({ indirizzo, ruolo }: { indirizzo: string; ruolo: ChiaveRuolo }) {
  const router = useRouter();
  const pagina = RUOLI.find((r) => r.chiave === ruolo)!.pagina;

  return (
    <>
      <Connesso indirizzo={indirizzo} />
      <p className="mb-2.5 text-xs font-semibold tracking-[.04em] text-muto">RUOLO RILEVATO DAL CONTRATTO</p>

      <div className="mb-5 flex flex-col gap-2">
        {RUOLI.map(({ chiave, nome, Icona }) => {
          const attivo = chiave === ruolo;
          return (
            <div
              key={chiave}
              className={
                "flex items-center gap-3 rounded-xl px-[15px] py-[13px] " +
                (attivo ? "border-[1.5px] border-accento bg-accento-tenue" : "border border-bordo opacity-55")
              }
            >
              <Icona className="h-[18px] w-[18px] text-accento" />
              <span className="flex-1 text-[15px] font-semibold">{nome}</span>
              {attivo ? (
                <IconCheck className="h-[18px] w-[18px] text-accento" />
              ) : (
                <span className="text-xs text-muto">non assegnato</span>
              )}
            </div>
          );
        })}
      </div>

      <Bottone onClick={() => router.push(pagina)} className="w-full">
        Vai alla dashboard →
      </Bottone>
    </>
  );
}

function PiuRuoli({ indirizzo, posseduti }: { indirizzo: string; posseduti: ChiaveRuolo[] }) {
  const router = useRouter();
  const [scelto, setScelto] = useState<ChiaveRuolo>(posseduti[0]);
  const opzioni = RUOLI.filter((r) => posseduti.includes(r.chiave));
  const ruoloScelto = RUOLI.find((r) => r.chiave === scelto)!;

  return (
    <>
      <Connesso indirizzo={indirizzo} />
      <p className="mb-3 text-sm leading-normal text-testo-2">
        Questo indirizzo ha <b>più ruoli</b> nel contratto. Scegli con quale entrare:
      </p>

      <div className="mb-[18px] flex flex-col gap-2">
        {opzioni.map(({ chiave, nome }) => {
          const attivo = chiave === scelto;
          return (
            <button
              key={chiave}
              type="button"
              onClick={() => setScelto(chiave)}
              className={
                "flex items-center gap-3 rounded-xl px-[15px] py-[13px] text-left " +
                (attivo ? "border-[1.5px] border-accento bg-accento-tenue" : "border border-bordo bg-white")
              }
            >
              <span
                className={
                  "h-4 w-4 rounded-full border-[1.5px] shadow-[inset_0_0_0_3px_#fff] " +
                  (attivo ? "border-accento bg-accento" : "border-[#C2CBDA] bg-white")
                }
              />
              <span className="flex-1 text-[15px] font-semibold">{nome}</span>
            </button>
          );
        })}
      </div>

      <Bottone onClick={() => router.push(ruoloScelto.pagina)} className="w-full">
        Entra come {ruoloScelto.nome} →
      </Bottone>
    </>
  );
}

function NessunRuolo({ indirizzo }: { indirizzo: string }) {
  return (
    <>
      <Connesso indirizzo={indirizzo} />
      <Avviso tipo="attenzione" titolo="Questo indirizzo non è registrato" className="mb-4">
        Non ha il ruolo di segreteria o professore e non ha una carriera. Chiedi alla segreteria di
        registrarti, comunicando questo indirizzo:
      </Avviso>
      <p className="mb-3 rounded-[10px] border border-bordo-forte bg-campo px-3.5 py-3 font-mono text-[13px] break-all">
        {indirizzo}
      </p>
      <BottoneCopia
        testo={indirizzo}
        etichetta="Copia indirizzo"
        className="w-full rounded-xl bg-navy py-[13px] text-sm text-white"
      />
    </>
  );
}

// Il rombo arancione di MetaMask
function RomboMetaMask({ piccolo = false }: { piccolo?: boolean }) {
  return (
    <span
      className={
        "shrink-0 rotate-45 bg-metamask " + (piccolo ? "h-[15px] w-[15px] rounded-[3px]" : "h-[30px] w-[30px] rounded-lg")
      }
    />
  );
}
