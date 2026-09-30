import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // In sviluppo Next accetta richieste solo da "localhost".
  // Aggiungiamo l'indirizzo del PC nella rete di casa, così il sito (e il QR)
  // si possono aprire anche dal telefono collegato allo stesso Wi-Fi.
  // Se il router assegna al PC un indirizzo diverso, va aggiornato qui.
  allowedDevOrigins: ["192.168.178.124"],
};

export default nextConfig;
