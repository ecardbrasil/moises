interface QuotaBarProps {
  used: number;
  cota: number | null;
}

export default function QuotaBar({ used, cota }: QuotaBarProps) {
  if (cota == null) {
    return <p className="text-xs text-slate-400">{used} pontos — sem cota definida</p>;
  }

  const pct = cota > 0 ? Math.min(100, (used / cota) * 100) : used > 0 ? 100 : 0;
  const over = used > cota;

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className={over ? "font-medium text-amber-700" : "text-slate-500"}>
          {used} / {cota} windbanners
        </span>
        {over && <span className="font-medium text-amber-700">acima da cota</span>}
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${over ? "bg-amber-500" : "bg-slate-900"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
