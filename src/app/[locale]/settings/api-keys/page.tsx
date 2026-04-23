"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Terminal, Sparkles, KeyRound } from "lucide-react";
import { useT } from "@/lib/locale-context";
import type { TranslationKey } from "@/lib/i18n";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

interface CreatedKey {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  createdAt: string;
}

/** Inline copy button with Lucide icons. */
function CopyBtn({ text, size = "sm" }: { text: string; size?: "sm" | "md" }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const icon = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md text-(--ditto-text-muted) hover:text-(--ditto-text) hover:bg-(--ditto-bg) transition-colors"
      title={copied ? t("apiKeysCopiedTooltip") : t("apiKeysCopyTooltip")}
    >
      {copied ? <Check className={icon} strokeWidth={2.25} /> : <Copy className={icon} strokeWidth={1.75} />}
    </button>
  );
}

/** Terminal-style one-liner with integrated copy button. */
function Cmd({ children }: { children: string }) {
  return (
    <div className="group flex items-center gap-2 rounded-lg border border-(--ditto-border) bg-(--ditto-bg) pl-3 pr-1.5 py-2">
      <span className="text-(--ditto-text-muted) text-sm select-none">$</span>
      <code className="flex-1 text-sm font-mono text-(--ditto-text) overflow-x-auto whitespace-pre-wrap break-all">
        {children}
      </code>
      <CopyBtn text={children} />
    </div>
  );
}

export default function ApiKeysPage() {
  const t = useT();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [justCreated, setJustCreated] = useState<CreatedKey | null>(null);
  const [copiedNewKey, setCopiedNewKey] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/auth/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "Untitled" }),
      });
      if (res.ok) {
        const data = (await res.json()) as CreatedKey;
        setJustCreated(data);
        setNewKeyName("");
        await load();
      }
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm(t("apiKeysRevokeConfirm"))) return;
    await fetch(`/api/auth/keys/${id}`, { method: "DELETE" });
    await load();
  };

  const copyNewKey = async () => {
    if (!justCreated) return;
    await navigator.clipboard.writeText(justCreated.key);
    setCopiedNewKey(true);
    setTimeout(() => setCopiedNewKey(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 text-(--ditto-primary)">
        <Terminal className="w-5 h-5" strokeWidth={1.75} />
        <span className="text-xs font-semibold uppercase tracking-wider">{t("apiKeysSectionTag")}</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-(--ditto-text) mb-2">
        {t("apiKeysTitle")}
      </h1>
      <p className="text-base text-(--ditto-text-secondary) mb-10 leading-relaxed">
        {t("apiKeysSubtitle")}
      </p>

      {/* ─── Quick start ─────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-4 uppercase tracking-wider">
          {t("apiKeysQuickStart")}
        </h2>

        <ol className="space-y-4">
          <li>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-full bg-(--ditto-primary) text-(--ditto-bg) text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span className="text-sm font-medium text-(--ditto-text)">{t("apiKeysStep1")}</span>
            </div>
            <div className="pl-9">
              <Cmd>npm i -g @didap/ditto</Cmd>
            </div>
          </li>

          <li>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-full bg-(--ditto-primary) text-(--ditto-bg) text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span className="text-sm font-medium text-(--ditto-text)">
                {t("apiKeysStep2")}
              </span>
            </div>
            <p className="pl-9 text-xs text-(--ditto-text-muted)">
              {t("apiKeysStep2Hint")}
            </p>
          </li>

          <li>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-full bg-(--ditto-primary) text-(--ditto-bg) text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span className="text-sm font-medium text-(--ditto-text)">{t("apiKeysStep3")}</span>
            </div>
            <div className="pl-9 space-y-2">
              <Cmd>ditto login</Cmd>
              <Cmd>ditto https://stripe.com</Cmd>
              <p className="text-xs text-(--ditto-text-muted) pl-1">
                {t("apiKeysStep3WritesPrefix")} <code className="font-mono">DESIGN.md</code> {t("apiKeysStep3WritesSuffix")}
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* ─── New key — form + big card if just created ──────────────────── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-4 uppercase tracking-wider">
          {t("apiKeysYourKeys")}
        </h2>

        {/* Just-created banner */}
        {justCreated && (
          <div className="mb-4 rounded-xl border-2 border-(--ditto-primary) bg-(--ditto-primary)/10 p-5">
            <div className="flex items-start gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-(--ditto-primary) mt-0.5 shrink-0" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-semibold text-(--ditto-text)">{t("apiKeysJustCreatedTitle")}</p>
                <p className="text-xs text-(--ditto-text-secondary)">
                  {t("apiKeysJustCreatedSubtitle")}
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center mb-3">
              <code className="flex-1 rounded-lg bg-(--ditto-bg) text-(--ditto-text) text-xs font-mono px-3 py-2 overflow-x-auto whitespace-nowrap border border-(--ditto-border)">
                {justCreated.key}
              </code>
              <button
                onClick={copyNewKey}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-(--ditto-primary) text-(--ditto-bg) text-xs font-medium px-3 py-2 hover:bg-(--ditto-primary-hover)"
              >
                {copiedNewKey ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={2.25} />
                    {t("apiKeysCopied")}
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                    {t("apiKeysCopy")}
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-(--ditto-text-secondary) mb-2">
              {t("apiKeysPasteHint")}
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-[11px] text-(--ditto-text-muted) mb-1 pl-1">
                  {t("apiKeysCliLoginLabel")}
                </p>
                <Cmd>{`ditto login --key ${justCreated.key}`}</Cmd>
              </div>
              <div>
                <p className="text-[11px] text-(--ditto-text-muted) mb-1 pl-1">
                  {t("apiKeysMcpHostedLabel")}
                </p>
                <Cmd>{`claude mcp add --transport http ditto https://dittodesign.dev/mcp --header "Authorization: Bearer ${justCreated.key}"`}</Cmd>
              </div>
            </div>
            <button
              onClick={() => setJustCreated(null)}
              className="mt-3 text-xs text-(--ditto-text-muted) hover:text-(--ditto-text) underline"
            >
              {t("apiKeysDismissCopied")}
            </button>
          </div>
        )}

        {/* Create form */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder={t("apiKeysNamePlaceholder")}
            className="flex-1 rounded-lg border border-(--ditto-border) bg-(--ditto-surface) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary)"
            disabled={creating}
            maxLength={50}
            onKeyDown={(e) => {
              if (e.key === "Enter") create();
            }}
          />
          <button
            onClick={create}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-(--ditto-primary) text-(--ditto-bg) text-sm font-medium px-4 py-2.5 hover:bg-(--ditto-primary-hover) disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" strokeWidth={1.75} />
            {creating ? t("apiKeysCreating") : t("apiKeysGenerate")}
          </button>
        </div>

        {/* Keys list */}
        {loading ? (
          <p className="text-xs text-(--ditto-text-muted) py-3">{t("apiKeysLoading")}</p>
        ) : keys.length === 0 ? (
          <p className="text-xs text-(--ditto-text-muted) py-3">
            {t("apiKeysEmpty")}
          </p>
        ) : (
          <ul className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) divide-y divide-(--ditto-border)">
            {keys.map((k) => (
              <li key={k.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-(--ditto-text) truncate">{k.name}</p>
                  <p className="text-xs text-(--ditto-text-muted) font-mono truncate">
                    {k.keyPrefix}…
                    <span className="mx-2 text-(--ditto-border)">·</span>
                    {k.lastUsedAt
                      ? `${t("apiKeysUsedRelative")} ${relTime(k.lastUsedAt, t)}`
                      : t("apiKeysNeverUsed")}
                  </p>
                </div>
                <button
                  onClick={() => revoke(k.id)}
                  className="shrink-0 text-xs font-medium text-(--ditto-text-muted) px-2 py-1 rounded hover:text-red-500 transition-colors"
                >
                  {t("apiKeysRevoke")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-4 uppercase tracking-wider">
          {t("apiKeysFAQTitle")}
        </h2>
        <dl className="space-y-4">
          <FAQ q={t("apiKeysFAQ1Q")}>
            {t("apiKeysFAQ1APart1")}{" "}
            <code className="font-mono text-xs bg-(--ditto-bg) px-1 py-0.5 rounded">DESIGN.md</code>
            {t("apiKeysFAQ1APart2")}{" "}
            <code className="font-mono text-xs bg-(--ditto-bg) px-1 py-0.5 rounded">--save</code>
            {t("apiKeysFAQ1APart3")}
          </FAQ>
          <FAQ q={t("apiKeysFAQ2Q")}>
            {t("apiKeysFAQ2APart1")}{" "}
            <code className="font-mono text-xs bg-(--ditto-bg) px-1 py-0.5 rounded">merge</code>{" "}
            {t("apiKeysFAQ2APart2")}
          </FAQ>
          <FAQ q={t("apiKeysFAQ3Q")}>
            <Cmd>ditto whoami</Cmd>
          </FAQ>
          <FAQ q={t("apiKeysFAQ4Q")}>
            {t("apiKeysFAQ4A")}
            <div className="mt-2 space-y-1.5">
              <Cmd>ditto list</Cmd>
              <Cmd>ditto view stripe</Cmd>
            </div>
          </FAQ>
          <FAQ q={t("apiKeysFAQ5Q")}>
            {t("apiKeysFAQ5A")}
          </FAQ>
        </dl>
      </section>

      {/* ─── Esempio pratico ─────────────────────────────────────────── */}
      <section className="mb-10 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-5">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-(--ditto-primary)" strokeWidth={1.75} />
          {t("apiKeysExampleTitle")}
        </h2>
        <ol className="space-y-3 text-sm text-(--ditto-text-secondary)">
          <li>
            <strong className="text-(--ditto-text)">1.</strong> {t("apiKeysExampleStep1")}
            <div className="mt-1.5">
              <Cmd>cd mio-progetto/</Cmd>
            </div>
          </li>
          <li>
            <strong className="text-(--ditto-text)">2.</strong> {t("apiKeysExampleStep2")}
            <div className="mt-1.5">
              <Cmd>ditto https://stripe.com</Cmd>
            </div>
            <p className="text-xs text-(--ditto-text-muted) mt-1">
              {t("apiKeysExampleStep2HintPrefix")} <code className="font-mono">DESIGN.md</code> {t("apiKeysExampleStep2HintSuffix")}
            </p>
          </li>
          <li>
            <strong className="text-(--ditto-text)">3.</strong> {t("apiKeysExampleStep3")}
            <div className="mt-2 rounded-lg border border-(--ditto-primary)/30 bg-(--ditto-primary)/5 px-4 py-3 text-sm italic text-(--ditto-text)">
              {t("apiKeysExamplePrompt")}
            </div>
            <p className="text-xs text-(--ditto-text-muted) mt-1">
              {t("apiKeysExampleNote")}
            </p>
          </li>
        </ol>
      </section>

      {/* ─── MCP — per sviluppatori AI ─────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-(--ditto-text) uppercase tracking-wider mb-4">
          {t("apiKeysMcpTitle")}
        </h2>
        <div className="space-y-4">
            <p className="text-sm text-(--ditto-text-secondary) leading-relaxed">
              {t("apiKeysMcpIntroPart1")} {"`"}ditto{" "}
              {"<url>"}{"`"} {t("apiKeysMcpIntroPart2")}
            </p>

            {/* Option A — hosted HTTP (recommended) */}
            <div className="rounded-xl border-2 border-(--ditto-primary) bg-(--ditto-surface) p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-(--ditto-primary) text-(--ditto-bg) px-2 py-0.5 rounded">
                  {t("apiKeysMcpRecommendedTag")}
                </span>
                <h3 className="text-sm font-semibold text-(--ditto-text)">
                  {t("apiKeysMcpOptionATitle")}
                </h3>
              </div>
              <p className="text-xs text-(--ditto-text-secondary) leading-relaxed mb-3">
                {t("apiKeysMcpOptionADesc")}
              </p>

              <p className="text-xs text-(--ditto-text-secondary) mb-1.5">
                <strong>1.</strong> {t("apiKeysMcpOptionAStep")}
              </p>
              <Cmd>{`claude mcp add --transport http ditto https://dittodesign.dev/mcp --header "Authorization: Bearer YOUR_KEY_HERE"`}</Cmd>
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-(--ditto-warning)/40 bg-(--ditto-warning)/10 px-3 py-2">
                <span className="text-(--ditto-warning) text-xs font-bold shrink-0">⚠</span>
                <p className="text-[11px] text-(--ditto-text-secondary) leading-relaxed">
                  <strong className="text-(--ditto-text)">{t("apiKeysMcpHeaderWarnPart1")} <code className="font-mono">--header</code> {t("apiKeysMcpHeaderWarnPart2")}</strong>{" "}
                  {t("apiKeysMcpHeaderWarnPart3")} <em>{t("apiKeysMcpHeaderWarnFailText")}</em>{t("apiKeysMcpHeaderWarnPart4")}
                  <code className="font-mono"> YOUR_KEY_HERE</code> {t("apiKeysMcpHeaderWarnPart5")} <code className="font-mono">ditto_live_abc123…</code>{t("apiKeysMcpHeaderWarnPart6")}
                </p>
              </div>
              <p className="text-[11px] text-(--ditto-text-muted) mt-2">
                {t("apiKeysMcpOptionAFooter")} <code className="font-mono">claude</code>.
              </p>
            </div>

            {/* Option B — local npm package */}
            <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-5">
              <h3 className="text-sm font-semibold text-(--ditto-text) mb-2">
                {t("apiKeysMcpOptionBTitle")}
              </h3>
              <p className="text-xs text-(--ditto-text-secondary) leading-relaxed mb-3">
                {t("apiKeysMcpOptionBDescPart1")}{" "}
                <code className="font-mono">~/.claude.json</code>{t("apiKeysMcpOptionBDescPart2")}
              </p>
              <div className="space-y-2 mb-3">
                <Cmd>npm i -g @didap/ditto</Cmd>
              </div>
              <div className="relative rounded-lg border border-(--ditto-border) bg-(--ditto-bg) p-3">
                <div className="absolute top-2 right-2">
                  <CopyBtn
                    text={`{
  "mcpServers": {
    "ditto": {
      "command": "ditto-mcp",
      "env": { "DITTO_API_KEY": "ditto_live_..." }
    }
  }
}`}
                    size="md"
                  />
                </div>
                <pre className="text-xs font-mono text-(--ditto-text) overflow-x-auto pr-10">{`{
  "mcpServers": {
    "ditto": {
      "command": "ditto-mcp",
      "env": { "DITTO_API_KEY": "ditto_live_..." }
    }
  }
}`}</pre>
              </div>
            </div>

            <p className="text-xs text-(--ditto-text-muted)">
              {t("apiKeysMcpToolsNotePart1")}{" "}
              <code className="font-mono">extract_design</code>{t("apiKeysMcpToolsNotePart2")}{" "}
              <code className="font-mono">whoami</code>{t("apiKeysMcpToolsNotePart3")}
            </p>
        </div>
      </section>
    </div>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-(--ditto-text) mb-1">{q}</dt>
      <dd className="text-sm text-(--ditto-text-secondary) leading-relaxed">{children}</dd>
    </div>
  );
}

function relTime(iso: string, t: (key: TranslationKey) => string): string {
  const now = Date.now();
  const ts = new Date(iso).getTime();
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return t("apiKeysTimeNow");
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t("apiKeysTimeMinutes")}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("apiKeysTimeHours")}`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ${t("apiKeysTimeDays")}`;
  return new Date(iso).toLocaleDateString();
}
