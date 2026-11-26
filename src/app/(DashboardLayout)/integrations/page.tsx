"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, PageLoader } from "@/components/admin/shell";
import { Dot, ErrorBanner, KV, YesNo } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

/* ── Admin access (passwordless allowlist) ─────────────────── */

function AdminAccessCard() {
  const [entries, setEntries] = useState<any[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<any>("/api/admin/allowlist");
      setEntries(res.entries || []);
    } catch (err: any) {
      toast.error("Allowlist: " + (err?.message || "load failed"));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    setBusy(true);
    try {
      const res = await api<any>("/api/admin/allowlist", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      toast.success(res?.duplicate ? "Email already on the allowlist." : "Email added — it can now sign in without a password.");
      setEmail("");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Add failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(em: string) {
    if (!window.confirm("Remove " + em + " from admin access?")) return;
    try {
      await api("/api/admin/allowlist/" + encodeURIComponent(em), { method: "DELETE" });
      toast.success(em + " removed.");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Remove failed.");
    }
  }

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Dot ok={entries ? entries.length > 0 : null} />
          <CardTitle className="text-sm text-foreground">Admin access — passwordless (Firebase)</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Add a Firebase account email below, then use “Sign in with Google (passwordless)” on the
          login screen. Sign-in completes through a secure bridge on playbeat.digital and is verified
          server-side against this allow-list — no password is shared with Google sign-in users.
        </p>
        <div className="flex gap-2">
          <Input
            className="flex-1 font-mono text-xs"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-google-account@gmail.com"
            type="email"
          />
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={busy || !email.includes("@")}
            onClick={add}
          >
            Add email
          </Button>
        </div>
        {entries && entries.length ? (
          <ul className="space-y-2">
            {entries.map((e, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-xs"
              >
                <span className="font-mono text-foreground/90">{e.email || e.uid}</span>
                <span className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">added {fmtDate(e.addedAt || "")}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-error/40 px-2 text-error hover:bg-lighterror"
                    onClick={() => remove(String(e.email || ""))}
                  >
                    Remove
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            No emails allow-listed yet — password login remains the only way in.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Meta ─────────────────────────────────────────────────────────── */

function MetaCard() {
  const [overview, setOverview] = useState<any>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [config, setConfig] = useState({ wabaId: "", waPhoneNumberId: "", datasetId: "", testEventCode: "" });
  const [token, setToken] = useState("");
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [busy, setBusy] = useState("");
  const [inbox, setInbox] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const [ov, tk, cf, fb] = await Promise.all([
        api<any>("/api/admin/meta/overview"),
        api<any>("/api/admin/meta/token"),
        api<any>("/api/admin/meta/config"),
        api<any>("/api/admin/meta/facebook"),
      ]);
      setOverview(ov);
      setTokenInfo(tk);
      if (cf.config) setConfig({ ...cf.config });
      setInbox(fb);
    } catch (err: any) {
      toast.error("Meta: " + (err?.message || "load failed"));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveToken() {
    setBusy("token");
    try {
      const res = await api<any>("/api/admin/meta/token", {
        method: "POST",
        body: JSON.stringify({ token: token.trim() }),
      });
      toast.success(res?.saved ? "Meta token saved." : "Token processed.");
      setToken("");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Token save failed.");
    } finally {
      setBusy("");
    }
  }

  async function saveApp() {
    setBusy("app");
    try {
      await api("/api/admin/meta/token", {
        method: "POST",
        body: JSON.stringify({ action: "save-app", appId: appId.trim(), appSecret: appSecret.trim() }),
      });
      toast.success("Meta app credentials saved & verified with /debug_token.");
      setAppId("");
      setAppSecret("");
      load();
    } catch (err: any) {
      toast.error(err?.message || "App save failed.");
    } finally {
      setBusy("");
    }
  }

  async function saveConfig() {
    setBusy("config");
    try {
      await api("/api/admin/meta/config", { method: "PATCH", body: JSON.stringify(config) });
      toast.success("Meta config saved.");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Config save failed.");
    } finally {
      setBusy("");
    }
  }

  async function clearToken() {
    setBusy("clear");
    try {
      await api("/api/admin/meta/token", { method: "POST", body: JSON.stringify({ action: "clear" }) });
      toast.success("Meta token cleared.");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Clear failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Dot ok={overview?.connected ?? false} />
          <CardTitle className="text-sm text-foreground">Meta Platform — Facebook · Instagram · WhatsApp</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {overview?.error ? <ErrorBanner message={overview.error} /> : null}

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Facebook", overview?.facebook?.connected ?? null],
            ["Instagram", overview?.instagram?.connected ?? null],
            ["WhatsApp", overview?.whatsapp?.connected ?? null],
          ].map(([label, conn]) => (
            <div key={label as string} className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <div className="flex items-center gap-2">
                <Dot ok={conn as boolean | null} />
                <span className="text-foreground/90">{label}</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {(conn as boolean) ? "page session live" : "not connected"}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold text-foreground/90">Access token</p>
          <KV
            rows={[
              ["configured", <YesNo key="c" v={tokenInfo?.configured ?? tokenInfo?.connected} />],
              ["kind", tokenInfo?.kind || tokenInfo?.tokenType || "—"],
              ["user", tokenInfo?.userName || "—"],
              ["expires", tokenInfo?.expiresAt ? fmtDate(tokenInfo.expiresAt) : "—"],
            ]}
          />
          <div className="mt-3 flex gap-2">
            <Input
              className="flex-1 font-mono text-xs"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste a Meta access token (EAAB…)"
            />
            <Button
              size="sm"
              disabled={busy === "token" || !token.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={saveToken}
            >
              Save token
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-error/40 text-error hover:bg-lighterror"
              disabled={busy === "clear"}
              onClick={clearToken}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold text-foreground/90">App credentials (enables long-lived exchange)</p>
          <div className="flex gap-2">
            <Input
              className="flex-1 font-mono text-xs"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="App ID (numeric)"
            />
            <Input
              className="flex-1 font-mono text-xs"
              type="password"
              value={appSecret}
              onChange={(e) => setAppSecret(e.target.value)}
              placeholder="App secret"
            />
            <Button
              size="sm"
              variant="outline"
              className="border-border text-muted-foreground"
              disabled={busy === "app" || !appId.trim() || !appSecret.trim()}
              onClick={saveApp}
            >
              <Send className="h-3.5 w-3.5" /> Save app
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold text-foreground/90">
            WhatsApp / CAPI config (numeric Meta IDs · test event code)
          </p>
          <div className="grid gap-2 sm:grid-cols-4">
            {(["wabaId", "waPhoneNumberId", "datasetId", "testEventCode"] as const).map((k) => (
              <Input
                key={k}
                className="font-mono text-xs"
                value={config[k]}
                onChange={(e) => setConfig({ ...config, [k]: e.target.value })}
                placeholder={k}
              />
            ))}
          </div>
          <Button
            size="sm"
            className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={busy === "config"}
            onClick={saveConfig}
          >
            Save config
          </Button>
        </div>

        {inbox ? (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="mb-2 text-xs font-semibold text-foreground/90">Facebook inbox</p>
            {inbox.connected ? (
              (inbox.conversations || []).length ? (
                <ul className="space-y-2 text-xs">
                  {(inbox.conversations || []).slice(0, 8).map((c: any, i: number) => (
                    <li key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                      <span className="text-foreground/90">{c.name || c.participants?.data?.[0]?.name || c.id}</span>
                      <span className="text-muted-foreground">{c.message_count || 0} msg(s)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No conversations yet.</p>
              )
            ) : (
              <p className="text-xs text-muted-foreground">{inbox.error || "Page session not available."}</p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ── TikTok ───────────────────────────────────────────────────────── */

function TikTokCard() {
  const [status, setStatus] = useState<any>(null);
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [testEventCode, setTestEventCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>("");

  const load = useCallback(async () => {
    try {
      const s = await api<any>("/api/admin/tiktok/status");
      setStatus(s);
      setPixelId(s.config?.pixelId || "");
      setTestEventCode(s.config?.testEventCode || "");
    } catch (err: any) {
      toast.error("TikTok: " + (err?.message || "load failed"));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setBusy(true);
    try {
      const body: Record<string, string> = { pixelId: pixelId.trim(), testEventCode: testEventCode.trim() };
      if (accessToken.trim()) body.accessToken = accessToken.trim();
      await api("/api/admin/tiktok/config", { method: "PATCH", body: JSON.stringify(body) });
      toast.success("TikTok config saved.");
      setAccessToken("");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    setTestResult("");
    try {
      const res = await api<any>("/api/admin/tiktok/test", { method: "POST" });
      setTestResult(JSON.stringify(res, null, 1).slice(0, 800));
      toast[res?.ok ? "success" : "error"](res?.ok ? "Test event accepted." : res?.message || "Events API error.");
    } catch (err: any) {
      toast.error(err?.message || "Test failed.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Dot ok={status?.eventsApiReady ?? false} />
          <CardTitle className="text-sm text-foreground">TikTok Events API</CardTitle>
          <span className="ml-auto text-[11px] text-muted-foreground font-mono">
            {status?.app?.clientKeyMasked || "app key not set"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <Input className="font-mono text-xs" value={pixelId} onChange={(e) => setPixelId(e.target.value)} placeholder="Pixel code" />
          <Input
            className="font-mono text-xs"
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Events API access token (paste to rotate)"
          />
          <Input
            className="font-mono text-xs"
            value={testEventCode}
            onChange={(e) => setTestEventCode(e.target.value)}
            placeholder="Test event code"
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={busy}
            onClick={save}
          >
            Save config
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-border text-muted-foreground"
            disabled={testing}
            onClick={sendTest}
          >
            {testing ? "Sending…" : "Send test event"}
          </Button>
        </div>
        {testResult ? (
          <pre className="max-h-40 overflow-auto rounded-md bg-muted/60 p-3 font-mono text-[10px] text-foreground/70">
            {testResult}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ── AdSense ──────────────────────────────────────────────────────── */

const RANGES = [
  { v: "today", label: "Today" },
  { v: "yesterday", label: "Yesterday" },
  { v: "7", label: "Last 7 days" },
  { v: "28", label: "Last 28 days" },
  { v: "mtd", label: "Month to date" },
];

function AdSenseCard() {
  const [status, setStatus] = useState<any>(null);
  const [publisherId, setPublisherId] = useState("");
  const [adsTxtExtra, setAdsTxtExtra] = useState("");
  const [range, setRange] = useState("7");
  const [analytics, setAnalytics] = useState<any>(null);
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const s = await api<any>("/api/admin/adsense/status");
      setStatus(s);
      setPublisherId(s.embed?.publisherId || "");
      setAdsTxtExtra(s.config?.adsTxtExtra || "");
    } catch (err: any) {
      toast.error("AdSense: " + (err?.message || "load failed"));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveConfig() {
    setBusy("config");
    try {
      await api("/api/admin/adsense/config", {
        method: "PATCH",
        body: JSON.stringify({ publisherId: publisherId.trim(), adsTxtExtra }),
      });
      toast.success("AdSense config saved.");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Save failed.");
    } finally {
      setBusy("");
    }
  }

  async function fetchAnalytics() {
    setBusy("analytics");
    try {
      const res = await api<any>("/api/admin/adsense/analytics?range=" + range);
      setAnalytics(res);
      if (res.ok === false) toast.error(res.error || "Analytics unavailable.");
    } catch (err: any) {
      toast.error(err?.message || "Analytics failed.");
    } finally {
      setBusy("");
    }
  }

  async function connectGoogle() {
    setBusy("oauth");
    try {
      const res = await api<any>("/api/admin/adsense/oauth/start", { method: "POST" });
      if (res.authUrl) {
        window.location.href = res.authUrl;
        return;
      }
      toast.error(res.error || "Could not start OAuth.");
    } catch (err: any) {
      toast.error(err?.message || "OAuth start failed.");
    } finally {
      setBusy("");
    }
  }

  async function connectManual() {
    setBusy("manual");
    try {
      const code = manualCode.trim();
      const body = code.startsWith("1//") ? { refreshToken: code } : { authorizationCode: code };
      const res = await api<any>("/api/admin/adsense/connect/manual", { method: "POST", body: JSON.stringify(body) });
      if (res.ok === false) toast.error(res.error || "Rejected.");
      else toast.success("AdSense connected (" + (res.mode || "code") + ").");
      setManualCode("");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Connect failed.");
    } finally {
      setBusy("");
    }
  }

  async function disconnect() {
    setBusy("disconnect");
    try {
      await api("/api/admin/adsense/disconnect", { method: "POST" });
      toast.success("AdSense API disconnected.");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Disconnect failed.");
    } finally {
      setBusy("");
    }
  }

  const oauthConnected = !!(status?.oauth?.hasRefreshToken || status?.serviceAccount?.configured);

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Dot ok={oauthConnected} />
          <CardTitle className="text-sm text-foreground">Google AdSense</CardTitle>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">
            {status?.embed?.publisherId || "publisher not set"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <KV
          rows={[
            ["ads.txt", status?.embed?.adsTxt || "—"],
            ["OAuth refresh token", <YesNo key="rt" v={status?.oauth?.hasRefreshToken} />],
            ["Service account", <YesNo key="sa" v={status?.serviceAccount?.configured} />],
            ["SA email", status?.serviceAccount?.email || "—"],
            ["redirect URI", status?.oauth?.redirectUri || "—"],
          ]}
        />

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold text-foreground/90">Publisher & ads.txt</p>
          <div className="flex gap-2">
            <Input className="flex-1 font-mono text-xs" value={publisherId} onChange={(e) => setPublisherId(e.target.value)} placeholder="ca-pub-…" />
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={busy === "config"} onClick={saveConfig}>
              Save
            </Button>
          </div>
          <Input
            className="mt-2 font-mono text-xs"
            value={adsTxtExtra}
            onChange={(e) => setAdsTxtExtra(e.target.value)}
            placeholder="extra ads.txt lines (optional)"
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold text-foreground/90">Revenue analytics</p>
          <div className="flex gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => (
                  <SelectItem key={r.v} value={r.v} className="text-xs">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="border-border text-muted-foreground" disabled={busy === "analytics"} onClick={fetchAnalytics}>
              {busy === "analytics" ? "Loading…" : "Fetch"}
            </Button>
          </div>
          {analytics ? (
            <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted/60 p-3 font-mono text-[10px] text-foreground/70">
              {JSON.stringify(analytics, null, 1).slice(0, 1200)}
            </pre>
          ) : null}
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold text-foreground/90">API connection</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={busy === "oauth"} onClick={connectGoogle}>
              Connect with Google
            </Button>
            <Input
              className="min-w-56 flex-1 font-mono text-xs"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste refresh token (1//…) or authorization code"
            />
            <Button size="sm" variant="outline" className="border-border text-muted-foreground" disabled={busy === "manual" || !manualCode.trim()} onClick={connectManual}>
              Manual connect
            </Button>
            <Button size="sm" variant="outline" className="border-error/40 text-error hover:bg-lighterror" disabled={busy === "disconnect"} onClick={disconnect}>
              Disconnect
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            OAuth finishes at playbeat.digital/oauth2callback and returns here. Manual mode accepts a Google refresh token directly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

function IntegrationsInner() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <PageLoader />;
  return (
    <div className="space-y-5">
      <AdminAccessCard />
      <MetaCard />
      <TikTokCard />
      <AdSenseCard />
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <AdminShell title="Integrations">
      <IntegrationsInner />
    </AdminShell>
  );
}
