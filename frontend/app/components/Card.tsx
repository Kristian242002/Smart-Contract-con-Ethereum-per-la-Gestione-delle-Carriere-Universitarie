// Riquadro bianco con bordo: il contenitore base di ogni sezione

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: Props) {
  return (
    <div className={"rounded-[14px] border border-bordo bg-white p-[22px] " + className}>
      {children}
    </div>
  );
}
