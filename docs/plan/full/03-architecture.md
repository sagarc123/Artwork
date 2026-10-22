# Art Website: Technical Architecture (v1, full custom build)

> Where this file conflicts with `00-decisions.md`, `00-decisions.md` wins.

Source: `docs/plan/art-website.md` (brief), plus `docs/plan/brainstorm.md` §6 (SEO) and §8 (security). Cost and scope cuts from the brainstorm do not apply here; every feature in the brief is in scope.
Fixed: Next.js App Router + TypeScript + Tailwind, PostgreSQL, Razorpay plus COD, Bunny Stream, Shiprocket, EN/मराठी/हिंदी.

---

## 1. Final stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js, using the latest major that Payload officially supports, with Cache Components (`'use cache'`, `cacheTag`) | Server components by default and tag-based revalidation from CMS hooks. |
| Hosting | Vercel Pro, functions pinned to `bom1` (Mumbai) | Native Next.js support, preview deploy per PR, firewall/WAF, and same-region latency to the DB. |
| DB provider | Supabase Postgres, Pro, `ap-south-1` Mumbai, PITR add-on | Managed Postgres in India with point-in-time recovery. We use **only Postgres and Storage**. The Data API/PostgREST is **disabled**. |
| ORM | Drizzle (Payload's Postgres adapter is Drizzle, so it is one ORM) | Typed SQL, real transactions, and `UPDATE … RETURNING` for sequences and state machines. |
| Schema ownership | Three Postgres schemas: `payload` (CMS, Payload migrations), `identity` (Better Auth), `app` (commerce/learning hot tables, Drizzle Kit migrations) | Each migration system owns its own schema, so they never collide. |
| Admin/CMS | **Payload CMS 3, in the same Next app** at `/admin`, plus custom admin views | Free, artist-usable admin with drafts, versions, live preview, per-field localisation, uploads and role-based access. A custom admin would be months of work and still worse. |
| Auth | **Better Auth**: `phoneNumber` (SMS/WhatsApp OTP), Google, `emailOTP` fallback, `twoFactor` (TOTP) | It supports all three methods plus 2FA on our own Postgres. Payload uses it through a **custom auth strategy** (`disableLocalStrategy`), so there is one identity system for shoppers, students and staff. |
| OTP/SMS + WhatsApp | MSG91 (DLT-registered SMS templates plus WhatsApp Business API templates) | One Indian vendor for both channels. DLT registration is required for Indian SMS. The WhatsApp authentication template doubles as the OTP fallback. |
| i18n | `next-intl`, `localePrefix: 'as-needed'`: `/…` (en), `/mr/…`, `/hi/…`. Same English slugs in every locale | Clean hreflang mapping and shareable ASCII URLs. Translated titles carry the keywords. |
| Images | Payload upload → `sharp` makes a **watermarked display master** (max 2400px) in a public bucket. The untouched original goes to a private bucket. `next/image` serves AVIF/WebP at responsive sizes | Watermarked derivatives (§8 of the brainstorm), no full-res leak, and automatic formats. |
| Storage | Supabase Storage (S3 API via `@payloadcms/storage-s3`). Buckets: `media-public`, `media-originals` (private), `private-docs` (invoices, certificates, practice sheets, exports) | One vendor. Private files are only reachable through short-lived signed URLs. |
| Search | Postgres FTS (`simple` config, which works for Devanagari) + `pg_trgm` on an `app.search_documents` table maintained by Payload hooks | Catalogue is in the hundreds of items. A search service would be another processor for no gain. |
| Email | Resend + React Email; Zoho/Workspace mailbox for humans. SPF/DKIM/DMARC `p=quarantine` | Good DX and deliverability. Broadcasts plus one-click unsubscribe headers. |
| Analytics | GA4 + Meta Pixel **only after consent** (Consent Mode v2, default denied); Vercel Speed Insights (cookieless) for Core Web Vitals | DPDP-aligned. Kids course pages never load trackers. |
| Errors | Sentry (Next SDK, `beforeSend` PII scrub, replay off) | Server and client errors, release tracking, alerts. |
| Background jobs | **Inngest** (event-driven, durable steps, retries, crons, dedupe by event id) | Webhook fan-out, PDFs, Shiprocket, emails, reconciliation, with no worker server. |
| Rate limiting/cache | Upstash Redis (`@upstash/ratelimit`) + Cloudflare Turnstile on public forms | Serverless-safe counters. Turnstile is privacy-friendlier than reCAPTCHA. |
| PDFs | `@react-pdf/renderer` (+ `qrcode`), run inside Inngest steps | No headless Chromium. Deterministic layout for invoices and certificates. |
| Validation | Zod at every boundary (server actions, route handlers, env) | One schema serves both types and runtime checks. |
| Video player | Vidstack on Bunny Stream HLS with CDN token auth | We control the fullscreen container, so the per-student watermark survives fullscreen. |

---

## 2. Repository structure

```
/
├─ src/
│  ├─ app/
│  │  ├─ [locale]/
│  │  │  ├─ (site)/              # public pages (see route map)
│  │  │  │  ├─ @modal/(.)artwork/[slug]/page.tsx   # intercepted lightbox
│  │  │  │  └─ …
│  │  │  ├─ (account)/account/…
│  │  │  ├─ (learn)/learn/…
│  │  │  └─ layout.tsx           # header, footer, consent, WhatsApp FAB
│  │  ├─ (payload)/admin/[[...segments]]/page.tsx
│  │  ├─ (payload)/cms-api/[...slug]/route.ts      # Payload REST moved off /api
│  │  ├─ api/                    # our route handlers only (webhooks, beacons, files)
│  │  ├─ sitemap.ts  robots.ts  manifest.ts
│  ├─ payload/
│  │  ├─ collections/            # Products, Artworks, Courses, Lessons, Media, Pages,
│  │  │                          # Festivals, Testimonials, Reviews, Enquiries, Orders,
│  │  │                          # Invoices, Shipments, Refunds, Coupons, Staff, Redirects, DataRequests
│  │  ├─ globals/                # SiteSettings, CommerceSettings (COD/GST/shipping), Home, Legal
│  │  ├─ access/                 # isOwner, isStaff, isEditor, …
│  │  ├─ hooks/                  # revalidate tags, search index, audit log
│  │  ├─ views/                  # custom admin: Dashboard, Fulfilment, Enquiry board, Data requests
│  │  └─ payload.config.ts
│  ├─ server/                    # domain services, server-only
│  │  ├─ db/ (drizzle schema for `app` + `identity`, client)
│  │  ├─ auth/ (better-auth config, session helpers, payload strategy)
│  │  ├─ commerce/ (cart, pricing, gst, cod, orders state machine, coupons)
│  │  ├─ payments/razorpay.ts
│  │  ├─ shipping/shiprocket.ts
│  │  ├─ learning/ (bunny, progress, certificates)
│  │  ├─ documents/ (invoice.tsx, credit-note.tsx, certificate.tsx)
│  │  ├─ notify/ (email templates, whatsapp)
│  │  ├─ privacy/ (consent ledger, export, erase)
│  │  ├─ authz.ts                # the single authorisation layer
│  │  └─ ratelimit.ts
│  ├─ jobs/                      # inngest client + functions
│  ├─ components/ (ui/, site/, shop/, learn/, rangoli/)
│  ├─ i18n/ (routing.ts, request.ts) + messages/{en,mr,hi}.json
│  ├─ lib/ (env.ts (zod), money.ts (paise), seo.ts, jsonld.ts)
│  └─ middleware.ts              # i18n, CSP nonce, security headers
├─ drizzle/  (migrations for app + identity)
├─ src/migrations/ (payload)
├─ tests/ (unit/, integration/, e2e/, fixtures/)
├─ .github/workflows/
└─ docker-compose.yml            # local postgres, mailpit, inngest dev
```

Rule: anything touching money, entitlements or PII lives in `src/server/**` with `import 'server-only'`. Components never query the DB directly; they call services.

---

## 3. Route map

Legend: **S** = server component, **C** = client island inside it. Caching uses `'use cache'` + `cacheTag`, and Payload `afterChange` hooks call `revalidateTag`. **Dyn** = per-request, never cached.

### Public (localised, indexable)

| Route | Render | Cache / revalidation |
|---|---|---|
| `/` Home | S; C: hero slider, rangoli draw, carousels, newsletter form | tags `home`, `products:featured`, `courses:featured`, `testimonials`, `instagram` |
| `/shop`, `/shop/[category]` | S; C: filter bottom-sheet, sort, load more | Query function cached per normalised filter key (`cacheLife('minutes')`), tag `products` |
| `/shop/p/[slug]` PDP | S; C: zoom gallery, framing/qty, add to cart, sticky bar, pincode check | Content tag `product:{id}`. **Stock/price block is a Dyn Suspense hole**, so "Sold" is always live |
| `/artwork`, `/artwork/[slug]` | S masonry; C lightbox via intercepting `@modal` route (real URL per artwork) | tag `artworks`, `artwork:{id}` |
| `/festivals`, `/festivals/[slug]` | S | tag `festival:{id}` |
| `/process` | S; C video/step viewer | tag `pages` |
| `/events`, `/events/[city]` | S; C enquiry form | tag `pages`, `cities` |
| `/custom-portraits` | S; C enquiry form | tag `pages` |
| `/courses`, `/courses/category/[cat]`, `/courses/[slug]` | S; C preview player, curriculum accordion, enrol button | tag `courses`, `course:{id}`. Enrolment state is a Dyn hole |
| `/courses/[slug]/sample/[lesson]` | S; C player | Dyn (signed token), indexable page shell |
| `/about`, `/contact` | S; C contact form, map (click-to-load) | tag `pages` |
| `/policies/[slug]` | S | tag `legal` |
| `/search` | S | Dyn, `noindex` |
| `/cart`, `/checkout`, `/order/[publicId]` | C-heavy | Dyn, `noindex` |
| `/verify/[certId]` | S | `cacheLife('days')`, `noindex` |
| `/newsletter/confirm`, `/newsletter/unsubscribe` | S | Dyn, `noindex` |
| `/login` | C | Dyn, `noindex` |

### Account and Learn (localised, `noindex`, auth-guarded in layout + service)

`/account` overview · `/account/orders` · `/account/orders/[id]` (invoice download, tracking) · `/account/addresses` · `/account/wishlist` · `/account/profile` · `/account/security` (sessions, linked logins) · `/account/privacy` (consents, export, delete).
`/learn` (My Courses, progress, continue watching) · `/learn/[course]` · `/learn/[course]/[lesson]` (player, lesson sidebar, notes/resources tabs) · `/learn/certificates`.
All of these are Dyn S pages with C player/forms. Nothing user-specific is ever cached.

### Admin

`/admin/**` (Payload, English UI, content edited per locale). Custom views:
- **Dashboard**: today's orders, enquiries, low stock, failed jobs.
- **Fulfilment**: pack, ship, print label.
- **Enquiry board**: kanban new → quoted → advance paid → done.
- **Refunds**.
- **Data requests**.
- **Audit log**.

### API / webhooks (Node runtime, `bom1`)

| Route | Purpose |
|---|---|
| `/api/auth/[...all]` | Better Auth |
| `/api/webhooks/razorpay` | payments, refunds, payment links, disputes |
| `/api/webhooks/courier` | Shiprocket tracking (see the URL-naming gotcha in §4.5) |
| `/api/webhooks/bunny` | video encoding status |
| `/api/inngest` | job runner |
| `/api/learn/progress` | `sendBeacon`-friendly progress writes |
| `/api/learn/token/[lessonId]` | signed HLS URL |
| `/api/files/[id]` | authorise, then 302 to a 60s signed URL |
| `/api/pincode/[pin]` | serviceability (Redis cached) |
| `/api/og/[type]/[id]` | OG images |
| `/cms-api/**` | Payload REST (admin only) |

Mutations from our own UI (cart, wishlist, checkout, forms, reviews) are **Server Actions**, each Zod-validated, auth-checked and rate-limited.

---

## 4. Integrations

### 4.1 Data rules common to commerce

- All money is integer paise. Product types: `original` (stock 1), `print` (stock n), `digital`, `course`, plus `framing` add-on.
- Price, tax and shipping are **always recomputed server-side**. Client values are ignored.
- Cart is DB-backed and keyed by an httpOnly `cart_id` cookie. It merges into the user cart on login.
- Checkout uses "guest-feel" auth: a phone OTP at the address step silently creates or logs in the account. There is no password and no signup form. This gives one account for shop and courses and verifies phones for COD.

### 4.2 Razorpay (prepaid)

1. **Create order (Server Action `startCheckout`)**: in one DB transaction:
   - Validate cart, address and pincode serviceability.
   - Compute lines, GST and shipping.
   - **Reserve stock** with `UPDATE products SET reserved = reserved + 1 WHERE id=$1 AND stock - reserved >= 1` and a reservation row expiring in 15 min.
   - Insert `orders` with status `pending_payment`.
   - Then call Razorpay `orders.create({ amount, currency:'INR', receipt: order.id, notes:{orderId} })` and store `rzp_order_id`.
2. **Checkout**: client loads `checkout.razorpay.com/v1/checkout.js` with `order_id`, prefill, `timeout: 900`, and method config ordering **UPI first**, then cards, net banking and wallets.
3. **Client verify (Server Action `confirmPayment`)**:
   - Compute `HMAC_SHA256(order_id + "|" + payment_id, key_secret)` and compare with `crypto.timingSafeEqual`.
   - On success set `payment_verified` and show the success page. **This is not the source of truth for fulfilment.**
4. **Webhook `/api/webhooks/razorpay`**:
   - Read the raw body (`await req.text()`) and verify `X-Razorpay-Signature` with the webhook secret.
   - `INSERT INTO app.webhook_events (provider, event_id, payload) ON CONFLICT DO NOTHING`. If the row already exists, return 200 and stop (idempotent).
   - `inngest.send({ id: 'rzp:'+eventId, name: 'razorpay/event', data })` (Inngest also dedupes on id), then return 200 within ms.
   - Subscribed events: `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`, `refund.failed`, `payment_link.paid`, `payment.dispute.created`.
5. **Mark paid (Inngest)**:
   - Assert `amount == order.total_paise` and `currency == INR`.
   - Run the guarded transition `UPDATE orders SET status='paid', paid_at=now() WHERE id=$1 AND status IN ('pending_payment','payment_verified') RETURNING id`. Zero rows means already done, so no-op.
   - Same transaction: convert reservations into stock decrements, and set `originals` to `sold`.
   - **Late payment edge case**: if the reservation expired and the original was sold to someone else, auto-refund in full, mark `cancelled_oversold`, and apologise by email/WhatsApp.
6. **Fulfil (`order/paid` fan-out, each its own retried step)**:
   - Issue the GST invoice (4.6).
   - Create course **enrolments** and digital-download entitlements.
   - Push physical lines to Shiprocket as "ready to pack".
   - Send the email + WhatsApp confirmation.
   - Revalidate `product:{id}` tags.
7. **Reconciliation cron (every 10 min)**:
   - Fetch Razorpay payments for orders `pending_payment` older than 20 min. This covers missed webhooks.
   - Release expired reservations.
   - Expire orders older than 24h.

Auto-capture is ON in the Razorpay dashboard.

### 4.3 COD rules (`CommerceSettings` global, editable by the owner)

- Eligible only if **every** line is `print` or `original` with price ≤ the COD cap. Never for `course`, `digital`, custom portraits, framing over the cap, or Kids Art.
- Order total ≤ **₹5,000** by default. Defaults are editable.
- Shiprocket serviceability must return `cod: 1` for the pincode.
- Phone is OTP-verified. At most **1 open COD order per account**. Block the account after 2 RTOs (return to origin).
- Optional COD fee line (taxable).
- Flow: create order with status `cod_pending_confirmation` → WhatsApp "Reply YES to confirm" template, or confirm via a link → `cod_confirmed`. Run the same fulfil fan-out **except the invoice, which is issued at dispatch** (time of supply). Stock is decremented at confirmation.

### 4.4 Refunds

- Admin "Refund" requires a fresh 2FA step-up (re-auth within 5 min).
- Full or partial per line, with a reason. Call `payments.refund(paymentId, { amount, receipt: refund.id, notes })` and record `refund_pending`.
- On the `refund.processed` webhook, in idempotent processing:
  - Set `refunded` / `partially_refunded`.
  - Issue a **credit note** (separate series).
  - Restock prints and un-sell originals (owner choice).
  - **Revoke course enrolments** and digital entitlements for refunded lines.
- Digital and courses follow the "no refund once accessed" policy (the first lesson play or download is logged), shown before payment, and an admin override exists.
- COD refunds: admin records a bank transfer with UTR. A credit note is still generated.

### 4.5 Shiprocket

- **Auth**: a dedicated API user. Cache the token in Redis for 9 days (it is valid for 10) and refresh on 401.
- **Pincode check**: `GET /courier/serviceability?pickup_postcode&delivery_postcode&weight&cod` → returns ETA, COD flag and cheapest courier. Cached in Redis per `(pin, weightBand)` for 24h. Rate-limited per IP.
- **Order push**: on `order/paid` or `cod_confirmed`, `POST /orders/create/adhoc` using per-product packed weight and dimensions (with presets such as "A3 tube" or "framed 18×24 box"). Store `shiprocket_order_id`.
- **AWB and label**: when the artist clicks "Packed – Ship" in the Fulfilment view, call `assign/awb` → `generate/pickup` → `generate/label`. The label PDF goes to the private bucket and the AWB is saved. The shipped notification goes out with the tracking link.
- **Tracking**: the Shiprocket webhook posts to `/api/webhooks/courier`.
  - It is verified by a shared token in the `x-api-key` header.
  - **Gotcha**: Shiprocket rejects URLs containing "shiprocket"/"sr"/"kr". Verify this when registering.
  - Store the events idempotently on `(awb, status, timestamp)` and update shipment status.
  - `/account/orders/[id]` renders the timeline. RTO triggers a stock return and an admin alert.
- **Insurance**: originals above a threshold ship with the insured option.
- **Staging**: Shiprocket has no sandbox. `SHIPROCKET_MODE=readonly` allows serviceability calls but stubs order and AWB calls.

### 4.6 GST invoices with sequential numbering

- **Series**: `app.document_sequences(series text, fy text, next int, PRIMARY KEY(series,fy))`.
- **Number issue** happens inside the same transaction that inserts the invoice:
  `UPDATE document_sequences SET next = next + 1 WHERE series='INV' AND fy='26-27' RETURNING next - 1`.
  The row lock serialises concurrent issuers and a rollback leaves no gaps.
- **Format**: `INV/26-27/000123` (16 chars, the GST limit). Credit notes are `CN/26-27/…`. Advances on enquiries get receipt vouchers `RV/26-27/…`.
- **Tax**:
  - Place of supply = shipping state (goods) or billing state (courses/digital).
  - Maharashtra → CGST + SGST; else IGST.
  - HSN/SAC and rates live on **tax classes** that the CA sets in admin: 9701 for works of art, 4911 for prints, SAC 9992 for courses, and so on. Rates are never hardcoded, because GST 2.0 changed several of them.
  - Prices are entered as tax-inclusive and the tax is split back out.
- **B2B**: optional GSTIN at checkout or on the enquiry (format + checksum validated). The invoice then shows buyer GSTIN and legal name.
- **Document**: a React-PDF template with seller legal name, address, GSTIN, HSN-wise summary, amount in words and signature image. The PDF is immutable once issued and stored in `private-docs`. Invoice rows are never edited; corrections go through a credit note.
- **Retention**: at least 8 years, excluded from erasure.

### 4.7 Bunny Stream: protected video

- **Library**: one private library per environment. Enable "Block direct URL file access", allowed referrers = our domains, CDN **token authentication**, and MediaCage Basic DRM if verified compatible with hls.js in staging.
- **Upload**: the Lessons admin field uploads straight from the browser via **TUS**, with a server-issued signature `sha256(libraryId + apiKey + expires + videoId)`. Large files never pass through Vercel.
- **Bunny webhook**: on `status=3/4` (encoded) store duration, thumbnail and `ready`. Captions (VTT) are uploaded per lesson and locale.
- **Playback**: `/api/learn/token/[lessonId]` checks
  - `authz.canWatch(user, lesson)`: enrolled, or lesson `isPreview`, or the course is free and the user is enrolled
  - and that the user is not refunded or revoked.
  It returns a playlist URL signed with a directory token over `/{videoId}/` that **expires in 4h**. The client re-requests the URL on expiry.
- **Watermark**: a Vidstack player inside our own fullscreen container shows an absolutely positioned overlay with the student name + masked email + short user id. The overlay is low opacity, `pointer-events:none`, and moves position every 30–60s. Native fullscreen is disabled; container fullscreen keeps the overlay visible. Per the brainstorm, the phone number is never shown.
- **Honest limit**: screen recording cannot be prevented. The watermark exists for deterrence and tracing.
- **Progress tracking**:
  - Every 15s, and on pause/`visibilitychange` via `sendBeacon`, POST `{lessonId, position, watchedDelta}`.
  - The server clamps `watchedDelta ≤ 1.5 × wall-clock since last beat`, upserts `app.lesson_progress(user, lesson, position, watched_seconds, completed_at)`, and marks a lesson complete at **≥ 90% watched**.
  - "Continue watching" = latest `updated_at`.
- **Course completion**: all required lessons complete → Inngest `course/completed`.

### 4.8 Certificates

- On `course/completed`, create `app.certificates(id = 10-char random Crockford base32, user, course, name_on_cert, issued_at)`.
  - Students confirm the name once.
  - For Kids Art the parent can set the child's first name only.
- React-PDF certificate (artist signature, rangoli border, QR code). Stored privately and downloaded via `/api/files`.
- `/verify/[certId]` shows name, course and date, or "not found". It is rate-limited and `noindex`. Revoked certificates (refund) show "revoked".

### 4.9 Instagram feed

- Use the **Instagram API with Instagram Login**, which needs a professional account. Basic Display is dead.
- The long-lived token is stored encrypted and refreshed by an Inngest cron every 30 days, with an alert if refresh fails.
- A 6-hourly cron fetches the latest media and **copies 6 images into our storage**, because Meta CDN URLs expire. It upserts `instagram_posts`, then `revalidateTag('instagram')`.
- The admin can pin or hide posts. If the API fails, the last good set stays.

### 4.10 Newsletter (double opt-in)

1. Form (Turnstile, honeypot, rate-limited) with a separate **unticked** consent checkbox. Insert `subscribers(status='pending', token_hash, notice_version, ip, ua)`.
2. Send the confirm email; the link expires in 48h. The confirm page sets `confirmed`, writes a consent-ledger row and syncs to the Resend Audience.
3. Campaigns are Resend Broadcasts, sent with `List-Unsubscribe` + `List-Unsubscribe-Post` (one-click). The unsubscribe page writes a withdrawal to the ledger.
4. WhatsApp marketing has its **own separate opt-in**. Transactional WhatsApp messages only use utility templates.

### 4.11 Enquiries (events, portraits, workshops) and advances

- Typed form → `Enquiries` collection, shown on the admin kanban, with an email + WhatsApp alert to the artist and an auto-reply with the reply-time promise.
- Quote screen → "Send payment link" creates a **Razorpay Payment Link** (`reference_id = enquiry.id`, expiry).
- `payment_link.paid` webhook → record the advance and issue a receipt voucher. The final invoice comes on completion.
- Portrait reference photos stay on WhatsApp, per the brainstorm security decision, so there is no public upload store.

---

## 5. Security controls

**Baseline (every request)**
- Middleware sets a nonce CSP. `script-src` allows self, Razorpay, Turnstile, and GA/Meta only after consent; `frame-src` allows Razorpay, Turnstile and Maps.
- HSTS preload, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'` (except `/admin` live preview: self).
- Vercel Firewall rules: block admin/API abuse patterns, attack challenge mode in reserve.

**Authorisation layer (instead of RLS)**
- The browser never talks to Postgres. The Supabase Data API is disabled, and every table also has RLS enabled with no policies as a backstop.
- The app connects as a least-privilege role (no superuser; `payload`/`app`/`identity` DML only). Migrations run with a separate role in CI.
- All checks go through `src/server/authz.ts`: `requireUser`, `requireStaff(role)`, `canViewOrder`, `canWatch`, `canDownload`.
- Payload collections use `access` functions per role:
  - **owner**: all, including refunds and staff.
  - **staff**: orders, shipments and enquiries; no refunds, no customer export.
  - **editor**: content only.
- IDOR guard: every `[id]` read filters by `user_id`. Order pages for guests use `publicId` + signed token.

**Secrets**
- Vercel env vars per environment, marked Sensitive. They are validated by `lib/env.ts` (Zod) at boot and the app fails closed.
- Only the Razorpay `key_id` and the Turnstile site key are `NEXT_PUBLIC_`.
- Test keys exist only in dev and staging. Rotation runbook every 12 months or on staff change.
- The Instagram token and Shiprocket password are encrypted at rest with AES-GCM (`APP_ENCRYPTION_KEY`).
- gitleaks in CI.

**Admin**
- **Mandatory TOTP 2FA for any staff role**, enforced in the Payload auth strategy, with backup codes.
- Staff sessions last 12h. Step-up re-auth is required for refunds, data exports, role changes and COD rules.
- Login alert email for new devices.
- `app.audit_log` (who, what, before/after diff) written by Payload hooks and services, read-only in admin.

| Feature | Controls |
|---|---|
| OTP login | Rate limits: 3 sends / 10 min / phone, 10 / hour / IP, 5 verify attempts then lockout. OTP 6 digits, 5 min TTL, hashed. Turnstile before the first send. DLT templates only. |
| Google/email | Auto-link only to a **verified** email. Otherwise link manually from `/account/security`. |
| Sessions | httpOnly, Secure, SameSite=Lax cookies. Rotate on privilege change. Revoke all on password/2FA change. |
| Checkout/payments | Server pricing. HMAC + `timingSafeEqual`. Raw-body webhook verification. Idempotent events and guarded state transitions. Amount/currency assertion. Reconciliation cron. No card data touches us, which keeps PCI scope at SAQ-A. |
| COD | OTP phone, caps, one open order, RTO blocklist, confirmation step. |
| Contact/enquiry/newsletter | Turnstile + honeypot + Upstash limit (5/hour/IP). Zod length limits. Output escaped. Admin notification emails are plain text. |
| Reviews | Only verified buyers or enrolled students, one per item, moderation queue, text only. Images are added by admin from testimonials with written permission. |
| Media | Watermarked public derivatives. Originals are private. EXIF is stripped by sharp. Upload MIME/size allow-list. |
| Files (invoices, sheets, certificates) | Authorise, then a 60s signed URL. Digital downloads have a max of 5 downloads per entitlement. |
| Video | Signed, expiring HLS. Referrer lock. Watermark. Entitlement re-checked on every token. |
| Webhooks | Signature/token verification, replay table, 2xx fast, work in Inngest. |
| Rate limiting | Upstash sliding window on auth, forms, pincode, progress (1 per 5s per lesson) and verify. |
| DPDP consent | `app.consents(user/subscriber, purpose[newsletter, whatsapp_marketing, analytics, marketing_cookies], notice_version, granted_at, withdrawn_at, source)`. Cookie banner with equal-weight Accept/Reject and a re-open link in the footer. Notice is in all 3 languages. |
| DPDP data requests | `/account/privacy` offers: <br>• **Export**: an Inngest job builds a JSON + PDF bundle and emails a 24h link. <br>• **Correct**: edit in profile. <br>• **Erase**: 7-day cooling-off, then anonymise name/phone/email/addresses and delete wishlist, progress and consents. **Invoices and order financials are kept** under the GST/tax retention exemption, pseudonymised. <br>Requests are also tracked in admin `DataRequests` with an SLA clock (30 days stated). The grievance officer's name and contact appear on `/policies/grievance`. |
| Kids Art | The account holder must declare age 18+ at signup. Kids courses are bought only by the parent's account, with a mandatory unticked **guardian consent** checkbox recorded in the ledger. No child data beyond an optional first name for the certificate. **No analytics or ad pixels on Kids course and lesson pages** (DPDP s.9: no tracking or targeted ads at children). The lawyer confirms the wording before launch. |
| E-Commerce Rules 2020 | The footer and `/policies/seller` show legal name, address, GSTIN, contact and grievance officer. Policies are linked at checkout above the Pay button. |
| Processors | Privacy policy lists Vercel, Supabase, Razorpay, Shiprocket, Bunny, Resend, MSG91, Inngest, Upstash, Sentry, Google and Meta. Sentry PII scrubbing is on. |

---

## 6. SEO implementation

**Metadata**
- `generateMetadata` on every route reads the CMS `seo` group (title ≤ 60, description ≤ 155, OG image).
- Fallback templates:
  - Product: `{title} – {medium} {type} | {Brand}`
  - Course: `{title} – Online {level} course in {language} | {Brand}`
- OG images are generated by `next/og` for products, courses and festivals.
- `noindex,follow` on cart, checkout, order, search, account, learn, login, verify, newsletter and draft previews.
- `robots.ts` disallows `/admin`, `/api`, `/cms-api`, `/account`, `/learn`.

**JSON-LD** (`lib/jsonld.ts`, one typed builder per type)

| Page | Types |
|---|---|
| Home | `Organization` (+ sameAs Instagram/YouTube/Facebook), `WebSite` with `SearchAction` |
| About, Contact, Events | `LocalBusiness` (NAP identical to the Google Business Profile), `Person` (artist) on About |
| `/events/[city]`, `/custom-portraits` | `Service` with `areaServed`, `offers.priceSpecification` ("starting from") |
| PDP | `Product` + `Offer` (price, INR, availability from live stock, `shippingDetails`, `hasMerchantReturnPolicy`); `AggregateRating`/`Review` **only from real verified reviews** |
| Artwork | `VisualArtwork` (artform, medium, dimensions, `dateCreated`, creator) |
| Course | `Course` + `offers` + `hasCourseInstance` (`courseMode: online`, `inLanguage`); `VideoObject` for preview/sample lessons |
| Listings, festivals, all deep pages | `BreadcrumbList` |
| Course FAQ | `FAQPage` |

**hreflang**
- `alternates.languages = { 'en-IN': '/x', 'mr-IN': '/mr/x', 'hi-IN': '/hi/x', 'x-default': '/x' }`, emitted **only for locales whose document has `translationStatus=published`**.
- An untranslated document still renders in `/mr` with English fallback, but with canonical → English and no hreflang entry. This avoids duplicate thin pages.
- `<html lang>` is set per locale. Mixed-language spans get `lang="mr"`/`lang="hi"`.

**Canonical rules**
- Self-referencing, absolute, lowercase, no trailing slash. Strip `utm_*`, `sort`, filters and `ref`.
- Filtered and sorted listings → base listing URL. `?page=n` is self-canonical.
- The intercepted lightbox carries the `/artwork/[slug]` canonical.
- Products live at the flat `/shop/p/[slug]`, so a category change never alters the URL.
- Slug edits auto-create a 301 in the `Redirects` collection (Payload redirects plugin), resolved in middleware.

**Sitemap**
- Sitemap index → `pages`, `products`, `artworks`, `festivals`, `courses`, `events`.
- Each URL carries `alternates.languages` (published locales only) and image entries (artwork images with titles).
- Built from DB, cached with tag `sitemap` and revalidated on publish. Submitted to Search Console and Bing.

**Images**
- Descriptive filenames are enforced on upload: slugified from alt text if the artist leaves `IMG_1234`.
- Alt text is a required, localised field on artwork media. Decorative images use `alt=""`.
- Hero: `priority`. Everything else lazy-loads.

---

## 7. Testing, CI, environments, backups

**Unit (Vitest)**
- Pricing and GST split (intra/inter-state, inclusive back-calculation, rounding to paise).
- COD eligibility matrix.
- Invoice number formatting and financial-year rollover (31 Mar → 1 Apr IST).
- Razorpay signature verify (valid, tampered, wrong length).
- Progress clamp and 90% rule.
- Canonical/hreflang builders.
- Consent state reducer.
- GSTIN checksum.

**Integration (Vitest + Testcontainers Postgres, real migrations, MSW for Razorpay/Shiprocket/Bunny/MSG91)**
- Webhook replay ×2 and 10 concurrent deliveries → exactly one `paid` and one invoice.
- 50 parallel invoice issues → gapless and unique.
- Two buyers race for one original → one succeeds, the other gets a clean error. A late payment produces an auto-refund.
- Refund → credit note + enrolment revoked.
- Authorisation matrix: every service function × anon/customer/other-customer/staff/editor/owner.
- Erasure keeps invoices but removes PII.
- Kids page renders no tracker scripts.

**E2E (Playwright)**
- Two projects: `desktop` 1440×900 (Chromium) and `mobile` 390×844 (WebKit, touch).
- Flows:
  - Browse → filter → PDP → pincode → cart → OTP (test OTP sink) → Razorpay.
  - Paid course → watch → complete → certificate → verify URL.
  - COD path.
  - Enquiry.
  - Newsletter DOI (Mailpit).
  - Language switch keeps the path.
  - Admin with 2FA: publish product → appears on site.
- Payment: PR runs complete payment by posting a **correctly signed test webhook**. A nightly staging job drives real Razorpay test-mode Checkout (`success@razorpay`, test card).
- `@axe-core/playwright` on every page at both widths. Keyboard-only checkout, and lightbox/drawer focus-trap tests.
- Visual snapshots of key pages at both widths.
- Lighthouse CI budgets: JS ≤ 150 KB gz, page ≤ 1 MB (PDP 1.5 MB), LCP ≤ 2.5s on mobile profile.

**CI (GitHub Actions)**
- PR pipeline: typecheck, eslint, unit, integration (service Postgres), `payload migrate:status` + `drizzle-kit check`, gitleaks, `npm audit --omit=dev` (high fails), build.
- Then Playwright + Lighthouse against the Vercel preview on `deployment_status`.
- Renovate weekly. Branch protection on `main`. Production deploys only from `main` after staging smoke tests.

**Environments**

| | dev | staging | prod |
|---|---|---|---|
| DB | Docker Postgres | Supabase project (Mumbai), seeded | Supabase Pro + PITR |
| Payments | Razorpay test | Razorpay test | Razorpay live |
| Video | Bunny dev library | Bunny staging library | Bunny prod library |
| Shipping | mock | `readonly` mode | live |
| Messages | Mailpit, OTP to console | Resend test domain, MSG91 to allow-listed numbers | live |
| Jobs | Inngest dev server | Inngest staging env | Inngest prod |

Migrations run in CI before the deploy is promoted. They are expand/contract only, with no destructive change in the same release.

**Backups**
- Supabase PITR (7 days).
- Nightly `pg_dump` via GitHub Actions, `age`-encrypted, to a bucket at a **different provider** (Cloudflare R2). Retain 35 dailies and 12 monthlies.
- Weekly `rclone` sync of storage buckets, also encrypted.
- Video masters also kept in the artist's Drive.
- **Quarterly restore drill** into staging, with a checklist.
- Invoices and credit notes are kept for at least 8 years.

---

## 8. Build order

1. **Foundations.**
   - Delivers: repo, CI skeleton, Vercel projects (`bom1`), Supabase dev/staging/prod, Payload installed with three-schema layout, Drizzle, `env.ts`, Sentry, security headers/CSP, Inngest and Upstash wired.
   - Depends on: none.
2. **Design system + global layout + i18n.**
   - Delivers: Tailwind tokens and fonts from brainstorm §5, components (buttons, cards, badges, drawer, bottom sheet, lightbox primitives with focus trap), rangoli SVG draw, header/mobile drawer/footer, WhatsApp button, `next-intl` routing for en/mr/hi, consent banner + consent ledger.
   - Depends on: 1.
3. **Content model + admin.**
   - Delivers: Media pipeline (sharp derivatives, watermark, private originals, alt/filename rules), Products, Artworks, Festivals, Pages, Testimonials, Courses/Lessons (metadata only), globals, Redirects, staff roles, revalidation hooks, search index hook, audit log.
   - Depends on: 1.
4. **Identity.**
   - Delivers: Better Auth (phone OTP via MSG91 SMS+WhatsApp, Google, email OTP), Payload custom strategy, **mandatory staff TOTP**, account profile/addresses/security, wishlist with guest merge, rate limits.
   - Depends on: 1, 2. Blocker: DLT registration.
5. **Brand and enquiry pages (revenue #1–2).**
   - Delivers: Home, Events + city pages, Custom Portraits, About, Contact (Turnstile, map click-to-load), Enquiries collection + kanban + notifications, Policies/seller/grievance pages.
   - Depends on: 2, 3.
6. **Portfolio.**
   - Delivers: masonry Artwork gallery, tabs, intercepted lightbox with story + Buy/Enquire, Festivals pages, Process section.
   - Depends on: 3, 5.
7. **Shop catalogue.**
   - Delivers: listing with filters/sort/load more, Postgres search, PDP (zoom, framing, sticky bar, live stock hole, related), Shiprocket pincode check.
   - Depends on: 3, 2.
8. **Cart + Razorpay checkout.**
   - Delivers: DB cart, address + OTP step, server pricing, reservations, order creation, Checkout.js, verify, webhook + idempotency, state machine, reconciliation cron, order pages, confirmation email/WhatsApp.
   - Depends on: 4, 7.
9. **Tax, documents, COD, refunds, coupons.**
   - Delivers: tax classes, sequence table, invoice/credit-note/receipt PDFs, B2B GSTIN, COD rules + confirmation, admin refunds with step-up, Payment Links for enquiry advances, simple festive coupons (percent/flat, expiry, usage cap).
   - Depends on: 8. Blocker: CA's written GST answer.
10. **Fulfilment.**
    - Delivers: Shiprocket order push, Fulfilment view (packed → AWB → pickup → label), courier webhook, tracking timeline, RTO handling, insurance flag.
    - Depends on: 8.
11. **Course catalogue + enrolment.**
    - Delivers: Bunny libraries, TUS upload from admin, encoding webhook, captions, course listing/categories/detail with curriculum and preview, free sample lessons, free and paid enrolment via the checkout from 8, digital downloads entitlements.
    - Depends on: 3, 8.
12. **Learning experience.**
    - Delivers: `/learn` dashboard, Vidstack player with signed HLS, moving watermark, lesson sidebar/next/prev, notes/resources tab, practice-sheet downloads, progress beacons, completion, certificates + `/verify`.
    - Depends on: 11.
13. **Engagement.**
    - Delivers: verified reviews + moderation (products and courses), testimonials on Home, newsletter double opt-in + Resend broadcasts, Instagram feed sync, WhatsApp utility notifications across order/shipping/enquiry.
    - Depends on: 8, 11.
14. **Privacy and Kids Art compliance.**
    - Delivers: `/account/privacy` export/erase jobs, DataRequests admin with SLA, retention jobs (purge stale carts, OTP logs, pending subscribers), Kids Art guardian consent + 18+ declaration + tracker suppression, GA4/Meta wired behind consent.
    - Depends on: 4, 8, 12, 13.
15. **SEO and localisation completion.**
    - Delivers: per-route metadata, all JSON-LD builders, sitemap index with hreflang and images, OG images, canonical/redirect middleware, Marathi/Hindi UI strings + translated priority pages, Search Console/Bing submission.
    - Depends on: 5–13.
16. **Hardening and launch.**
    - Delivers: full Playwright matrix at 1440/390, axe and Lighthouse budgets green, load test of checkout + webhooks, security review (authz matrix, headers, rate limits), backup restore drill, live Razorpay keys + webhook registration, Shiprocket live, Bunny prod, monitoring alerts, go-live and rollback runbook (Vercel instant rollback + expand/contract migrations).
    - Depends on: all.

Before milestone 8 goes live, these must be done: Razorpay KYC, PAN/current account, GSTIN, MSG91 DLT, Meta WhatsApp Business verification, the Instagram professional account, and the lawyer's sign-off on Kids Art and the refund wording.

Some details should be confirmed against current vendor docs during the milestone that uses them:
- Shiprocket's webhook URL keyword restriction.
- Whether Bunny MediaCage works with hls.js.
- The GST rates the CA assigns to each tax class.
- Which Next.js major Payload currently supports.
