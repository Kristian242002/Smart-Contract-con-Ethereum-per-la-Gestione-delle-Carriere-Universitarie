"use client";

// Studente · Carriera: dati letti dal contratto CarrieraStudente con getStudenteInfo()

import Link from "next/link";
import { mediaPonderata, useCarriera } from "../CarrieraProvider";
import Avatar from "../components/Avatar";
import Avviso from "../components/Avviso";
import Badge from "../components/Badge";
import BarraProgresso from "../components/BarraProgresso";
import Card from "../components/Card";
import ErroreLettura from "../components/ErroreLettura";
import Indirizzo from "../components/Indirizzo";
import Scheletro from "../components/Scheletro";
import { IconCheck, IconLinkEsterno } from "../icons";
import type { Carriera as TipoCarriera } from "../letture";
import { iniziali, linkIndirizzo, mostraVoto } from "../utils";

export default function Carriera() {
  const { carriera, errore, ricarica } = useCarriera();

  if (errore) return <ErroreLettura onRiprova={ricarica} />;

  if (carriera === undefined) {
    return (
      <div>
        <div className="mb-[18px] flex flex-wrap gap-[18px]">
          <Scheletro className="h-[170px] flex-[1_1_300px] rounded-2xl" />
          <Scheletro className="h-[170px] flex-[1_1_300px] rounded-2xl" />
        </div>
        <Scheletro className="h-[260px] rounded-[14px]" />
      </div>
    );
  }

  // Ha il ruolo studente ma nessuna carriera: non dovrebbe succedere (registraStudente crea entrambi)
  if (carriera === null) {
    return <Avviso tipo="attenzione">Nessuna carriera trovata per il tuo indirizzo.</Avviso>;
  }

  const inAttesa = carriera.esami.filter((e) => e.stato === "IN_ATTESA").length;

  return (
    <div>
      {inAttesa > 0 && (
        <Link
          href="/studente/esami"
          className="mb-[18px] flex flex-wrap items-center gap-3 rounded-xl border border-[#F5E1BF] bg-ambra-chiaro px-4 py-3.5"
        >
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-ambra px-[7px] text-xs font-bold text-white">
            {inAttesa}
          </span>
          <span className="flex-[1_1_180px] text-sm font-semibold text-ambra-scuro">
            {inAttesa === 1 ? "Hai 1 esame in attesa della tua decisione" : `Hai ${inAttesa} esami in attesa della tua decisione`}
          </span>
          <span className="text-[13px] font-semibold text-accento">Gestisci →</span>
        </Link>
      )}

      <div className="mb-[18px] flex flex-wrap gap-[18px]">
        <Identita carriera={carriera} />
        {carriera.laureato ? <CardLaureato carriera={carriera} /> : <CardCfu carriera={carriera} />}
      </div>

      <Statistiche carriera={carriera} />
      <TabellaEsami carriera={carriera} />
    </div>
  );
}

// Card scura con nome, indirizzo, tipo di laurea e link al contratto carriera
function Identita({ carriera }: { carriera: TipoCarriera }) {
  return (
    <div className="min-w-0 flex-[1_1_300px] rounded-2xl bg-navy p-[22px] text-white">
      <div className="mb-4 flex items-center gap-[13px]">
        <Avatar indirizzo={carriera.studente} testo={iniziali(carriera.nome, carriera.cognome)} dimensione={52} />
        <div className="min-w-0">
          <div className="font-heading text-[21px] font-bold">
            {carriera.nome} {carriera.cognome}
          </div>
          <Indirizzo indirizzo={carriera.studente} className="text-xs text-[#8FA6CC]" />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-[18px] gap-y-2">
        <span className="text-xs font-semibold tracking-[.02em]">
          {carriera.tipo === "TRIENNALE" ? "Laurea triennale" : "Laurea magistrale"}
        </span>
        <a
          href={linkIndirizzo(carriera.contratto)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7FE6AC]"
        >
          <IconCheck className="h-3 w-3" />
          Carriera on-chain · {carriera.contratto.slice(0, 6)}…{carriera.contratto.slice(-4)}
          <IconLinkEsterno className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function CardCfu({ carriera }: { carriera: TipoCarriera }) {
  return (
    <Card className="min-w-0 flex-[1_1_300px] rounded-2xl">
      <div className="mb-2.5 text-sm text-testo-3">CFU accettati</div>
      <div className="mb-3.5 font-heading text-[38px] leading-none font-bold">
        {carriera.cfu}
        <span className="text-xl text-muto"> / {carriera.soglia}</span>
      </div>
      <div className="mb-2.5">
        <BarraProgresso valore={carriera.cfu} massimo={carriera.soglia} colore="bg-[linear-gradient(90deg,#22A557,#5BE39A)]" alta />
      </div>
      <p className="text-[13px] text-testo-3">
        Mancano <b className="text-navy">{carriera.soglia - carriera.cfu} CFU</b> alla soglia di laurea
      </p>
    </Card>
  );
}

// Stato celebrativo: soglia di CFU raggiunta
function CardLaureato({ carriera }: { carriera: TipoCarriera }) {
  return (
    <div className="flex min-w-0 flex-[1_1_300px] items-center gap-4 rounded-2xl border border-[#C6E9D2] bg-verde-chiaro p-[22px]">
      <div className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full border-2 border-verde bg-white shadow-[0_0_0_6px_rgba(34,165,87,.12)]">
        <IconCheck className="h-8 w-8 text-verde-scuro" />
      </div>
      <div>
        <div className="mb-1 text-xs font-bold tracking-[.05em] text-verde-scuro">LAUREATO · SOGLIA RAGGIUNTA</div>
        <div className="font-heading text-[30px] leading-[1.05] font-bold">
          {carriera.cfu} / {carriera.soglia} CFU
        </div>
        <div className="mt-1.5 text-xs leading-[1.45] text-[#3A6B4C]">
          Stato calcolato dal contratto al raggiungimento della soglia. Nessuna data registrata.
        </div>
      </div>
    </div>
  );
}

function Statistiche({ carriera }: { carriera: TipoCarriera }) {
  const conta = (stato: string) => carriera.esami.filter((e) => e.stato === stato).length;

  const valori = [
    { etichetta: "Media ponderata", valore: mediaPonderata(carriera) ?? "—", colore: "" },
    { etichetta: "Accettati", valore: conta("ACCETTATO"), colore: "text-verde-scuro" },
    { etichetta: "In attesa", valore: conta("IN_ATTESA"), colore: "text-ambra" },
    { etichetta: "Rifiutati", valore: conta("RIFIUTATO"), colore: "text-grigio" },
    { etichetta: "Insufficienti", valore: conta("INSUFFICIENTE"), colore: "text-rosso" },
  ];

  return (
    <div className="mb-[18px] grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
      {valori.map((v) => (
        <div key={v.etichetta} className="rounded-xl border border-bordo bg-white p-4 max-sm:first:col-span-2">
          <div className="mb-2 text-xs text-testo-3">{v.etichetta}</div>
          <div className={"font-heading text-2xl font-bold " + v.colore}>{v.valore}</div>
        </div>
      ))}
    </div>
  );
}

function TabellaEsami({ carriera }: { carriera: TipoCarriera }) {
  const colonne = "grid grid-cols-[minmax(0,1fr)_44px_48px_108px] gap-2.5";

  return (
    <Card className="px-5! pt-1.5! pb-3.5!">
      <div className={colonne + " pt-3.5 pb-2.5 text-[11px] font-semibold tracking-[.05em] text-muto"}>
        <span>CORSO</span>
        <span className="text-right">CFU</span>
        <span className="text-right">VOTO</span>
        <span className="text-right">STATO</span>
      </div>

      {carriera.esami.length === 0 && (
        <div className="border-t border-riga pt-[34px] pb-5 text-center">
          <div className="font-heading text-base font-semibold">Nessun esame registrato</div>
          <div className="mt-1 text-[13px] text-testo-3">I voti appariranno qui quando un professore li registrerà.</div>
        </div>
      )}

      {/* Dal più recente al più vecchio */}
      {[...carriera.esami].reverse().map((e) => (
        <div key={e.id} className={colonne + " items-center border-t border-riga py-3"}>
          <span className="text-sm font-medium">{e.nome}</span>
          <span className="text-right text-[13px] text-testo-3">{e.cfu}</span>
          <span className="text-right font-heading text-[15px] font-bold">{mostraVoto(e.voto)}</span>
          <span className="text-right">
            <Badge stato={e.stato} />
          </span>
        </div>
      ))}

      <div className="flex flex-wrap gap-x-[18px] gap-y-1.5 border-t border-riga pt-3 text-xs leading-normal text-testo-3">
        <span>
          <b className="text-grigio">RIFIUTATO</b> definitivo, non ripetibile nello stesso corso
        </span>
        <span>
          <b className="text-rosso">INSUFFICIENTE</b> voto &lt; 18, registrato automaticamente
        </span>
        <span>30L = 30 e lode (conta 30 nella media)</span>
      </div>
    </Card>
  );
}
