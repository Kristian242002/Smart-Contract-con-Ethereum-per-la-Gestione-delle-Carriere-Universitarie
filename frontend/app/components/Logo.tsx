import Link from "next/link";

// Logo "Cattedra": rombo bianco su quadrato blu scuro. Cliccandolo si torna alla home.

export default function Logo({ sottotitolo }: { sottotitolo?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-navy">
        <span className="h-[11px] w-[11px] rotate-45 rounded-[2px] bg-white" />
      </span>
      <span>
        <span className="block font-heading text-lg font-bold leading-none text-navy">Cattedra</span>
        {sottotitolo && (
          <span className="mt-0.5 block font-mono text-[11px] whitespace-nowrap text-muto">
            {sottotitolo}
          </span>
        )}
      </span>
    </Link>
  );
}
