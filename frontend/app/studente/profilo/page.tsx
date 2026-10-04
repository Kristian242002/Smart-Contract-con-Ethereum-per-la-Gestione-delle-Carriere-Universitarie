"use client";

// Studente · Profilo
// Nome e cognome sono nel contratto carriera. Il contratto ha DUE funzioni separate
// (aggiornaNome, aggiornaCognome): se cambiano entrambi servono due firme.

import { useState } from "react";
import { useAzioni, type Passo } from "../../AzioniProvider";
import { useCarriera } from "../../CarrieraProvider";
import { scriviContratto } from "../../client";
import Avviso from "../../components/Avviso";
import Bottone from "../../components/Bottone";
import Campo from "../../components/Campo";
import Card from "../../components/Card";
import ErroreLettura from "../../components/ErroreLettura";
import Indirizzo from "../../components/Indirizzo";
import Scheletro from "../../components/Scheletro";
import { useWallet } from "../../WalletProvider";

export default function Profilo() {
  const { indirizzo: io } = useWallet();
  const { carriera, errore, ricarica } = useCarriera();
  const { esegui } = useAzioni();

  // null = nessuna modifica in corso: i campi mostrano i valori del contratto
  const [modifica, setModifica] = useState<{ nome: string; cognome: string } | null>(null);

  if (errore) return <ErroreLettura onRiprova={ricarica} />;
  if (!carriera) return <Scheletro className="h-[360px] max-w-[580px] rounded-2xl" />;

  const campi = modifica ?? { nome: carriera.nome, cognome: carriera.cognome };
  const nome = campi.nome.trim();
  const cognome = campi.cognome.trim();
  const cambiaNome = nome !== carriera.nome;
  const cambiaCognome = cognome !== carriera.cognome;
  const firme = (cambiaNome ? 1 : 0) + (cambiaCognome ? 1 : 0);

  let motivo = "";
  if (!nome || !cognome) motivo = "Nome e cognome non possono essere vuoti";
  else if (firme === 0) motivo = "Nessuna modifica";

  async function salva() {
    if (!io || motivo) return;

    // Un passo (una firma) per ogni campo modificato
    const passi: Passo[] = [];
    if (cambiaNome) {
      passi.push({ etichetta: "aggiornaNome → " + nome, invia: () => scriviContratto(io, "aggiornaNome", [nome]) });
    }
    if (cambiaCognome) {
      passi.push({
        etichetta: "aggiornaCognome → " + cognome,
        invia: () => scriviContratto(io, "aggiornaCognome", [cognome]),
      });
    }

    const ok = await esegui(passi, "Profilo aggiornato");
    if (ok) {
      setModifica(null);
      ricarica();
    } else {
      // Se una firma è andata e l'altra no, rileggiamo per mostrare lo stato reale
      ricarica();
    }
  }

  return (
    <div className="max-w-[580px]">
      <h1 className="mb-1 font-heading text-[26px] font-bold">Profilo</h1>
      <p className="mb-5 text-sm text-testo-3">Nome e cognome sono salvati nel tuo contratto carriera.</p>

      <Card className="flex flex-col gap-4 rounded-2xl p-6!">
        <div className="flex flex-wrap gap-3">
          <Campo
            etichetta="Nome"
            valore={campi.nome}
            onCambia={(v) => setModifica({ ...campi, nome: v })}
            className="flex-[1_1_180px]"
          />
          <Campo
            etichetta="Cognome"
            valore={campi.cognome}
            onCambia={(v) => setModifica({ ...campi, cognome: v })}
            className="flex-[1_1_180px]"
          />
        </div>

        {firme === 2 && (
          <Avviso tipo="attenzione">
            Hai modificato nome e cognome: <b>ti verranno chieste 2 firme</b> (aggiornaNome, poi aggiornaCognome).
          </Avviso>
        )}
        {firme === 1 && (
          <p className="text-[13px] text-testo-3">
            1 firma per <span className="font-mono">{cambiaNome ? "aggiornare il Nome" : "aggiornare il Cognome"}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2.5">
          <Bottone onClick={salva} disabilitato={!!motivo} motivo={motivo} className="flex-[1_1_200px]">
            Salva modifiche
          </Bottone>
          <Bottone variante="secondario" onClick={() => setModifica(null)}>
            Annulla
          </Bottone>
        </div>

        <div className="flex flex-col gap-3 border-t border-riga pt-3.5 text-[13px]">
          <div className="flex justify-between gap-2.5">
            <span className="text-testo-3">Indirizzo wallet</span>
            <Indirizzo indirizzo={carriera.studente} />
          </div>
          <div className="flex justify-between gap-2.5">
            <span className="text-testo-3">Tipo di laurea</span>
            <span className="text-right">
              <span className="font-semibold">
                {carriera.tipo === "TRIENNALE" ? "Laurea triennale" : "Laurea magistrale"}
              </span>
              <br />
              <span className="text-xs text-muto">stabilito dalla segreteria, non modificabile</span>
            </span>
          </div>
          <div className="flex justify-between gap-2.5">
            <span className="text-testo-3">Contratto carriera</span>
            <Indirizzo indirizzo={carriera.contratto} etherscan />
          </div>
        </div>
      </Card>
    </div>
  );
}
