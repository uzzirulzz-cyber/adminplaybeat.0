"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, PageLoader } from "@/components/admin/shell";
import { ErrorBanner, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, fmtDate } from "@/lib/admin-api";
import { toast } from "sonner";
import { RefreshCw, Send } from "lucide-react";

type Inquiry = {
  id: string;
  serviceId?: string;
  serviceName?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  companyName?: string;
  notes?: string;
  capiLeadId?: string;
  status?: string;
  createdAt?: string;
  capi?: any;
  tiktok?: any;
};

const STATUSES = ["NEW", "CONTACTED", "WON", "LOST"];

function InquiriesInner() {
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await api<{ serviceInquiries: Inquiry[] }>("/api/admin/catalog");
      setInquiries(res.serviceInquiries || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load inquiries.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    try {
      await api("/api/admin/inquiries/" + encodeURIComponent(id), {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(id + " marked " + status + ".");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Status update failed.");
    }
  }

  async function resend(id: string, rail: "capi" | "tiktok") {
    try {
      await api("/api/admin/inquiries/" + encodeURIComponent(id) + "/" + rail, { method: "POST" });
      toast.success(id + " lead re-sent to " + (rail === "capi" ? "Meta CAPI" : "TikTok Events API") + ".");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Re-send failed.");
    }
  }

  if (inquiries === null && !error) return <PageLoader />;

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {(inquiries || []).length + " service inquiry(ies)"}
        </p>
        <Button variant="outline" size="sm" className="border-border text-muted-foreground" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {inquiries && inquiries.length === 0 ? (
        <Card className="border-dashed border-border/70 bg-card/60">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No inquiries yet. Leads from the storefront services forms land here.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {(inquiries || []).map((iq) => (
          <Card key={iq.id} className="border-border/70 bg-card/80">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-foreground">{iq.id}</span>
                <StatusBadge status={iq.status || "NEW"} />
                <span className="ml-auto text-[11px] text-muted-foreground">{fmtDate(iq.createdAt || "")}</span>
              </div>
              <p className="mt-2 text-sm text-foreground/90">
                {iq.serviceName}
                {iq.companyName ? <span className="text-muted-foreground"> · {iq.companyName}</span> : null}
              </p>
              <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                <p>
                  {iq.customerName} · {iq.customerEmail}
                  {iq.customerPhone ? " · " + iq.customerPhone : ""}
                </p>
                {iq.notes ? <p className="text-foreground/70">“{iq.notes}”</p> : null}
                <p className="font-mono text-[10px]">
                  capiLeadId {iq.capiLeadId || "—"} · capi{" "}
                  {iq.capi?.delivered ? "delivered" : iq.capi?.error ? "error" : "pending"} · tiktok{" "}
                  {iq.tiktok?.delivered ? "delivered" : iq.tiktok?.error ? "error" : "pending"}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Select value={iq.status || "NEW"} onValueChange={(v) => setStatus(iq.id, v)}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-muted-foreground"
                  onClick={() => resend(iq.id, "capi")}
                >
                  <Send className="h-3.5 w-3.5" /> CAPI
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-muted-foreground"
                  onClick={() => resend(iq.id, "tiktok")}
                >
                  <Send className="h-3.5 w-3.5" /> TikTok
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function InquiriesPage() {
  return (
    <AdminShell title="Inquiries">
      <InquiriesInner />
    </AdminShell>
  );
}
