"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Terminal, Sparkles, KeyRound } from "lucide-react";

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
      title={copied ? "Copiato" : "Copia"}
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
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [justCreated, setJustCreated] = useState<CreatedKey | null>(null);
  const [copiedNewKey, setCopiedNewKey] = useState(false);
  const [showMcp, setShowMcp] = useState(false);

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
    if (!confirm("Revocare questa chiave? Chi la sta usando perderà accesso.")) return;
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
        <span className="text-xs font-semibold uppercase tracking-wider">CLI & API</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-(--ditto-text) mb-2">
        Usa Ditto dal tuo terminale
      </h1>
      <p className="text-base text-(--ditto-text-secondary) mb-10 leading-relaxed">
        Estrai un design da qualsiasi URL senza aprire il browser.
        Stessi crediti del web, stessi comandi ovunque.
      </p>

      {/* ─── Quick start ─────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-4 uppercase tracking-wider">
          Quick start
        </h2>

        <ol className="space-y-4">
          <li>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-full bg-(--ditto-primary) text-(--ditto-bg) text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span className="text-sm font-medium text-(--ditto-text)">Installa</span>
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
                Genera una chiave qui sotto e copiala
              </span>
            </div>
            <p className="pl-9 text-xs text-(--ditto-text-muted)">
              Usa il form più in basso. La chiave viene mostrata una sola volta.
            </p>
          </li>

          <li>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-full bg-(--ditto-primary) text-(--ditto-bg) text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span className="text-sm font-medium text-(--ditto-text)">Estrai un design</span>
            </div>
            <div className="pl-9 space-y-2">
              <Cmd>ditto login</Cmd>
              <Cmd>ditto https://stripe.com</Cmd>
              <p className="text-xs text-(--ditto-text-muted) pl-1">
                Scrive <code className="font-mono">DESIGN.md</code> nella cartella corrente.
                Scala 100 crediti dal tuo account.
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* ─── New key — form + big card if just created ──────────────────── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-4 uppercase tracking-wider">
          Le tue chiavi
        </h2>

        {/* Just-created banner */}
        {justCreated && (
          <div className="mb-4 rounded-xl border-2 border-(--ditto-primary) bg-(--ditto-primary)/10 p-5">
            <div className="flex items-start gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-(--ditto-primary) mt-0.5 shrink-0" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-semibold text-(--ditto-text)">Chiave creata!</p>
                <p className="text-xs text-(--ditto-text-secondary)">
                  Copiala ora — per sicurezza non verrà più mostrata.
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
                    Copiata
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                    Copia
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-(--ditto-text-secondary) mb-2">
              Login rapido (incollalo nel tuo terminale):
            </p>
            <Cmd>{`ditto login --key ${justCreated.key}`}</Cmd>
            <button
              onClick={() => setJustCreated(null)}
              className="mt-3 text-xs text-(--ditto-text-muted) hover:text-(--ditto-text) underline"
            >
              Ho copiato, chiudi
            </button>
          </div>
        )}

        {/* Create form */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Dai un nome alla chiave (es. 'laptop', 'CI')"
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
            {creating ? "Creazione…" : "Genera chiave"}
          </button>
        </div>

        {/* Keys list */}
        {loading ? (
          <p className="text-xs text-(--ditto-text-muted) py-3">Caricamento…</p>
        ) : keys.length === 0 ? (
          <p className="text-xs text-(--ditto-text-muted) py-3">
            Nessuna chiave ancora. Creane una qui sopra per iniziare.
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
                      ? `usata ${relTime(k.lastUsedAt)}`
                      : "mai usata"}
                  </p>
                </div>
                <button
                  onClick={() => revoke(k.id)}
                  className="shrink-0 text-xs font-medium text-(--ditto-text-muted) px-2 py-1 rounded hover:text-red-500 transition-colors"
                >
                  Revoca
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-4 uppercase tracking-wider">
          Domande frequenti
        </h2>
        <dl className="space-y-4">
          <FAQ q="Dove finisce il file estratto?">
            Nella cartella in cui ti trovi quando lanci il comando. Il file si chiama{" "}
            <code className="font-mono text-xs bg-(--ditto-bg) px-1 py-0.5 rounded">DESIGN.md</code>,
            è tuo, vive sul disco. Se vuoi vederlo anche su Ditto aggiungi{" "}
            <code className="font-mono text-xs bg-(--ditto-bg) px-1 py-0.5 rounded">--save</code>.
          </FAQ>
          <FAQ q="Quanto costa?">
            100 crediti per estrazione, come dal web. Per il comando{" "}
            <code className="font-mono text-xs bg-(--ditto-bg) px-1 py-0.5 rounded">merge</code>{" "}
            (blend di più siti): 100 × N estrazioni + 300 extra per la miscela.
            Se qualcosa va storto, rimborso automatico.
          </FAQ>
          <FAQ q="Come vedo quanti crediti ho?">
            <Cmd>ditto whoami</Cmd>
          </FAQ>
          <FAQ q="Posso vedere i design salvati?">
            Sì, lista + apertura diretti dal terminale:
            <div className="mt-2 space-y-1.5">
              <Cmd>ditto list</Cmd>
              <Cmd>ditto view stripe</Cmd>
            </div>
          </FAQ>
          <FAQ q="Ho perso una chiave, che faccio?">
            Revocala dalla lista qui sopra e creane una nuova. Le chiavi non sono
            mai salvate in chiaro sui nostri server, per cui non possiamo
            recuperartela — solo sostituirla.
          </FAQ>
        </dl>
      </section>

      {/* ─── Esempio pratico ─────────────────────────────────────────── */}
      <section className="mb-10 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-5">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-(--ditto-primary)" strokeWidth={1.75} />
          Esempio: estrai Stripe e fallo usare a un agente AI
        </h2>
        <ol className="space-y-3 text-sm text-(--ditto-text-secondary)">
          <li>
            <strong className="text-(--ditto-text)">1.</strong> Apri il tuo progetto nel
            terminale:
            <div className="mt-1.5">
              <Cmd>cd mio-progetto/</Cmd>
            </div>
          </li>
          <li>
            <strong className="text-(--ditto-text)">2.</strong> Estrai lo stile:
            <div className="mt-1.5">
              <Cmd>ditto https://stripe.com</Cmd>
            </div>
            <p className="text-xs text-(--ditto-text-muted) mt-1">
              Ora hai un <code className="font-mono">DESIGN.md</code> nella cartella.
            </p>
          </li>
          <li>
            <strong className="text-(--ditto-text)">3.</strong> Apri Claude Code (o Cursor) e
            chiedigli:
            <div className="mt-2 rounded-lg border border-(--ditto-primary)/30 bg-(--ditto-primary)/5 px-4 py-3 text-sm italic text-(--ditto-text)">
              &ldquo;Leggi DESIGN.md e ricostruisci la mia landing page usando quei colori,
              font e componenti. Replica l&apos;hero pattern descritto e mantieni lo stesso
              sentiment.&rdquo;
            </div>
            <p className="text-xs text-(--ditto-text-muted) mt-1">
              L&apos;agente userà i token estratti come source of truth per generare UI
              coerente con il brand.
            </p>
          </li>
        </ol>
      </section>

      {/* ─── MCP (collapsed by default) ─────────────────────────────────── */}
      <section>
        <button
          onClick={() => setShowMcp(!showMcp)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="text-sm font-semibold text-(--ditto-text) uppercase tracking-wider">
            Per sviluppatori AI &mdash; Claude Code, Cursor, Zed
          </h2>
          <span className="text-xs text-(--ditto-text-muted)">
            {showMcp ? "Nascondi ↑" : "Mostra ↓"}
          </span>
        </button>
        {showMcp && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-(--ditto-text-secondary) leading-relaxed">
              Ditto espone un server MCP che i tuoi agenti AI possono chiamare direttamente
              durante una sessione (niente bisogno di {"`"}ditto{" "}
              {"<url>"}{"`"} manuale). Scegli come collegarlo:
            </p>

            {/* Option A — hosted HTTP (recommended) */}
            <div className="rounded-xl border-2 border-(--ditto-primary) bg-(--ditto-surface) p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-(--ditto-primary) text-(--ditto-bg) px-2 py-0.5 rounded">
                  Consigliato
                </span>
                <h3 className="text-sm font-semibold text-(--ditto-text)">
                  A — Server hosted (zero install)
                </h3>
              </div>
              <p className="text-xs text-(--ditto-text-secondary) leading-relaxed mb-3">
                Usa l&apos;MCP di Ditto direttamente via HTTP — nessun pacchetto npm, nessun
                binario locale. Claude Code lo aggiunge con un comando.
              </p>
              <Cmd>{`claude mcp add --transport http ditto https://dittodesign.dev/mcp --header "Authorization: Bearer ditto_live_..."`}</Cmd>
              <p className="text-[11px] text-(--ditto-text-muted) mt-2">
                Sostituisci <code className="font-mono">ditto_live_...</code> con una chiave
                generata qui sopra. Lo stesso comando funziona per Cursor / Zed, cambia solo
                il client di gestione.
              </p>
            </div>

            {/* Option B — local npm package */}
            <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-5">
              <h3 className="text-sm font-semibold text-(--ditto-text) mb-2">
                B — Pacchetto npm (stdio locale)
              </h3>
              <p className="text-xs text-(--ditto-text-secondary) leading-relaxed mb-3">
                Per chi vuole tenersi il binario in locale e non dipendere dal nostro server.
                Installa il pacchetto e aggiungilo a{" "}
                <code className="font-mono">~/.claude.json</code>:
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
              Tools esposti da entrambi:{" "}
              <code className="font-mono">extract_design</code>,{" "}
              <code className="font-mono">whoami</code>. L&apos;agente può chiamarli durante
              la sessione; ogni estrazione scala 100 crediti dal tuo account.
            </p>
          </div>
        )}
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

function relTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.floor((now - t) / 1000);
  if (diff < 60) return "adesso";
  if (diff < 3600) return `${Math.floor(diff / 60)} min fa`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} giorni fa`;
  return new Date(iso).toLocaleDateString();
}
