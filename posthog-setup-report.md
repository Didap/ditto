<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of your project. PostHog was already partially integrated with a well-structured client/server analytics layer (`src/lib/analytics/`), a consent-gated `PostHogProvider`, and events for the core extraction and monetisation flows. This run extended that foundation with 7 additional typed events covering the full user lifecycle — from signup through payment to churn — and set `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` in `.env.local`.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User successfully creates an account | `src/app/api/auth/register/route.ts` |
| `payment_completed` | Stripe one-time pack purchase confirmed | `src/app/api/stripe/webhook/route.ts` |
| `subscription_activated` | Stripe subscription first invoice paid | `src/app/api/stripe/webhook/route.ts` |
| `subscription_cancelled` | Stripe subscription deleted/expired | `src/app/api/stripe/webhook/route.ts` |
| `hybrid_generated` | User generates a hybrid design from inspirations | `src/app/api/inspire/route.ts` |
| `extract_started` (inspire) | Extraction started from the inspire flow | `src/app/api/inspire/route.ts` |
| `design_saved` | User explicitly saves a generated hybrid design | `src/app/api/designs/save/route.ts` |
| `boost_applied` | User applies a quality boost to a design | `src/app/api/designs/[slug]/boost/route.ts` |

All new events are declared in the central typed registry (`src/lib/analytics/events.ts`) and emitted via the existing `trackServer()` wrapper. Server-side `identifyServer()` is now called on signup to correlate user traits from the moment of registration.

## Next steps

We've built a dashboard and five insights to keep an eye on user behaviour:

- **Dashboard** — Analytics basics: https://eu.posthog.com/project/164271/dashboard/636940
- **Signup → Extract → Save conversion funnel**: https://eu.posthog.com/project/164271/insights/FxCnAxvo
- **Revenue events over time**: https://eu.posthog.com/project/164271/insights/iYmpWxNI
- **Subscription churn**: https://eu.posthog.com/project/164271/insights/H0tWqixs
- **Feature adoption (extractions, hybrids, boosts, unlocks)**: https://eu.posthog.com/project/164271/insights/VfG9lPjD
- **Upgrade pressure — credits depleted**: https://eu.posthog.com/project/164271/insights/VkCImbWY

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
