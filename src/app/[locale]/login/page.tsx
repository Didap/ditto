"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocalePath, useT } from "@/lib/locale-context";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lp = useLocalePath();
  const t = useT();
  const verified = searchParams.get("verified") === "true";
  const tokenError = searchParams.get("error");

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
      setError(t("authLoginInvalidCredentials"));
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
          <h1 className="text-2xl font-bold tracking-tight text-(--ditto-text)">
            {t("authLoginTitle")}
          </h1>
          <p className="text-sm text-(--ditto-text-muted) mt-1">
            {t("authLoginSubtitle")}
          </p>
        </div>

        {/* Verification success */}
        {verified && (
          <div className="rounded-lg border border-(--ditto-primary)/30 bg-(--ditto-primary)/10 px-4 py-3 mb-4">
            <p className="text-sm text-(--ditto-primary) font-medium">
              {t("authLoginVerifiedSuccess")}
            </p>
          </div>
        )}

        {/* Token errors */}
        {tokenError === "invalid-token" && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 mb-4">
            <p className="text-sm text-red-400">{t("authLoginInvalidToken")}</p>
          </div>
        )}
        {tokenError === "expired-token" && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 mb-4">
            <p className="text-sm text-red-400">{t("authLoginExpiredToken")}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-(--ditto-text) mb-1.5">
              {t("authLoginEmailLabel")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary)"
              placeholder={t("authLoginEmailPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-(--ditto-text) mb-1.5">
              {t("authLoginPasswordLabel")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary)"
              placeholder={t("authLoginPasswordPlaceholder")}
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
            {loading ? t("authLoginSubmitting") : t("authLoginSubmit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-(--ditto-text-muted)">
          {t("authNoAccount")}{" "}
          <a
            href={lp("/register")}
            className="text-(--ditto-primary) hover:text-(--ditto-primary-hover)"
          >
            {t("authRegisterLink")}
          </a>
        </p>
      </div>
    </div>
  );
}
