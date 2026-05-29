# Priority 3: Monetization & Differentiation — Build Plan

## Current state (already shipped)
- `/upgrade` page with pricing cards, monthly/yearly toggle, mock 7-day trial
- `/upgrade/success` page (UpgradeSuccess.tsx) with unlocked-features list
- `usePremium`-equivalent via `useApp().isPremium` and `<PremiumGate>` component
- Dashboard PDF export (jsPDF + html2canvas), Premium-gated
- `/settings/notifications` page wired to `user_notifications` table
- `/settings/mpesa` page with phone input + "Coming Soon" placeholder
- Tables: `profiles`, `user_allocations`, `user_goals`, `user_debts`, `user_notifications`, `user_protection_gaps`, `user_risk_profiles`

So Features 2, 3 (UI), and 4 (UI) are partially in place. The real gaps are real payments, real email/SMS sending, real M-Pesa, and a polished upgrade flow.

---

## Recommended scope (4 focused changes)

### 1. Real payments via Lovable's built-in Stripe (replaces mock trial)
- Run `recommend_payment_provider` → `enable_stripe_payments` (no API keys, no Stripe account setup needed)
- Create two products: Premium Monthly (KES 499/mo ≈ $8) and Premium Yearly (KES 4,990/yr ≈ $80, "save 2 months")
- Wire `/upgrade` "Start trial" buttons to create a real Stripe checkout session (edge function)
- On webhook `checkout.session.completed` → set `profiles.subscription_status = 'active'` + `subscription_tier`, `current_period_end`
- `useApp().isPremium` reads from `profiles` instead of localStorage
- Keep `/upgrade/success` with confetti (add `canvas-confetti`) + 5s auto-redirect

> Note: I will use **Lovable's seamless Stripe** (no key needed), not the BYOK Stripe with custom `price_monthly_8usd` IDs you mentioned. Prices/products are created via Lovable's product tool after enabling.

### 2. PDF export — extend to Income Allocator + polish header
- Add the same Premium-gated export button to `/allocator`
- Extract `utils/pdfGenerator.ts` so Dashboard + Allocator share branded header/footer (Kifedha logo, user name, date, page numbers)
- Include allocation breakdown, debts, protection gap, goals — pulled from Supabase, not just a DOM snapshot

### 3. Email reminders via Lovable Emails (skip SMS for now)
- Set up Lovable email domain (prompts user)
- Edge functions:
  - `send-weekly-digest` — net worth delta, savings rate, top category
  - `send-monthly-review` — budget vs actual, goal progress
  - `send-payment-reminder` — 3 days before each `user_debts.due_date`
- pg_cron schedules: Mondays 08:00 EAT, 1st of month 08:00 EAT, daily 07:00 EAT
- Templates branded with Kifedha colors + CTA back to app
- SMS via Africa's Talking deferred — needs paid AT account + sender ID approval; will add as Phase 2 stub

### 4. M-Pesa import — keep as "Coming Soon" stub (no Daraja yet)
- Daraja production access requires: registered Safaricom paybill/till, signed Safaricom contract, callback URL on a verified domain, and KYB review (2–4 weeks). Not viable for MVP.
- Sandbox STK push works but cannot read a user's real transactions — Safaricom does not expose a "list my M-Pesa SMS" API. Transaction import requires either (a) SMS forwarder app on the phone, or (b) M-Pesa Statement PDF upload + parsing.
- **Recommendation**: ship **M-Pesa Statement PDF upload** as the MVP import path — user requests statement from `*334#`, uploads PDF, we parse with `pdfjs-dist`, categorize, and insert into a `transactions` table. Real and usable today.

---

## Technical details

**New tables**
- `transactions` (id, user_id, date, amount, type income/expense, category, description, source manual/mpesa_pdf, created_at) with RLS + GRANTs
- Add to `profiles`: `subscription_status text`, `subscription_tier text`, `stripe_customer_id text`, `current_period_end timestamptz`

**New/changed files**
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts` (verify_jwt=false)
- `supabase/functions/send-weekly-digest/index.ts`
- `supabase/functions/send-monthly-review/index.ts`
- `supabase/functions/send-payment-reminder/index.ts`
- `supabase/functions/parse-mpesa-statement/index.ts`
- `src/hooks/usePremium.ts` (reads `profiles.subscription_status`)
- `src/utils/pdfGenerator.ts`
- `src/components/ExportPDF.tsx` (Premium-gated)
- `src/pages/MpesaImport.tsx` (PDF upload UI)
- Update `src/pages/Upgrade.tsx`, `src/pages/UpgradeSuccess.tsx`, `src/context/AppContext.tsx`, `src/pages/MpesaSetup.tsx`

**Dependencies**: `canvas-confetti`, `pdfjs-dist` (jspdf + html2canvas already present)

---

## Decisions I need from you

1. **Payments**: OK to use **Lovable's built-in Stripe** (no Stripe account / API keys needed, recommended)? Or do you insist on BYOK Stripe with your own `price_*` IDs?
2. **SMS via Africa's Talking**: skip for now (recommended) or set up the integration even though it requires a paid AT account + sender ID approval?
3. **M-Pesa**: ship **PDF statement upload + parser** (works today) instead of Daraja "auto-sync" (not feasible for individual transactions)?
4. **Pricing currency**: KES 499/mo + KES 4,990/yr (Kenyan market) or USD $8/$80 as in your spec?

Once you confirm, I'll execute the scope above end-to-end.
