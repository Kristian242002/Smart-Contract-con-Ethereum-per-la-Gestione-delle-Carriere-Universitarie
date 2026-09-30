"use client";

// Studente · Il mio QR
// Il QR contiene il link alla pagina pubblica di verifica: /verifica/<indirizzo studente>.
// Chi lo scansiona vede la carriera letta dalla blockchain, senza bisogno di un wallet.

import QRCode from "qrcode";
import { useAzioni } from "../../AzioniProvider";
import { useCarriera } from "../../CarrieraProvider";
import Scheletro from "../../components/Scheletro";
import { IconCopia } from "../../icons";
import { useDati } from "../../useDati";

export default function IlMioQr() {
  const { carriera } = useCarriera();
  const { toast } = useAzioni();

  // Link completo, es. http://localhost:3000/verifica/0x4D8e…
  const link = carriera ? `${window.location.origin}/verifica/${carriera.studente}` : "";

  // Immagine PNG del QR (come data URL) generata dalla libreria qrcode
  const { dati: immagine } = useDati(
    () =>
      link
        ? QRCode.toDataURL(link, { width: 440, margin: 1, color: { dark: "#0A1E3D", light: "#FFFFFF" } })
        : Promise.resolve(""),
    [link]
  );

  async function copiaLink() {
    await navigator.clipboard.writeText(link);
    toast("Link di verifica copiato");
  }

  function scarica() {
    if (!immagine || !carriera) return;
    const a = document.createElement("a");
    a.href = immagine;
    a.download = `cattedra-qr-${carriera.studente.slice(0, 8)}.png`;
    a.click();
    toast("QR scaricato");
  }

  async function condividi() {
    // Sul telefono apre il menu di condivisione; sul computer spesso non c'è: copiamo il link
    if (navigator.share) {
      await navigator.share({ title: "Verifica carriera · Cattedra", url: link }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(link);
      toast("Condivisione non disponibile: link copiato");
    }
  }

  const bottone =
    "flex min-h-11 flex-[1_1_110px] items-center justify-center gap-[7px] rounded-[10px] text-sm font-semibold";

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[460px] rounded-[18px] border border-bordo bg-white p-[26px] text-center">
        <h1 className="mb-1 font-heading text-[22px] font-bold">Il mio QR</h1>
        <p className="mb-5 text-sm leading-normal text-testo-3">
          Chi lo scansiona apre la pagina di verifica pubblica della tua carriera, senza wallet.
        </p>

        <div className="mb-3.5 inline-flex rounded-[14px] border border-bordo bg-white p-3.5">
          {immagine ? (
            // eslint-disable-next-line @next/next/no-img-element -- è un data URL generato nel browser
            <img src={immagine} alt="QR per la verifica della carriera" className="block h-[220px] w-[220px]" />
          ) : (
            <Scheletro className="h-[220px] w-[220px]" />
          )}
        </div>

        <p className="mb-4 rounded-[9px] bg-sfondo px-3 py-2.5 font-mono text-xs leading-normal break-all text-testo-2">
          {link || "…"}
        </p>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={scarica} className={bottone + " bg-accento text-white"}>
            ⬇ Scarica PNG
          </button>
          <button type="button" onClick={copiaLink} className={bottone + " border border-bordo-forte bg-white"}>
            <IconCopia className="h-[15px] w-[15px]" /> Copia link
          </button>
          <button type="button" onClick={condividi} className={bottone + " border border-bordo-forte bg-white"}>
            ↗ Condividi
          </button>
        </div>
      </div>
    </div>
  );
}
