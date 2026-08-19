import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { formatPercent, type RankRow } from "@/lib/report";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: number | string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <Card
      className={cn(
        "gap-0 p-4",
        emphasis && "bg-primary text-primary-foreground border-primary",
      )}
    >
      <p
        className={cn(
          "text-[11px] tracking-[0.12em] uppercase",
          emphasis ? "text-primary-foreground/75" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p className={cn("stat-value mt-2", emphasis ? "text-4xl" : "text-3xl")}>{value}</p>
      {hint && (
        <p
          className={cn(
            "mt-1 text-xs",
            emphasis ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      )}
    </Card>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden p-0", className)}>
      <div className="bg-surface flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="doc-title text-surface-foreground text-sm">{title}</h2>
          {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

export function RankTable({
  rows,
  firstColumn,
  limit,
  emptyText = "Nenhum registro.",
}: {
  rows: RankRow[];
  firstColumn: string;
  limit?: number;
  emptyText?: string;
}) {
  const visible = limit ? rows.slice(0, limit) : rows;
  if (rows.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">{emptyText}</p>;
  }
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-b text-[11px] tracking-wider uppercase">
            <th className="py-2 text-left font-medium">{firstColumn}</th>
            <th className="w-16 py-2 text-right font-medium">Qt</th>
            <th className="w-20 py-2 text-right font-medium">%</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.name} className="border-border/60 border-b last:border-0">
              <td className="py-2 pr-2">
                <span className="block truncate">{row.name}</span>
                <span className="bg-border mt-1 block h-1 w-full max-w-56 overflow-hidden rounded-full">
                  <span
                    className="bg-primary block h-full rounded-full"
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </span>
              </td>
              <td className="num py-2 text-right font-medium">{row.count}</td>
              <td className="num text-muted-foreground py-2 text-right">
                {formatPercent(row.percent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {limit && rows.length > limit && (
        <p className="text-muted-foreground mt-3 text-xs">
          Exibindo {limit} de {rows.length} itens.
        </p>
      )}
    </div>
  );
}

export function LoadingBlock({ label = "Carregando…" }: { label?: string }) {
  return <p className="text-muted-foreground py-10 text-center text-sm">{label}</p>;
}

export function ErrorBlock({ label = "Erro ao comunicar com o banco de dados." }) {
  return <p className="text-destructive py-10 text-center text-sm">{label}</p>;
}

export function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground rounded-md border border-dashed py-10 text-center text-sm">
      {label}
    </div>
  );
}
