# Art Website — Plan v2 (after panel review)

Built from 5 brainstorms (backend, product, UI, UX/accessibility, security) and reviewed by a 5-person panel (technical, security, SEO, business, devil's advocate). All 5 reviewers: **APPROVE WITH CHANGES**; their changes are applied below.
Source brief: `docs/plan/art-website.md`. Date: 2026-10-19. Prices are estimates to verify.

## Verdict: FEASIBLE, with changes and 6 checks first

The full brief as one custom build is not feasible for an artist running it alone. A **Shopify store using a bought theme, built enquiry-first**, is feasible. Courses come later and only after demand is proven.

**Before paying for the build, run these 6 checks** (devil's advocate):
1. Count paid art sales over the last 6 months via Instagram/WhatsApp. **Under 10 → take the Simple path below instead.**
2. The artist lists 5 products in a free Shopify trial without help, and it takes a reasonable time.
3. Send 3 test parcels of originals to other states; check cost and damage.
4. Get the CA's written answer on GST (selling to other states may require registration from day one, plus monthly returns).
5. She can give 4–6 hours a week to the site, including festival season.
6. (Before courses) one paid live workshop gets 10+ sign-ups.

**Simple path** (if check 1 fails, under ₹25k/year): Instagram + WhatsApp Business catalogue + Razorpay Payment Links/Pages + a cheap portfolio site carrying the policy pages Razorpay KYC requires. Move to Shopify at about 15+ orders a month.

## 1. Launch timing

Diwali 2026 is about 8 Nov; a build starting now cannot be ready, and the artist is busiest then. **Do not launch into Diwali.**
- **Oct–Nov 2026:** use Diwali and wedding events to shoot photos, collect testimonials (with permission), and run the 6 checks.
- **Dec 2026:** build (5–6 weeks).
- **Jan 2027:** soft launch to existing WhatsApp/Instagram contacts during wedding season; push event bookings first.
- **Spring 2027:** festival push before Gudi Padwa (check the date); publish festival galleries 4–6 weeks ahead.

## 2. Decisions

| Topic | Decision | Changed by review? |
|---|---|---|
| Stack | Shopify Basic + **bought premium gallery theme** (~₹15–30k one-time), configured through theme settings. Custom code only for small sections (rangoli SVG, masonry gallery). | Yes, was a custom theme (devil's advocate: custom code decays with no developer) |
| Build priority | **Enquiry-first**: events and portraits before shop features | Yes (business, devil's advocate) |
| Enquiry flow | Typed form (portrait / event / workshop) → WhatsApp quick replies → quote → advance via **Razorpay Payment Link** → template invoice (incl. B2B GST invoice for corporate events) | New |
| Portrait reference photos | Collected **over WhatsApp**, not uploaded to the site | New (security: no unnamed upload store) |
| Payments | Razorpay (UPI first) via Shopify. **Prepaid only at launch, no COD**; review after 3 months | Yes. Also removes the Shopify Plus requirement for COD rules (technical) |
| Pincode | Shopify's own checkout address autocomplete. No custom pincode autofill (needs Plus). Product-page pincode check later via Shiprocket | Yes (technical) |
| Shop filters | **Category tabs + sort only** for 20–30 products. More filters at 60+ products | Yes (devil's advocate) |
| Fees | Budget ~4.4% per sale (Shopify ~2% third-party gateway fee + Razorpay ~2% + GST); compare with Razorpay Payment Pages | New |
| Accounts | Guest checkout; Shopify customer accounts (passwordless) for students later | — |
| Language | English + Marathi headings/taglines; toggle deferred to Phase 3 | — |
| WhatsApp | Free WhatsApp Business app (quick replies, catalogue). No paid API | Yes (devil's advocate) |
| Courses | Phase 2, **only after check 6 passes**. Choose the platform first and confirm video hosting and watermark support (Shopify course app vs Indian platforms like Graphy/Exly). Watermark with name/email, not phone | Yes (technical, devil's advocate) |
| Kids Art | Sold to and held by the **parent's account**; parent/guardian consent checkbox at checkout; no child data beyond first name. Lawyer to confirm before launch | Yes (security) |
| Look | Minimal gallery default, plus a **seasonal festive skin** (festive banner strip, warmer event section) | Yes (business: all-neutral can feel cold) |

## 3. Navigation and Home (revenue-ordered)

**Desktop menu:** Book an Event · Custom Portraits · Shop · Artwork · Courses (when live) · About. Account, cart.
**Mobile:** hamburger · logo · cart. WhatsApp button hidden where a sticky bar shows.

**Home, in order:**
1. Hero (single image, warm headline, buttons: Book an Event / Shop Art).
2. **Event rangoli**: "starting from ₹X", 3–5 captioned real event photos ("Diwali 2025, Pune society, 40 ft"), "we reply within X hours", enquiry button.
3. **Custom portraits**: starting price, turnaround time, example before/after.
4. 4 featured works.
5. Meet the Artist.
6. 3 testimonials.
7. Curated "On Instagram" image strip (static, links out).
8. Footer with newsletter.

**Must exist before launch:** starting prices for events and portraits; reply-time promise; delivery time per product type.

## 4. Launch scope (Phase 1, ~25–30 developer-days)

- Theme setup, design tokens and fonts; seasonal festive skin
- Book an Event page + per-city service pages (e.g. "Rangoli for weddings in Pune")
- Custom Portraits page (sizes, prices, turnaround, how it works)
- Enquiry → quote → advance flow (form app or custom section, Payment Link, invoice template)
- Shop: category tabs, sort, 3-col desktop / 2-col mobile, Load more
- Product page: gallery with zoom, framing variants, Add to Cart / Buy Now, sticky bar on mobile, shipping/returns, story, 4 related
- Cart drawer + Shopify checkout (Razorpay, prepaid)
- Artwork gallery: masonry, tabs, lightbox with story + Buy/Enquire
- **Festival galleries** (Diwali, Ganesh Chaturthi, Gudi Padwa, weddings): English with Marathi headings
- About + contact, static stats, map
- Legal pages; consent banner; SEO setup (section 6)

**Phase 2** (after launch + check 6): one course, course platform, free sample lesson, reviews, product-page pincode check.
**Phase 3:** digital downloads, workshop deposits, festival newsletter campaigns, Marathi body-copy pages, language toggle, process/time-lapse section.

## 5. Design system

The art is the loudest thing on the page. About 90% of each screen is neutral paper and charcoal. Rangoli colour goes on one call to action per view, on tags, and on a thin mandala divider. The seasonal skin adds warmth to the event section and the banner.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| paper | #FAF6EF | page background | — |
| surface | #FFFFFF | cards, drawers, inputs | — |
| charcoal | #1E1B18 | text, secondary buttons | 15.91 on paper |
| muted | #5F574F | metadata | 6.58 |
| border | #857B70 | input borders | 3.85 (UI) |
| kumkum | #A6261D | primary button, Sold, errors | white on it 7.20 |
| peacock | #0B5E73 | links, focus ring | 6.81 |
| marigold | #E8890C | festive badge fill (charcoal text) | **never as text (2.43)** |
| turmeric | #F2B705 | decoration only | **never as text (1.69)** |
| leaf | #2E6B3C | success, Available | 5.94 |

**Fonts**
- Headings: Tiro Devanagari Marathi. Use Martel if a bold weight is needed.
- Body: Mukta.

**Type scale (desktop / mobile)**
- Display 64/40
- H1 48/32
- H2 36/26
- H3 24/20
- Body 18/16, line height 1.6 (1.75 for Devanagari)

**Spacing and layout**
- Spacing steps: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Grid: 12 columns at 1200px on desktop; 4 columns with 20px margins on mobile.

**Components**
- Buttons: 48px tall, one kumkum primary per view.
- Artwork: square corners, 12px white mat, framed-art shadow.
- UI elements: 6px corner radius.
- Badges: at most one per card, in the order Sold > New > Sale.

**Motion** (all of it is turned off under prefers-reduced-motion)
- Hover zoom: scale 1.03 over 400ms.
- Scroll reveal: once per section.
- Rangoli self-draw: runs once, on the first visit and as the loader.

## 6. SEO & discoverability (Phase 1)

- **Google Business Profile**: claim and verify it, list the service-area cities, post event photos weekly, and ask event clients for Google reviews.
- **Name, address and phone (NAP)**: keep them identical across the footer, Google Business Profile and the Instagram bio.
- **Structured data**:
  - Product and Offer on product pages.
  - BreadcrumbList on listing pages.
  - LocalBusiness on About and in the footer.
  - Phase 2: Course and VideoObject.
- **Canonical URLs**: point sorted and filtered collection URLs at the main collection URL.
- **Image filenames**: name each file descriptively before upload (`sanskar-bharti-rangoli-diwali-red-yellow.webp`) and match the alt text to it.
- **Sitemap**: submit it to Google Search Console and Bing at launch.
- **Social links**: Instagram and YouTube links go to festival or collection pages with UTM tags, not to the home page.

**Target pages and keywords**
1. Rangoli artist for weddings in [City]
2. City event pages
3. Diwali rangoli designs
4. Ganesh Chaturthi rangoli
5. Gudi Padwa rangoli
6. Sanskar Bharti rangoli
7. Pencil portrait from photo
8. Custom charcoal portrait price
9. Buy original paintings online India
10. Online rangoli course (Phase 2)

## 7. UX & accessibility rules (verify on every page)

1. Tap targets are at least 44×44px.
2. Every icon button has an accessible name.
3. Every swipe has a visible button alternative.
4. Focus ring is visible: peacock, 2px.
5. Drawers, sheets and the lightbox trap focus, close on Esc, and return focus when they close.
6. Labels sit above fields, with the correct input type, inputmode and autocomplete.
7. UPI is listed first.
8. Guest checkout works end to end.
9. Colour is never the only signal.
10. Every artwork has artist-written alt text; decorative images use `alt=""`.
11. Course videos have captions and a transcript (Phase 2).
12. Marathi and Hindi text carries `lang="mr"` or `lang="hi"`.
13. Images are responsive WebP/AVIF, lazy-loaded below the fold, with the hero loaded eagerly.
14. Page weight stays under 1 MB (1.5 MB on product pages), with JS under 150 KB gzipped.

## 8. Security & compliance (launch must-haves)

**Shopify handles**
- Payment verification and webhooks.
- PCI scope.
- TLS.
- 2FA on the owner account.

**The artist must do**
- **Vet every app before installing it.** Read its privacy terms, grant only the permission scopes it needs, and list each app as a data processor in the privacy policy.
- **Staff accounts** get only the permissions they need, e.g. orders only.
- **Cookie consent banner.** Analytics and the Meta pixel load only after consent.
- **Under India's DPDP Act:**
  - A plain-language notice.
  - Separate, unticked opt-ins for the newsletter and for WhatsApp marketing.
  - An unsubscribe option in every message.
  - A retention policy.
  - A grievance contact.
  - Use Shopify's customer data request tool for access and erasure requests, and state the response time.
- **Under the E-Commerce Rules 2020:**
  - Seller's legal name, address, contact details and GSTIN.
  - A named grievance officer.
  - All policies shown before checkout.
- **Policies:**
  - Digital products: no refund once accessed, disclosed before purchase. Have a CA or lawyer sanity-check this.
  - Commission advance policy.
  - Event cancellation policy.
- **Abuse protection:**
  - Honeypot and rate limit on the contact form.
  - Double opt-in for the newsletter.
  - Reviews only from verified buyers.
  - Low-opacity watermark on artwork images.
- **Backups:**
  - A backup app plus a monthly CSV export.
  - Keep originals in the artist's Drive, but **not customer-submitted photos**.

## 9. Year-1 cost (estimates to verify)

| Item | Low (₹) | High (₹) |
|---|---|---|
| Build (freelance, 25–30 days at ₹3–5k/day) | 75,000 | 1,50,000 |
| Premium theme | 15,000 | 30,000 |
| Shopify Basic | 18,000 | 24,000 |
| Apps (GST invoice, backup, reviews, form, consent) | 12,000 | 30,000 |
| Phase 2 course platform + video | 10,000 | 25,000 |
| Domain + email | 1,000 | 4,000 |
| CA: GST registration + filings | 15,000 | 36,000 |
| Photography setup | 8,000 | 20,000 |
| **Total** | **~1.5 lakh** | **~3.2 lakh** |

**Per-order costs:** about 4.4% in fees, plus ₹100–400 shipping and ₹100–300 packaging.

**Break-even:** at an average original of ₹5,000, netting about ₹3,800, she needs roughly 15–40 extra sales a year to cover running costs. Recovering the build cost as well needs 35–90.

## 10. Blockers before build

1. Fill in the artist name, brand name, city, logo and domain.
2. Add the reference photos to the project.
3. Prepare 20–30 products: 3–4 consistent photos each, sizes, prices, alt text and descriptive filenames.
4. Gather the About text, a portrait photo, 15+ event photos with captions, and testimonials with permission.
5. Set starting prices for events and portraits, the reply-time promise, and shipping zones and rates.
6. Write all the policy text.
7. Get a PAN and a current account, and complete Razorpay KYC.
8. Get the CA's written GST answer.
9. Run the 6 checks.

## 11. Top risks

1. **The 6 checks fail.** The money is spent on a store nobody visits. Mitigation: the Simple path.
2. **Content is not ready.** Photos, names and prices are missing.
3. **Festival-season overload.** Mitigation: launch after Diwali, show a "dispatch after X" banner, and use WhatsApp quick replies.
4. **Fees and GST eat the margin.** Mitigation: ~4.4% fees plus filings, priced in.
5. **App sprawl.** Each app adds cost and becomes another data processor.
6. **Fragile shipping.** Mitigation: ship unframed or with acrylic, insure, and test parcels first.
7. **Selling an original twice.** Mitigation: mark it sold everywhere immediately.

## 12. Revenue ranked

1. Event rangoli bookings.
2. Custom portraits.
3. Originals.
4. Workshops.
5. Courses.
6. Prints.
7. Digital downloads.

The site's navigation and Home page now follow this order.
