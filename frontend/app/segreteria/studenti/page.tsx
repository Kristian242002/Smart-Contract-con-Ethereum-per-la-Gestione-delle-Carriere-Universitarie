"use client";

// Segreteria · Studenti
// Il contratto non espone un elenco degli studenti: si registra uno studente nuovo
// (deploy del suo contratto CarrieraStudente) oppure si cerca una carriera per indirizzo.

import Link from "next/link";
import { useState } from "react";
import { useAzioni } from "../../AzioniProvider";
import { scriviContratto } from "../../client";
import Avviso from "../../components/Avviso";
import Bottone from "../../components/Bottone";
import Campo from "../../components/Campo";
import Card from "../../components/Card";
import CercaCarriera from "../../components/CercaCarriera";
import Indirizzo from "../../components/Indirizzo";
import { IconCheck } from "../../icons";
import { leggiCarriera, type Carriera } from "../../letture";
import { useDati } from "../../useDati";
import { indirizzoValido } from "../../utils";
import { useWallet } from "../../WalletProvider";

const TIPI = [
  { valore: 0, etichetta: "Triennale · 180 CFU" },
  { valore: 1, etichetta: "Magistrale · 120 CFU" },
];

export default function Studenti() {
  const { indirizzo: io } = useWallet();
  const { esegui } = useAzioni();

  const [studente, setStudente] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [tipo, setTipo] = useState(0); // 0 = TRIENNALE, 1 = MAGISTRALE (come l'enum del contratto)
  const [creata, setCreata] = useState<Carriera | null>(null); // carriera appena registrata

  const testo = studente.trim();
  const valido = indirizzoValido(testo);

  // Appena l'indirizzo è valido controlliamo se ha già una carriera
  const { dati: esistente } = useDati(
    () => (valido ? leggiCarriera(testo) : Promise.resolve(null)),
    [valido ? testo.toLowerCase() : ""]
  );

  let errStudente = "";
  if (testo && !valido) errStudente = "Formato non valido: servono 0x seguito da 40 caratteri esadecimali";
  else if (esistente) errStudente = "Questo indirizzo ha già una carriera";

  const completo = valido && !errStudente && nome.trim() !== "" && cognome.trim() !== "";

  async function registra() {
    if (!io || !indirizzoValido(testo)) return;
    const n = nome.trim();
    const c = cognome.trim();

    const ok = await esegui(
      [
        {
          etichetta: `Registra studente ${n} ${c} · ${tipo === 0 ? "Triennale" : "Magistrale"}`,
          invia: () => scriviContratto(io, "registraStudente", [testo, tipo, n, c]),
        },
      ],
      "Carriera creata on-chain"
    );

    if (ok) {
      // Rileggiamo la carriera appena creata per mostrare l'indirizzo del suo contratto
      setCreata(await leggiCarriera(testo));
      setStudente("");
      setNome("");
      setCognome("");
      setTipo(0);
    }
  }

  return (
    <div>
      <h1 className="mb-1 font-heading text-[26px] font-bold">Studenti</h1>
      <p className="mb-[22px] max-w-[640px] text-sm leading-normal text-testo-3">
        Il contratto non espone un elenco degli studenti, puoi devidere di registrarne uno nuovo oppure cercare una
        carriera per indirizzo.
      </p>

      <div className="flex flex-wrap items-start gap-[18px]">
        <div className="min-w-0 flex-[1.3_1_440px]">
          {creata ? (
            <CarrieraCreata carriera={creata} onAltro={() => setCreata(null)} />
          ) : (
            <Card className="flex flex-col gap-4 rounded-2xl p-6!">
              <h2 className="font-heading text-[17px] font-semibold">Registra studente</h2>

              <Campo
                etichetta="Indirizzo wallet"
                valore={studente}
                onCambia={setStudente}
                segnaposto="0x…"
                errore={errStudente}
                mono
              />

              <div className="flex flex-wrap gap-3">
                <Campo etichetta="Nome" valore={nome} onCambia={setNome} segnaposto="Nome" className="flex-[1_1_160px]" />
                <Campo
                  etichetta="Cognome"
                  valore={cognome}
                  onCambia={setCognome}
                  segnaposto="Cognome"
                  className="flex-[1_1_160px]"
                />
              </div>

              <div>
                <div className="mb-[7px] text-[13px] font-semibold text-testo-2">Tipo di laurea</div>
                <div className="flex gap-2.5">
                  {TIPI.map((t) => (
                    <button
                      key={t.valore}
                      type="button"
                      onClick={() => setTipo(t.valore)}
                      className={
                        "flex-1 rounded-[10px] p-3 text-sm " +
                        (tipo === t.valore
                          ? "border-[1.5px] border-accento bg-accento-tenue font-semibold"
                          : "border border-bordo-forte bg-white font-medium text-testo-3")
                      }
                    >
                      {t.etichetta}
                    </button>
                  ))}
                </div>
              </div>

              <Avviso>
                Nota bene il tipo di laurea non potrà essere modificato dallo studente.
              </Avviso>

              <Bottone
                onClick={registra}
                disabilitato={!completo}
                motivo={errStudente || "Compila indirizzo, nome e cognome"}
                className="w-full py-3.5! text-[15px]!"
              >
                Crea carriera on-chain →
              </Bottone>
            </Card>
          )}
        </div>

        <Card className="min-w-0 flex-[1_1_320px] rounded-2xl">
          <h2 className="mb-1 font-heading text-[17px] font-semibold">Cerca carriera</h2>
          <p className="mb-3 text-[13px] text-testo-3">Puoi cercare la carriera di uno studente con questo panello qua</p>
          <CercaCarriera />
        </Card>
      </div>
    </div>
  );
}

// Riepilogo mostrato dopo la registrazione
function CarrieraCreata({ carriera, onAltro }: { carriera: Carriera; onAltro: () => void }) {
  return (
    <Card className="rounded-2xl p-6!">
      <div className="mb-[18px] flex items-center gap-3">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-verde-chiaro">
          <IconCheck className="h-5 w-5 text-verde-scuro" />
        </div>
        <div>
          <div className="font-heading text-lg font-bold">Carriera creata</div>
          <div className="text-[13px] text-testo-3">
            {carriera.nome} {carriera.cognome} · {carriera.tipo === "TRIENNALE" ? "Triennale" : "Magistrale"}
          </div>
        </div>
      </div>

      <Riga etichetta="Wallet studente">
        <Indirizzo indirizzo={carriera.studente} />
      </Riga>
      <Riga etichetta="Contratto carriera">
        <Indirizzo indirizzo={carriera.contratto} etherscan />
      </Riga>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link
          href="/segreteria/corsi"
          className="flex-1 rounded-[11px] bg-accento py-[13px] text-center text-sm font-semibold text-white"
        >
          Iscrivi a un corso →
        </Link>
        <Bottone variante="secondario" onClick={onAltro} className="flex-1">
          Registra un altro
        </Bottone>
      </div>
    </Card>
  );
}

function Riga({ etichetta, children }: { etichetta: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2.5 border-t border-riga py-2.5 text-[13px]">
      <span className="text-testo-3">{etichetta}</span>
      {children}
    </div>
  );
}
