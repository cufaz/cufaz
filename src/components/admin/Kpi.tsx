export function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4">
      <p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-muted-foreground sm:text-[11px]">
        {label}
      </p>
      <p className="mt-1 num-fit font-bold text-foreground">{value}</p>
      {hint ? (
        <p className="mt-1 break-words text-[11px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
