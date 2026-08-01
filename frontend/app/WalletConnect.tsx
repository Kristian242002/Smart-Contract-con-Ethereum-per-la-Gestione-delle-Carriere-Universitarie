"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CONTRACT_ADDRESS, getWalletClient, publicClient } from "./client";
import { universitaAbi } from "./abi";
import {
  IconArrowRight,
  IconBookOpen,
  IconCheck,
  IconGraduationCap,
  IconLandmark,
} from "./icons";

const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

type Roles = {
  segreteria: boolean;
  professore: boolean;
  studente: boolean;
};

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

async function ensureSepolia() {
  if (!window.ethereum) return;

  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (chainId === SEPOLIA_CHAIN_ID_HEX) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SEPOLIA_CHAIN_ID_HEX,
            chainName: "Sepolia",
            nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export default function WalletConnect() {
  const router = useRouter();
  const [hasMetaMask, setHasMetaMask] = useState(true);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Roles | null>(null);

  const loadRoles = useCallback(async (addr: string) => {
    const [segreteriaRole, professoreRole, studenteRole] = await Promise.all([
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: universitaAbi,
        functionName: "SEGRETERIA_ROLE",
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: universitaAbi,
        functionName: "PROFESSORE_ROLE",
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: universitaAbi,
        functionName: "STUDENTE_ROLE",
      }),
    ]);

    const [segreteria, professore, studente] = await Promise.all([
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: universitaAbi,
        functionName: "hasRole",
        args: [segreteriaRole, addr as `0x${string}`],
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: universitaAbi,
        functionName: "hasRole",
        args: [professoreRole, addr as `0x${string}`],
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: universitaAbi,
        functionName: "hasRole",
        args: [studenteRole, addr as `0x${string}`],
      }),
    ]);

    setRoles({ segreteria, professore, studente });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      setHasMetaMask(false);
      return;
    }

    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const list = accounts as string[];
        if (list.length > 0) setAddress(list[0]);
      })
      .catch(() => {});

    const handleAccountsChanged = (accounts: unknown) => {
      const list = accounts as string[];
      setAddress(list.length > 0 ? list[0] : null);
      setRoles(null);
    };
    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (address) {
      loadRoles(address).catch(() => setRoles(null));
    }
  }, [address, loadRoles]);

  const connect = async () => {
    const walletClient = getWalletClient();
    if (!walletClient) {
      setHasMetaMask(false);
      return;
    }

    setError(null);
    setConnecting(true);
    try {
      await ensureSepolia();
      const [addr] = await walletClient.requestAddresses();
      setAddress(addr);
    } catch (err) {
      const code = (err as { code?: number })?.code;
      setError(
        code === 4001
          ? "Connessione rifiutata dal wallet."
          : "Impossibile connettersi al wallet. Riprova."
      );
    } finally {
      setConnecting(false);
    }
  };

  const ruoloRilevato = roles
    ? roles.segreteria
      ? "Segreteria"
      : roles.professore
        ? "Professore"
        : roles.studente
          ? "Studente"
          : null
    : null;

  return (
    <div className="w-full max-w-[560px] rounded-sm bg-white p-9 shadow-[0_1px_3px_rgba(10,30,61,.10),0_10px_34px_rgba(10,30,61,.07)]">
      <h1 className="mb-1.5 font-heading text-2xl font-bold text-[#0A1E3D]">
        Connetti il tuo wallet
      </h1>
      <p className="mb-[26px] text-[15px] text-[#5A6B85]">
        Il ruolo viene rilevato automaticamente dal contratto in base al tuo indirizzo.
      </p>

      {!hasMetaMask && (
        <div className="mb-6 rounded-xl border border-[#F3D2CE] bg-[#FDF6F5] p-4 text-sm text-[#C0392B]">
          MetaMask non è stato rilevato nel browser.{" "}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            Installa l&apos;estensione
          </a>{" "}
          per continuare.
        </div>
      )}

      {hasMetaMask && !address && (
        <button
          type="button"
          onClick={connect}
          disabled={connecting}
          className="mb-6 flex w-full items-center gap-[13px] rounded-[13px] border-[1.5px] border-[#F6851B] bg-[#FFF9F2] px-[18px] py-4 text-left transition-opacity disabled:opacity-60"
        >
          <span className="h-[34px] w-[34px] rotate-45 rounded-[9px] bg-[#F6851B]" />
          <span className="flex-1">
            <span className="block text-base font-semibold text-[#0A1E3D]">
              {connecting ? "Connessione in corso…" : "Connetti MetaMask"}
            </span>
            <span className="block text-[13px] text-[#9A6A2E]">
              Estensione rilevata nel browser
            </span>
          </span>
          <IconArrowRight className="h-5 w-5 shrink-0 text-[#F6851B]" />
        </button>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-[#F3D2CE] bg-[#FDF6F5] px-4 py-3 text-sm text-[#C0392B]">
          {error}
        </div>
      )}

      {address && (
        <>
          <div className="mb-[18px] flex items-center gap-3">
            <div className="h-px flex-1 bg-[#ECEFF4]" />
            <span className="font-mono text-xs text-[#8392AB]">
              WALLET CONNESSO
            </span>
            <div className="h-px flex-1 bg-[#ECEFF4]" />
          </div>

          <div className="mb-[22px] flex items-center gap-[11px] rounded-[11px] bg-[#F4F6FA] px-[15px] py-[13px]">
            <span className="h-[9px] w-[9px] rounded-full bg-[#22A557] shadow-[0_0_0_4px_rgba(34,165,87,.16)]" />
            <span className="flex-1 font-mono text-sm text-[#0A1E3D]">
              {truncateAddress(address)}
            </span>
            <span className="rounded-[7px] bg-[#E7F6EC] px-[9px] py-1 text-xs font-semibold text-[#1B7A43]">
              Connesso
            </span>
          </div>

          <div className="mb-[11px] text-[13px] font-semibold tracking-[0.04em] text-[#8392AB]">
            RUOLO RILEVATO
          </div>
          <div className="mb-[26px] flex flex-col gap-[9px]">
            {[
              { key: "segreteria", label: "Segreteria", Icon: IconLandmark, active: roles?.segreteria },
              { key: "professore", label: "Professore", Icon: IconGraduationCap, active: roles?.professore },
              { key: "studente", label: "Studente", Icon: IconBookOpen, active: roles?.studente },
            ].map((r) => (
              <div
                key={r.key}
                className={
                  r.active
                    ? "flex items-center gap-[11px] rounded-[11px] border-[1.5px] border-[#2D6BE4] bg-[#F5F9FF] px-[15px] py-[13px]"
                    : "flex items-center gap-[11px] rounded-[11px] border border-[#ECEFF4] px-[15px] py-[13px] opacity-55"
                }
              >
                <r.Icon
                  className={r.active ? "h-[18px] w-[18px] text-[#0A1E3D]" : "h-[18px] w-[18px] text-[#3A4D6B]"}
                />
                <span
                  className={
                    r.active
                      ? "flex-1 text-[15px] font-semibold text-[#0A1E3D]"
                      : "flex-1 text-[15px] font-semibold text-[#3A4D6B]"
                  }
                >
                  {r.label}
                </span>
                {r.active && <IconCheck className="h-[18px] w-[18px] text-[#2D6BE4]" />}
              </div>
            ))}
            {roles && !ruoloRilevato && (
              <p className="text-sm text-[#8392AB]">
                Nessun ruolo trovato per questo indirizzo nel contratto Università.
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={!ruoloRilevato}
            onClick={() => {
              if (ruoloRilevato === "Segreteria") router.push("/segreteria");
            }}
            className="flex w-full items-center justify-center gap-[9px] rounded-xl bg-[#2D6BE4] py-[15px] text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {ruoloRilevato ? (
              <>
                {`Vai alla dashboard ${ruoloRilevato}`}
                <IconArrowRight className="h-[18px] w-[18px]" />
              </>
            ) : (
              "Ruolo non riconosciuto"
            )}
          </button>
        </>
      )}
    </div>
  );
}
