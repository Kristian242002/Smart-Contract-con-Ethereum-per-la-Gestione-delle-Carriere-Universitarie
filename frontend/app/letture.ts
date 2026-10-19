
import { BaseError, ContractFunctionRevertedError } from "viem";
import { carrieraAbi, corsoAbi } from "./abi-contratti";
import { universitaAbi } from "./abi";
import { CONTRACT_ADDRESS, publicClient } from "./client";
import type { Stato } from "./components/Badge";
import type { Indirizzo } from "./utils";

// ---------- Tipi ----------

export type Corso = {
  indirizzo: Indirizzo; 
  nome: string;
  cfu: number;
  max: number;
  professore: Indirizzo;
  nomeProfessore: string; // "Nome Cognome" letto da Universita
  stato: "APERTO" | "CHIUSO";
  iscritti: Indirizzo[];
  voti: number; // quanti iscritti hanno già un voto registrato
};

export type StatoEsame = "IN_ATTESA" | "ACCETTATO" | "RIFIUTATO" | "INSUFFICIENTE";

export type Esame = {
  id: number; // posizione nell'array esami: serve per accettaEsame / rifiutaEsame
  nome: string;
  voto: number; 
  cfu: number;
  stato: StatoEsame;
};

export type Carriera = {
  contratto: Indirizzo; 
  studente: Indirizzo;
  nome: string;
  cognome: string;
  tipo: "TRIENNALE" | "MAGISTRALE";
  cfu: number; 
  soglia: number; // 180 o 120
  laureato: boolean;
  esami: Esame[];
};


const STATI_ESAME: StatoEsame[] = ["IN_ATTESA", "ACCETTATO", "RIFIUTATO", "INSUFFICIENTE"];
const TIPI_LAUREA = ["TRIENNALE", "MAGISTRALE"] as const;

const universita = { address: CONTRACT_ADDRESS, abi: universitaAbi } as const;

// ---------- Professori ----------

export type Professore = {
  indirizzo: Indirizzo;
  nome: string;
  cognome: string;
};

// Nome e cognome di un professore (salvati da aggiungiProfessore)
export async function leggiProfessore(indirizzo: Indirizzo): Promise<Professore> {
  const dati = await publicClient.readContract({ ...universita, functionName: "getProfessore", args: [indirizzo] });
  return { indirizzo, nome: dati.nome, cognome: dati.cognome };
}

// Tutti i professori abilitati, con nome e cognome
export async function leggiProfessori() {
  const indirizzi = await publicClient.readContract({ ...universita, functionName: "getListaProfessori" });
  return Promise.all(indirizzi.map(leggiProfessore));
}

// "Mario Rossi"
export function nomeCompleto(p: { nome: string; cognome: string }) {
  return `${p.nome} ${p.cognome}`.trim();
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

  // Per ogni iscritto ha già ricevuto un voto? E come si chiama il professore?
  const [registrati, prof] = await Promise.all([
    Promise.all(
      iscritti.map((s) => publicClient.readContract({ ...corso, functionName: "votiRegistrati", args: [s] }))
    ),
    leggiProfessore(professore),
  ]);

  return {
    indirizzo,
    nome,
    cfu: Number(cfu),
    max: Number(max),
    professore,
    nomeProfessore: nomeCompleto(prof),
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

// APERTO / CHIUSO / PIENO 
export function statoCorso(c: Corso): Stato {
  if (c.stato === "APERTO" && c.iscritti.length >= c.max) return "PIENO";
  return c.stato;
}

// ---------- Carriere ----------

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
