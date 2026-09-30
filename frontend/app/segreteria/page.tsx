"use client";

// Segreteria · Panoramica: numeri letti dal contratto Universita e dai contratti Corso,
// più una lista "Da fare" calcolata dallo stato dei corsi.

import Link from "next/link";
import { CONTRACT_ADDRESS } from "../client";
import BarraProgresso from "../components/BarraProgresso";
import Card from "../components/Card";
import CercaCarriera from "../components/CercaCarriera";
import ErroreLettura from "../components/ErroreLettura";
import Indirizzo from "../components/Indirizzo";
import Scheletro from "../components/Scheletro";
import { IconCheck } from "../icons";
import { leggiCorsi, leggiProfessori, statoCorso, type Corso } from "../letture";
import { useDati } from "../useDati";

export default function Panoramica() {
  const { dati, caricamento, errore, ricarica } = useDati(
    () => Promise.all([leggiProfessori(), leggiCorsi()]),
    []
  );
  const professori = dati?.[0] ?? [];
  const corsi = dati?.[1] ?? [];

  const aperti = corsi.filter((c) => c.stato === "APERTO").length;
  const postiOccupati = corsi.reduce((tot, c) => tot + c.iscritti.length, 0);
  const postiTotali = corsi.reduce((tot, c) => tot + c.max, 0);
  const votiRegistrati = corsi.reduce((tot, c) => tot + c.voti, 0);
  const iscrizioniChiuse = corsi.filter((c) => c.stato === "CHIUSO").reduce((tot, c) => tot + c.iscritti.length, 0);

  const daFare = calcolaDaFare(corsi);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-heading text-[28px] font-bold">Panoramica</h1>
          <p className="mt-[3px] text-sm text-testo-3">
            Dati letti dal contratto Universita e dai singoli contratti Corso.
          </p>
        </div>
        <div className="flex items-center gap-2.5 rounded-[9px] border border-bordo-medio bg-white px-[13px] py-2 text-xs text-testo-3">
          Contratto Universita
          <Indirizzo indirizzo={CONTRACT_ADDRESS} etherscan className="text-navy" />
        </div>
      </div>

      {errore && (
        <div className="mb-[18px]">
          <ErroreLettura onRiprova={ricarica} />
        </div>
      )}

      {/* Numeri principali */}
      <div className="mb-[18px] grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px]">
        {caricamento ? (
          <>
            <Scheletro className="h-32" />
            <Scheletro className="h-32" />
            <Scheletro className="h-32" />
            <Scheletro className="h-32" />
          </>
        ) : (
          <>
            <Statistica titolo="Professori abilitati" valore={professori.length}>
              <span className="font-mono text-[11px] text-muto">getListaProfessori()</span>
            </Statistica>
            <Statistica titolo="Corsi totali" valore={corsi.length}>
              <span className="font-semibold text-verde-scuro">{aperti} aperti</span> · {corsi.length - aperti} chiusi
            </Statistica>
            <Statistica titolo="Posti occupati" valore={postiOccupati} su={postiTotali}>
              <div className="mt-1">
                <BarraProgresso valore={postiOccupati} massimo={postiTotali} colore="bg-accento" />
              </div>
            </Statistica>
            <Statistica titolo="Voti registrati" valore={votiRegistrati}>
              su {iscrizioniChiuse} iscrizioni in corsi chiusi
            </Statistica>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-[18px]">
        {/* Da fare */}
        <Card className="min-w-0 flex-[1.4_1_460px]">
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="font-heading text-base font-semibold">Da fare</h2>
            <span className="text-xs text-muto">calcolato dallo stato dei corsi</span>
          </div>

          {caricamento && (
            <div className="flex flex-col gap-2.5 pt-2.5">
              <Scheletro className="h-11" />
              <Scheletro className="h-11" />
              <Scheletro className="h-11" />
            </div>
          )}

          {dati && daFare.length === 0 && (
            <div className="pt-7 pb-3 text-center">
              <IconCheck className="mx-auto h-[30px] w-[30px] text-segnaposto" />
              <p className="mt-2 text-sm text-testo-3">Nessuna azione in sospeso</p>
            </div>
          )}

          {daFare.map((d) => (
            <Link
              key={d.corso.indirizzo}
              href={`/segreteria/corsi/${d.corso.indirizzo}`}
              className="flex items-center gap-3 border-t border-riga py-[13px]"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{d.corso.nome}</div>
                <div className="mt-0.5 text-[13px] text-testo-3">{d.testo}</div>
              </div>
              <span className={"text-xs font-semibold tracking-[.03em] " + d.colore}>{d.etichetta}</span>
              <span className="text-[#C2CBDA]">→</span>
            </Link>
          ))}
        </Card>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-[18px]">
          <Card>
            <h2 className="mb-1 font-heading text-base font-semibold">Cerca studente</h2>
            <p className="mb-3 text-[13px] text-testo-3">Il contratto non espone un elenco: cerca per indirizzo.</p>
            <CercaCarriera />
          </Card>

          <Card>
            <h2 className="mb-3.5 font-heading text-base font-semibold">Azioni rapide</h2>
            <div className="flex flex-col gap-2.5">
              <AzioneRapida href="/segreteria/studenti" principale>
                Registra studente
              </AzioneRapida>
              <AzioneRapida href="/segreteria/professori">Aggiungi professore</AzioneRapida>
              <AzioneRapida href="/segreteria/corsi">Crea corso</AzioneRapida>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Cosa c'è da fare su ogni corso, in base al suo stato
function calcolaDaFare(corsi: Corso[]) {
  const lista: { corso: Corso; testo: string; etichetta: string; colore: string }[] = [];

  for (const c of corsi) {
    const stato = statoCorso(c);
    const posti = `${c.iscritti.length}/${c.max}`;

    if (stato === "PIENO") {
      lista.push({ corso: c, testo: `pieno (${posti}) · puoi chiudere le iscrizioni`, etichetta: "PIENO", colore: "text-ambra" });
    } else if (stato === "APERTO") {
      lista.push({ corso: c, testo: `iscrizioni aperte · ${posti} iscritti`, etichetta: "APERTO", colore: "text-verde-scuro" });
    } else if (c.voti < c.iscritti.length) {
      lista.push({
        corso: c,
        testo: `chiuso · ${c.voti}/${c.iscritti.length} voti registrati`,
        etichetta: "CHIUSO",
        colore: "text-grigio",
      });
    }
  }
  return lista;
}

function Statistica({
  titolo,
  valore,
  su,
  children,
}: {
  titolo: string;
  valore: number;
  su?: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3.5 text-sm text-testo-3">{titolo}</div>
      <div className="font-heading text-4xl leading-none font-bold">
        {valore}
        {su !== undefined && <span className="text-xl text-muto"> / {su}</span>}
      </div>
      <div className="mt-2.5 text-[13px] text-testo-3">{children}</div>
    </Card>
  );
}

function AzioneRapida({ href, principale, children }: { href: string; principale?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={
        "flex items-center gap-2.5 rounded-[11px] px-[15px] py-[13px] text-sm font-semibold " +
        (principale ? "bg-accento text-white" : "border border-bordo-medio bg-sfondo")
      }
    >
      <span className="text-base">＋</span>
      {children}
    </Link>
  );
}
