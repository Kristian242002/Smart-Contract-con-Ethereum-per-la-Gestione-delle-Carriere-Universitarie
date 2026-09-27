// Funzioni di supporto usate in tutte le pagine

export type Indirizzo = `0x${string}`;

const ETHERSCAN = "https://sepolia.etherscan.io";

// 0x1234567890abcdef... -> 0x1234…cdef
export function abbrevia(indirizzo: string) {
  return indirizzo.slice(0, 6) + "…" + indirizzo.slice(-4);
}

// Controlla che il testo sia un indirizzo: 0x + 40 caratteri esadecimali
export function indirizzoValido(testo: string): testo is Indirizzo {
  return /^0x[0-9a-fA-F]{40}$/.test(testo);
}

// Link a Etherscan (rete Sepolia)
export function linkIndirizzo(indirizzo: string) {
  return ETHERSCAN + "/address/" + indirizzo;
}

export function linkTransazione(hash: string) {
  return ETHERSCAN + "/tx/" + hash;
}

// Il contratto salva "30 e lode" come 31
export function mostraVoto(voto: number | bigint) {
  const n = Number(voto);
  return n === 31 ? "30L" : String(n);
}

// "Maria", "Rossi" -> "MR"
export function iniziali(nome: string, cognome: string) {
  return (nome.charAt(0) + cognome.charAt(0)).toUpperCase();
}

// Colore dell'avatar calcolato dall'indirizzo:
// lo stesso indirizzo ha sempre lo stesso colore
export function coloreAvatar(indirizzo: string) {
  const numero = parseInt(indirizzo.slice(-6), 16) || 0;
  const tinta1 = numero % 360;
  const tinta2 = (tinta1 + 55) % 360;
  return `linear-gradient(135deg, hsl(${tinta1} 62% 58%), hsl(${tinta2} 58% 40%))`;
}
