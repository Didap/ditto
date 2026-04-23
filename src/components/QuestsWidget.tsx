"use client";

import { useCallback, useEffect, useState } from "react";
import { Drawer } from "vaul";
import confetti from "canvas-confetti";
import { Target, Coins, X, Sparkles, Check, Copy, Gift } from "lucide-react";
import { useCredits } from "@/lib/credits-context";
import { useT } from "@/lib/locale-context";
import type { QuestStatus } from "@/lib/quests";

interface QuestsWidgetProps {
  /** Whether the user is authenticated — widget hides entirely if false. */
  authed: boolean;
}

export function QuestsWidget({ authed }: QuestsWidgetProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [quests, setQuests] = useState<QuestStatus[] | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [justClaimed, setJustClaimed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { add: addCredits, refresh: refreshCredits } = useCredits();

  const fetchQuests = useCallback(async () => {
    try {
      const res = await fetch("/api/quests");
      if (!res.ok) return;
      const data = await res.json();
      setQuests(data.quests || []);
      setReferralCode(data.referralCode ?? null);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchQuests();
  }, [authed, fetchQuests]);

  // Refresh on drawer open so counts stay accurate.
  useEffect(() => {
    if (open && authed) fetchQuests();
  }, [open, authed, fetchQuests]);

  const fireConfetti = useCallback(() => {
    // Drawer opens on the left — origin slightly to the left + center vertically
    // so the burst is visible next to the claimed card.
    const defaults = { spread: 70, ticks: 180, gravity: 0.9, scalar: 0.9 };
    confetti({
      ...defaults,
      particleCount: 80,
      origin: { x: 0.15, y: 0.5 },
      colors: ["#03e65b", "#2aff7a", "#ffc533", "#ff3386"],
    });
    // Second burst, slightly delayed & wider
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 50,
        origin: { x: 0.25, y: 0.4 },
        colors: ["#03e65b", "#ffc533"],
      });
    }, 180);
  }, []);

  const claim = async (questId: string) => {
    setClaiming(questId);
    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      if (res.ok) {
        const awarded = await res.json();
        addCredits(awarded.credits || 0);
        refreshCredits();
        setJustClaimed(questId);
        fireConfetti();
        await fetchQuests();
        // Clear the "just claimed" highlight after a beat.
        setTimeout(() => setJustClaimed(null), 1800);
      }
    } catch {
      /* silent */
    } finally {
      setClaiming(null);
    }
  };

  if (!authed) return null;

  const claimable = quests?.filter((q) => q.canClaim) ?? [];
  const done = quests?.filter((q) => q.completed && !q.canClaim) ?? [];
  const locked = quests?.filter((q) => !q.canClaim && !q.completed) ?? [];
  const claimableCount = claimable.length;

  const referralLink =
    referralCode && typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralCode}`
      : null;

  const totalEarnable = claimable.reduce((sum, q) => sum + q.quest.credits, 0);

  return (
    <Drawer.Root
      direction="left"
      open={open}
      onOpenChange={setOpen}
    >
      {/* Floating trigger — bottom-left corner */}
      <Drawer.Trigger asChild>
        <button
          aria-label={t("questsOpenAria")}
          className="fixed bottom-6 left-6 z-40 group"
        >
          <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-(--ditto-primary) text-(--ditto-bg) shadow-lg shadow-(--ditto-primary)/30 hover:shadow-xl hover:shadow-(--ditto-primary)/40 hover:scale-105 transition-all duration-200">
            <Target className="w-6 h-6" strokeWidth={2} />
            {claimableCount > 0 && (
              <>
                {/* Pulse ring */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-(--ditto-accent) opacity-60 animate-ping"
                />
                {/* Count badge */}
                <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-(--ditto-accent) text-white text-[11px] font-bold flex items-center justify-center border-2 border-(--ditto-bg) z-10">
                  {claimableCount}
                </span>
              </>
            )}
          </span>
        </button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed top-0 left-0 bottom-0 z-[70] flex outline-none"
          style={{ width: "min(440px, 92vw)" }}
        >
          <div className="flex flex-col h-full w-full bg-(--ditto-surface) border-r border-(--ditto-border) shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-(--ditto-border)">
              <div className="min-w-0">
                <Drawer.Title className="flex items-center gap-2 text-lg font-bold text-(--ditto-text)">
                  <Target className="w-5 h-5 text-(--ditto-primary)" strokeWidth={2} />
                  {t("questsTitle")}
                </Drawer.Title>
                <Drawer.Description className="text-xs text-(--ditto-text-muted) mt-0.5">
                  {claimableCount > 0
                    ? `${claimableCount} ${t("questsDescToClaim")} · +${totalEarnable} ${t("questsDescCreditsAvailable")}`
                    : quests === null
                      ? t("questsLoading")
                      : t("questsEmpty")}
                </Drawer.Description>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("questsCloseAria")}
                className="shrink-0 w-8 h-8 rounded-lg border border-(--ditto-border) text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* Claimable */}
              {claimable.length > 0 && (
                <QuestSection
                  title={t("questsSectionClaimable")}
                  accent="primary"
                  countLabel={`${claimable.length}`}
                >
                  {claimable.map((q) => (
                    <QuestCard
                      key={q.quest.id}
                      quest={q}
                      state={justClaimed === q.quest.id ? "just-claimed" : "claimable"}
                      claiming={claiming === q.quest.id}
                      onClaim={() => claim(q.quest.id)}
                    />
                  ))}
                </QuestSection>
              )}

              {/* Locked / in-progress */}
              {locked.length > 0 && (
                <QuestSection title={t("questsSectionLocked")} accent="muted">
                  {locked.map((q) => (
                    <QuestCard key={q.quest.id} quest={q} state="locked" />
                  ))}
                </QuestSection>
              )}

              {/* Completed */}
              {done.length > 0 && (
                <QuestSection title={t("questsSectionDone")} accent="muted">
                  {done.map((q) => (
                    <QuestCard key={q.quest.id} quest={q} state="done" />
                  ))}
                </QuestSection>
              )}

              {/* Referral */}
              {referralLink && (
                <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-bg) p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-(--ditto-primary)" strokeWidth={2} />
                    <span className="text-sm font-semibold text-(--ditto-text)">
                      {t("questsInviteTitle")}
                    </span>
                  </div>
                  <p className="text-xs text-(--ditto-text-muted) mb-3 leading-relaxed">
                    {t("questsInvitePre")} <strong className="text-(--ditto-text)">{t("questsInviteCreditsBold")}</strong> {t("questsInviteMid")}
                  </p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={referralLink}
                      className="flex-1 min-w-0 text-xs px-3 py-2 rounded-lg bg-(--ditto-surface) text-(--ditto-text-muted) border border-(--ditto-border) outline-none truncate"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(referralLink);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="shrink-0 px-3 py-2 rounded-lg text-xs font-medium border border-(--ditto-border) text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" strokeWidth={2} /> {t("questsCopied")}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" strokeWidth={1.5} /> {t("questsCopy")}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// ─── Internal components ───────────────────────────────────────────────

function QuestSection({
  title,
  accent,
  countLabel,
  children,
}: {
  title: string;
  accent: "primary" | "muted";
  countLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3
          className={
            "text-[10px] font-bold uppercase tracking-wider " +
            (accent === "primary"
              ? "text-(--ditto-primary)"
              : "text-(--ditto-text-muted)")
          }
        >
          {title}
        </h3>
        {countLabel && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-(--ditto-primary)/15 text-(--ditto-primary)">
            {countLabel}
          </span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function QuestCard({
  quest: q,
  state,
  claiming,
  onClaim,
}: {
  quest: QuestStatus;
  state: "claimable" | "locked" | "done" | "just-claimed";
  claiming?: boolean;
  onClaim?: () => void;
}) {
  const t = useT();
  const isClaimable = state === "claimable" || state === "just-claimed";
  const isJustClaimed = state === "just-claimed";
  const isDone = state === "done";

  return (
    <div
      className={
        "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-300 " +
        (isJustClaimed
          ? "border-(--ditto-primary) bg-(--ditto-primary)/15 scale-[0.99]"
          : isClaimable
            ? "border-(--ditto-primary)/30 bg-(--ditto-primary)/5 hover:border-(--ditto-primary)/60"
            : "border-(--ditto-border) bg-(--ditto-bg) " +
              (isDone ? "opacity-60" : "opacity-70"))
      }
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className="text-2xl leading-none shrink-0 select-none" aria-hidden>
          {q.quest.icon}
        </span>
        <div className="min-w-0">
          <div
            className={
              "text-sm font-semibold text-(--ditto-text) " +
              (isDone ? "line-through" : "")
            }
          >
            {q.quest.title}
          </div>
          <div className="text-xs text-(--ditto-text-muted) mt-0.5 leading-snug">
            {isDone
              ? q.quest.repeatable === "daily"
                ? t("questsDoneToday")
                : t("questsCompleted")
              : q.quest.description}
            {isDone && q.totalCompletions > 1 && ` · ${q.totalCompletions}×`}
          </div>
        </div>
      </div>
      {isClaimable && onClaim && (
        <button
          onClick={onClaim}
          disabled={claiming || isJustClaimed}
          className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold bg-(--ditto-primary) text-(--ditto-bg) hover:bg-(--ditto-primary-hover) disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-1"
        >
          {isJustClaimed ? (
            <>
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              {t("questsClaimedBadge")}
            </>
          ) : claiming ? (
            <span className="w-3 h-3 border-2 border-(--ditto-bg) border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3 h-3" strokeWidth={2} />+{q.quest.credits}
              <Coins className="w-3 h-3" strokeWidth={2} />
            </>
          )}
        </button>
      )}
      {isDone && (
        <Check className="w-4 h-4 text-(--ditto-primary) shrink-0" strokeWidth={2} />
      )}
      {state === "locked" && (
        <span className="shrink-0 text-xs text-(--ditto-text-muted) flex items-center gap-1">
          +{q.quest.credits}
          <Coins className="w-3 h-3" strokeWidth={1.5} />
        </span>
      )}
    </div>
  );
}
