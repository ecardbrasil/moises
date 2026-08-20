interface StatCardsProps {
  totalVotos: number;
  meta2026: number;
  cargo2024: string;
  cargo2026: string;
}

export default function StatCards({ totalVotos, meta2026, cargo2024, cargo2026 }: StatCardsProps) {
  const multiplicador = meta2026 / totalVotos;

  const cards = [
    { label: `Votos ${cargo2024} (2024)`, value: totalVotos.toLocaleString("pt-BR") },
    { label: `Meta ${cargo2026} (2026)`, value: meta2026.toLocaleString("pt-BR") },
    { label: "Multiplicador necessário", value: `${multiplicador.toFixed(2)}x` },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm"
        >
          <div className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight">{c.label}</div>
          <div className="mt-1 text-lg sm:text-2xl font-bold text-slate-900 tabular-nums">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
