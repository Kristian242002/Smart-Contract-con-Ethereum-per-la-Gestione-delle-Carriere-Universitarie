import Link from "next/link";
import { CONTRACT_ADDRESS } from "./client";
import BottoneCopia from "./components/BottoneCopia";
import Logo from "./components/Logo";
import { IconBookOpen, IconGraduationCap, IconLandmark, IconLinkEsterno } from "./icons";
import { linkIndirizzo } from "./utils";

const datiTesi = [
  ["CANDIDATO", "Xhani Kristian VR500653"],
  ["RELATORE", "Migliorini Sara"],
  ["UNIVERSITÀ", "Università di Verona"],
  ["ANNO ACCADEMICO", "2025 / 2026"],
];

const anteprimaEsami = [
  { nome: "Analisi Matematica I", cfu: 6, voto: "28", stato: "ACCETTATO", colore: "text-[#7FE6AC]" },
  { nome: "Programmazione I", cfu: 12, voto: "30L", stato: "IN ATTESA", colore: "text-[#F2C46B]" },
  { nome: "Fisica", cfu: 6, voto: "17", stato: "INSUFFICIENTE", colore: "text-[#F29B8F]" },
];

// Il ciclo di vita di un esame, con la funzione del contratto usata in ogni passo
const passi = [
  { ruolo: "SEGRETERIA", titolo: "Registra lo studente", testo: "Viene effettuato il deploy del suo contratto CarrieraStudente.", funzione: "registraStudente()" },
  { ruolo: "SEGRETERIA", titolo: "Crea il corso e iscrive", testo: "Un contratto Corso con CFU, posti e professore; poi le iscrizioni finché c'è posto.", funzione: "creaCorso() · iscriviStudenteACorso()" },
  { ruolo: "SEGRETERIA", titolo: "Chiude le iscrizioni", testo: "Operazione irreversibile: da qui il corso accetta i voti.", funzione: "chiudiIscrizioniCorso()" },
  { ruolo: "PROFESSORE", titolo: "Registra i voti", testo: "Un solo voto per studente, 0–30, lode solo con 30. Può farlo anche la segreteria.", funzione: "registraVoto()" },
  { ruolo: "STUDENTE", titolo: "Accetta o rifiuta", testo: "I CFU accettati si sommano: alla soglia (180 o 120) la carriera risulta Laureato.", funzione: "accettaEsame() · rifiutaEsame()" },
];

const ruoli = [
  { Icona: IconLandmark, nome: "Segreteria", testo: "Un solo indirizzo (chi ha fatto il deploy). Abilita professori, registra studenti, crea corsi e gestisce le iscrizioni." },
  { Icona: IconGraduationCap, nome: "Professore", testo: "Identificato solo dall'indirizzo. Registra i voti dei corsi a lui assegnati dopo la chiusura delle iscrizioni." },
  { Icona: IconBookOpen, nome: "Studente", testo: "Possiede un contratto carriera. Accetta o rifiuta i voti, aggiorna nome e cognome, condivide il QR di verifica." },
];

const stack = [
  ["Smart contract", "Solidity · OpenZeppelin AccessControl"],
  ["Rete", "Ethereum Sepolia (testnet)"],
  ["Frontend", "Next.js · viem"],
  ["Wallet", "MetaMask"],
];

export default function Frontespizio() {
  return (
    <div className="animate-comparsa">
      {/* Barra in alto */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-bordo bg-white/85 px-5 py-4 backdrop-blur-md md:px-10">
        <Logo sottotitolo="Prototipo di tesi" />
        <div className="flex items-center gap-3">
          <Link
            href="/verifica"
            className="hidden rounded-[9px] border border-bordo-forte px-[18px] py-2.5 text-sm font-semibold text-testo-2 sm:block"
          >
            Verifica un titolo
          </Link>
          <Link
            href="/connetti"
            className="rounded-[9px] bg-accento px-[18px] py-2.5 text-sm font-semibold whitespace-nowrap text-white"
          >
            Login →
          </Link>
        </div>
      </header>

      {/* Frontespizio */}
      <section className="mx-auto max-w-[840px] px-5 pt-[76px] pb-12 text-center md:px-10">
        <p className="mb-[26px] font-mono text-xs text-accento">
          Tesi di Laurea · Corso di Laurea in Informatica
        </p>
        <h1 className="mb-[18px] font-heading text-[34px] leading-[1.12] font-bold tracking-[-.02em] text-balance md:text-[44px]">
          La carriera universitaria, registrata on-chain
        </h1>
        <p className="mx-auto mb-[34px] max-w-[600px] text-[17px] leading-[1.65] text-pretty text-testo-3">
          Progettazione e prototipazione di un sistema per la gestione delle carriere accademiche
          tramite smart contract Ethereum.
        </p>
        <div className="inline-grid grid-cols-2 gap-x-10 gap-y-2.5 rounded-[14px] border border-bordo bg-white px-[30px] py-[22px] text-left">
          {datiTesi.map(([etichetta, valore]) => (
            <div key={etichetta}>
              <div className="mb-[3px] text-[11px] font-semibold tracking-[.04em] text-muto">{etichetta}</div>
              <div className="text-sm font-semibold">{valore}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Anteprima dell'interfaccia studente */}
      <section className="mx-auto max-w-[900px] px-5 pb-16 md:px-10">
        <div className="rounded-[18px] bg-navy p-6 text-white shadow-[0_24px_60px_rgba(10,30,61,.24)]">
          <div className="mb-[18px] flex items-center gap-[13px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2D6BE4,#5B8DEF)] font-heading text-lg font-bold">
              MR
            </div>
            <div className="flex-1">
              <div className="font-heading text-[17px] font-semibold">Maria Rossi</div>
              <div className="font-mono text-xs text-[#8FA6CC]">0x4D8e…c93A · Laurea triennale</div>
            </div>
            <div className="hidden text-[11px] font-semibold text-[#8FA6CC] sm:block">
              Anteprima interfaccia studente
            </div>
          </div>
          <div className="mb-2 flex justify-between text-[13px] text-[#8FA6CC]">
            <span>CFU accettati / soglia</span>
            <span className="font-mono text-white">36 / 180 CFU</span>
          </div>
          <div className="mb-[22px] h-[9px] overflow-hidden rounded-full bg-white/12">
            <div className="h-full w-[20%] rounded-full bg-[linear-gradient(90deg,#22A557,#5BE39A)]" />
          </div>
          <div className="flex flex-col gap-2.5">
            {anteprimaEsami.map((e) => (
              <div key={e.nome} className="flex items-center justify-between rounded-[11px] bg-white/6 px-[13px] py-[11px]">
                <div>
                  <div className="text-sm font-semibold">{e.nome}</div>
                  <div className="text-[11px] text-[#8FA6CC]">{e.cfu} CFU</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading text-base font-bold">{e.voto}</span>
                  <span className={"w-[92px] text-right text-[11px] font-semibold " + e.colore}>{e.stato}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-10">
        <p className="mb-1.5 text-center text-[11px] font-semibold tracking-[.06em] text-muto">COME FUNZIONA</p>
        <h2 className="mb-[26px] text-center font-heading text-[26px] font-bold">
          Il ciclo di vita di un esame, on-chain
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          {passi.map((p, i) => (
            <div key={p.titolo} className="flex flex-col gap-[9px] rounded-[14px] border border-bordo bg-white p-5">
              <div className="flex justify-between">
                <span className="font-mono text-xs font-semibold text-accento">0{i + 1}</span>
                <span className="text-[11px] font-semibold tracking-[.04em] text-muto">{p.ruolo}</span>
              </div>
              <div className="font-heading text-base font-semibold">{p.titolo}</div>
              <div className="text-[13px] leading-normal text-testo-3">{p.testo}</div>
              <div className="mt-auto font-mono text-[11px] text-testo-2">{p.funzione}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tre ruoli */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-10">
        <p className="mb-3.5 text-center text-[11px] font-semibold tracking-[.06em] text-muto">
          ARCHITETTURA DEL SISTEMA · TRE RUOLI ON-CHAIN
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
          {ruoli.map(({ Icona, nome, testo }) => (
            <div key={nome} className="rounded-[14px] border border-bordo bg-white p-6">
              <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-accento-chiaro">
                <Icona className="h-5 w-5 text-accento" />
              </div>
              <div className="mb-[5px] font-heading text-lg font-semibold">{nome}</div>
              <div className="text-sm leading-normal text-testo-3">{testo}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stack tecnico e contratto */}
      <section className="mx-auto flex max-w-[1180px] flex-wrap gap-[18px] px-5 pb-20 md:px-10">
        <div className="flex-[1_1_440px] rounded-[14px] border border-bordo bg-white p-6">
          <p className="mb-2 text-[11px] font-semibold tracking-[.06em] text-muto">STACK TECNICO</p>
          {stack.map(([etichetta, valore], i) => (
            <div
              key={etichetta}
              className={"flex justify-between gap-4 py-3 " + (i < stack.length - 1 ? "border-b border-riga" : "")}
            >
              <span className="text-[13px] text-muto">{etichetta}</span>
              <span className="text-right text-sm font-semibold">{valore}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-[1_1_380px] flex-col gap-3.5 rounded-[14px] bg-navy p-6 text-white">
          <p className="text-[11px] font-semibold tracking-[.06em] text-[#8FA6CC]">CONTRATTO UNIVERSITA · SEPOLIA</p>
          <p className="font-mono text-sm leading-[1.55] break-all">{CONTRACT_ADDRESS}</p>
          <div className="mt-auto flex flex-wrap gap-2.5">
            <BottoneCopia
              testo={CONTRACT_ADDRESS}
              className="rounded-[9px] border border-white/20 px-3.5 py-[9px] text-[13px]"
            />
            <a
              href={linkIndirizzo(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[7px] rounded-[9px] bg-accento px-3.5 py-[9px] text-[13px] font-semibold"
            >
              Vedi su Etherscan <IconLinkEsterno className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
