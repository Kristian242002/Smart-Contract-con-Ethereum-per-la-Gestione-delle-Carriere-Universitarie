"use client";

// Studente · Esami da gestire
// Voti >= 18 in stato IN_ATTESA: lo studente li accetta (i CFU si sommano) o li rifiuta (definitivo).
// Gli INSUFFICIENTI (< 18) sono registrati automaticamente e non si possono né accettare né rifiutare.

import { useAzioni } from "../../AzioniProvider";
import { useCarriera } from "../../CarrieraProvider";
import { scriviContratto } from "../../client";
import Bottone from "../../components/Bottone";
import ErroreLettura from "../../components/ErroreLettura";
import Scheletro from "../../components/Scheletro";
import StatoVuoto from "../../components/StatoVuoto";
import { IconCheck, IconLucchetto } from "../../icons";
import type { Esame } from "../../letture";
import { mostraVoto } from "../../utils";
import { useWallet } from "../../WalletProvider";

export default function EsamiDaGestire() {
  const { indirizzo: io } = useWallet();
  const { carriera, errore, ricarica } = useCarriera();
  const { esegui, conferma } = useAzioni();

  if (errore) return <ErroreLettura onRiprova={ricarica} />;

  if (carriera === undefined) {
    return (
      <div className="flex max-w-[760px] flex-col gap-3">
        <Scheletro className="h-40" />
        <Scheletro className="h-40" />
      </div>
    );
  }

  const inAttesa = carriera?.esami.filter((e) => e.stato === "IN_ATTESA") ?? [];
  const insufficienti = carriera?.esami.filter((e) => e.stato === "INSUFFICIENTE") ?? [];

  async function accetta(e: Esame) {
    if (!io) return;
    const ok = await esegui(
      [
        {
          etichetta: `Accetta ${e.nome} · ${mostraVoto(e.voto)}`,
          invia: () => scriviContratto(io, "accettaEsame", [BigInt(e.id)]),
        },
      ],
      `+${e.cfu} CFU accettati`
    );
    if (ok) ricarica();
  }

  async function rifiuta(e: Esame) {
    if (!io) return;
    const sicuro = await conferma({
      titolo: "Rifiutare il voto?",
      testo: `${e.nome} · ${mostraVoto(e.voto)} · ${e.cfu} CFU`,
      avviso: "Rifiutare è definitivo: in questo corso non potrai ricevere un altro voto.",
      cta: "Rifiuta definitivamente",
      pericolo: true,
    });
    if (!sicuro) return;

    const ok = await esegui(
      [
        {
          etichetta: `Rifiuta ${e.nome} · ${mostraVoto(e.voto)}`,
          invia: () => scriviContratto(io, "rifiutaEsame", [BigInt(e.id)]),
        },
      ],
      "Voto rifiutato"
    );
    if (ok) ricarica();
  }

  return (
    <div className="max-w-[760px]">
      <h1 className="mb-1 font-heading text-[26px] font-bold">Esami da gestire</h1>
      <p className="mb-5 text-sm leading-normal text-testo-3">
        Voti ≥ 18 in attesa della tua decisione. Accettando, i CFU si sommano alla carriera.
      </p>

      <div className="mb-[26px] flex flex-col gap-3">
        {inAttesa.length === 0 && (
          <StatoVuoto
            titolo="Nessun esame da gestire"
            testo="Non ci sono voti in attesa della tua decisione."
            icona={<IconCheck className="h-8 w-8" />}
          />
        )}

        {carriera &&
          inAttesa.map((e) => {
            const dopo = carriera.cfu + e.cfu;
            const raggiunge = !carriera.laureato && dopo >= carriera.soglia;
            return (
              <div key={e.id} className="rounded-[14px] border border-bordo bg-white p-5">
                <div className="mb-3.5 flex items-start gap-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="mb-[3px] text-base font-semibold">{e.nome}</div>
                    <div className="text-[13px] text-testo-3">
                      {e.cfu} CFU · <span className="font-semibold text-ambra">IN ATTESA</span>
                    </div>
                  </div>
                  <div className="font-heading text-[32px] leading-none font-bold">{mostraVoto(e.voto)}</div>
                </div>

                <p className="mb-3.5 rounded-[9px] bg-sfondo px-3 py-2.5 text-[13px] text-testo-2">
                  Accettando arrivi a {dopo} / {carriera.soglia} CFU{raggiunge && " · soglia raggiunta"}
                </p>

                <div className="flex flex-wrap gap-2.5">
                  <Bottone variante="successo" onClick={() => accetta(e)} className="flex-[1_1_180px]">
                    Accetta · +{e.cfu} CFU
                  </Bottone>
                  <Bottone variante="pericoloLeggero" onClick={() => rifiuta(e)} className="flex-[1_1_120px]">
                    Rifiuta
                  </Bottone>
                </div>
              </div>
            );
          })}
      </div>

      {insufficienti.length > 0 && (
        <>
          <h2 className="mb-2.5 font-heading text-base font-semibold">Insufficienti · sola lettura</h2>
          <div className="rounded-[14px] border border-bordo bg-white px-[18px] py-1">
            {insufficienti.map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-[13px]">
                <IconLucchetto className="h-4 w-4 text-[#A65248]" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{e.nome}</div>
                  <div className="text-xs text-muto">{e.cfu} CFU · voto &lt; 18, nessuna azione possibile</div>
                </div>
                <span className="font-heading text-[17px] font-bold text-rosso">{mostraVoto(e.voto)}</span>
                <span className="text-[11px] font-semibold text-rosso">INSUFFICIENTE</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
