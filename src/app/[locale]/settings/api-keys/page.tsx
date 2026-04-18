"use client";

import { useEffect, useState } from "react";

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

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [justCreated, setJustCreated] = useState<CreatedKey | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copy = async () => {
    if (!justCreated) return;
    await navigator.clipboard.writeText(justCreated.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-(--ditto-text) mb-2">API Keys</h1>
      <p className="text-sm text-(--ditto-text-secondary) mb-8">
        Genera chiavi per usare Ditto dal CLI, da script CI, o dal server MCP. Ogni estrazione scala 100 crediti dal tuo account.
      </p>

      {/* Install hint */}
      <div className="mb-6 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-5">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-2">Installazione CLI</h2>
        <pre className="rounded-lg bg-(--ditto-bg) text-(--ditto-text-secondary) text-xs font-mono px-3 py-2 overflow-x-auto">
npm i -g @didap/ditto
ditto login --key YOUR_KEY
cd your-project/
ditto https://stripe.com    {"# → scrive ./DESIGN.md"}
        </pre>
      </div>

      {/* Newly-created key banner */}
      {justCreated && (
        <div className="mb-6 rounded-xl border border-(--ditto-primary)/30 bg-(--ditto-primary)/10 p-5">
          <h3 className="text-sm font-semibold text-(--ditto-text) mb-1">Chiave creata: {justCreated.name}</h3>
          <p className="text-xs text-(--ditto-text-secondary) mb-3">
            Copiala adesso. Per sicurezza non verrà più mostrata dopo aver chiuso questo messaggio.
          </p>
          <div className="flex gap-2 items-center">
            <code className="flex-1 rounded-lg bg-(--ditto-bg) text-(--ditto-text) text-xs font-mono px-3 py-2 overflow-x-auto whitespace-nowrap">
              {justCreated.key}
            </code>
            <button
              onClick={copy}
              className="rounded-lg bg-(--ditto-primary) text-(--ditto-bg) text-xs font-medium px-3 py-2 hover:bg-(--ditto-primary-hover)"
            >
              {copied ? "Copiata!" : "Copia"}
            </button>
            <button
              onClick={() => setJustCreated(null)}
              className="rounded-lg border border-(--ditto-border) text-(--ditto-text-secondary) text-xs font-medium px-3 py-2 hover:text-(--ditto-text)"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="mb-6 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-5">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-3">Nuova chiave</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Nome descrittivo (es. 'laptop', 'CI GitHub')"
            className="flex-1 rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary)"
            disabled={creating}
          />
          <button
            onClick={create}
            disabled={creating}
            className="rounded-lg bg-(--ditto-primary) text-(--ditto-bg) text-sm font-medium px-4 py-2 hover:bg-(--ditto-primary-hover) disabled:opacity-50"
          >
            {creating ? "Creazione…" : "Crea"}
          </button>
        </div>
      </div>

      {/* Keys list */}
      <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface)">
        <div className="px-5 py-3 border-b border-(--ditto-border)">
          <h2 className="text-sm font-semibold text-(--ditto-text)">Chiavi attive</h2>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-xs text-(--ditto-text-muted)">Caricamento…</p>
        ) : keys.length === 0 ? (
          <p className="px-5 py-6 text-xs text-(--ditto-text-muted)">
            Nessuna chiave. Creane una qui sopra per iniziare a usare il CLI.
          </p>
        ) : (
          <ul className="divide-y divide-(--ditto-border)">
            {keys.map((k) => (
              <li key={k.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-(--ditto-text) truncate">{k.name}</p>
                  <p className="text-xs text-(--ditto-text-muted) font-mono">
                    {k.keyPrefix}…  ·  creata {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt && ` · ultima uso ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                    {!k.lastUsedAt && " · mai usata"}
                  </p>
                </div>
                <button
                  onClick={() => revoke(k.id)}
                  className="rounded-lg border border-(--ditto-border) text-(--ditto-text-secondary) text-xs font-medium px-3 py-1.5 hover:text-red-500 hover:border-red-500/40"
                >
                  Revoca
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
