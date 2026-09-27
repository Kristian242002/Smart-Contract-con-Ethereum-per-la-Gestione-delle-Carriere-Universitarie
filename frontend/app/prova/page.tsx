"use client";

// PAGINA TEMPORANEA: serve solo a controllare i componenti base.
// Da cancellare quando le pagine vere sono pronte.

import Avatar from "../components/Avatar";
import Avviso from "../components/Avviso";
import Badge, { type Stato } from "../components/Badge";
import Bottone from "../components/Bottone";
import Card from "../components/Card";
import Indirizzo from "../components/Indirizzo";
import Scheletro from "../components/Scheletro";
import { useEffect, useState } from "react";
import { iniziali, mostraVoto } from "../utils";
import { useWallet } from "../WalletProvider";
import { useAzioni } from "../AzioniProvider";
import { scriviContratto } from "../client";

const MARIA = "0x4D8e2A71c3F0b96E5d14A8c7B2e0F39d61aEc93A";
const PROF = "0x2b9C4e7A10fD83b6C5e29a47D0cE61f8B3a2A17f";

const stati: Stato[] = [
  "APERTO", "CHIUSO", "PIENO", "IN_ATTESA", "ACCETTATO",
  "RIFIUTATO", "INSUFFICIENTE", "LAUREATO", "IN_CORSO",
];

// Esami di esempio (nelle pagine vere arriveranno dal contratto)
const esami: { nome: string; cfu: number; voto: number; stato: Stato }[] = [
  { nome: "Analisi Matematica I", cfu: 12, voto: 28, stato: "ACCETTATO" },
  { nome: "Programmazione", cfu: 9, voto: 31, stato: "IN_ATTESA" },
  { nome: "Fisica", cfu: 6, voto: 17, stato: "INSUFFICIENTE" },
];

export default function Prova() {
  const [caricamento, setCaricamento] = useState(true);

  // Finge una lettura dalla blockchain che dura 2 secondi
  function simulaCaricamento() {
    setCaricamento(true);
    setTimeout(() => setCaricamento(false), 2000);
  }

  // Alla prima apertura della pagina
  useEffect(() => {
    const timer = setTimeout(() => setCaricamento(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5 px-8 py-10">
      <h1 className="font-heading text-[28px] font-bold">Componenti base</h1>

      <StatoWallet />
      <ProvaAzioni />

      <Card>
        <h2 className="mb-4 font-heading text-base font-semibold">Bottoni</h2>
        <div className="flex flex-wrap gap-3">
          <Bottone>Primario</Bottone>
          <Bottone variante="secondario">Secondario</Bottone>
          <Bottone variante="scuro">Scuro</Bottone>
          <Bottone variante="successo">✓ Accetta · +9 CFU</Bottone>
          <Bottone variante="pericolo">Pericolo</Bottone>
          <Bottone variante="pericoloLeggero">Rimuovi</Bottone>
          <Bottone piccolo>Piccolo</Bottone>
          <Bottone disabilitato motivo="Corso pieno">Disabilitato (passa il mouse)</Bottone>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-heading text-base font-semibold">Badge di stato</h2>
        <div className="flex flex-wrap gap-5">
          {stati.map((s) => (
            <Badge key={s} stato={s} />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-heading text-base font-semibold">Avatar e indirizzi</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar indirizzo={MARIA} testo={iniziali("Maria", "Rossi")} />
            <div>
              <div className="text-sm font-semibold">Maria Rossi</div>
              <Indirizzo indirizzo={MARIA} className="text-xs text-muto" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar indirizzo={PROF} />
            <Indirizzo indirizzo={PROF} etherscan className="text-sm font-semibold" />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-heading text-base font-semibold">Avvisi</h2>
        <div className="flex flex-col gap-3">
          <Avviso>Alla conferma viene effettuato il deploy del contratto carriera.</Avviso>
          <Avviso tipo="attenzione">Ogni voto è definitivo: una sola registrazione per studente.</Avviso>
          <Avviso tipo="errore" titolo="Rete sbagliata">
            Il wallet è su Ethereum Mainnet. I contratti sono su Sepolia.
          </Avviso>
          <Avviso tipo="bloccato">Non sei più abilitato come professore.</Avviso>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold">Voti e caricamento</h2>
          <Bottone piccolo variante="secondario" onClick={simulaCaricamento}>
            Ricarica
          </Bottone>
        </div>

        {/* Mentre i dati "arrivano" mostriamo gli scheletri, poi gli esami */}
        {caricamento ? (
          <div className="flex flex-col gap-2">
            <Scheletro className="h-12" />
            <Scheletro className="h-12" />
            <Scheletro className="h-12" />
          </div>
        ) : (
          <div>
            {esami.map((e) => (
              <div key={e.nome} className="flex items-center gap-3 border-t border-riga py-3">
                <span className="flex-1 text-sm font-medium">{e.nome}</span>
                <span className="text-[13px] text-testo-3">{e.cfu} CFU</span>
                <span className="w-10 text-right font-heading text-base font-bold">
                  {mostraVoto(e.voto)}
                </span>
                <span className="w-28 text-right">
                  <Badge stato={e.stato} />
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Mostra cosa contiene il contesto wallet in questo momento
function StatoWallet() {
  const w = useWallet();

  const righe: [string, React.ReactNode][] = [
    ["MetaMask installato", w.haMetaMask ? "sì" : "no"],
    ["Controllo iniziale finito", w.pronto ? "sì" : "no"],
    ["Indirizzo", w.indirizzo ? <Indirizzo indirizzo={w.indirizzo} etherscan /> : "—"],
    ["Rete giusta (Sepolia)", w.reteGiusta ? "sì" : "no"],
    [
      "Ruoli",
      !w.indirizzo
        ? "—"
        : w.erroreRuoli
          ? "errore di lettura"
          : !w.ruoli
            ? "lettura in corso…"
            : Object.entries(w.ruoli)
                .filter(([, attivo]) => attivo)
                .map(([nome]) => nome)
                .join(", ") || "nessuno",
    ],
    ["Stato connessione", w.statoConnessione],
  ];

  return (
    <Card>
      <h2 className="mb-2 font-heading text-base font-semibold">Contesto wallet</h2>
      {righe.map(([etichetta, valore]) => (
        <div key={etichetta} className="flex justify-between gap-4 border-t border-riga py-2.5 text-sm">
          <span className="text-testo-3">{etichetta}</span>
          <span className="font-semibold">{valore}</span>
        </div>
      ))}

      <div className="mt-4 flex flex-wrap gap-3">
        {!w.indirizzo && <Bottone onClick={w.connetti}>Connetti</Bottone>}
        {w.indirizzo && (
          <Bottone variante="pericoloLeggero" onClick={w.disconnetti}>
            Disconnetti
          </Bottone>
        )}
        {!w.reteGiusta && <Bottone variante="scuro" onClick={w.passaASepolia}>Passa a Sepolia</Bottone>}
      </div>
    </Card>
  );
}

// Prova della finestra di conferma, del toast e della finestra transazione
function ProvaAzioni() {
  const { indirizzo } = useWallet();
  const { conferma, toast, esegui } = useAzioni();

  async function provaConferma() {
    const ok = await conferma({
      titolo: "Chiudere le iscrizioni?",
      testo: "Programmazione · 4/6 iscritti.",
      avviso: "Operazione irreversibile. Dopo la chiusura non potrai più iscrivere studenti.",
      cta: "Chiudi iscrizioni",
      pericolo: true,
    });
    toast(ok ? "Hai confermato" : "Hai annullato");
  }

  // aggiungiProfessore(0x000…0) viene rifiutata dal contratto già in simulazione:
  // si vede la finestra "Rifiutata dal contratto" senza firmare né spendere gas
  function provaRevert() {
    if (!indirizzo) return;
    esegui(
      [
        {
          etichetta: "Abilita professore 0x0000…0000",
          invia: () =>
            scriviContratto(indirizzo, "aggiungiProfessore", ["0x0000000000000000000000000000000000000000"]),
        },
      ],
      "Professore abilitato"
    );
  }

  return (
    <Card>
      <h2 className="mb-4 font-heading text-base font-semibold">Azioni (conferma, toast, transazione)</h2>
      <div className="flex flex-wrap gap-3">
        <Bottone variante="secondario" onClick={provaConferma}>
          Finestra di conferma
        </Bottone>
        <Bottone variante="secondario" onClick={() => toast("Voto registrato on-chain")}>
          Toast
        </Bottone>
        <Bottone
          variante="scuro"
          onClick={provaRevert}
          disabilitato={!indirizzo}
          motivo="Connetti prima il wallet"
        >
          Transazione rifiutata dal contratto
        </Bottone>
      </div>
    </Card>
  );
}
