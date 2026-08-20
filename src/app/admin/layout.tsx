import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/admin" className="text-sm font-semibold text-slate-900">
            Admin
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
            ← Mapa
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
