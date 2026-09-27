"use client";

// Contesto del wallet: tiene indirizzo, rete e ruoli disponibili in TUTTE le pagine.
// Si usa così, in qualsiasi componente client:
//   const { indirizzo, ruoli, connetti } = useWallet();

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { keccak256, toBytes } from "viem";
import { CONTRACT_ADDRESS, getWalletClient, publicClient } from "./client";
import { universitaAbi } from "./abi";
import type { Indirizzo } from "./utils";

// ID della rete Sepolia
const SEPOLIA = "0xaa36a7";

export type Ruoli = {
  segreteria: boolean;
  professore: boolean;
  studente: boolean;
};

type StatoConnessione = "inattivo" | "in_corso" | "rifiutata" | "errore";

type Wallet = {
  haMetaMask: boolean;
  pronto: boolean; // false finché non sappiamo se il wallet è già connesso
  indirizzo: Indirizzo | null;
  reteGiusta: boolean; // il wallet è su Sepolia?
  idRete: number | null; // chainId attuale del wallet (Sepolia = 11155111)
  ruoli: Ruoli | null; // null mentre li stiamo leggendo dal contratto
  erroreRuoli: boolean; // la lettura dei ruoli è fallita (es. nodo RPC irraggiungibile)
  statoConnessione: StatoConnessione;
  connetti: () => Promise<void>;
  disconnetti: () => Promise<void>;
  passaASepolia: () => Promise<void>;
};

const WalletContext = createContext<Wallet | null>(null);

// ---------- Lettura dei ruoli dal contratto ----------

// Controlla se l'indirizzo ha un certo ruolo nel contratto.
// Il codice del ruolo non serve chiederlo al contratto: in Universita.sol è
// keccak256("SEGRETERIA_ROLE"), quindi lo calcoliamo qui (una lettura in meno).
async function haRuolo(
  nomeRuolo: "SEGRETERIA_ROLE" | "PROFESSORE_ROLE" | "STUDENTE_ROLE",
  indirizzo: Indirizzo
) {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: universitaAbi,
    functionName: "hasRole",
    args: [keccak256(toBytes(nomeRuolo)), indirizzo],
  });
}

// Legge tutti e tre i ruoli
async function caricaRuoli(indirizzo: Indirizzo): Promise<Ruoli> {
  const [segreteria, professore, studente] = await Promise.all([
    haRuolo("SEGRETERIA_ROLE", indirizzo),
    haRuolo("PROFESSORE_ROLE", indirizzo),
    haRuolo("STUDENTE_ROLE", indirizzo),
  ]);

  return { segreteria, professore, studente };
}

// ---------- Rete ----------

// Porta MetaMask sulla rete Sepolia (la aggiunge se manca)
async function passaASepolia() {
  const eth = window.ethereum;
  if (!eth) return;

  const reteAttuale = await eth.request({ method: "eth_chainId" });
  if (reteAttuale === SEPOLIA) return;

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA }],
    });
  } catch (err) {
    const code = (err as { code?: number }).code;

    // 4902 = MetaMask non conosce la rete: la aggiungiamo
    if (code !== 4902) throw err;

    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: SEPOLIA,
          chainName: "Sepolia",
          nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
          blockExplorerUrls: ["https://sepolia.etherscan.io"],
        },
      ],
    });
  }
}

// ---------- MetaMask installato? ----------

// window.ethereum esiste solo nel browser: sul server diciamo "sì"
// per non mostrare l'errore per un attimo prima che la pagina si carichi
function nessunaIscrizione() {
  return () => {};
}

function useHaMetaMask() {
  return useSyncExternalStore(
    nessunaIscrizione,
    () => !!window.ethereum,
    () => true
  );
}

// ---------- Il componente che fornisce il contesto ----------

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  const haMetaMask = useHaMetaMask();

  const [controllato, setControllato] = useState(false);
  const [indirizzo, setIndirizzo] = useState<Indirizzo | null>(null);
  const [rete, setRete] = useState<string | null>(null);
  const [statoConnessione, setStatoConnessione] = useState<StatoConnessione>("inattivo");

  // I ruoli li salviamo insieme all'indirizzo a cui si riferiscono:
  // così se l'account cambia non mostriamo per errore i ruoli di quello vecchio
  const [ruoliLetti, setRuoliLetti] = useState<{ indirizzo: Indirizzo; ruoli: Ruoli } | null>(null);
  const [erroreRuoliPer, setErroreRuoliPer] = useState<Indirizzo | null>(null);

  // All'avvio: il wallet è già connesso? Su che rete è?
  // E ci mettiamo in ascolto dei cambi di account e di rete fatti in MetaMask.
  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;

    eth
      .request({ method: "eth_accounts" })
      .then((accounts) => setIndirizzo((accounts as Indirizzo[])[0] ?? null))
      .catch(() => {})
      .finally(() => setControllato(true));

    eth
      .request({ method: "eth_chainId" })
      .then(setRete)
      .catch(() => {});

    function cambioAccount(accounts: unknown) {
      setIndirizzo((accounts as Indirizzo[])[0] ?? null);
    }

    function cambioRete(nuovaRete: unknown) {
      setRete(nuovaRete as string);
    }

    eth.on("accountsChanged", cambioAccount);
    eth.on("chainChanged", cambioRete);

    return () => {
      eth.removeListener("accountsChanged", cambioAccount);
      eth.removeListener("chainChanged", cambioRete);
    };
  }, []);

  // Quando cambia l'indirizzo, rilegge i ruoli dal contratto
  useEffect(() => {
    if (!indirizzo) return;

    caricaRuoli(indirizzo)
      .then((ruoli) => setRuoliLetti({ indirizzo, ruoli }))
      .catch(() => setErroreRuoliPer(indirizzo));
  }, [indirizzo]);

  async function connetti() {
    const walletClient = getWalletClient();
    if (!walletClient) return;

    setStatoConnessione("in_corso");

    try {
      await passaASepolia();
      const [addr] = await walletClient.requestAddresses();
      setIndirizzo(addr);
      setStatoConnessione("inattivo");
    } catch (err) {
      const code = (err as { code?: number }).code;

      // 4001 = l'utente ha rifiutato in MetaMask
      setStatoConnessione(code === 4001 ? "rifiutata" : "errore");
    }
  }

  async function disconnetti() {
    // Chiede a MetaMask di dimenticare il permesso dato al sito,
    // così al prossimo caricamento non si riconnette da solo
    try {
      await window.ethereum?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch {
      // Versioni vecchie di MetaMask non lo supportano: pazienza
    }

    setIndirizzo(null);
    setStatoConnessione("inattivo");
  }

  const ruoli = ruoliLetti && ruoliLetti.indirizzo === indirizzo ? ruoliLetti.ruoli : null;

  const valore: Wallet = {
    haMetaMask,
    pronto: !haMetaMask || controllato,
    indirizzo,
    reteGiusta: rete === null || rete === SEPOLIA,
    idRete: rete ? parseInt(rete, 16) : null,
    ruoli,
    erroreRuoli: !!indirizzo && erroreRuoliPer === indirizzo && !ruoli,
    statoConnessione,
    connetti,
    disconnetti,
    passaASepolia,
  };

  return <WalletContext.Provider value={valore}>{children}</WalletContext.Provider>;
}

// Da usare nei componenti per leggere il wallet
export function useWallet() {
  const wallet = useContext(WalletContext);
  if (!wallet) {
    throw new Error("useWallet va usato dentro <WalletProvider>");
  }
  return wallet;
}
