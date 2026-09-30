"use client";

// Dettaglio di un corso, usato dalla segreteria (e nel passo 6 dal professore).
// - Corso APERTO: iscrizione studenti (solo segreteria) e chiusura delle iscrizioni
// - Corso CHIUSO: registrazione dei voti, uno per studente e definitivo

import Link from "next/link";
import { useState } from "react";
import { useAzioni } from "../AzioniProvider";
import { scriviContratto } from "../client";
import { IconLucchetto } from "../icons";
import { leggiCarriera, leggiDettaglioCorso, statoCorso, type Corso, type IscrittoCorso } from "../letture";
import { useDati } from "../useDati";
import { abbrevia, indirizzoValido, iniziali, mostraVoto, type Indirizzo as TipoIndirizzo } from "../utils";
import { useWallet } from "../WalletProvider";
import Avatar from "./Avatar";
import Avviso from "./Avviso";
import Badge from "./Badge";
import BarraProgresso from "./BarraProgresso";
import Bottone from "./Bottone";
import Campo from "./Campo";
import Card from "./Card";
import ErroreLettura from "./ErroreLettura";
import Indirizzo from "./Indirizzo";
import Scheletro from "./Scheletro";

type Props = {
  indirizzo: string; // dall'URL
  ruolo: "segreteria" | "professore";
  indietro: { href: string; etichetta: string };
};

export default function DettaglioCorso({ indirizzo, ruolo, indietro }: Props) {
  const valido = indirizzoValido(indirizzo);

  const { dati, caricamento, errore, ricarica } = useDati(
    () => (valido ? leggiDettaglioCorso(indirizzo) : Promise.resolve(null)),
    [indirizzo]
  );

  return (
    <div>
      <Link href={indietro.href} className="mb-4 inline-flex text-[13px] text-testo-3">
        ← {indietro.etichetta}
      </Link>

      {!valido && <Avviso tipo="errore">Indirizzo del corso non valido.</Avviso>}
      {valido && caricamento && (
        <div className="flex flex-col gap-4">
          <Scheletro className="h-[110px]" />
          <Scheletro className="h-[240px]" />
        </div>
      )}
      {errore && <ErroreLettura onRiprova={ricarica} />}
      {valido && dati === null && (
        <Avviso tipo="errore" titolo="Corso non trovato">
          Questo indirizzo non corrisponde a nessun corso creato dal contratto Universita.
        </Avviso>
      )}

      {dati && (
        <>
          <Intestazione corso={dati.corso} />
          {dati.corso.stato === "APERTO" ? (
            <CorsoAperto corso={dati.corso} studenti={dati.studenti} ruolo={ruolo} onCambiato={ricarica} />
          ) : (
            <CorsoChiuso corso={dati.corso} studenti={dati.studenti} ruolo={ruolo} onCambiato={ricarica} />
          )}
        </>
      )}
    </div>
  );
}

function Intestazione({ corso }: { corso: Corso }) {
  return (
    <Card className="mb-[18px] rounded-2xl px-6!">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold">{corso.nome}</h1>
        <Badge stato={statoCorso(corso)} />
      </div>
      <div className="flex flex-wrap gap-x-[26px] gap-y-2.5 text-[13px] text-testo-3">
        <span>
          <b className="text-navy">{corso.cfu}</b> CFU
        </span>
        <span>
          <b className="text-navy">
            {corso.iscritti.length}/{corso.max}
          </b>{" "}
          iscritti
        </span>
        <span className="flex items-center gap-1.5">
          Professore <Avatar indirizzo={corso.professore} dimensione={14} />
          <Indirizzo indirizzo={corso.professore} className="text-navy" />
        </span>
        <span className="flex items-center gap-1.5">
          Contratto Corso <Indirizzo indirizzo={corso.indirizzo} etherscan className="text-navy" />
        </span>
      </div>
    </Card>
  );
}

// Riga con avatar, nome e indirizzo di uno studente
function Studente({ s }: { s: IscrittoCorso }) {
  return (
    <>
      <Avatar indirizzo={s.indirizzo} testo={iniziali(s.nome, s.cognome)} dimensione={36} />
      <div className="min-w-0 flex-[1_1_150px]">
        <div className="text-sm font-semibold">
          {s.nome} {s.cognome}
        </div>
        <Indirizzo indirizzo={s.indirizzo} className="text-xs text-muto" />
      </div>
    </>
  );
}

type PropsStato = {
  corso: Corso;
  studenti: IscrittoCorso[];
  ruolo: "segreteria" | "professore";
  onCambiato: () => void;
};

// ---------- Corso APERTO ----------

function CorsoAperto({ corso, studenti, ruolo, onCambiato }: PropsStato) {
  const { indirizzo: io } = useWallet();
  const { esegui, conferma } = useAzioni();
  const pieno = corso.iscritti.length >= corso.max;

  async function chiudi() {
    if (!io) return;
    const sicuro = await conferma({
      titolo: "Chiudere le iscrizioni?",
      testo: `${corso.nome} · ${corso.iscritti.length}/${corso.max} iscritti.`,
      avviso:
        "Operazione irreversibile. Dopo la chiusura non potrai più iscrivere studenti; si abiliterà la registrazione dei voti.",
      cta: "Chiudi iscrizioni",
      pericolo: true,
    });
    if (!sicuro) return;

    const ok = await esegui(
      [
        {
          etichetta: "Chiudi iscrizioni · " + corso.nome,
          invia: () => scriviContratto(io, "chiudiIscrizioniCorso", [corso.indirizzo]),
        },
      ],
      "Iscrizioni chiuse"
    );
    if (ok) onCambiato();
  }

  return (
    <div className="flex flex-wrap items-start gap-[18px]">
      <div className="flex min-w-0 flex-[1_1_540px] flex-col gap-[18px]">
        {ruolo === "segreteria" && <IscriviStudente corso={corso} onIscritto={onCambiato} />}

        <Card>
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="font-heading text-base font-semibold">Iscritti</h2>
            <span className="text-xs text-muto">nome letto dalla carriera</span>
          </div>
          <div className="mt-2.5 mb-1.5">
            <BarraProgresso valore={corso.iscritti.length} massimo={corso.max} colore={pieno ? "bg-ambra" : "bg-verde"} />
          </div>

          {studenti.length === 0 && <p className="pt-6 pb-2.5 text-center text-sm text-testo-3">Nessuno studente iscritto</p>}

          {studenti.map((s) => (
            <div key={s.indirizzo} className="flex items-center gap-3 border-t border-riga py-3">
              <Studente s={s} />
              <span className="text-xs text-muto">voto non ancora registrabile</span>
            </div>
          ))}
        </Card>
      </div>

      <Card className="min-w-[260px] flex-[1_1_340px] lg:flex-[0_1_340px]">
        <h2 className="mb-2 font-heading text-base font-semibold">Chiusura iscrizioni</h2>
        <p className="mb-3.5 text-[13px] leading-[1.55] text-testo-3">
          Dopo la chiusura non si potranno più iscrivere studenti e si abiliterà la registrazione dei voti.
          L&apos;operazione è irreversibile.
        </p>
        {pieno && <p className="mb-3 text-[13px] text-[#9A6A2E]">Il corso è pieno: puoi chiudere le iscrizioni.</p>}

        {ruolo === "segreteria" ? (
          <Bottone variante="scuro" onClick={chiudi} className="w-full">
            Chiudi iscrizioni
          </Bottone>
        ) : (
          <p className="rounded-[10px] bg-sfondo p-3 text-[13px] text-testo-2">
            Sola lettura: in attesa che la segreteria chiuda le iscrizioni.
          </p>
        )}
      </Card>
    </div>
  );
}

function IscriviStudente({ corso, onIscritto }: { corso: Corso; onIscritto: () => void }) {
  const { indirizzo: io } = useWallet();
  const { esegui } = useAzioni();
  const [testo, setTesto] = useState("");

  const q = testo.trim();
  const valido = indirizzoValido(q);
  const pieno = corso.iscritti.length >= corso.max;
  const giaIscritto = corso.iscritti.some((s) => s.toLowerCase() === q.toLowerCase());

  // Lo studente deve avere una carriera: la cerchiamo appena l'indirizzo è valido
  const { dati: carriera, caricamento } = useDati(
    () => (valido ? leggiCarriera(q) : Promise.resolve(null)),
    [valido ? q.toLowerCase() : ""]
  );

  let errore = "";
  if (pieno) errore = "Corso pieno: numero massimo di studenti raggiunto";
  else if (q && !valido) errore = "Formato non valido";
  else if (giaIscritto) errore = "Studente già iscritto a questo corso";
  else if (valido && !caricamento && carriera === null)
    errore = "Nessuna carriera per questo indirizzo: registra prima lo studente";

  const pronto = valido && !errore && !!carriera;

  async function iscrivi() {
    if (!io || !carriera) return;
    const ok = await esegui(
      [
        {
          etichetta: `Iscrivi ${carriera.nome} ${carriera.cognome} · ${corso.nome}`,
          invia: () => scriviContratto(io, "iscriviStudenteACorso", [carriera.studente, corso.indirizzo]),
        },
      ],
      "Studente iscritto al corso"
    );
    if (ok) {
      setTesto("");
      onIscritto();
    }
  }

  return (
    <Card>
      <h2 className="mb-3 font-heading text-base font-semibold">Iscrivi studente</h2>
      <div className="flex flex-wrap items-start gap-2.5">
        <Campo
          valore={testo}
          onCambia={setTesto}
          segnaposto="0x… indirizzo studente"
          errore={errore}
          mono
          className="min-w-0 flex-[1_1_260px]"
        />
        <Bottone onClick={iscrivi} disabilitato={!pronto} motivo={errore || "Inserisci un indirizzo"}>
          Iscrivi
        </Bottone>
      </div>
      {pronto && carriera && (
        <p className="mt-2 text-xs text-verde-scuro">
          ✓ Carriera trovata: {carriera.nome} {carriera.cognome}
        </p>
      )}
    </Card>
  );
}

// ---------- Corso CHIUSO ----------

type Inserimento = { voto: string; lode: boolean };

function CorsoChiuso({ corso, studenti, ruolo, onCambiato }: PropsStato) {
  const { indirizzo: io, ruoli } = useWallet();
  const { esegui, conferma } = useAzioni();
  const [inserimenti, setInserimenti] = useState<Record<string, Inserimento>>({});

  // Il professore può registrare solo nei suoi corsi (la segreteria in tutti)
  const mioCorso = !!io && corso.professore.toLowerCase() === io.toLowerCase();
  const puoRegistrare = ruolo === "segreteria" ? !!ruoli?.segreteria : mioCorso && !!ruoli?.professore;

  const registrati = studenti.filter((s) => s.voto !== null);
  const media =
    registrati.length > 0
      ? (registrati.reduce((tot, s) => tot + Math.min(s.voto!, 30), 0) / registrati.length).toFixed(1).replace(".", ",")
      : "—";

  function aggiorna(studente: TipoIndirizzo, cambio: Partial<Inserimento>) {
    setInserimenti((prima) => ({
      ...prima,
      [studente]: { ...(prima[studente] ?? { voto: "", lode: false }), ...cambio },
    }));
  }

  async function registra(s: IscrittoCorso, voto: number, lode: boolean) {
    if (!io) return;
    const votoMostrato = mostraVoto(lode ? 31 : voto);

    const sicuro = await conferma({
      titolo: "Confermi il voto?",
      testo: `Registri ${votoMostrato} a ${abbrevia(s.indirizzo)} (${s.nome} ${s.cognome}). Non potrai modificarlo.`,
      avviso: voto < 18 ? "Voto inferiore a 18: l'esame risulterà INSUFFICIENTE automaticamente." : undefined,
      cta: "Firma e registra",
    });
    if (!sicuro) return;

    const ok = await esegui(
      [
        {
          etichetta: `Registra voto ${votoMostrato} · ${corso.nome}`,
          invia: () => scriviContratto(io, "registraVoto", [corso.indirizzo, s.indirizzo, BigInt(voto), lode]),
        },
      ],
      "Voto registrato on-chain"
    );
    if (ok) {
      setInserimenti((prima) => {
        const resto = { ...prima };
        delete resto[s.indirizzo];
        return resto;
      });
      onCambiato();
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-[18px]">
      <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-3.5">
        <div className="flex items-center gap-2.5 rounded-xl border border-bordo bg-white px-[15px] py-3 text-[13px] text-testo-3">
          <IconLucchetto className="h-[15px] w-[15px] text-grigio" />
          Iscrizioni chiuse: non è più possibile iscrivere studenti.
        </div>

        {ruolo === "professore" && !mioCorso && (
          <Avviso tipo="bloccato">Questo corso non è assegnato al tuo indirizzo: sola lettura.</Avviso>
        )}

        <Card>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-base font-semibold">Registrazione voti</h2>
            <span className="text-[13px] text-testo-3">
              <b className="text-navy">{registrati.length}</b> / {studenti.length} registrati
            </span>
          </div>
          <div className="mb-3.5">
            <BarraProgresso valore={registrati.length} massimo={studenti.length} />
          </div>

          <Avviso tipo="attenzione" className="mb-1.5">
            Ogni voto è definitivo: una sola registrazione per studente.
          </Avviso>
          <p className="mb-1.5 text-xs text-muto">
            {ruolo === "segreteria"
              ? "Come segreteria puoi registrare voti al posto del professore."
              : "La segreteria può registrare voti al posto del professore."}
          </p>

          {studenti.length === 0 && (
            <p className="pt-6 pb-2.5 text-center text-sm text-testo-3">Nessuno studente iscritto a questo corso</p>
          )}

          {studenti.map((s) => {
            if (s.voto !== null) {
              return (
                <div key={s.indirizzo} className="flex flex-wrap items-center gap-3 border-t border-riga py-3.5">
                  <Studente s={s} />
                  <span className="text-xs font-semibold whitespace-nowrap text-verde-scuro">✓ Registrato on-chain</span>
                  <span className="min-w-10 text-right font-heading text-lg font-bold">{mostraVoto(s.voto)}</span>
                </div>
              );
            }

            const ins = inserimenti[s.indirizzo] ?? { voto: "", lode: false };
            const n = ins.voto === "" ? null : Number(ins.voto);
            let errore = "";
            if (n !== null && n > 30) errore = "Voto fuori range: inserisci un numero intero da 0 a 30";
            else if (ins.lode && n !== 30) errore = "La lode è consentita solo con voto 30";

            const lodePossibile = n === 30 || ins.lode;
            const pronto = n !== null && !errore && puoRegistrare;

            return (
              <div key={s.indirizzo} className="flex flex-wrap items-center gap-3 border-t border-riga py-3.5">
                <Studente s={s} />
                <div className="flex items-center gap-3">
                  <input
                    value={ins.voto}
                    onChange={(e) => aggiorna(s.indirizzo, { voto: e.target.value.replace(/[^0-9]/g, "").slice(0, 2) })}
                    placeholder="0–30"
                    disabled={!puoRegistrare}
                    className={
                      "w-[68px] rounded-[9px] border bg-campo px-2.5 py-[9px] text-center font-heading text-[15px] font-semibold placeholder:text-segnaposto " +
                      (errore ? "border-[#E8A59C]" : "border-bordo-forte")
                    }
                  />
                  <button
                    type="button"
                    onClick={() => lodePossibile && aggiorna(s.indirizzo, { lode: !ins.lode })}
                    title={lodePossibile ? "" : "Lode solo con 30"}
                    className={
                      "flex items-center gap-1.5 text-[13px] text-testo-2 " +
                      (lodePossibile ? "" : "cursor-not-allowed opacity-45")
                    }
                  >
                    <span
                      className={
                        "flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] text-[11px] text-white " +
                        (ins.lode ? "border-accento bg-accento" : "border-[#C2CBDA] bg-white")
                      }
                    >
                      {ins.lode && "✓"}
                    </span>
                    Lode
                  </button>
                  <Bottone
                    piccolo
                    onClick={() => n !== null && registra(s, n, ins.lode)}
                    disabilitato={!pronto}
                    motivo={!puoRegistrare ? "Non puoi registrare voti in questo corso" : errore || "Inserisci un voto"}
                  >
                    Registra
                  </Bottone>
                </div>
                {errore && <div className="basis-full pl-12 text-xs text-rosso">{errore}</div>}
              </div>
            );
          })}
        </Card>
      </div>

      <Card className="min-w-[240px] flex-[1_1_300px] lg:flex-[0_1_300px]">
        <h2 className="mb-3 font-heading text-base font-semibold">Riepilogo</h2>
        <RigaRiepilogo etichetta="Iscritti" valore={studenti.length} />
        <RigaRiepilogo etichetta="Voti registrati" valore={registrati.length} colore="text-verde-scuro" />
        <RigaRiepilogo etichetta="Mancanti" valore={studenti.length - registrati.length} colore="text-ambra" />
        <RigaRiepilogo etichetta="Media voti registrati" valore={media} />
        <p className="mt-2.5 text-xs leading-normal text-muto">
          La media considera 30 e lode come 30. Il valore dei voti è letto dalla carriera di ciascuno studente.
        </p>
      </Card>
    </div>
  );
}

function RigaRiepilogo({ etichetta, valore, colore = "" }: { etichetta: string; valore: string | number; colore?: string }) {
  return (
    <div className="flex justify-between border-t border-riga py-2.5 text-sm">
      <span className="text-testo-3">{etichetta}</span>
      <b className={"font-heading " + colore}>{valore}</b>
    </div>
  );
}
