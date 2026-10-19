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

export const CONTRACT_ADDRESS = "0xaEc4cfEC09220934c153e16784E5E92D173eE25A"; // indirizzo contratto universita

const opzioni = { timeout: 8000, retryCount: 1 };
const nodo = (url?: string) => http(url, opzioni);

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    nodo("https://ethereum-sepolia-rpc.publicnode.com"),
    nodo(), 
  ]),
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

// Funzioni del contratto Universita che scrivono dati 
type FunzioneScrittura = ContractFunctionName<typeof universitaAbi, "nonpayable">;

export async function scriviContratto<F extends FunzioneScrittura>(account: Indirizzo,functionName: F,args: ContractFunctionArgs<typeof universitaAbi, "nonpayable", F>) {
  const walletClient = getWalletClient();
  if (!walletClient) throw new Error("MetaMask non disponibile");
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
