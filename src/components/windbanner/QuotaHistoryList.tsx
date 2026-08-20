import type { WindbannerQuotaHistoryEntry } from "@/lib/windbanner-types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function QuotaHistoryList({ history }: { history: WindbannerQuotaHistoryEntry[] }) {
  if (history.length === 0) return <p className="text-sm text-slate-400">Nenhuma alteração de cota ainda.</p>;

  return (
    <ul className="space-y-2">
      {history.map((entry) => (
        <li key={entry.id} className="rounded-md border border-slate-200 bg-white p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">
              {entry.cotaAnterior ?? "—"} → {entry.cotaNova ?? "—"}
            </span>
            <span className="text-slate-400">{formatDateTime(entry.alteradoEm)}</span>
          </div>
          {entry.motivo && <p className="mt-0.5 text-slate-500">{entry.motivo}</p>}
        </li>
      ))}
    </ul>
  );
}
