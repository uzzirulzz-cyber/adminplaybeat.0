"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, PageLoader } from "@/components/admin/shell";
import { StatusBadge, ErrorBanner } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, fmtDate, fmtUsd } from "@/lib/admin-api";
import { toast } from "sonner";
import { Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

type OrderItem = {
  sku: string;
  name: string;
  platform?: string;
  quantity: number;
  unitPriceUsd: number;
  unitPricePkr: number;
};

type Order = {
  orderId: string;
  createdAt: string;
  updatedAt: string;
  customerEmail: string;
  customerMobile: string;
  customerUid: string;
  paymentRail: string;
  manualChannel: string;
  manualReference: string;
  manualSenderAccount: string;
  currency: string;
  totalUsd: number;
  totalPkr: number;
  status: string;
  statusDetail: string;
  items: OrderItem[];
  issuedKeys: string[];
};

const MANUAL_CHANNELS = [
  "Bank Transfer (IBAN)",
  "Easypaisa",
  "JazzCash",
  "USDT (TRC-20)",
  "Cash on Delivery",
];

function ManualOrderDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [channel, setChannel] = useState(MANUAL_CHANNELS[0]);
  const [reference, setReference] = useState("");
  const [sender, setSender] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [rows, setRows] = useState([{ sku: "", qty: 1 }]);
  const [busy, setBusy] = useState(false);

  async function create() {
    const items = rows
      .map((r) => ({ sku: r.sku.trim(), quantity: Math.max(1, Number(r.qty) || 1) }))
      .filter((r) => r.sku);
    if (!email.includes("@")) {
      toast.error("Valid customer email is required.");
      return;
    }
    if (!items.length) {
      toast.error("Add at least one SKU.");
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ order: Order }>("/api/orders/manual", {
        method: "POST",
        body: JSON.stringify({
          items,
          customerEmail: email.trim(),
          customerMobile: mobile.trim(),
          manualChannel: channel,
          manualReference: reference.trim(),
          manualSenderAccount: sender.trim(),
          currency,
        }),
      });
      toast.success("Order " + res.order.orderId + " created (pending verification).");
      setOpen(false);
      setEmail("");
      setMobile("");
      setReference("");
      setSender("");
      setRows([{ sku: "", qty: 1 }]);
      onCreated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New manual order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>New manual order</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Customer email *</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="buyer@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mobile</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+92…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Manual channel</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MANUAL_CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="PKR">PKR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Payment reference</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="auto if empty" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sender account</Label>
            <Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Customer Wallet" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Items (catalog SKU + qty)</Label>
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <Input
                className="flex-1 font-mono text-xs"
                value={r.sku}
                onChange={(e) =>
                  setRows(rows.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))
                }
                placeholder="EF-…-SKU"
              />
              <Input
                type="number"
                min={1}
                className="w-20"
                value={r.qty}
                onChange={(e) =>
                  setRows(rows.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))
                }
              />
              <Button
                variant="outline"
                size="icon"
                className="border-border text-muted-foreground"
                onClick={() => setRows(rows.length > 1 ? rows.filter((_, j) => j !== i) : [{ sku: "", qty: 1 }])}
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground"
            onClick={() => setRows([...rows, { sku: "", qty: 1 }])}
          >
            <Plus className="h-3.5 w-3.5" /> Add item row
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-border text-muted-foreground" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={create} disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Creating…" : "Create order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrdersInner() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await api<{ orders: Order[] }>("/api/orders");
      setOrders(res.orders || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load orders.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(orderId: string) {
    try {
      await api("/api/orders/" + encodeURIComponent(orderId) + "/approve-manual", { method: "POST" });
      toast.success(orderId + " verified — keys issued.");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Approve failed.");
    }
  }

  async function remove(orderId: string) {
    if (!window.confirm("Delete order " + orderId + "? This cannot be undone.")) return;
    try {
      await api("/api/orders/" + encodeURIComponent(orderId), { method: "DELETE" });
      toast.success(orderId + " deleted.");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed.");
    }
  }

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {orders ? orders.length + " order(s) · newest first" : "Loading…"}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border text-muted-foreground" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <ManualOrderDialog onCreated={load} />
        </div>
      </div>

      {orders === null && !error ? (
        <PageLoader />
      ) : orders && orders.length === 0 ? (
        <Card className="border-dashed border-border/70 bg-card/60">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No orders yet. Create a manual order to see it here.
          </CardContent>
        </Card>
      ) : null}

      {orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.orderId} className="border-border/70 bg-card/80">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-bold text-foreground">{o.orderId}</span>
                  <StatusBadge status={o.status} />
                  <Badge variant="outline" className="text-[11px] border-border text-muted-foreground">
                    {o.paymentRail} · {o.manualChannel}
                  </Badge>
                  <span className="ml-auto text-sm font-semibold text-foreground">
                    {o.currency === "PKR" ? "₨ " + Number(o.totalPkr).toLocaleString() : fmtUsd(o.totalUsd)}
                  </span>
                </div>
                <div className="mt-3 grid gap-x-8 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                  <span>customer: <span className="text-foreground/90">{o.customerEmail}</span></span>
                  <span>uid: <span className="text-foreground/90 font-mono">{o.customerUid || "guest"}</span></span>
                  <span>ref: <span className="text-foreground/90 font-mono">{o.manualReference}</span></span>
                  <span>created: <span className="text-foreground/90">{fmtDate(o.createdAt)}</span></span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.items.map((it) => (
                    <span
                      key={it.sku}
                      className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] text-foreground/80"
                    >
                      {it.name} ×{it.quantity}
                    </span>
                  ))}
                </div>
                {o.issuedKeys && o.issuedKeys.length > 0 ? (
                  <p className="mt-2 font-mono text-[11px] text-success">
                    {o.issuedKeys.length} key(s) issued
                  </p>
                ) : null}
                <p className="mt-2 text-[11px] text-muted-foreground">{o.statusDetail}</p>
                <div className="mt-3 flex items-center gap-2">
                  {o.status === "PENDING_VERIFICATION" ? (
                    <Button
                      size="sm"
                      onClick={() => approve(o.orderId)}
                      className="bg-success text-white hover:bg-successemphasis"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Verify & fulfill
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-error/40 text-error hover:bg-lighterror hover:text-erroremphasis"
                    onClick={() => remove(o.orderId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AdminShell title="Orders">
      <OrdersInner />
    </AdminShell>
  );
}
