// Tutte le letture dalla blockchain, in un posto solo.
// Le letture fatte insieme (Promise.all) partono in UNA richiesta grazie al multicall (vedi client.ts).

import { BaseError, ContractFunctionRevertedError } from "viem";
import { carrieraAbi, corsoAbi } from "./abi-contratti";
import { universitaAbi } from "./abi";
import { CONTRACT_ADDRESS, publicClient } from "./client";
import type { Stato } from "./components/Badge";
import type { Indirizzo } from "./utils";

// ---------- Tipi ----------

export type Corso = {
  indirizzo: Indirizzo; // indirizzo del contratto Corso
  nome: string;
  cfu: number;
  max: number;
  professore: Indirizzo;
  stato: "APERTO" | "CHIUSO";
  iscritti: Indirizzo[];
  voti: number; // quanti iscritti hanno già un voto registrato
};

export type StatoEsame = "IN_ATTESA" | "ACCETTATO" | "RIFIUTATO" | "INSUFFICIENTE";

export type Esame = {
  id: number; // posizione nell'array esami: serve per accettaEsame / rifiutaEsame
  nome: string;
  voto: number; // 31 = 30 e lode
  cfu: number;
  stato: StatoEsame;
};

export type Carriera = {
  contratto: Indirizzo; // indirizzo del contratto CarrieraStudente
  studente: Indirizzo;
  nome: string;
  cognome: string;
  tipo: "TRIENNALE" | "MAGISTRALE";
  cfu: number; // CFU degli esami accettati
  soglia: number; // 180 o 120
  laureato: boolean;
  esami: Esame[];
};

// Gli enum di Solidity arrivano come numeri: 0, 1, 2…
const STATI_ESAME: StatoEsame[] = ["IN_ATTESA", "ACCETTATO", "RIFIUTATO", "INSUFFICIENTE"];
const TIPI_LAUREA = ["TRIENNALE", "MAGISTRALE"] as const;

const universita = { address: CONTRACT_ADDRESS, abi: universitaAbi } as const;

// ---------- Professori ----------

export function leggiProfessori() {
  return publicClient.readContract({ ...universita, functionName: "getListaProfessori" });
}

// ---------- Corsi ----------

export async function leggiCorso(indirizzo: Indirizzo): Promise<Corso> {
  const corso = { address: indirizzo, abi: corsoAbi } as const;

  const [nome, cfu, max, professore, stato, iscritti] = await Promise.all([
    publicClient.readContract({ ...corso, functionName: "nome" }),
    publicClient.readContract({ ...corso, functionName: "cfu" }),
    publicClient.readContract({ ...corso, functionName: "maxStudenti" }),
    publicClient.readContract({ ...corso, functionName: "professore" }),
    publicClient.readContract({ ...corso, functionName: "stato" }),
    publicClient.readContract({ ...corso, functionName: "getIscritti" }),
  ]);

  // Per ogni iscritto: ha già ricevuto un voto?
  const registrati = await Promise.all(
    iscritti.map((s) => publicClient.readContract({ ...corso, functionName: "votiRegistrati", args: [s] }))
  );

  return {
    indirizzo,
    nome,
    cfu: Number(cfu),
    max: Number(max),
    professore,
    stato: stato === 0 ? "APERTO" : "CHIUSO",
    iscritti: [...iscritti],
    voti: registrati.filter(Boolean).length,
  };
}

export async function leggiCorsi() {
  const indirizzi = await publicClient.readContract({ ...universita, functionName: "getListaCorsi" });
  const corsi = await Promise.all(indirizzi.map(leggiCorso));
  return corsi.reverse(); // i più recenti per primi
}

// APERTO / CHIUSO / PIENO (aperto ma senza posti liberi)
export function statoCorso(c: Corso): Stato {
  if (c.stato === "APERTO" && c.iscritti.length >= c.max) return "PIENO";
  return c.stato;
}

// ---------- Carriere ----------

// Il contratto fa revert se lo studente non esiste: per noi significa "non trovato".
// Qualsiasi altro errore (es. nodo irraggiungibile) va invece segnalato.
function eRevert(err: unknown) {
  return err instanceof BaseError && !!err.walk((e) => e instanceof ContractFunctionRevertedError);
}

// Restituisce la carriera dello studente, oppure null se non esiste.
export async function leggiCarriera(studente: Indirizzo): Promise<Carriera | null> {
  let contratto: Indirizzo;

  try {
    contratto = await publicClient.readContract({
      ...universita,
      functionName: "getCarrieraStudente",
      args: [studente],
    });
  } catch (err) {
    if (eRevert(err)) return null;
    throw err;
  }

  const info = await publicClient.readContract({
    address: contratto,
    abi: carrieraAbi,
    functionName: "getStudenteInfo",
  });

  return daStudenteInfo(contratto, info);
}

// Lettura per la verifica pubblica: usa getQRCode(), la funzione del contratto Universita
// pensata proprio per questo. Restituisce anche il blocco letto, come "prova" della lettura.
export async function leggiVerifica(studente: Indirizzo) {
  try {
    const [info, contratto, blocco] = await Promise.all([
      publicClient.readContract({ ...universita, functionName: "getQRCode", args: [studente] }),
      publicClient.readContract({ ...universita, functionName: "getCarrieraStudente", args: [studente] }),
      publicClient.getBlockNumber(),
    ]);
    return { carriera: daStudenteInfo(contratto, info), blocco };
  } catch (err) {
    if (eRevert(err)) return null;
    throw err;
  }
}

// La struct StudenteInfo di Solidity (numeri come bigint, enum come numeri) -> il nostro tipo Carriera
type StudenteInfo = {
  wallet: Indirizzo;
  nome: string;
  cognome: string;
  tipoLaurea: number;
  cfuTotali: bigint;
  laureato: boolean;
  esami: readonly { nome: string; voto: bigint; cfu: bigint; stato: number }[];
};

function daStudenteInfo(contratto: Indirizzo, info: StudenteInfo): Carriera {
  const tipo = TIPI_LAUREA[info.tipoLaurea];

  return {
    contratto,
    studente: info.wallet,
    nome: info.nome,
    cognome: info.cognome,
    tipo,
    cfu: Number(info.cfuTotali),
    soglia: tipo === "TRIENNALE" ? 180 : 120,
    laureato: info.laureato,
    esami: info.esami.map((e, id) => ({
      id,
      nome: e.nome,
      voto: Number(e.voto),
      cfu: Number(e.cfu),
      stato: STATI_ESAME[e.stato],
    })),
  };
}

// ---------- Dettaglio corso ----------

export type IscrittoCorso = {
  indirizzo: Indirizzo;
  nome: string;
  cognome: string;
  voto: number | null; // null = voto non ancora registrato
};

// Il corso con, per ogni iscritto, nome/cognome e voto letti dalla sua carriera.
// Il contratto Corso non salva i voti: sono nella carriera, nell'esame con il nome del corso.
// Restituisce null se l'indirizzo non è uno dei corsi creati dal contratto Universita.
export async function leggiDettaglioCorso(indirizzo: Indirizzo) {
  const lista = await publicClient.readContract({ ...universita, functionName: "getListaCorsi" });
  if (!lista.some((c) => c.toLowerCase() === indirizzo.toLowerCase())) return null;

  const corso = await leggiCorso(indirizzo);

  const carriere = await Promise.all(corso.iscritti.map(leggiCarriera));

  const studenti: IscrittoCorso[] = corso.iscritti.map((s, i) => {
    const carriera = carriere[i];
    const esame = carriera?.esami.findLast((e) => e.nome === corso.nome);
    return {
      indirizzo: s,
      nome: carriera?.nome ?? "",
      cognome: carriera?.cognome ?? "",
      voto: esame ? esame.voto : null,
    };
  });

  return { corso, studenti };
}
