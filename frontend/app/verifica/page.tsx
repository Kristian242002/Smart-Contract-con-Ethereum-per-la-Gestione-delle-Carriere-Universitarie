import FormVerifica from "../components/FormVerifica";

export default function Verifica() {
  return (
    <div>
      <h1 className="mb-1 font-heading text-[26px] font-bold">Verifica una carriera</h1>
      <p className="mb-[18px] text-sm leading-normal text-testo-3">
        Incolla l&apos;indirizzo wallet dello studente qua:
      </p>
      <FormVerifica />
      <p className="text-[13px] leading-normal text-muto">
        Non serve un wallet né un account. Se hai ricevuto un QR da uno studente, scansionalo e si apre direttamente la
        sua pagina di verifica.
      </p>
    </div>
  );
}
