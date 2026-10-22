"use client";

// Segreteria · Professori
// aggiungiProfessore salva indirizzo, nome e cognome; rimuoviProfessore toglie il ruolo.

import { useState } from "react";
import { MOTIVO_IN_ATTESA, useAzioni } from "../../AzioniProvider";
import { scriviContratto } from "../../client";
import Avatar from "../../components/Avatar";
import Bottone from "../../components/Bottone";
import Card from "../../components/Card";
import Campo from "../../components/Campo";
import ErroreLettura from "../../components/ErroreLettura";
import Indirizzo from "../../components/Indirizzo";
import Scheletro from "../../components/Scheletro";
import StatoVuoto from "../../components/StatoVuoto";
import { IconGraduationCap } from "../../icons";
import { leggiCorsi, leggiProfessori, nomeCompleto } from "../../letture";
import { useDati } from "../../useDati";
import { indirizzoValido, iniziali, type Indirizzo as TipoIndirizzo } from "../../utils";
import { useWallet } from "../../WalletProvider";

export default function Professori() {
  const { indirizzo: io } = useWallet();
  const { esegui, conferma, inAttesa } = useAzioni();
  const aggiuntaInAttesa = inAttesa("aggiungi-professore");
  const [nuovo, setNuovo] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");

  // Professori + corsi (per sapere quanti corsi ha ciascuno)
  const { dati, caricamento, errore, ricarica } = useDati(
    () => Promise.all([leggiProfessori(), leggiCorsi()]),
    []
  );
  const professori = dati?.[0] ?? [];
  const corsi = dati?.[1] ?? [];

  // Validazione del form "Aggiungi professore"
  const testo = nuovo.trim();
  let errNuovo = "";
  if (testo && !indirizzoValido(testo)) {
    errNuovo = "Formato non valido: servono 0x seguito da 40 caratteri esadecimali";
  } else if (professori.some((p) => p.indirizzo.toLowerCase() === testo.toLowerCase())) {
    errNuovo = "Questo indirizzo è già abilitato come professore";
  }

  let motivo = errNuovo;
  if (!motivo && !indirizzoValido(testo)) motivo = "Inserisci un indirizzo";
  else if (!motivo && (!nome.trim() || !cognome.trim())) motivo = "Inserisci nome e cognome";
  const puoAggiungere = !!io && !motivo;

  async function aggiungi() {
    if (!io || !indirizzoValido(testo)) return;
    const n = nome.trim();
    const c = cognome.trim();

    const ok = await esegui(
      [
        {
          etichetta: `Abilita professore ${n} ${c}`,
          invia: () => scriviContratto(io, "aggiungiProfessore", [testo, n, c]),
        },
      ],
      "Professore abilitato",
      "aggiungi-professore"
    );
    if (ok) {
      setNuovo("");
      setNome("");
      setCognome("");
      ricarica();
    }
  }

  async function rimuovi(prof: TipoIndirizzo, nomeProf: string, nCorsi: number) {
    if (!io) return;

    const sicuro = await conferma({
      titolo: "Rimuovere il professore?",
      testo: `${nomeProf} perderà il ruolo PROFESSORE.`,
      avviso:
        nCorsi > 0
          ? `I suoi ${nCorsi} corsi restano assegnati a questo indirizzo, ma non potrà più registrare voti: potrà farlo la segreteria.`
          : undefined,
      cta: "Rimuovi professore",
      pericolo: true,
    });
    if (!sicuro) return;

    const ok = await esegui(
      [
        {
          etichetta: "Rimuovi professore " + nomeProf,
          invia: () => scriviContratto(io, "rimuoviProfessore", [prof]),
        },
      ],
      "Professore rimosso",
      "rimuovi-" + prof
    );
    if (ok) ricarica();
  }

  return (
    <div className="max-w-[760px]">
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="font-heading text-[26px] font-bold">Professori</h1>
        {dati && <span className="text-[13px] text-testo-3">{professori.length} abilitati</span>}
      </div>
      <p className="mb-5 text-sm text-testo-3">
        Il contratto memorizza indirizzo wallet, nome e cognome di ogni professore.
      </p>

      {/* Aggiungi professore */}
      <Card className="mb-[22px] p-4!">
        <div className="mb-2.5 text-[13px] font-semibold text-testo-2">Aggiungi professore</div>
        <div className="flex flex-col gap-2.5">
          <Campo valore={nuovo} onCambia={setNuovo} segnaposto="0x… indirizzo wallet" errore={errNuovo} mono />
          <div className="flex flex-wrap gap-2.5">
            <Campo valore={nome} onCambia={setNome} segnaposto="Nome" className="min-w-0 flex-[1_1_160px]" />
            <Campo valore={cognome} onCambia={setCognome} segnaposto="Cognome" className="min-w-0 flex-[1_1_160px]" />
          </div>
          <Bottone
            onClick={aggiungi}
            disabilitato={!puoAggiungere || aggiuntaInAttesa}
            motivo={aggiuntaInAttesa ? MOTIVO_IN_ATTESA : motivo}
            className="self-start"
          >
            {aggiuntaInAttesa ? "In attesa…" : "Abilita"}
          </Bottone>
        </div>
      </Card>

      {/* Elenco */}
      {caricamento && (
        <div className="flex flex-col gap-2">
          <Scheletro className="h-[66px]" />
          <Scheletro className="h-[66px]" />
          <Scheletro className="h-[66px]" />
        </div>
      )}

      {errore && <ErroreLettura onRiprova={ricarica} />}

      {dati && professori.length === 0 && (
        <StatoVuoto
          titolo="Nessun professore abilitato"
          testo="Aggiungi il primo professore con il modulo qui sopra."
          icona={<IconGraduationCap className="h-[34px] w-[34px]" />}
        />
      )}

      {dati && professori.length > 0 && (
        <div className="flex flex-col gap-2">
          {professori.map((p) => {
            const nCorsi = corsi.filter((c) => c.professore.toLowerCase() === p.indirizzo.toLowerCase()).length;
            return (
              <div
                key={p.indirizzo}
                className="flex flex-wrap items-center gap-3 rounded-[11px] border border-bordo bg-white px-3.5 py-[13px]"
              >
                <Avatar indirizzo={p.indirizzo} testo={iniziali(p.nome, p.cognome)} dimensione={38} />
                <div className="min-w-0 flex-[1_1_180px]">
                  <div className="text-sm font-semibold">{nomeCompleto(p)}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muto">
                    <Indirizzo indirizzo={p.indirizzo} etherscan />
                    <span>· {nCorsi === 1 ? "1 corso assegnato" : `${nCorsi} corsi assegnati`}</span>
                  </div>
                </div>
                <Bottone
                  variante="pericoloLeggero"
                  piccolo
                  onClick={() => rimuovi(p.indirizzo, nomeCompleto(p), nCorsi)}
                  disabilitato={inAttesa("rimuovi-" + p.indirizzo)}
                  motivo={MOTIVO_IN_ATTESA}
                >
                  {inAttesa("rimuovi-" + p.indirizzo) ? "In attesa…" : "Rimuovi"}
                </Bottone>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
