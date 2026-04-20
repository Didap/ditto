"use client";

import { useEffect, useState, useCallback } from "react";
import { Coins, Pencil, Trash2, Check, X, Search, RefreshCw } from "lucide-react";

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  plan: string;
  credits: number;
  emailVerified: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  designsCount: number;
  unlockCreditsSpent: number;
}

interface EditState {
  user: AdminUserRow;
  name: string;
  email: string;
  credits: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

export function AdminUsersClient({ currentAdminId }: { currentAdminId: string }) {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleting, setDeleting] = useState<AdminUserRow | null>(null);
  const [savingCredits, setSavingCredits] = useState<string | null>(null);
  const [creditsDraft, setCreditsDraft] = useState<{ id: string; value: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setRows(data.users as AdminUserRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
  });

  const saveCreditsInline = async (id: string, value: string) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) {
      setError("Credits must be a non-negative integer");
      return;
    }
    setSavingCredits(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: n }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setRows((prev) => prev.map((u) => (u.id === id ? { ...u, credits: n } : u)));
      setCreditsDraft(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingCredits(null);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (editing.name !== editing.user.name) payload.name = editing.name;
      if (editing.email !== editing.user.email) payload.email = editing.email;
      const creditsN = Number(editing.credits);
      if (creditsN !== editing.user.credits) payload.credits = creditsN;

      const res = await fetch(`/api/admin/users/${editing.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setRows((prev) =>
        prev.map((u) =>
          u.id === editing.user.id
            ? { ...u, name: editing.name, email: editing.email, credits: creditsN }
            : u
        )
      );
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setRows((prev) => prev.filter((u) => u.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--ditto-text)">Manage Users</h1>
          <p className="text-sm text-(--ditto-text-muted) mt-1">
            {loading ? "Loading…" : `${rows.length} total · ${filtered.length} shown`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--ditto-text-muted)" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email or name…"
              className="w-64 pl-8 pr-3 py-2 rounded-lg bg-(--ditto-surface) border border-(--ditto-border) text-sm text-(--ditto-text) placeholder:text-(--ditto-text-muted) focus:outline-none focus:border-(--ditto-primary)"
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-(--ditto-border) px-3 py-2 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-(--ditto-error) bg-(--ditto-error)/10 px-4 py-2 text-sm text-(--ditto-error)">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-(--ditto-border)">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-(--ditto-surface) text-left text-xs uppercase tracking-wide text-(--ditto-text-muted)">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium text-right">Credits</th>
              <th className="px-4 py-3 font-medium text-right">Spent</th>
              <th className="px-4 py-3 font-medium text-right">Designs</th>
              <th className="px-4 py-3 font-medium">Verified</th>
              <th className="px-4 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const isSelf = u.id === currentAdminId;
              const draft = creditsDraft?.id === u.id ? creditsDraft.value : null;
              const isSaving = savingCredits === u.id;
              return (
                <tr
                  key={u.id}
                  className="border-t border-(--ditto-border) text-(--ditto-text) hover:bg-(--ditto-surface)/40"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{u.email}</span>
                    {isSelf && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-(--ditto-primary)">
                        you
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-(--ditto-text-secondary)">{u.name || "—"}</td>
                  <td className="px-4 py-3 text-(--ditto-text-secondary)">{u.plan}</td>
                  <td className="px-4 py-3 text-right">
                    {draft !== null ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={draft}
                          onChange={(e) =>
                            setCreditsDraft({ id: u.id, value: e.target.value })
                          }
                          className="w-20 px-2 py-1 rounded bg-(--ditto-bg) border border-(--ditto-border) text-right text-sm focus:outline-none focus:border-(--ditto-primary)"
                          autoFocus
                          disabled={isSaving}
                        />
                        <button
                          onClick={() => saveCreditsInline(u.id, draft)}
                          disabled={isSaving}
                          className="p-1 rounded text-(--ditto-success) hover:bg-(--ditto-success)/10 disabled:opacity-50"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => setCreditsDraft(null)}
                          disabled={isSaving}
                          className="p-1 rounded text-(--ditto-text-muted) hover:bg-(--ditto-bg)"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setCreditsDraft({ id: u.id, value: String(u.credits) })
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-(--ditto-primary) hover:bg-(--ditto-primary)/10 font-semibold"
                        title="Edit credits"
                      >
                        <Coins className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {u.credits}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-(--ditto-text-muted)">
                    {u.unlockCreditsSpent}
                  </td>
                  <td className="px-4 py-3 text-right">{u.designsCount}</td>
                  <td className="px-4 py-3 text-(--ditto-text-muted)">
                    {u.emailVerified ? "✓" : "—"}
                  </td>
                  <td className="px-4 py-3 text-(--ditto-text-muted)">
                    {formatDate(u.lastLoginAt)}
                  </td>
                  <td className="px-4 py-3 text-(--ditto-text-muted)">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() =>
                          setEditing({
                            user: u,
                            name: u.name,
                            email: u.email,
                            credits: String(u.credits),
                          })
                        }
                        className="p-1.5 rounded text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:bg-(--ditto-bg)"
                        title="Edit user"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => setDeleting(u)}
                        disabled={isSelf}
                        className="p-1.5 rounded text-(--ditto-text-secondary) hover:text-(--ditto-error) hover:bg-(--ditto-error)/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={isSelf ? "Cannot delete yourself" : "Delete user"}
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-(--ditto-text-muted)">
                  No users match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-1">Edit user</h2>
          <p className="text-xs text-(--ditto-text-muted) mb-4">
            ID: <code className="font-mono">{editing.user.id}</code>
          </p>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-(--ditto-text-muted)">Name</span>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="px-3 py-2 rounded-lg bg-(--ditto-bg) border border-(--ditto-border) text-sm text-(--ditto-text) focus:outline-none focus:border-(--ditto-primary)"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-(--ditto-text-muted)">Email</span>
              <input
                type="email"
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className="px-3 py-2 rounded-lg bg-(--ditto-bg) border border-(--ditto-border) text-sm text-(--ditto-text) focus:outline-none focus:border-(--ditto-primary)"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-(--ditto-text-muted)">Credits</span>
              <input
                type="number"
                min={0}
                step={1}
                value={editing.credits}
                onChange={(e) => setEditing({ ...editing, credits: e.target.value })}
                className="px-3 py-2 rounded-lg bg-(--ditto-bg) border border-(--ditto-border) text-sm text-(--ditto-text) focus:outline-none focus:border-(--ditto-primary)"
              />
            </label>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={() => setEditing(null)}
              disabled={busy}
              className="rounded-lg border border-(--ditto-border) px-4 py-2 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted)"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={busy}
              className="rounded-lg bg-(--ditto-primary) px-4 py-2 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleting && (
        <Modal onClose={() => setDeleting(null)}>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-2">Delete user</h2>
          <p className="text-sm text-(--ditto-text-secondary) mb-2">
            Permanently delete <span className="font-semibold text-(--ditto-text)">{deleting.email}</span>?
          </p>
          <p className="text-xs text-(--ditto-text-muted) mb-4">
            This cascades to <strong>{deleting.designsCount}</strong> designs, all unlocks, quest completions and API keys. Cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleting(null)}
              disabled={busy}
              className="rounded-lg border border-(--ditto-border) px-4 py-2 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted)"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={busy}
              className="rounded-lg bg-(--ditto-error) px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-(--ditto-border) bg-(--ditto-surface) p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
