import { marca } from "@/lib/marca";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
      <main className="flex w-full max-w-sm flex-1 flex-col">{children}</main>
      <footer className="mt-10 text-chico text-tinta-suave">{marca.derechos}</footer>
    </div>
  );
}
