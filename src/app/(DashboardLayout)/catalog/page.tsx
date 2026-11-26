"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell, PageLoader } from "@/components/admin/shell";
import { ErrorBanner } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, fmtDate, fmtUsd } from "@/lib/admin-api";
import { toast } from "sonner";
import { Download, Plus, RefreshCw, Search, Trash2, Zap } from "lucide-react";

type Product = {
  sku: string;
  name: string;
  category: string;
  platform?: string;
  region?: string;
  originalPriceUsd?: number;
  priceUsd?: number;
  pricePkr?: number;
  discountPercent?: number;
  stockCount?: number;
  stockStatus?: string;
  published?: boolean;
  featured?: boolean;
};

type Service = {
  id: string;
  sku?: string;
  name: string;
  category?: string;
  packageLevel?: string;
  recommendedPkr?: number;
  deliveryTime?: string;
  published?: boolean;
};

type Channel = {
  id: string;
  name: string;
  category?: string;
  country?: string;
  language?: string;
  quality?: string;
  streamType?: string;
  isLive?: boolean;
  published?: boolean;
};

type Plan = {
  id: string;
  sku?: string;
  name: string;
  lineType?: string;
  durationLabel?: string;
  priceUsd?: number;
  pricePkr?: number;
  channelsCount?: number;
  connections?: number;
  vodLibrary?: boolean;
  published?: boolean;
};

type Catalog = {
  digitalProducts: Product[];
  businessServices: Service[];
  liveTvChannels: Channel[];
  liveTvPlans: Plan[];
  serviceInquiries: any[];
  lastPublishedSyncAt?: string;
  sync?: { syncedAt?: string; source?: string; message?: string; productCount?: number };
};

const PAGE_SIZE = 25;

function AddDialog({
  title,
  open,
  setOpen,
  fields,
  onSubmit,
  busy,
}: {
  title: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  fields: { key: string; label: string; placeholder?: string; type?: string; required?: boolean }[];
  onSubmit: (values: Record<string, string>) => void;
  busy: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={"space-y-1.5 " + (f.key === "description" ? "sm:col-span-2" : "")}>
              <Label className="text-xs text-muted-foreground">
                {f.label}
                {f.required ? " *" : ""}
              </Label>
              <Input
                type={f.type || "text"}
                value={values[f.key] || ""}
                placeholder={f.placeholder}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-border text-muted-foreground" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={busy}
            onClick={() => onSubmit(values)}
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CatalogInner() {
  const [cat, setCat] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [addOpen, setAddOpen] = useState<null | "product" | "service" | "channel" | "plan">(null);

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await api<Catalog>("/api/admin/catalog");
      setCat(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load catalog.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const list = cat?.digitalProducts || [];
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter(
      (p) =>
        p.name?.toLowerCase().includes(needle) ||
        p.sku?.toLowerCase().includes(needle) ||
        p.category?.toLowerCase().includes(needle)
    );
  }, [cat, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  async function syncEf() {
    if (!window.confirm("Re-sync the ElectronicFirst catalog? Existing verified catalog is preserved on failure.")) return;
    setSyncing(true);
    try {
      const res = await api<any>("/api/admin/electronicfirst/sync", { method: "POST" });
      toast.success(res?.sync?.message || "Sync finished.");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  function exportCsv() {
    const rows = filtered.slice(0, 5000);
    const header = ["sku", "name", "category", "platform", "priceUsd", "pricePkr", "stockCount", "published"];
    const lines = [header.join(",")].concat(
      rows.map((p) =>
        [p.sku, p.name, p.category, p.platform || "", p.priceUsd ?? "", p.pricePkr ?? "", p.stockCount ?? "", p.published !== false ? "1" : "0"]
          .map((v) => '"' + String(v).replace(/"/g, '""') + '"')
          .join(",")
      )
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "playbeat-products.csv";
    a.click();
    toast.success("Exported " + rows.length + " SKUs to CSV.");
  }

  async function del(path: string, label: string) {
    if (!window.confirm("Delete " + label + "?")) return;
    try {
      await api(path, { method: "DELETE" });
      toast.success(label + " deleted.");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed.");
    }
  }

  async function saveEntity(kind: string, values: Record<string, string>) {
    setBusy(true);
    try {
      if (kind === "product") {
        await api("/api/admin/products", {
          method: "POST",
          body: JSON.stringify({
            name: values.name,
            sku: values.sku || undefined,
            category: values.category || undefined,
            platform: values.platform || undefined,
            priceUsd: Number(values.priceUsd || 9.99),
            originalPriceUsd: Number(values.originalPriceUsd || values.priceUsd || 9.99),
            stockCount: Number(values.stockCount || 50),
            productUrl: values.productUrl || undefined,
            imageUrl: values.imageUrl || undefined,
            description: values.description || undefined,
          }),
        });
        toast.success("Product saved.");
      } else if (kind === "service") {
        await api("/api/admin/services", {
          method: "POST",
          body: JSON.stringify({
            name: values.name,
            category: values.category || undefined,
            packageLevel: values.packageLevel || undefined,
            recommendedPkr: Number(values.recommendedPkr || 149000),
            deliveryTime: values.deliveryTime || undefined,
            shortDescription: values.shortDescription || undefined,
          }),
        });
        toast.success("Service saved.");
      } else if (kind === "channel") {
        await api("/api/admin/livetv/channels", {
          method: "POST",
          body: JSON.stringify({
            name: values.name,
            category: values.category || undefined,
            country: values.country || undefined,
            language: values.language || undefined,
            quality: values.quality || undefined,
            streamType: values.streamType || "hls",
            streamUrl: values.streamUrl || undefined,
          }),
        });
        toast.success("Channel saved.");
      } else if (kind === "plan") {
        await api("/api/admin/livetv/plans", {
          method: "POST",
          body: JSON.stringify({
            name: values.name,
            lineType: values.lineType || "cable",
            durationLabel: values.durationLabel || "1 Month",
            priceUsd: Number(values.priceUsd || 5),
            pricePkr: Number(values.pricePkr || 0),
            channelsCount: Number(values.channelsCount || 0),
            connections: Number(values.connections || 1),
            vodLibrary: values.vodLibrary === "1",
          }),
        });
        toast.success("Plan saved.");
      }
      setAddOpen(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  if (cat === null && !error) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search products by name, SKU, category…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <Button variant="outline" size="sm" className="border-border text-muted-foreground" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
        <Button variant="outline" size="sm" className="border-border text-muted-foreground" onClick={exportCsv}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-amber-400/30 text-amber-300 hover:bg-amber-400/10"
          onClick={syncEf}
          disabled={syncing}
        >
          <Zap className="h-3.5 w-3.5" /> {syncing ? "Syncing…" : "Sync ElectronicFirst"}
        </Button>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setAddOpen("product")}
        >
          <Plus className="h-4 w-4" /> Add product
        </Button>
      </div>

      {cat?.sync ? (
        <p className="text-[11px] text-muted-foreground">
          Last sync {fmtDate(cat.sync.syncedAt || "")} via {cat.sync.source} · {cat.sync.productCount} products · {cat.sync.message}
        </p>
      ) : null}

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="products">Digital Products</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="channels">TV Channels</TabsTrigger>
          <TabsTrigger value="plans">TV Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Product</TableHead>
                    <TableHead className="text-muted-foreground">SKU</TableHead>
                    <TableHead className="text-muted-foreground">Price</TableHead>
                    <TableHead className="text-muted-foreground">Stock</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((p) => (
                    <TableRow key={p.sku} className="border-border">
                      <TableCell className="max-w-64">
                        <p className="truncate text-sm text-foreground/90">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.category}
                          {p.platform ? " · " + p.platform : ""}
                        </p>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground max-w-56 truncate">{p.sku}</TableCell>
                      <TableCell className="text-sm">
                        <span className="text-foreground">{fmtUsd(p.priceUsd)}</span>
                        {p.originalPriceUsd && p.originalPriceUsd > (p.priceUsd || 0) ? (
                          <span className="ml-1.5 text-[11px] text-muted-foreground line-through">
                            {fmtUsd(p.originalPriceUsd)}
                          </span>
                        ) : null}
                        {p.discountPercent ? (
                          <span className="ml-1.5 text-[11px] text-success">-{p.discountPercent}%</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm text-foreground/80">{p.stockCount}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            "text-[10px] border " +
                            (p.published !== false
                              ? "border-success/40 bg-lightsuccess text-success"
                              : "border-border bg-muted text-muted-foreground")
                          }
                        >
                          {p.published !== false ? "live" : "hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-error hover:bg-lighterror"
                          onClick={() => del("/api/admin/products/" + encodeURIComponent(p.sku), p.name || p.sku)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <span>
              {filtered.length.toLocaleString()} result(s) · page {page + 1}/{pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-muted-foreground"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border text-muted-foreground"
                disabled={page >= pages - 1}
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="services">
          <div className="flex justify-end pb-2">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setAddOpen("service")}>
              <Plus className="h-4 w-4" /> Add service
            </Button>
          </div>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Service</TableHead>
                    <TableHead className="text-muted-foreground">Category</TableHead>
                    <TableHead className="text-muted-foreground">Level</TableHead>
                    <TableHead className="text-muted-foreground">From</TableHead>
                    <TableHead className="text-muted-foreground">Delivery</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(cat?.businessServices || []).map((s) => (
                    <TableRow key={s.id} className="border-border">
                      <TableCell className="text-sm text-foreground/90">{s.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.category}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.packageLevel}</TableCell>
                      <TableCell className="text-sm text-foreground">₨ {Number(s.recommendedPkr).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.deliveryTime}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-error hover:bg-lighterror"
                          onClick={() => del("/api/admin/services/" + encodeURIComponent(s.id), s.name || s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <div className="flex justify-end pb-2">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setAddOpen("channel")}>
              <Plus className="h-4 w-4" /> Add channel
            </Button>
          </div>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Channel</TableHead>
                    <TableHead className="text-muted-foreground">Category</TableHead>
                    <TableHead className="text-muted-foreground">Country</TableHead>
                    <TableHead className="text-muted-foreground">Quality</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(cat?.liveTvChannels || []).map((c) => (
                    <TableRow key={c.id} className="border-border">
                      <TableCell className="text-sm text-foreground/90">
                        {c.name}
                        {c.isLive ? (
                          <span className="ml-2 text-[10px] font-bold text-error">● LIVE</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.category}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.country}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.quality}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{c.streamType}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-error hover:bg-lighterror"
                          onClick={() => del("/api/admin/livetv/channels/" + encodeURIComponent(c.id), c.name || c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <div className="flex justify-end pb-2">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setAddOpen("plan")}>
              <Plus className="h-4 w-4" /> Add plan
            </Button>
          </div>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Plan</TableHead>
                    <TableHead className="text-muted-foreground">Line</TableHead>
                    <TableHead className="text-muted-foreground">Duration</TableHead>
                    <TableHead className="text-muted-foreground">Price</TableHead>
                    <TableHead className="text-muted-foreground">Channels</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(cat?.liveTvPlans || []).map((p) => (
                    <TableRow key={p.id} className="border-border">
                      <TableCell className="text-sm text-foreground/90">{p.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.lineType}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.durationLabel}</TableCell>
                      <TableCell className="text-sm text-foreground">
                        {fmtUsd(p.priceUsd)}
                        <span className="ml-1.5 text-[11px] text-muted-foreground">₨ {Number(p.pricePkr).toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-xs text-foreground/80">
                        {p.channelsCount} · {p.connections} screen(s)
                        {p.vodLibrary ? " · VOD" : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-error hover:bg-lighterror"
                          onClick={() => del("/api/admin/livetv/plans/" + encodeURIComponent(p.id), p.name || p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {addOpen === "product" ? (
        <AddDialog
          title="Add / update product"
          open={addOpen === "product"}
          setOpen={(v) => setAddOpen(v ? "product" : null)}
          busy={busy}
          onSubmit={(v) => saveEntity("product", v)}
          fields={[
            { key: "name", label: "Name", required: true, placeholder: "Product name" },
            { key: "sku", label: "SKU", placeholder: "auto if empty" },
            { key: "category", label: "Category", placeholder: "PC Games" },
            { key: "platform", label: "Platform", placeholder: "Steam / Xbox / …" },
            { key: "priceUsd", label: "Price USD", type: "number", placeholder: "9.99" },
            { key: "originalPriceUsd", label: "Original USD", type: "number", placeholder: "59.99" },
            { key: "stockCount", label: "Stock", type: "number", placeholder: "50" },
            { key: "productUrl", label: "Product URL", placeholder: "https://…" },
            { key: "imageUrl", label: "Image URL", placeholder: "https://…" },
            { key: "description", label: "Description", placeholder: "Short description" },
          ]}
        />
      ) : null}
      {addOpen === "service" ? (
        <AddDialog
          title="Add / update service"
          open={addOpen === "service"}
          setOpen={(v) => setAddOpen(v ? "service" : null)}
          busy={busy}
          onSubmit={(v) => saveEntity("service", v)}
          fields={[
            { key: "name", label: "Name", required: true, placeholder: "Service name" },
            { key: "category", label: "Category", placeholder: "Business Websites" },
            { key: "packageLevel", label: "Package level", placeholder: "Professional" },
            { key: "recommendedPkr", label: "Price PKR", type: "number", placeholder: "149000" },
            { key: "deliveryTime", label: "Delivery time", placeholder: "2–3 Weeks" },
            { key: "shortDescription", label: "Short description", placeholder: "…" },
          ]}
        />
      ) : null}
      {addOpen === "channel" ? (
        <AddDialog
          title="Add / update channel"
          open={addOpen === "channel"}
          setOpen={(v) => setAddOpen(v ? "channel" : null)}
          busy={busy}
          onSubmit={(v) => saveEntity("channel", v)}
          fields={[
            { key: "name", label: "Name", required: true, placeholder: "Channel name" },
            { key: "category", label: "Category", placeholder: "News" },
            { key: "country", label: "Country", placeholder: "Worldwide" },
            { key: "language", label: "Language", placeholder: "English" },
            { key: "quality", label: "Quality", placeholder: "1080p" },
            { key: "streamType", label: "Stream type", placeholder: "hls" },
            { key: "streamUrl", label: "Stream URL", placeholder: "https://…m3u8" },
          ]}
        />
      ) : null}
      {addOpen === "plan" ? (
        <AddDialog
          title="Add / update TV plan"
          open={addOpen === "plan"}
          setOpen={(v) => setAddOpen(v ? "plan" : null)}
          busy={busy}
          onSubmit={(v) => saveEntity("plan", v)}
          fields={[
            { key: "name", label: "Name", required: true, placeholder: "Plan name" },
            { key: "lineType", label: "Line type", placeholder: "cable / iptv" },
            { key: "durationLabel", label: "Duration", placeholder: "1 Month" },
            { key: "priceUsd", label: "Price USD", type: "number", placeholder: "5" },
            { key: "pricePkr", label: "Price PKR", type: "number", placeholder: "1390" },
            { key: "channelsCount", label: "Channels", type: "number", placeholder: "16" },
            { key: "connections", label: "Connections", type: "number", placeholder: "1" },
            { key: "vodLibrary", label: "VOD (1/0)", placeholder: "0" },
          ]}
        />
      ) : null}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <AdminShell title="Catalog">
      <CatalogInner />
    </AdminShell>
  );
}
