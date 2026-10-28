# Art Website: Full Build Plan, Final Decisions

This file is the single source of truth. The five specialist documents below were written in parallel and disagree in places; **wherever any of them conflicts with this file, this file wins.**

| File | What it covers | Written by |
|---|---|---|
| `01-public-shop-pages.md` | Every public and shop page at 1440 and 390px: header, footer, Home, Shop, Product, Cart, Checkout, Order, Artwork, Festivals, Book an Event, Custom Portraits, About, Contact, Search, Wishlist, Policies, 404 | UI designer |
| `02-courses-accounts-admin.md` | Courses, course detail, lesson player, login, account dashboard, certificates, the artist's admin panel, 10 user flows | Product planner |
| `03-architecture.md` | Stack, repo layout, routes, Razorpay/COD/refunds/Shiprocket/GST/Bunny/certificates/Instagram/newsletter, security, SEO, testing, 16-step build order | Architect |
| `04-database.md` | PostgreSQL tables, invariants, erasure rules, seed data | Database designer |
| `05-components.md` | 52 components with states, keyboard and ARIA rules, accessibility checklist, Tailwind tokens | Accessibility architect |

Scope: **every feature in the original brief**, fully working. Cost and reach are not constraints (owner's decision, 19 Oct 2026).

---

## 1. Stack (final)

The stack in `03-architecture.md` §1 is final:

| Layer | Choice |
|---|---|
| App | Next.js App Router, TypeScript, Tailwind |
| Content and admin | Payload CMS 3, inside the same app at `/admin` |
| Data | Supabase Postgres (Mumbai), Drizzle |
| Auth | Better Auth: phone OTP, Google, email OTP, plus TOTP 2FA for staff |
| Payments | Razorpay |
| Course video | Bunny Stream with Vidstack |
| Shipping | Shiprocket |
| Messages | MSG91 for SMS and WhatsApp, Resend for email |
| Background jobs | Inngest |
| Rate limiting | Upstash |
| Errors | Sentry |
| Hosting | Vercel (Mumbai) |

**Build notes (22 Oct 2026, milestones 1–2 done):**
- **Languages:** use Next.js 16's built-in dictionaries and `next/root-params` instead of `next-intl`, which saves a dependency. The proxy is at `src/proxy.ts` and the logic, with tests, is in `src/i18n/config.ts`.
- **Payload and the database:** installation moves to milestone 3.

**Build notes (22 Oct 2026, milestone 3 core done):**
- **Database:** local PostgreSQL 18, database `siddesh_art`, Payload tables in the `payload` schema.
- **Migrations:** schema changes only go through migrations (`npm run migrate:create <name>`, then `npm run migrate`).
  - Production runs `npm run migrate` before each deploy.
  - `push` is turned off everywhere.
- **Payload's command-line tool:** runs with `--use-swc` (the `npm run payload` script). Its default loader loads `undici` twice in this setup and crashes. `package.json` is `"type": "module"`, as Payload expects.
- **Collections done:** Users (owner/staff/editor), Media, Categories, Mediums, Festivals, Products (variants with stock and reserved, plus framing), Artworks, Courses, Lessons, Testimonials, and the SiteSettings global. Text fields are stored in en/mr/hi.
- **Still to do for milestone 3** (done when the pages that use them are built):
  - Cloud storage plus watermarking for media. Uploads go to `/media` on disk for now.
  - Search index, audit log, redirects and the remaining globals (Home, Commerce settings).
  - An email adapter (Resend).
- **Before going public:** create the owner account first, because `/admin/create-first-user` is open until an owner exists.

**Design direction (22 Oct 2026, from the art direction, motion and usability agents):**
- **Look:** "उंबरठा / Umbartha — the doorstep".
  - Full-bleed coloured "floors" (paper, charcoal, kumkum, peacock, leaf), separated by a paithani border and a row of powder dots (`Threshold`).
  - One giant Devanagari word per section, in Rozha One.
  - Powder heaps for categories; tape-framed artworks.
  - A seeded, code-drawn rangoli (`GenerativeRangoli`) stands in for every photo until real photos arrive.
  - No mandala clip-art.
- **Motion:** "bindu → rekha → rang" (dot → line → colour).
  - Includes: the hero draw, scroll reveals and drawn lines (CSS `animation-timeline: view()`), page transitions (React `<ViewTransition>` plus cross-document `@view-transition`), a sliding tab indicator, a powder tap burst, and a scroll progress bar.
  - Extra JS is about 1 KB.
- **Guardrails:**
  - The headline never fades in, and nothing loops.
  - `data-motion="off"` comes from the footer switch; `data-fx="lite"` is set automatically on slow phones and data saver. Both give the final, still state, as does `prefers-reduced-motion`.
- **Code:** `src/components/Art.tsx`, `GenerativeRangoli.tsx`, `MotionSettings.tsx`, `TapRipple.tsx`, and the motion section of `src/app/globals.css`.

## 2. Who owns which data

| Owner | Holds | Edited through |
|---|---|---|
| **Payload** (`payload` schema) | Products and variants (including `stock` and `reserved` columns on variant rows), artworks, festivals, categories, mediums, media, courses, sections, lessons, lesson resources, pages, testimonials, timeline, stats, Home global, site and commerce settings (COD rules, shipping rates, tax classes, policies), coupons, enquiries and quotes, reviews and their moderation, redirects | Admin panel |
| **Better Auth** (`identity` schema) | Users, sessions, accounts and logins, OTP, 2FA. Roles: `customer`, `editor`, `staff`, `owner` | Login and account pages, Admin → Staff |
| **App** (`app` schema, Drizzle) | Carts, stock reservations, orders, order lines, payments, refunds, document sequences, invoices, credit notes, receipt vouchers, shipments, webhook events, enrolments, lesson progress, notes, lesson Q&A, certificates, download entitlements, wishlists, addresses, consents, newsletter subscribers, data requests, customer flags, Instagram posts, search documents, audit log | Site and custom admin views |

Rules:
- There are no foreign keys from `app` into `payload`. Order lines store the product, variant and course id **plus a snapshot** of the title, price, tax class and framing.
- Checkout reserves and sells stock with a guarded `UPDATE … WHERE stock - reserved >= qty` on the Payload variant row, inside one transaction.
- User ids are Better Auth text ids.

## 3. Conflicts resolved

| Topic | Options proposed | **Decision** |
|---|---|---|
| Language URLs | `/en/…` always (designers) vs English without a prefix (architect) | English has **no prefix** (`/shop`). Marathi and Hindi use `/mr/shop` and `/hi/shop`. The cookie remembers the choice. |
| Translations | Generic table (database designer) vs Payload localisation (architect) | **Payload per-field localisation** for content; `next-intl` message files for interface text. Drop the `translations` table. |
| Database security | Policies on every table (database designer) vs one app-level check (architect) | Policies are switched on with **no rules** as a backstop. Every permission check goes through `src/server/authz.ts`. |
| Checkout and accounts | Guest checkout then "create account" (designers) vs phone OTP at step 1 creating the account (architect) | **Phone OTP at checkout step 1**. It quietly signs in or creates the account, with no password. The order page then says "Your account is ready — track this order anytime" instead of a "Create account" card. COD needs no second OTP. |
| Cash on delivery | ₹10,000 limit with OTP (designer) vs ₹5,000 limit with WhatsApp confirmation (architect) | **Default limit ₹5,000**, editable in Settings. Prints and originals only. Confirmed on WhatsApp. One open COD order per customer. Blocked after 2 returns-to-origin. |
| Certificate numbers | Year + sequence (designer, database) vs random 10 characters (architect) | **Random 10-character code**, shown as `ART-7K2M-9QXD`. It can't be guessed by counting. |
| Who issues certificates | Database trigger (database) vs background job (architect) | **Background job** on `course/completed`. Remove the trigger. A unique enrolment still guarantees one certificate per course. |
| Order numbers | `#AR1042`, `#ART-10482`, `ORD-2026-000123` | **`ART-10482`** style: `ART-` plus a sequence. |
| Account area | `/dashboard` (designer) vs `/account` + `/learn` (architect) | **`/account`** is the dashboard from `02` §5 with tabs: My Courses, Orders, Wishlist, Downloads, Certificates, Addresses, Profile (Profile includes security and privacy). The player lives at `/learn/[course]/[lesson]`. |
| Wishlist | `/wishlist` page vs dashboard tab | One `/wishlist` page. It works for guests (saved on the device) and merges when they sign in. The account tab links to it. Courses can be wishlisted too. |
| Shop menu | Large menu with image (designer) vs skipped (components) | **Keep the designer's dropdown**: 3 columns of links plus one "New this week" image. |
| Home hero | Slider (architect) vs single image (designer) | **Single image** with the rangoli drawing itself in. |
| Dark mode | — | None. Light only. |
| Search language | `english` (database) vs `simple` (architect) | **`simple`**, so Devanagari works, in `app.search_documents`. |

## 4. Final route map

English has no prefix. Every route below also exists under `/mr` and `/hi`.

| Area | Routes |
|---|---|
| Public | `/` · `/shop` · `/shop/[category]` · `/shop/p/[slug]` · `/artwork` · `/artwork/[slug]` (lightbox) · `/festivals` · `/festivals/[slug]` · `/process` · `/events` · `/events/[city]` · `/custom-portraits` · `/courses` · `/courses/category/[cat]` · `/courses/[slug]` · `/courses/[slug]/sample/[lesson]` · `/about` · `/contact` · `/search` · `/wishlist` · `/policies/[slug]` · `/verify/[certId]` |
| Buying | `/cart` (drawer, with a page fallback) · `/checkout` · `/order/[publicId]` |
| Account | `/login` · `/account` (tabs) · `/account/orders/[id]` · `/learn/[course]/[lesson]` |
| Admin | `/admin/**` (Payload plus custom views: Dashboard, Fulfilment, Enquiry board, Refunds, Data requests, Audit log) |
| System | `/api/*` as listed in `03` §3 |

`01` uses `/product/[slug]`, `/book-event` and `/custom-portrait`. Read these as `/shop/p/[slug]`, `/events` and `/custom-portraits`. `02` uses `/dashboard` and `/certificates/verify/[serial]`. Read these as `/account` and `/verify/[certId]`.

## 5. Required changes to `04-database.md`

1. Remove the tables now owned by Payload or Better Auth (see §2): users, roles, auth identities, OTP codes, categories, mediums, media, festivals, products, variants, product and artwork media, digital assets, course tables, testimonials, timeline, stats, homepage blocks, settings, translations, coupons, enquiries and their history and quotes, and reviews.
2. `user_id` columns become `text`, holding the Better Auth id.
3. Add `stock_reservations(variant_id, order_id, qty, expires_at)`.
4. Add `orders` fields:
   - **Status values:** `pending_payment`, `payment_verified`, `paid`, `cod_pending_confirmation`, `cod_confirmed`, `packed`, `shipped`, `delivered`, `cancelled`, `cancelled_oversold`, `partially_refunded`, `refunded`.
   - **New columns:** `public_id`, `payment_mode` (prepaid/COD), `cod_fee_paise`, `delivery_option`, `gift_wrap`, `gift_note`, `hide_prices`, `billing_address_snapshot`.
5. Add to `order_items`: `product_type`, `tax_class` and HSN/SAC, the per-line tax split, framing, and the course id for course lines.
6. Replace `invoice_counters` with `document_sequences(series, fy)` for the series INV, CN and RV.
   - `invoices` gains `doc_type` (invoice, credit note, receipt voucher).
   - `order_id` is no longer unique.
   - Add an optional `enquiry_id` for advance receipts.
7. Add `entitlements(user_id, order_item_id, asset_id, downloads_used, max_downloads=5, expires_at)` for digital downloads.
8. `enrolments`:
   - Status gains `refunded`.
   - Add `first_accessed_at`, which drives the no-refund-after-access rule.
   - Add `guardian_consent_id` and `child_first_name` (Kids Art).
9. `lesson_progress`: add `last_position_seconds`, `max_watched_seconds` and `updated_at`. A lesson completes at 90% watched.
10. `certificates`: use the random id, add `name_on_cert` and a revoked status, and drop the trigger.
11. Add `lesson_questions(lesson_id, user_id, body, reply, replied_at, status)`.
12. `consents`:
    - Make `user_id` nullable and add `subscriber_id`.
    - Purposes: newsletter, WhatsApp marketing, analytics, marketing cookies, Kids guardian.
    - Add `notice_version` and `source`.
13. Add `data_requests(type: export|erase, status, due_at)`.
14. Add `customer_flags(user_id, cod_blocked, rto_count)`.
15. Add `instagram_posts`.
16. Add `search_documents`, using the `simple` config.
17. `payments`: `order_id` is nullable and `enquiry_id` is added, with exactly one set, for payment-link advances.
18. `wishlists` become `(user_id, item_type: product|course, item_id)`.

## 6. Behaviour rules settled across documents

**Payments**
- Prices, tax and shipping are always recalculated on the server.
- Only a verified Razorpay webhook marks an order paid or enrols a student.

**Stock**
- An original sells exactly once. It is held for 15 minutes during checkout.
- If an original oversells after the hold ran out, the buyer gets an automatic full refund and an apology.

**Courses**
- A lesson counts as complete at 90% watched, or when the student taps "Mark as complete".
- A certificate needs every lesson in the course.
- Reviews open at 30% progress.
- Courses and digital files can't be refunded after first access. This is shown before payment, and the owner can override it.

**Kids Art**
- Bought through the parent's account, with a guardian consent box.
- The only child data is an optional first name.
- No analytics or ad tracking on Kids pages.

**Privacy**
- Portrait reference photos are collected on WhatsApp, never uploaded to the site.
- Cookie banner with equal Accept and Reject buttons. Analytics and the Meta pixel load only after consent.

**Shop**
- At most one badge per product card, in priority order: Sold Out, then New, then Sale.

**Design**
- One kumkum primary button per view.
- Marigold and turmeric are never used for text.
- Every tap target is at least 44px.
- Animations stop when the visitor has reduced motion turned on.

## 7. Build order

Follow the 16 milestones in `03-architecture.md` §8:

1. Foundations
2. Design system and layout
3. Content model and admin
4. Login
5. Brand and enquiry pages
6. Portfolio
7. Shop catalogue
8. Cart and checkout
9. Tax, invoices, COD and refunds
10. Fulfilment
11. Course catalogue
12. Learning
13. Reviews, newsletter and Instagram
14. Privacy and Kids Art
15. SEO and translations
16. Hardening and launch

## 8. Decisions still needed from the owner

**Business details**
1. ~~Artist name~~ **Siddesh Mokashi** (given 19 Oct 2026). Marathi spelling used: सिद्धेश मोकाशी. Owner to confirm.
   Still to come: brand name, city, logo, domain.
   **Photos: build with placeholders.** Each image slot is a paper-tinted (#F1EBE1) box at the correct ratio. Inside it:
   - a thin border line
   - a centred label with the photo type and purpose, e.g. `ART · Product main image 4:5`, `EVT · Wedding event 3:2`, `POR · Artist portrait 4:5`
   - descriptive placeholder alt text
   Codes and ratios are listed in `01` §18. Real photos replace them through Admin → Media, with no code changes.
2. Real starting prices for events and portraits. The specs use placeholders such as ₹4,500 and ₹2,500.

**Policies**
3. ~~Course access: lifetime, or 12 months?~~ **Lifetime** (owner, 28 Oct 2026).
4. Return windows. Proposed: prints within 7 days; originals within 3 days, only if damaged.
5. Should lesson Q&A be on by default?
6. Is a ₹5,000 default COD limit acceptable?

**External sign-ups and approvals** (each blocks the milestone shown)
7. MSG91 DLT registration. Needed for milestone 4.
8. Razorpay KYC, PAN and a current account. Needed for milestone 8.
9. A written GST answer from a CA. Needed for milestone 9.
10. Meta WhatsApp Business verification.
11. An Instagram professional account.
12. A lawyer's sign-off on the Kids Art, under-18 and refund wording.
13. Student price for teens: yes or no, and how much off?

## 9. Who we design for (added 22 Oct 2026, overrides 01, 02 and 05 where they differ)

| Group | Who they are | What they need |
|---|---|---|
| **Women around 35–45** (main buyers, "aunties") | Mostly on an Android phone. Live on WhatsApp. Often prefer Marathi or Hindi. Unsure about online forms and payments. | Big, clear text. Words, not icons. One thing per screen. Help that is always one tap away. |
| **Teen girls 14–18** (learners) | Students who learn rangoli and drawing for festivals and school competitions. Grew up on Instagram. Small budgets. Often use a parent's phone. | A modern, clean look that isn't childish. Short lessons. Free or cheap starter courses. Something to share. |

### 9.1 Easy to use for everyone (applies to every page and to the admin panel)

**Text and buttons**
- Body text is **18px on phones too** (was 16px). Nothing on screen is smaller than **16px**, except legal fine print.
- Main buttons are **52px tall on phones**, full width.
- Every icon has a **word under or next to it**: "Search", "Cart", "Saved", "Menu". The only exception is the close button (×), which is still labelled "Close" for screen readers.
- Pinch-zoom is never blocked, and the layout still works when the phone's text size is set to large (200%).

**Mobile bottom bar** (this overrides `01` §1.3, which said no bottom bar)
- Five labelled tabs, 64px tall: **Home · Shop · Learn · Cart · Me**.
- The menu button stays at the top for everything else.
- On product, course and checkout pages, the sticky "Add to Cart" / "Enrol" bar sits **just above** the bottom bar. The WhatsApp button moves above both.

**Language**
- On the first visit, one screen with three big buttons: **English · मराठी · हिंदी**. "Choose your language" is written in all three languages.
- The choice is remembered. It can be changed any time from the top bar and from Me.

**Plain words.** Use the left-hand word everywhere instead of the right-hand one:

| Use | Instead of |
|---|---|
| Saved | Wishlist |
| My orders | Order history |
| Go to payment | Checkout |
| Track my parcel | Tracking |
| Pay safely | Proceed |
| Learn | Courses (in the bottom bar) |
| Me | Account |

**Help is always close**
- Every page has a "Need help? WhatsApp me" link and a tap-to-call number in the menu and footer.
- A new **`/help` page** with picture-by-picture guides and 30-second videos in Marathi and Hindi:
  - "How to order"
  - "How to pay with UPI"
  - "How to watch a lesson"
  - "How to download my certificate"

**One step at a time**
- Checkout shows "Step 1 of 3". Each step has one clear button.
- Nothing important is hidden behind swipes or hover. There is always a visible button.

**Forms**
- The phone number comes first.
- The OTP fills in automatically from the SMS.
- Number fields open the number keypad.
- The pincode fills in the city and state.
- Error messages say what to do, e.g. "Please enter your 10-digit mobile number".

**Payment confidence**
- UPI comes first, with the GPay, PhonePe and Paytm logos.
- Cash on delivery is shown clearly.
- Next to the Pay button: "Safe payment by Razorpay. You'll get a WhatsApp message as soon as it's done."

**Messages**
- Order, shipping and course messages are sent on WhatsApp **in the customer's chosen language**.

**Lesson player**
- A big Play button and a big "Next lesson" button.
- Subtitles are large and turned on by default.
- Lessons are recorded in Marathi or Hindi, or carry Marathi and Hindi subtitles.

**Testing with real people**
- Before launch, 3 women in the 35–45 group and 3 teens each try to: buy a print, book an event and watch a lesson.
- They use budget Android phones and a slow connection.
- Anything they get stuck on gets fixed before launch.

### 9.2 Appealing to teen girls (without changing the look for others)

- **Courses:**
  - Short lessons of **5–10 minutes**.
  - A "Beginner friendly" tag.
  - A **free starter course**, e.g. "Your first rangoli in 15 minutes".
  - A "School & competition rangoli" collection next to the festival designs.
- **Sharing:** a **"Share to Instagram / WhatsApp"** button on finished-course certificates and on each festival design. It shares a ready-made image with Siddesh's handle on it.
- **Look:** the same calm design, but course pages can use brighter festival colours on cards and tags. The tone of voice stays friendly, never childish.
- **Price:** an optional **student price** (owner to decide, item 13 above).

### 9.3 Under-18 users: the law (extends the Kids Art rule to all ages under 18)

Under India's DPDP Act, **everyone under 18 counts as a child**. Teen girls are therefore covered by the child rules.

**Accounts**
- An under-18 learner does **not** get her own account.
- A parent or guardian signs in with their own phone OTP, pays, and adds the learner's first name.
- The teen then learns on that account, on the parent's phone or her own.

**Age question**
- Sign-up asks "Are you 18 or older?"
- **No** shows: "Please ask a parent to sign in. They can add you as a learner."

**Consent and tracking**
- At checkout for any course used by an under-18 learner, the parent ticks a box: "I am the parent/guardian and I agree."
- No analytics, ad pixels or marketing messages for those learners. This already applies to Kids Art pages.

**Sign-off**
- A lawyer confirms this before launch (item 12).

### 9.4 "Mobile app"

**Plan:** the website will **install like an app** (a Progressive Web App, or PWA).
- Phones show "Add to Home Screen". That puts Siddesh's icon on the phone, opens the site full screen with no browser bar, and loads quickly on later visits.
- This covers Android and iPhone and costs nothing extra.

**Later, if needed:** a Play Store / App Store app. It is not in the current plan, and can be added once the website is live.

### 9.5 What this changes in the other files

| File | Change |
|---|---|
| `01` | Bottom bar added. Body text 18px on phones. "Saved" replaces "Wishlist" in the interface. `/help` page added. |
| `02` | Age question at sign-up. Parent-held accounts for under-18 learners. Free starter course. Share button on certificates. |
| `05` | Body text size 18px on all screens, minimum 16px. Phone button height 52px. Bottom tab bar component. Icon + label rule. |
| `03` | PWA manifest and service worker added in milestone 2. Under-18 tracking off in milestone 14. WhatsApp messages localised in milestone 13. |
