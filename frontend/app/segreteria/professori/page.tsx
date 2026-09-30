"use client";

// Segreteria · Professori
// Il contratto memorizza solo gli indirizzi: aggiungiProfessore / rimuoviProfessore.

import { useState } from "react";
import { useAzioni } from "../../AzioniProvider";
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
import { leggiCorsi, leggiProfessori } from "../../letture";
import { useDati } from "../../useDati";
import { abbrevia, indirizzoValido, type Indirizzo as TipoIndirizzo } from "../../utils";
import { useWallet } from "../../WalletProvider";

export default function Professori() {
  const { indirizzo: io } = useWallet();
  const { esegui, conferma } = useAzioni();
  const [nuovo, setNuovo] = useState("");

  // Professori + corsi (per sapere quanti corsi ha ciascuno)
  const { dati, caricamento, errore, ricarica } = useDati(
    () => Promise.all([leggiProfessori(), leggiCorsi()]),
    []
  );
  const professori = dati?.[0] ?? [];
  const corsi = dati?.[1] ?? [];

  // Validazione del campo "Aggiungi professore"
  const testo = nuovo.trim();
  let errNuovo = "";
  if (testo && !indirizzoValido(testo)) {
    errNuovo = "Formato non valido: servono 0x seguito da 40 caratteri esadecimali";
  } else if (professori.some((p) => p.toLowerCase() === testo.toLowerCase())) {
    errNuovo = "Questo indirizzo è già abilitato come professore";
  }
  const puoAggiungere = !!io && indirizzoValido(testo) && !errNuovo;

  async function aggiungi() {
    if (!io || !indirizzoValido(testo)) return;
    const ok = await esegui(
      [
        {
          etichetta: "Abilita professore " + abbrevia(testo),
          invia: () => scriviContratto(io, "aggiungiProfessore", [testo]),
        },
      ],
      "Professore abilitato"
    );
    if (ok) {
      setNuovo("");
      ricarica();
    }
  }

  async function rimuovi(prof: TipoIndirizzo, nCorsi: number) {
    if (!io) return;

    const sicuro = await conferma({
      titolo: "Rimuovere il professore?",
      testo: `L'indirizzo ${abbrevia(prof)} perderà il ruolo PROFESSORE.`,
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
          etichetta: "Rimuovi professore " + abbrevia(prof),
          invia: () => scriviContratto(io, "rimuoviProfessore", [prof]),
        },
      ],
      "Professore rimosso"
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
        Il contratto memorizza solo gli indirizzi wallet: nessun nome o email.
      </p>

      {/* Aggiungi professore */}
      <Card className="mb-[22px] p-4!">
        <div className="mb-2.5 text-[13px] font-semibold text-testo-2">Aggiungi professore</div>
        <div className="flex flex-wrap items-start gap-2.5">
          <Campo
            valore={nuovo}
            onCambia={setNuovo}
            segnaposto="0x… indirizzo wallet"
            errore={errNuovo}
            mono
            className="min-w-0 flex-[1_1_280px]"
          />
          <Bottone
            onClick={aggiungi}
            disabilitato={!puoAggiungere}
            motivo={errNuovo || "Inserisci un indirizzo"}
          >
            Abilita
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
          testo="Aggiungi il primo indirizzo con il campo qui sopra."
          icona={<IconGraduationCap className="h-[34px] w-[34px]" />}
        />
      )}

      {dati && professori.length > 0 && (
        <div className="flex flex-col gap-2">
          {professori.map((p) => {
            const nCorsi = corsi.filter((c) => c.professore.toLowerCase() === p.toLowerCase()).length;
            return (
              <div
                key={p}
                className="flex flex-wrap items-center gap-3 rounded-[11px] border border-bordo bg-white px-3.5 py-[13px]"
              >
                <Avatar indirizzo={p} dimensione={38} />
                <div className="min-w-0 flex-[1_1_180px]">
                  <Indirizzo indirizzo={p} etherscan className="text-sm font-semibold" />
                  <div className="mt-0.5 text-xs text-muto">
                    {nCorsi === 1 ? "1 corso assegnato" : `${nCorsi} corsi assegnati`}
                  </div>
                </div>
                <Bottone variante="pericoloLeggero" piccolo onClick={() => rimuovi(p, nCorsi)}>
                  Rimuovi
                </Bottone>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
