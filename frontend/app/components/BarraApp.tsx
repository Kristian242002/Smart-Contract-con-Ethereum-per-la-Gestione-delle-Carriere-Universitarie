"use client";

// Barra in alto delle pagine riservate: logo, menu del ruolo, rete e badge del wallet.
// Su schermi piccoli il menu diventa un elenco a tendina (icona ☰).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconGiu, IconLinkEsterno, IconMenu } from "../icons";
import { abbrevia, coloreAvatar, linkIndirizzo } from "../utils";
import { useWallet, type Ruoli } from "../WalletProvider";
import BottoneCopia from "./BottoneCopia";
import Indirizzo from "./Indirizzo";
import Logo from "./Logo";

// Voci di menu per ogni ruolo
const MENU: Record<keyof Ruoli, { etichetta: string; href: string }[]> = {
  segreteria: [
    { etichetta: "Panoramica", href: "/segreteria" },
    { etichetta: "Professori", href: "/segreteria/professori" },
    { etichetta: "Studenti", href: "/segreteria/studenti" },
    { etichetta: "Corsi", href: "/segreteria/corsi" },
  ],
  professore: [{ etichetta: "I miei corsi", href: "/professore" }],
  studente: [
    { etichetta: "Carriera", href: "/studente" },
    { etichetta: "Esami da gestire", href: "/studente/esami" },
    { etichetta: "Profilo", href: "/studente/profilo" },
    { etichetta: "Il mio QR", href: "/studente/qr" },
  ],
};

const NOME_RUOLO: Record<keyof Ruoli, string> = {
  segreteria: "SEGRETERIA",
  professore: "PROFESSORE",
  studente: "STUDENTE",
};

export default function BarraApp({ ruolo }: { ruolo: keyof Ruoli }) {
  const { indirizzo, disconnetti } = useWallet();
  const percorso = usePathname();
  const [menuWallet, setMenuWallet] = useState(false);
  const [menuMobile, setMenuMobile] = useState(false);

  if (!indirizzo) return null;

  const voci = MENU[ruolo];
  const radice = voci[0].href; // es. "/segreteria"

  // Una voce è attiva se siamo nella sua pagina o in una sotto-pagina
  // (es. /segreteria/corsi/0x… accende "Corsi"). La prima voce solo se esatta.
  function attiva(href: string) {
    if (href === radice) return percorso === href;
    return percorso === href || percorso.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-bordo bg-white">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
        <div className="flex min-w-0 items-center gap-[22px]">
          <Logo />

          {/* Menu orizzontale (schermi grandi) */}
          <nav className="hidden gap-1 md:flex">
            {voci.map((v) => (
              <Link
                key={v.href}
                href={v.href}
                className={
                  "rounded-lg px-3.5 py-2 text-sm whitespace-nowrap " +
                  (attiva(v.href) ? "bg-accento-chiaro font-semibold text-accento" : "font-medium text-testo-3")
                }
              >
                {v.etichetta}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3.5">
          <span className="hidden items-center gap-1.5 text-xs text-testo-3 md:flex">
            <span className="h-[7px] w-[7px] rounded-full bg-verde" />
            Sepolia
          </span>

          {/* Badge del wallet con menu a tendina */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setMenuWallet(!menuWallet)}
              className="flex items-center gap-[9px] rounded-[10px] border border-bordo-medio bg-sfondo py-1.5 pr-2.5 pl-[7px]"
            >
              <span className="h-6 w-6 rounded-full" style={{ background: coloreAvatar(indirizzo) }} />
              <span className="font-mono text-[13px]">{abbrevia(indirizzo)}</span>
              <span className="text-[11px] font-bold tracking-[.03em]">{NOME_RUOLO[ruolo]}</span>
              <IconGiu className="h-3.5 w-3.5 text-muto" />
            </button>

            {menuWallet && (
              <>
                {/* Strato invisibile: cliccando fuori il menu si chiude */}
                <div className="fixed inset-0 z-20" onClick={() => setMenuWallet(false)} />

                <div className="absolute top-[calc(100%+8px)] right-0 z-30 w-[330px] rounded-[14px] border border-bordo bg-white p-4 shadow-[0_20px_50px_rgba(10,30,61,.16)]">
                  <p className="mb-1.5 text-[11px] font-semibold tracking-[.05em] text-muto">INDIRIZZO CONNESSO</p>
                  <p className="mb-2.5 font-mono text-xs leading-normal break-all">{indirizzo}</p>

                  <BottoneCopia
                    testo={indirizzo}
                    etichetta="Copia indirizzo"
                    className="py-[9px] text-[13px]"
                  />
                  <RigaMenu etichetta="Rete">
                    <span className="flex items-center gap-1.5">
                      <span className="h-[7px] w-[7px] rounded-full bg-verde" />
                      Sepolia
                    </span>
                  </RigaMenu>
                  <RigaMenu etichetta="Ruolo">{NOME_RUOLO[ruolo]}</RigaMenu>
                  <a
                    href={linkIndirizzo(indirizzo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border-t border-riga py-[9px] text-[13px] font-semibold text-accento"
                  >
                    Vedi su Etherscan <IconLinkEsterno className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={disconnetti}
                    className="w-full border-t border-riga pt-[9px] text-left text-[13px] font-semibold text-rosso"
                  >
                    Disconnetti
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Bottone ☰ (schermi piccoli) */}
          <button
            type="button"
            onClick={() => setMenuMobile(!menuMobile)}
            aria-label="Menu"
            className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-bordo-medio md:hidden"
          >
            <IconMenu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Menu a tendina (schermi piccoli) */}
      {menuMobile && (
        <div className="flex flex-col gap-0.5 border-t border-bordo px-3 pt-1.5 pb-3.5 md:hidden">
          {voci.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              onClick={() => setMenuMobile(false)}
              className={
                "flex min-h-11 items-center rounded-[9px] px-3 text-[15px] " +
                (attiva(v.href) ? "bg-accento-chiaro font-semibold text-accento" : "font-medium text-testo-3")
              }
            >
              {v.etichetta}
            </Link>
          ))}

          <div className="mt-1.5 flex items-center gap-[9px] rounded-[10px] bg-sfondo p-3">
            <span className="h-6 w-6 rounded-full" style={{ background: coloreAvatar(indirizzo) }} />
            <Indirizzo indirizzo={indirizzo} className="text-[13px]" />
            <span className="ml-auto text-[11px] font-bold">{NOME_RUOLO[ruolo]} · Sepolia</span>
          </div>
          <button
            type="button"
            onClick={disconnetti}
            className="flex min-h-11 items-center px-3 text-sm font-semibold text-rosso"
          >
            Disconnetti
          </button>
        </div>
      )}
    </header>
  );
}

// Riga "etichetta ........ valore" del menu del wallet
function RigaMenu({ etichetta, children }: { etichetta: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between border-t border-riga py-[9px] text-[13px]">
      <span className="text-testo-3">{etichetta}</span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}
