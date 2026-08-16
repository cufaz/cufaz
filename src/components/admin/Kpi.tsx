export function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const len = value ? value.length : 0;
  const fontClass =
    len > 13
      ? "text-xs sm:text-xs md:text-sm font-extrabold tracking-tight"
      : len > 9
      ? "text-xs sm:text-sm md:text-base font-extrabold tracking-tight"
      : "text-base sm:text-lg md:text-xl font-extrabold tracking-tight";

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4 flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-colors">
      <div>
        <p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-muted-foreground sm:text-[11px] truncate" title={label}>
          {label}
        </p>
        <p
          className={`mt-1.5 text-foreground whitespace-nowrap overflow-hidden text-ellipsis ${fontClass}`}
          title={value}
        >
          {value}
        </p>
      </div>
      {hint ? (
        <p className="mt-1.5 break-words text-[10px] sm:text-[11px] leading-tight text-muted-foreground font-medium">{hint}</p>
      ) : null}
    </div>
  );
}
