import { coloreAvatar } from "../utils";

// Cerchio colorato generato dall'indirizzo.
// Per gli studenti si passano le iniziali; i professori non hanno un nome.

type Props = {
  indirizzo: string;
  testo?: string;
  dimensione?: number;
};

export default function Avatar({ indirizzo, testo, dimensione = 36 }: Props) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-heading font-semibold text-white"
      style={{
        width: dimensione,
        height: dimensione,
        fontSize: dimensione * 0.37,
        background: coloreAvatar(indirizzo),
      }}
    >
      {testo}
    </div>
  );
}
