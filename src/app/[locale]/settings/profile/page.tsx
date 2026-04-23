"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Upload, Shuffle, Trash2, User as UserIcon, Save } from "lucide-react";
import {
  dittatoAvatarDataUrl,
  encodeDittatoSeed,
  extractDittatoSeed,
  isUploadedAvatar,
  normalizeSeed,
  randomSeed,
} from "@/lib/avatar-dittato";
import { setConsent, useConsent } from "@/lib/analytics/consent";
import { useT } from "@/lib/locale-context";

interface ProfileData {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

type AvatarMode = "uploaded" | "dittato";

export default function ProfilePage() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Form state (unsaved changes)
  const [name, setName] = useState("");
  const [avatarMode, setAvatarMode] = useState<AvatarMode>("dittato");
  /** Seed when avatarMode === "dittato" */
  const [seed, setSeed] = useState<string>("");
  /** Preview URL when a new file was uploaded — already a Cloudinary URL. */
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setProfile(data);
        setName(data.name || "");
        if (isUploadedAvatar(data.avatarUrl)) {
          setAvatarMode("uploaded");
          setUploadedUrl(data.avatarUrl);
          setSeed(normalizeSeed(data.email));
        } else {
          setAvatarMode("dittato");
          setSeed(extractDittatoSeed(data.avatarUrl) ?? normalizeSeed(data.email));
        }
      })
      .catch(() => setError(t("profileLoadFailed")))
      .finally(() => setLoading(false));
  }, [t]);

  // Derived: the src currently shown in the big preview
  const previewSrc = useMemo(() => {
    if (avatarMode === "uploaded" && uploadedUrl) return uploadedUrl;
    return dittatoAvatarDataUrl(seed || "ditto", 256);
  }, [avatarMode, uploadedUrl, seed]);

  const nameValid = name.trim().length >= 2 && name.trim().length <= 60;

  const dirty = useMemo(() => {
    if (!profile) return false;
    if (name.trim() !== (profile.name || "")) return true;
    if (avatarMode === "uploaded") {
      return uploadedUrl !== profile.avatarUrl;
    }
    return encodeDittatoSeed(seed) !== profile.avatarUrl;
  }, [profile, name, avatarMode, uploadedUrl, seed]);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("profileUploadFailed"));
        return;
      }
      setUploadedUrl(data.avatarUrl);
      setAvatarMode("uploaded");
      // The avatar route also persists avatarUrl — refresh local profile mirror.
      setProfile((p) => (p ? { ...p, avatarUrl: data.avatarUrl } : p));
    } catch {
      setError(t("profileUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const shuffle = () => {
    setAvatarMode("dittato");
    setSeed(randomSeed());
  };

  const useEmailSeed = () => {
    setAvatarMode("dittato");
    if (profile) setSeed(normalizeSeed(profile.email));
  };

  const removeUpload = () => {
    setUploadedUrl(null);
    setAvatarMode("dittato");
    if (profile) setSeed(extractDittatoSeed(profile.avatarUrl) ?? normalizeSeed(profile.email));
  };

  const save = async () => {
    if (!nameValid || !profile) return;
    setSaving(true);
    setError(null);
    try {
      const body: { name: string; avatarUrl?: string | null } = { name: name.trim() };
      if (avatarMode === "uploaded" && uploadedUrl) {
        body.avatarUrl = uploadedUrl;
      } else {
        body.avatarUrl = encodeDittatoSeed(seed);
      }
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("profileSaveFailed"));
        return;
      }
      setProfile((p) =>
        p
          ? {
              ...p,
              name: body.name,
              avatarUrl: body.avatarUrl ?? null,
            }
          : p,
      );
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch {
      setError(t("profileSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-sm text-(--ditto-text-muted)">{t("profileLoading")}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-sm text-(--ditto-error)">{t("profileUnavailable")}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4">
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-(--ditto-text) tracking-tight">
          <UserIcon className="w-6 h-6 text-(--ditto-primary)" strokeWidth={2} />
          {t("profileTitle")}
        </h1>
        <p className="text-sm text-(--ditto-text-muted) mt-1">
          {t("profileSubtitle")}
        </p>
      </header>

      {/* Avatar section */}
      <section className="mb-8 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-4">{t("profileAvatarHeading")}</h2>

        <div className="flex gap-6 items-start flex-wrap">
          {/* Preview */}
          <div className="shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-(--ditto-border) bg-(--ditto-bg) flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt={t("profileAvatarPreviewAlt")}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-2 text-[11px] text-center text-(--ditto-text-muted) uppercase tracking-wider">
              {avatarMode === "uploaded" ? t("profileAvatarModeUploaded") : t("profileAvatarModeGenerated")}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-1 min-w-[240px] space-y-3">
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg border border-(--ditto-border) px-3 py-2 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors disabled:opacity-60"
              >
                <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                {uploading ? t("profileUploading") : t("profileUploadPhoto")}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={shuffle}
                className="inline-flex items-center gap-2 rounded-lg border border-(--ditto-border) px-3 py-2 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" strokeWidth={1.5} />
                {t("profileGenerateNew")}
              </button>

              {avatarMode === "dittato" && (
                <button
                  type="button"
                  onClick={useEmailSeed}
                  className="inline-flex items-center gap-2 rounded-lg border border-(--ditto-border) px-3 py-2 text-xs text-(--ditto-text-muted) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
                  title={t("profileUseDefaultTitle")}
                >
                  {t("profileUseDefault")}
                </button>
              )}

              {avatarMode === "uploaded" && (
                <button
                  type="button"
                  onClick={removeUpload}
                  className="inline-flex items-center gap-2 rounded-lg border border-(--ditto-border) px-3 py-2 text-xs text-(--ditto-text-muted) hover:text-(--ditto-error) hover:border-(--ditto-error) transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {t("profileRemovePhoto")}
                </button>
              )}
            </div>

            <p className="text-xs text-(--ditto-text-muted) leading-relaxed">
              {t("profileAvatarHint")}
            </p>
          </div>
        </div>
      </section>

      {/* Name section */}
      <section className="mb-8 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6">
        <h2 className="text-sm font-semibold text-(--ditto-text) mb-4">{t("profileInfoHeading")}</h2>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium text-(--ditto-text-muted) mb-1"
            >
              {t("profilePublicName")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="w-full px-3 py-2 rounded-lg bg-(--ditto-bg) border border-(--ditto-border) text-sm text-(--ditto-text) outline-none focus:border-(--ditto-primary) transition-colors"
              placeholder={t("profileNamePlaceholder")}
            />
            {!nameValid && name.length > 0 && (
              <div className="text-xs text-(--ditto-error) mt-1">
                {t("profileNameInvalid")}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-(--ditto-text-muted) mb-1">
              {t("profileEmailLabel")}
            </label>
            <div className="px-3 py-2 rounded-lg bg-(--ditto-bg) border border-(--ditto-border) text-sm text-(--ditto-text-muted)">
              {profile.email}
            </div>
          </div>
        </div>
      </section>

      {/* Analytics consent toggle */}
      <AnalyticsConsentSection />

      {/* Save bar */}
      <div className="flex items-center justify-between gap-3 sticky bottom-4">
        <div className="text-xs">
          {error && <span className="text-(--ditto-error)">{error}</span>}
          {!error && savedFlash && (
            <span className="inline-flex items-center gap-1 text-(--ditto-primary) font-medium">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              {t("profileSaved")}
            </span>
          )}
          {!error && !savedFlash && dirty && (
            <span className="text-(--ditto-text-muted)">{t("profileUnsaved")}</span>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!nameValid || !dirty || saving}
          className="inline-flex items-center gap-2 rounded-lg bg-(--ditto-primary) text-(--ditto-bg) px-4 py-2 text-sm font-semibold hover:bg-(--ditto-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" strokeWidth={2} />
          {saving ? t("profileSaving") : t("profileSave")}
        </button>
      </div>
    </div>
  );
}

// ─── Analytics consent toggle ─────────────────────────────────────────
function AnalyticsConsentSection() {
  const consent = useConsent();
  const t = useT();
  const enabled = consent === "granted";
  return (
    <section className="mb-8 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6">
      <h2 className="text-sm font-semibold text-(--ditto-text) mb-2">
        {t("consentManageTitle")}
      </h2>
      <p className="text-xs text-(--ditto-text-muted) mb-4 leading-relaxed">
        {t("consentManageBody")}
      </p>
      <button
        type="button"
        onClick={() => setConsent(enabled ? "denied" : "granted")}
        className="flex items-center justify-between w-full"
      >
        <span className="text-sm text-(--ditto-text)">
          {enabled ? t("consentAccept") : t("consentDeny")}
        </span>
        <span
          className="relative inline-block w-10 h-5 rounded-full transition-colors"
          style={{
            backgroundColor: enabled
              ? "var(--ditto-primary)"
              : "var(--ditto-border)",
          }}
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-(--ditto-bg) shadow-sm transition-all"
            style={{ left: enabled ? "calc(100% - 18px)" : "2px" }}
          />
        </span>
      </button>
    </section>
  );
}
