import {
  createPublicClient,
  createWalletClient,
  custom,
  fallback,
  http,
  type ContractFunctionArgs,
  type ContractFunctionName,
  type SimulateContractParameters,
  type WriteContractParameters,
} from "viem";
import { sepolia } from "viem/chains";
import { universitaAbi } from "./abi";
import type { Indirizzo } from "./utils";

export const CONTRACT_ADDRESS = "0x1fFf2f10994573d2AC59de2769b4612C445825D1";

// Nodi pubblici di Sepolia: si usa il primo, se non risponde si passa al secondo.
// timeout/retryCount: se un nodo è lento non aspettiamo decine di secondi.
const nodo = (url?: string) => http(url, { timeout: 8_000, retryCount: 1 });

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    nodo("https://ethereum-sepolia-rpc.publicnode.com"),
    nodo(), // nodo predefinito di viem (thirdweb)
  ]),
  // Le letture fatte nello stesso momento vengono unite in UNA sola richiesta
  // tramite il contratto Multicall3 (già presente su Sepolia)
  batch: { multicall: true },
});

export function getWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }

  return createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  });
}

// Funzioni del contratto Universita che scrivono dati (richiedono una firma)
type FunzioneScrittura = ContractFunctionName<typeof universitaAbi, "nonpayable">;

// Chiama una funzione di scrittura del contratto Universita.
// 1. la SIMULA: se il contratto la rifiuterebbe (require non rispettato) si ferma subito
//    con il messaggio del contratto, senza aprire MetaMask e senza spendere gas;
// 2. se la simulazione va bene, chiede la firma in MetaMask e invia la transazione.
// Restituisce l'hash della transazione.
export async function scriviContratto<F extends FunzioneScrittura>(
  account: Indirizzo,
  functionName: F,
  args: ContractFunctionArgs<typeof universitaAbi, "nonpayable", F>
) {
  const walletClient = getWalletClient();
  if (!walletClient) throw new Error("MetaMask non disponibile");

  // Chi chiama questa funzione ha nome e parametri controllati da TypeScript.
  // Qui dentro i tipi di viem sono troppo complessi da seguire: li forziamo noi.
  const parametri = {
    address: CONTRACT_ADDRESS,
    abi: universitaAbi,
    functionName,
    args,
    account,
  } as unknown as SimulateContractParameters;

  const { request } = await publicClient.simulateContract(parametri);
  return walletClient.writeContract(request as unknown as WriteContractParameters);
}
