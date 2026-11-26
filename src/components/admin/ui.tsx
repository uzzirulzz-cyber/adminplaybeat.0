"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_STYLES: Record<string, string> = {
  PENDING_VERIFICATION: "bg-lightwarning text-warning border-warning/40",
  AWAITING_PAYMENT: "bg-lightwarning text-warning border-warning/40",
  COMPLETED: "bg-lightsuccess text-success border-success/40",
  DELIVERED: "bg-lightsuccess text-success border-success/40",
  PAID: "bg-lightsuccess text-success border-success/40",
  WON: "bg-lightsuccess text-success border-success/40",
  NEW: "bg-lightprimary text-primary border-primary/40",
  CONTACTED: "bg-lightinfo text-info border-info/40",
  CANCELLED: "bg-lighterror text-error border-error/40",
  FAILED: "bg-lighterror text-error border-error/40",
  LOST: "bg-lighterror text-error border-error/40",
};

export function StatusBadge({ status }: { status: string }) {
  const s = String(status || "—");
  const cls = STATUS_STYLES[s] || "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={"font-mono text-[11px] px-2 py-0.5 " + cls}>
      {s}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  // Legacy accent hex values map to the Modernize palette
  const ACCENT_MAP: Record<string, string> = {
    "#4cc2a9": "text-success",
    "#13deb9": "text-success",
    "#7f9bff": "text-primary",
    "#5d87ff": "text-primary",
    "#f2c46d": "text-warning",
    "#f6b51e": "text-warning",
    "#e57ea1": "text-info",
    "#8754ec": "text-info",
    "#e5484d": "text-error",
    "#ef4444": "text-error",
  };
  const tone = accent ? ACCENT_MAP[accent.toLowerCase()] || "text-primary" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className={"mt-1.5 text-2xl font-bold tracking-tight " + tone}>
          {value}
        </p>
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}

export function Dot({ ok }: { ok: boolean | null }) {
  if (ok === null || ok === undefined)
    return <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/50" />;
  return (
    <span
      className={
        "inline-block h-2 w-2 rounded-full " +
        (ok ? "bg-success shadow-[0_0_6px_rgba(19,222,185,0.7)]" : "bg-error/80")
      }
    />
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-error/40 bg-lighterror px-4 py-3 text-sm text-error">
      {message}
    </div>
  );
}

export function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-muted-foreground whitespace-nowrap">{k}</dt>
          <dd className="text-foreground/90 break-all font-mono text-[13px]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function YesNo({ v }: { v: boolean | undefined | null }) {
  if (v === undefined || v === null) return <span className="text-muted-foreground">—</span>;
  return v ? (
    <span className="text-success">yes</span>
  ) : (
    <span className="text-error">no</span>
  );
}
