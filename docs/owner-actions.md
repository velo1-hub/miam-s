# ⚠️ Owner-only actions: master checklist

Everything that requires the owner personally (identity, money, signatures, account ownership). **Open every account in the business's name, with the owner as primary admin and 2FA on.** Never share passwords; add people as users or partners.

## Before anything else (week −10)
- [ ] Answer the Phase 0 questions Q1–Q8 ([00-discovery.md §2](00-discovery.md))
- [ ] Personalise the brand story (founder name, origin, family dish) ([01 §8](01-brand-strategy.md))
- [ ] Approve positioning, tagline and visual Direction A
- [ ] Register the domain(s) `miamsrestocafe.ca` (+ `.com`) in the owner's name
- [ ] Reserve `@miamsrestocafe` on Instagram, TikTok, Facebook, Pinterest, LinkedIn
- [ ] File the "Miam's" trademark with CIPO (or instruct a trademark agent)

## Legal, tax and permits
- [ ] NEQ registration and GST/QST numbers (with accountant)
- [ ] MAPAQ food establishment permit; food hygiene training certificates (manager and handlers)
- [ ] Confirm the Québec sales-recording (SRS / WEB-SRM) obligations and **choose a POS from Revenu Québec's certified list**
- [ ] Exterior sign wording checked against the French-language signage rules (OQLF/lawyer)
- [ ] Name the **privacy officer** (Law 25) and publish their title and contact on the website
- [ ] Halal supplier certificates on file
- [ ] RACJ: alcohol permit (when ready); check contest rules for the grand-opening giveaway
- [ ] Review tip-pool design against Québec labour standards (CNESST)

## Platforms and accounts
- [ ] **Google Business Profile**: create, verify (video, once the sign is up), add the manager as a user ([07 §1](07-local-seo.md))
- [ ] Apple Business Connect, Bing Places, Yelp, TripAdvisor claims (NAP exactly as in [07 §8](07-local-seo.md))
- [ ] **Meta**: Business portfolio, ad account (CAD, Eastern time), payment method, business and domain verification ([11 §1](11-meta-ads.md))
- [ ] **Uber Eats / DoorDash / SkipTheDishes**: identity verification, bank details, contract signature; read commission, price-parity and insert clauses ([08 §2](08-delivery.md))
- [ ] POS and payment processor: merchant application (KYC), bank account, hardware order
- [ ] Reservation provider (Libro or other), Klaviyo, Cloudflare (website), Supabase + Vercel (MIAM OS): all in the business's name
- [ ] Google Business Profile API access application and Meta app review (for MIAM OS command centre)
- [ ] Glovo: **not applicable in Montréal**; only if a location opens in a Glovo market (partner API approval, store IDs)

## Money and approvals
- [ ] Approve the launch budget tier ([13 §3](13-launch-roadmap.md))
- [ ] Approve menu prices after real recipe costing ([03](03-menu.md))
- [ ] Approve creator fees, event budget, delivery promo caps
- [ ] Approve negative-review replies (ongoing)

## Website go-live
- [ ] Fill in `site/src/config.mjs` (address, phone, email, geo, links) and the `[brackets]` in `site/src/content.mjs`
- [ ] Provide real photos; sign model releases for staff and guests who appear
