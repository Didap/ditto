"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";

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

function CopyButton({ text, label = "Copia" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-(--ditto-border) bg-(--ditto-surface) text-(--ditto-text-secondary) text-[11px] font-medium px-2 py-1 hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" strokeWidth={2} />
          Copiato
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" strokeWidth={1.75} />
          {label}
        </>
      )}
    </button>
  );
}

function Snippet({ code }: { code: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-3 py-2">
      <pre className="flex-1 text-xs font-mono text-(--ditto-text) overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <CopyButton text={code} />
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-(--ditto-primary) text-(--ditto-bg) text-sm font-bold flex items-center justify-center">
        {number}
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <h3 className="text-sm font-semibold text-(--ditto-text) mb-2">{title}</h3>
        <div className="text-sm text-(--ditto-text-secondary) leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [justCreated, setJustCreated] = useState<CreatedKey | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

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
    if (!confirm("Revocare questa chiave? Tutti gli script che la usano smetteranno di funzionare.")) return;
    await fetch(`/api/auth/keys/${id}`, { method: "DELETE" });
    await load();
  };

  const copyNewKey = async () => {
    if (!justCreated) return;
    await navigator.clipboard.writeText(justCreated.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const hasKey = keys.length > 0;

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <h1 className="text-2xl font-bold tracking-tight text-(--ditto-text) mb-2">
        CLI &amp; API Keys
      </h1>
      <p className="text-sm text-(--ditto-text-secondary) mb-8">
        Usa Ditto dal terminale o da qualsiasi agente MCP (Claude Code, Cursor, Zed).
        Stesso account, stessi crediti, pipeline identica al web.
      </p>

      {/* ─── Getting started ─────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-(--ditto-text) mb-1">
          Come partire in 4 passi
        </h2>
        <p className="text-xs text-(--ditto-text-muted) mb-6">
          Setup una volta, poi estrai da qualsiasi progetto.
        </p>

        <div className="space-y-5">
          <Step number={1} title="Installa il CLI">
            <p>Richiede Node.js 18+.</p>
            <Snippet code="npm i -g @didap/ditto" />
          </Step>

          <Step number={2} title="Genera una chiave API">
            <p>
              Qui sotto trovi il form &quot;Nuova chiave&quot;. Scegli un nome descrittivo (es.
              <em> &quot;laptop&quot;</em>, <em>&quot;CI GitHub&quot;</em>), clicca Crea,
              <strong> copia la chiave adesso</strong>: per sicurezza non sarà più mostrata.
            </p>
          </Step>

          <Step number={3} title="Login dal terminale">
            <p>
              Scegli uno dei due: interattivo (ti chiede la chiave) o diretto con flag{" "}
              <code className="text-xs font-mono bg-(--ditto-bg) px-1 py-0.5 rounded">--key</code>.
            </p>
            <Snippet code="ditto login" />
            <p className="text-xs">oppure, per script / CI:</p>
            <Snippet code="ditto login --key ditto_live_XXXX" />
            <p className="text-xs">
              La chiave viene salvata in <code className="font-mono">~/.ditto/config.json</code> con
              permessi user-only (0600). In alternativa puoi usare la variabile d&apos;ambiente{" "}
              <code className="font-mono">DITTO_API_KEY</code>.
            </p>
          </Step>

          <Step number={4} title="Estrai un design">
            <p>
              Spostati nella cartella del progetto in cui vuoi il file <code className="font-mono">DESIGN.md</code> e lancia:
            </p>
            <Snippet code="ditto https://stripe.com" />
            <p className="text-xs">
              Esempio completo: estrai Linear con nome custom e percorso custom.
            </p>
            <Snippet code="ditto https://linear.app --name Linear --out docs/linear.md" />
          </Step>
        </div>
      </section>

      {/* ─── Newly-created key banner ───────────────────────────────────── */}
      {justCreated && (
        <div className="mb-8 rounded-xl border border-(--ditto-primary) bg-(--ditto-primary)/10 p-5">
          <h3 className="text-sm font-semibold text-(--ditto-text) mb-1">
            Chiave creata: {justCreated.name}
          </h3>
          <p className="text-xs text-(--ditto-text-secondary) mb-3">
            Copiala adesso. Per sicurezza non verrà più mostrata dopo aver chiuso questo messaggio.
            Se la perdi, revoca e rigenera.
          </p>
          <div className="flex gap-2 items-center mb-3">
            <code className="flex-1 rounded-lg bg-(--ditto-bg) text-(--ditto-text) text-xs font-mono px-3 py-2 overflow-x-auto whitespace-nowrap border border-(--ditto-border)">
              {justCreated.key}
            </code>
            <button
              onClick={copyNewKey}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-(--ditto-primary) text-(--ditto-bg) text-xs font-medium px-3 py-2 hover:bg-(--ditto-primary-hover)"
            >
              {copiedKey ? (
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
            <button
              onClick={() => setJustCreated(null)}
              className="shrink-0 rounded-lg border border-(--ditto-border) text-(--ditto-text-secondary) text-xs font-medium px-3 py-2 hover:text-(--ditto-text)"
            >
              Chiudi
            </button>
          </div>
          <div className="rounded-lg border border-(--ditto-border) bg-(--ditto-bg) p-3">
            <p className="text-[11px] text-(--ditto-text-muted) mb-2">Quick login:</p>
            <Snippet code={`ditto login --key ${justCreated.key}`} />
          </div>
        </div>
      )}

      {/* ─── Create form ─────────────────────────────────────────────────── */}
      <section className="mb-8 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-5">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-3">Nuova chiave</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Nome descrittivo (es. 'laptop', 'CI GitHub')"
            className="flex-1 rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary)"
            disabled={creating}
            maxLength={50}
          />
          <button
            onClick={create}
            disabled={creating}
            className="rounded-lg bg-(--ditto-primary) text-(--ditto-bg) text-sm font-medium px-4 py-2 hover:bg-(--ditto-primary-hover) disabled:opacity-50"
          >
            {creating ? "Creazione…" : "Crea"}
          </button>
        </div>
      </section>

      {/* ─── Active keys ─────────────────────────────────────────────────── */}
      <section className="mb-10 rounded-xl border border-(--ditto-border) bg-(--ditto-surface)">
        <div className="px-5 py-3 border-b border-(--ditto-border) flex items-center justify-between">
          <h2 className="text-sm font-semibold text-(--ditto-text)">Chiavi attive</h2>
          <span className="text-xs text-(--ditto-text-muted)">{keys.length} totali</span>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-xs text-(--ditto-text-muted)">Caricamento…</p>
        ) : keys.length === 0 ? (
          <p className="px-5 py-6 text-xs text-(--ditto-text-muted)">
            Nessuna chiave ancora. Creane una qui sopra per iniziare.
          </p>
        ) : (
          <ul className="divide-y divide-(--ditto-border)">
            {keys.map((k) => (
              <li key={k.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-(--ditto-text) truncate">{k.name}</p>
                  <p className="text-xs text-(--ditto-text-muted) font-mono">
                    {k.keyPrefix}…  ·  creata {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt
                      ? `  ·  ultima uso ${new Date(k.lastUsedAt).toLocaleDateString()}`
                      : "  ·  mai usata"}
                  </p>
                </div>
                <button
                  onClick={() => revoke(k.id)}
                  className="shrink-0 rounded-lg border border-(--ditto-border) text-(--ditto-text-secondary) text-xs font-medium px-3 py-1.5 hover:text-red-500 hover:border-red-500/40 transition-colors"
                >
                  Revoca
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── How it works ───────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-(--ditto-text) mb-4">Come funziona</h2>

        <div className="space-y-4">
          <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-5">
            <h3 className="text-sm font-semibold text-(--ditto-text) mb-2">
              Dove finisce il file estratto?
            </h3>
            <p className="text-sm text-(--ditto-text-secondary) leading-relaxed mb-2">
              <code className="font-mono">ditto &lt;url&gt;</code> scrive un file chiamato{" "}
              <code className="font-mono">DESIGN.md</code> nella cartella corrente (CWD). Non viene
              salvato sui server di Ditto: vive solo sul tuo disco, è tuo.
            </p>
            <p className="text-sm text-(--ditto-text-secondary) leading-relaxed mb-2">
              Se invece vuoi anche vederlo nella tua libreria Ditto su{" "}
              <code className="font-mono">/dashboard</code> (per usarlo con l&apos;editor, i macros,
              i kit scaricabili), aggiungi il flag{" "}
              <code className="font-mono">--save</code>:
            </p>
            <Snippet code="ditto https://stripe.com --save" />
          </div>

          <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-5">
            <h3 className="text-sm font-semibold text-(--ditto-text) mb-2">
              Come vengono spesi i crediti?
            </h3>
            <p className="text-sm text-(--ditto-text-secondary) leading-relaxed mb-2">
              Stesso saldo del web: quando estrai dal CLI, Ditto scala 100 crediti dal tuo account.
              Se il sito target è protetto da WAF e il primo tentativo fallisce, riproviamo tramite
              proxy residenziale — la prima estrazione &quot;speciale&quot; di ogni mese è inclusa,
              le successive costano 100 crediti extra.
            </p>
            <p className="text-sm text-(--ditto-text-secondary) leading-relaxed mb-2">
              Per controllare il saldo live:
            </p>
            <Snippet code="ditto whoami" />
          </div>

          <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-5">
            <h3 className="text-sm font-semibold text-(--ditto-text) mb-2">
              Revoca o perdita di una chiave
            </h3>
            <p className="text-sm text-(--ditto-text-secondary) leading-relaxed">
              Le chiavi vengono mostrate <strong>una sola volta</strong>, al momento della creazione.
              Il server non le conserva in chiaro (solo l&apos;hash SHA-256). Se perdi una chiave o
              sospetti che sia stata leakata, revocala dalla lista qui sopra e creane una nuova — è
              istantaneo.
            </p>
          </div>
        </div>
      </section>

      {/* ─── MCP setup ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-(--ditto-text) mb-1">
          Usa Ditto dai tuoi agenti AI
        </h2>
        <p className="text-xs text-(--ditto-text-muted) mb-4">
          Il pacchetto include un secondo binary{" "}
          <code className="font-mono">ditto-mcp</code> che espone l&apos;estrazione come tool MCP.
          Qualsiasi agente compatibile (Claude Code, Cursor, Zed) può chiamarla durante una sessione.
        </p>

        <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-5 space-y-3">
          <p className="text-sm text-(--ditto-text-secondary)">
            Aggiungi a <code className="font-mono">~/.claude.json</code> (o{" "}
            <code className="font-mono">.mcp.json</code> del progetto):
          </p>
          <Snippet
            code={`{
  "mcpServers": {
    "ditto": {
      "command": "ditto-mcp",
      "env": { "DITTO_API_KEY": "ditto_live_..." }
    }
  }
}`}
          />
          <p className="text-xs text-(--ditto-text-muted)">
            Tool esposti:{" "}
            <code className="font-mono">extract_design(url, name?, save?)</code>{" "}
            e <code className="font-mono">whoami()</code>. L&apos;agente chiede conferma prima di
            scalare i crediti se usi Claude Code con{" "}
            <code className="font-mono">permissionMode: plan</code>.
          </p>
        </div>
      </section>

      {!hasKey && (
        <p className="mt-10 text-center text-xs text-(--ditto-text-muted)">
          Hai bisogno d&apos;aiuto? Leggi la README del pacchetto su{" "}
          <a
            href="https://www.npmjs.com/package/@didap/ditto"
            target="_blank"
            rel="noopener"
            className="underline hover:text-(--ditto-text)"
          >
            npm
          </a>
          .
        </p>
      )}
    </div>
  );
}
