"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email o password non validi");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <span className="w-12 h-12 ditto-blob inline-block mb-3" />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ditto-text)]">
            Accedi a Ditto
          </h1>
          <p className="text-sm text-[var(--ditto-text-muted)] mt-1">
            Entra per gestire i tuoi design system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ditto-text)] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--ditto-border)] bg-[var(--ditto-bg)] px-4 py-2.5 text-sm text-[var(--ditto-text)] placeholder-[var(--ditto-text-muted)] outline-none focus:border-[var(--ditto-primary)]"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ditto-text)] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--ditto-border)] bg-[var(--ditto-bg)] px-4 py-2.5 text-sm text-[var(--ditto-text)] placeholder-[var(--ditto-text-muted)] outline-none focus:border-[var(--ditto-primary)]"
              placeholder="La tua password"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--ditto-primary)] px-4 py-2.5 text-sm font-medium text-[var(--ditto-bg)] hover:bg-[var(--ditto-primary-hover)] transition-colors disabled:opacity-50"
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--ditto-text-muted)]">
          Non hai un account?{" "}
          <a
            href="/register"
            className="text-[var(--ditto-primary)] hover:text-[var(--ditto-primary-hover)]"
          >
            Registrati
          </a>
        </p>
      </div>
    </div>
  );
}
