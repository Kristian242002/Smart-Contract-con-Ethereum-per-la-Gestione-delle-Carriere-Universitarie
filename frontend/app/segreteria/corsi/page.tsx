"use client";

// Segreteria · Corsi: elenco dei contratti Corso e creazione di un corso nuovo

import Link from "next/link";
import { useState } from "react";
import { useAzioni } from "../../AzioniProvider";
import { scriviContratto } from "../../client";
import Avatar from "../../components/Avatar";
import Avviso from "../../components/Avviso";
import Badge from "../../components/Badge";
import BarraProgresso from "../../components/BarraProgresso";
import Bottone from "../../components/Bottone";
import Campo from "../../components/Campo";
import Card from "../../components/Card";
import ErroreLettura from "../../components/ErroreLettura";
import Scheletro from "../../components/Scheletro";
import StatoVuoto from "../../components/StatoVuoto";
import { IconBookOpen, IconGiu } from "../../icons";
import { leggiCorsi, leggiProfessori, statoCorso, type Corso } from "../../letture";
import { useDati } from "../../useDati";
import { abbrevia, type Indirizzo } from "../../utils";
import { useWallet } from "../../WalletProvider";

type Filtro = "tutti" | "aperti" | "chiusi";

export default function Corsi() {
  const [filtro, setFiltro] = useState<Filtro>("tutti");

  const { dati, caricamento, errore, ricarica } = useDati(
    () => Promise.all([leggiCorsi(), leggiProfessori()]),
    []
  );
  const corsi = dati?.[0] ?? [];
  const professori = dati?.[1] ?? [];

  const aperti = corsi.filter((c) => c.stato === "APERTO").length;
  const filtri: { chiave: Filtro; etichetta: string; numero: number }[] = [
    { chiave: "tutti", etichetta: "Tutti", numero: corsi.length },
    { chiave: "aperti", etichetta: "Aperti", numero: aperti },
    { chiave: "chiusi", etichetta: "Chiusi", numero: corsi.length - aperti },
  ];

  const visibili = corsi.filter(
    (c) => filtro === "tutti" || (filtro === "aperti" ? c.stato === "APERTO" : c.stato === "CHIUSO")
  );

  return (
    <div className="flex flex-wrap items-start gap-[22px]">
      <div className="min-w-0 flex-[1_1_560px]">
        <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-[26px] font-bold">Corsi</h1>
          <div className="flex gap-1">
            {filtri.map((f) => (
              <button
                key={f.chiave}
                type="button"
                onClick={() => setFiltro(f.chiave)}
                className={
                  "rounded-lg px-3 py-[7px] text-[13px] " +
                  (filtro === f.chiave ? "bg-accento-chiaro font-semibold text-accento" : "font-medium text-testo-3")
                }
              >
                {f.etichetta} · {f.numero}
              </button>
            ))}
          </div>
        </div>

        {caricamento && (
          <div className="flex flex-col gap-2.5">
            <Scheletro className="h-[76px]" />
            <Scheletro className="h-[76px]" />
            <Scheletro className="h-[76px]" />
          </div>
        )}

        {errore && <ErroreLettura onRiprova={ricarica} />}

        {dati && visibili.length === 0 && (
          <StatoVuoto
            titolo="Nessun corso"
            testo={corsi.length === 0 ? "Crea il primo corso con il modulo qui accanto." : "Nessun corso per questo filtro."}
            icona={<IconBookOpen className="h-[34px] w-[34px]" />}
          />
        )}

        <div className="flex flex-col gap-2.5">
          {visibili.map((c) => (
            <RigaCorso key={c.indirizzo} corso={c} />
          ))}
        </div>
      </div>

      <CreaCorso professori={professori} onCreato={ricarica} />
    </div>
  );
}

function RigaCorso({ corso }: { corso: Corso }) {
  const stato = statoCorso(corso);
  const coloreBarra = stato === "PIENO" ? "bg-ambra" : stato === "APERTO" ? "bg-verde" : "bg-segnaposto";

  return (
    <Link
      href={`/segreteria/corsi/${corso.indirizzo}`}
      className="flex flex-wrap items-center gap-4 rounded-xl border border-bordo bg-white px-4 py-[15px] hover:border-bordo-forte"
    >
      <div className="min-w-0 flex-[1_1_200px]">
        <div className="mb-[5px] text-[15px] font-semibold">{corso.nome}</div>
        <div className="flex items-center gap-[7px] font-mono text-xs text-muto" title={corso.professore}>
          <Avatar indirizzo={corso.professore} dimensione={14} />
          {abbrevia(corso.professore)}
        </div>
      </div>
      <div className="min-w-11 text-center">
        <div className="font-heading text-base font-bold">{corso.cfu}</div>
        <div className="text-[11px] text-muto">CFU</div>
      </div>
      <div className="min-w-[110px]">
        <div className="mb-[5px] flex justify-between text-xs">
          <span className="font-heading font-bold">
            {corso.iscritti.length}/{corso.max}
          </span>
          <span className="text-muto">iscritti</span>
        </div>
        <BarraProgresso valore={corso.iscritti.length} massimo={corso.max} colore={coloreBarra} />
      </div>
      <span className="min-w-[62px] text-right">
        <Badge stato={stato} />
      </span>
    </Link>
  );
}

function CreaCorso({ professori, onCreato }: { professori: readonly Indirizzo[]; onCreato: () => void }) {
  const { indirizzo: io } = useWallet();
  const { esegui } = useAzioni();

  const [nome, setNome] = useState("");
  const [cfu, setCfu] = useState(6);
  const [max, setMax] = useState("");
  const [scelto, setScelto] = useState<Indirizzo | null>(null);
  const [tendinaAperta, setTendinaAperta] = useState(false);

  // Se non è stato scelto nessuno (o quello scelto non è più professore) usiamo il primo
  const professore = scelto && professori.includes(scelto) ? scelto : professori[0];
  const nessunProfessore = professori.length === 0;

  const maxNumero = Number(max);
  let motivo = "";
  if (nessunProfessore) motivo = "Aggiungi prima un professore";
  else if (!nome.trim()) motivo = "Inserisci il nome del corso";
  else if (!/^\d+$/.test(max) || maxNumero <= 0) motivo = "Max studenti deve essere maggiore di 0";

  async function crea() {
    if (!io || motivo || !professore) return;
    const n = nome.trim();

    const ok = await esegui(
      [
        {
          etichetta: `Crea corso ${n} · ${cfu} CFU · max ${maxNumero}`,
          invia: () => scriviContratto(io, "creaCorso", [n, BigInt(cfu), BigInt(maxNumero), professore]),
        },
      ],
      "Corso creato"
    );

    if (ok) {
      setNome("");
      setCfu(6);
      setMax("");
      onCreato();
    }
  }

  return (
    <Card className="min-w-[280px] flex-[1_1_360px] lg:flex-[0_1_360px]">
      <h2 className="mb-4 font-heading text-base font-semibold">Crea corso</h2>

      {nessunProfessore && (
        <Avviso tipo="attenzione" className="mb-3.5">
          Aggiungi prima un professore: ogni corso deve essere assegnato a un indirizzo abilitato.{" "}
          <Link href="/segreteria/professori" className="font-semibold text-accento">
            Vai ai professori →
          </Link>
        </Avviso>
      )}

      <div className={"flex flex-col gap-3.5 " + (nessunProfessore ? "opacity-50" : "")}>
        <Campo etichetta="Nome corso" valore={nome} onCambia={setNome} segnaposto="es. Sistemi Operativi" />

        <div className="flex gap-3">
          <div className="flex-1">
            <div className="mb-[7px] text-[13px] font-semibold text-testo-2">CFU (1–20)</div>
            <div className="flex items-center justify-between rounded-[10px] border border-bordo-forte bg-campo px-2 py-1.5">
              <button
                type="button"
                onClick={() => setCfu(Math.max(1, cfu - 1))}
                className={"h-7 w-7 text-lg " + (cfu <= 1 ? "text-[#C2CBDA]" : "text-accento")}
              >
                −
              </button>
              <span className="font-heading text-base font-bold">{cfu}</span>
              <button
                type="button"
                onClick={() => setCfu(Math.min(20, cfu + 1))}
                className={"h-7 w-7 text-lg " + (cfu >= 20 ? "text-[#C2CBDA]" : "text-accento")}
              >
                +
              </button>
            </div>
          </div>
          <Campo
            etichetta="Max studenti"
            valore={max}
            onCambia={(v) => setMax(v.replace(/[^0-9]/g, "").slice(0, 4))}
            segnaposto="> 0"
            className="flex-1"
          />
        </div>

        {/* Menu a tendina con gli indirizzi dei professori */}
        <div className="relative">
          <div className="mb-[7px] text-[13px] font-semibold text-testo-2">Professore assegnato</div>
          <button
            type="button"
            onClick={() => !nessunProfessore && setTendinaAperta(!tendinaAperta)}
            className="flex w-full items-center gap-[9px] rounded-[10px] border border-bordo-forte bg-campo px-[13px] py-2.5"
          >
            {professore ? (
              <>
                <Avatar indirizzo={professore} dimensione={20} />
                <span className="flex-1 text-left font-mono text-[13px]">{abbrevia(professore)}</span>
              </>
            ) : (
              <span className="flex-1 text-left text-[13px] text-segnaposto">Nessun professore</span>
            )}
            <IconGiu className="h-3.5 w-3.5 text-muto" />
          </button>

          {tendinaAperta && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setTendinaAperta(false)} />
              <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-20 rounded-[11px] border border-bordo bg-white p-1.5 shadow-[0_16px_40px_rgba(10,30,61,.14)]">
                {professori.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setScelto(p);
                      setTendinaAperta(false);
                    }}
                    title={p}
                    className={
                      "flex w-full items-center gap-[9px] rounded-lg px-2.5 py-[9px] " +
                      (p === professore ? "bg-accento-tenue" : "")
                    }
                  >
                    <Avatar indirizzo={p} dimensione={20} />
                    <span className="flex-1 text-left font-mono text-[13px]">{abbrevia(p)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <Bottone onClick={crea} disabilitato={!!motivo} motivo={motivo} className="mt-1 w-full">
          Crea corso on-chain
        </Bottone>
        <p className="text-xs leading-normal text-muto">
          Il corso nasce APERTO. Esegue il deploy di un contratto Corso.
        </p>
      </div>
    </Card>
  );
}
