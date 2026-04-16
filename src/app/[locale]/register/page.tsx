"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocalePath } from "@/lib/locale-context";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const lp = useLocalePath();
  const referralCode = searchParams.get("ref") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Le password non coincidono");
      return;
    }

    if (password.length < 6) {
      setError("La password deve avere almeno 6 caratteri");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, referralCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registrazione fallita");
        setLoading(false);
        return;
      }

      setLoading(false);
      setEmailSent(true);
    } catch {
      setLoading(false);
      setError("Errore di rete, riprova");
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-(--ditto-primary)/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-(--ditto-primary)" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-(--ditto-text) mb-2">Check your email</h1>
          <p className="text-sm text-(--ditto-text-muted) mb-1">
            We sent a verification link to
          </p>
          <p className="text-sm font-semibold text-(--ditto-text) mb-6">{email}</p>
          <p className="text-xs text-(--ditto-text-muted)">
            Click the link in the email to activate your account. The link expires in 24 hours.
          </p>
          <Link href={lp("/login")} className="inline-block mt-6 text-sm text-(--ditto-primary) hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <span className="w-12 h-12 ditto-blob inline-block mb-3" />
          <h1 className="text-2xl font-bold tracking-tight text-(--ditto-text)">
            Crea il tuo account
          </h1>
          <p className="text-sm text-(--ditto-text-muted) mt-1">
            Inizia a collezionare design system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-(--ditto-text) mb-1.5">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary)"
              placeholder="Il tuo nome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-(--ditto-text) mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary)"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-(--ditto-text) mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary)"
              placeholder="Minimo 6 caratteri"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-(--ditto-text) mb-1.5">
              Conferma password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary)"
              placeholder="Ripeti la password"
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
            className="w-full rounded-lg bg-(--ditto-primary) px-4 py-2.5 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors disabled:opacity-50"
          >
            {loading ? "Creazione in corso..." : "Crea account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-(--ditto-text-muted)">
          Hai gia un account?{" "}
          <a
            href={lp("/login")}
            className="text-(--ditto-primary) hover:text-(--ditto-primary-hover)"
          >
            Accedi
          </a>
        </p>
      </div>
    </div>
  );
}
