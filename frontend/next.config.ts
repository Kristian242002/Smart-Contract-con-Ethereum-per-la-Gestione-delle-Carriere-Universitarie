import type { NextConfig } from "next";
import { networkInterfaces } from "os";

// Indirizzi IPv4 del computer nella rete locale (es. 192.168.178.124).
// Li leggiamo all'avvio, così funziona su qualsiasi PC (fisso, portatile…)
// senza dover scrivere l'indirizzo a mano.
function indirizziLocali() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((rete) => rete && rete.family === "IPv4" && !rete.internal)
    .map((rete) => rete!.address);
}

const nextConfig: NextConfig = {
  devIndicators: false,

  // In sviluppo Next accetta richieste solo da "localhost".
  // Aggiungiamo gli indirizzi del PC nella rete locale, così il sito (e il QR)
  // si possono aprire anche dal telefono collegato allo stesso Wi-Fi.
  allowedDevOrigins: indirizziLocali(),
};

export default nextConfig;
