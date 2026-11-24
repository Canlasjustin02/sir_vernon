import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { WashingMachine } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <header className="flex flex-col items-center bg-slate-50 px-8 py-7">
          <Link
            to="/"
            aria-label="EcoShine home"
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md"
          >
            <WashingMachine className="h-6 w-6" />
          </Link>
          <p className="text-xl font-bold text-slate-900">EcoShine</p>
          <p className="mt-1 text-sm text-slate-500">{title}</p>
        </header>
        <div className="px-6 py-7 sm:px-8">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </section>
    </main>
  );
}
