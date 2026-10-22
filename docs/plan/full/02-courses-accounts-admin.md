# Layout and Flow Spec: Courses, Accounts, Certificates, Admin

Sources: `docs/plan/art-website.md` (the brief) and `docs/plan/brainstorm.md`, sections 5, 7 and 8. The brainstorm's cost and scope cuts are ignored, as the owner asked. The build is Next.js App Router + Tailwind, Razorpay and Bunny Stream. Every route has a locale prefix: `/en`, `/mr` or `/hi`.

## 0. Shared conventions

**Tokens (brainstorm §5)**
- Background is paper `#FAF6EF`; cards and inputs are surface `#FFFFFF`; text is charcoal `#1E1B18`; metadata is muted `#5F574F`.
- Each view has one kumkum `#A6261D` primary button. Links and the 2px focus ring are peacock `#0B5E73`. Success and "Completed" use leaf `#2E6B3C`.
- Marigold is only a fill behind charcoal text. Turmeric is decoration only, such as progress-bar texture or mandala dividers. Neither is ever used as text.
- Headings use Tiro Devanagari Marathi (Martel when a bold weight is needed). Body text is Mukta: 18px desktop, 16px mobile, line height 1.6 (1.75 for Devanagari).
- Buttons are 48px tall, UI corners are 6px, and course thumbnails get the 12px white mat with the framed-art shadow.

**Layout**
- Desktop (1440px): 12-column grid in a 1200px container.
- Mobile (390px): 4 columns with 20px margins; every tap target is at least 44px.

**State patterns, used on every screen**
- **Loading:** skeleton blocks shaped like the real content. Only a full-page load shows the rangoli self-draw loader. Both turn off under reduced motion.
- **Empty:** a small mandala line drawing, one warm sentence and one button.
- **Error:** an inline kumkum message with an icon and text (colour is never the only signal), plus a "Try again" button. Lost network shows a toast: "You're offline. We'll save your progress when you're back."
- **Locked:** a lock icon plus a text label ("Locked", "Unlocks after enrolment"), never a greyed-out look alone.

**Language and copy**
- The language switch sits in the header and the account menu: `EN · मराठी · हिंदी`.
- Copy below is English. Marathi and Hindi strings come from Admin → Translations. Every MR/HI string carries `lang="mr"` or `lang="hi"`.
- The voice is first person, from the artist: "I", "my students", "your practice".

**Security baseline (brainstorm §8, adapted for a custom build)**
- Enrolment is granted only by a verified Razorpay webhook (signature checked, handled idempotently), never by the client.
- Bunny videos play through signed, short-expiry token URLs, with a name/email watermark (never phone).
- PDFs come from signed URLs, and only to enrolled users.
- OTP is rate-limited.
- Admin requires 2FA, and staff roles get only the permissions they need.
- Reviews come only from verified buyers or enrolled students.

---

## 1. Courses listing (`/[locale]/courses`)

**Purpose:** let a visitor find the right course quickly and try a free lesson before paying.

**Blocks, in order**
1. **Banner.**
   - H1: "Learn Drawing & Rangoli From Home".
   - Sub: "Step-by-step video lessons I recorded in my studio. Learn at your pace, in English, मराठी or हिंदी."
   - Primary button: "Watch a free lesson", which scrolls to block 4. Secondary link: "See all courses".
   - Desktop: two columns. Text takes 6 columns; the right side has a framed still from a lesson with a mandala corner.
   - Mobile: text only, with the image cropped below it at 4:3.
2. **Category filter.** Chips: All, Pencil Sketching Basics, Portrait Drawing, Rangoli for Beginners, Festival Rangoli Designs, Kids Art.
   - Desktop: a single row of chips, with a "Sort" select on the right: Popular, Newest, Price low–high, Free first.
   - Mobile: the chips scroll sideways, with visible ‹ › buttons as the alternative to swiping. A "Filter & sort" button opens a bottom sheet with Level (Beginner/Intermediate/Advanced), Language, Price (Free/Paid) and Sort.
   - The URL updates (`?cat=portrait-drawing`). The canonical URL stays `/courses`.
3. **Course grid.** 3 columns on desktop, 1 column on mobile. Mobile cards are full width with a 16:9 thumbnail.
4. **"Try a lesson free".**
   - H2: "Try a lesson free".
   - Sub: "No sign-up needed. If you enjoy it, the full course is waiting."
   - Shows 3 sample-lesson tiles: thumbnail, play icon, lesson title, course name and duration. Tapping one opens an inline modal player that traps focus and closes on Esc, with captions on.
   - At the end of the video, a button: "Continue this course →".
5. **Student reviews strip.** 3 reviews with star rating, first name and city.
6. **FAQ teaser.** 4 questions: "Do I need prior experience?", "How long do I have access?", "Which materials do I need?", "Will I get a certificate?"

**Course card fields, top to bottom**
- Thumbnail, matted, with at most one badge in the order Free > New > Bestseller.
- Category tag.
- Title (H3).
- Level · lessons count · total duration, e.g. "Beginner · 12 lessons · 3h 20m".
- Language icons: EN / मराठी / हिंदी.
- Rating, e.g. "★ 4.8 (126)", or "New course" when there are no reviews yet.
- Price as "₹1,499", with the struck original price if on sale, or "Free".
- Wishlist heart, labelled "Save course".
- Button, "Enrol", which goes to the detail page.
- If the user is already enrolled, the button becomes "Continue learning" and a progress bar replaces the price.

**States**
- Loading: 6 skeleton cards.
- Empty category: "I'm still recording lessons for this one. Save it and I'll tell you when it's ready." The button is "Notify me", which requires sign-in.
- Error: "Courses didn't load. Please try again."

## 2. Course detail (`/[locale]/courses/[slug]`)

**Purpose:** answer every doubt and get the enrolment.

**Blocks, in order**
1. **Breadcrumb:** Courses › Category › Title.
2. **Hero.**
   - Desktop: left 7 columns hold the intro video preview (Bunny, poster frame, captions); right 5 columns hold the **sticky enrol card**.
   - Mobile: video at full width, then title, rating and meta. A **sticky bottom bar** shows the price and "Enrol now". The floating WhatsApp button is hidden while this bar shows.
3. **Title block:** H1 title, one-line promise, rating, students enrolled, level, language, last updated, and "Certificate on completion".
4. **What you'll learn.** H2 "What you'll learn". 6–8 ticks, in 2 columns on desktop and 1 on mobile.
5. **Curriculum accordion.**
   - H2: "Course curriculum". Meta: "4 sections · 18 lessons · 4h 10m". A "Expand all" toggle.
   - Each section shows its title and lesson count. Each lesson row shows an icon, title, duration and status:
     - **Free preview:** play icon plus a "Preview" text tag. It opens the modal player.
     - **Locked:** lock icon plus "Locked". Tapping it shows a tooltip or toast: "Enrol to unlock this lesson."
     - **Unlocked** (enrolled): play icon. It goes to the lesson player.
     - **Completed:** leaf tick plus "Done".
   - Rows with PDFs show a "PDF" tag.
6. **Materials you'll need.** A list with "Buy in my shop" links where products exist, e.g. "Rangoli colour set (10 shades)".
7. **Your teacher.** Artist photo in a rangoli frame, a 3-line bio, stats (students taught, years teaching) and a "Read my story" link.
8. **Reviews.**
   - Average, rating bars, and the 5 newest reviews, then "Show more".
   - Enrolled students who have finished at least 30% see "Write a review".
   - Only enrolled students can post; the admin moderates.
9. **FAQ accordion:** access duration, refunds ("No refund once lessons are accessed", from policy), device support, certificate, language.
10. **Related courses:** 3 cards.

**Sticky enrol card (desktop)**
- Price, any coupon field (collapsed as "Have a coupon?") and the kumkum primary button.
- Below the button: "Lifetime access · Watch on phone or laptop · Certificate".
- Secondary link: "Save for later".
- The card stays visible from block 3 until the reviews section.

**Enrol button variants**
- **Paid, signed out:** "Enrol for ₹1,499". This opens the login sheet, then the Razorpay checkout (UPI listed first), then a success page.
- **Paid, signed in:** "Enrol for ₹1,499" goes straight to Razorpay.
- **Free:** "Enrol free". It needs sign-in and enrols instantly, then shows "You're in! Let's begin." and jumps to lesson 1.
- **Enrolled:** "Continue: Lesson 4 – Shading the cheeks".
- **Completed:** "Download certificate" (primary) plus "Rewatch".
- **Kids Art, any price:** "Enrol my child". This inserts the parent-consent step first.

**Kids Art parent-consent step** (a modal, or a full page on mobile)
- H2: "A quick note for parents".
- Copy: "This course is bought and managed by you. Your child watches on your account. I only ask for their first name, to print on the certificate."
- Fields:
  - Child's first name (optional). Helper: "Shown on the certificate only."
  - Checkbox, unticked: "I'm the parent or guardian and I agree to the course terms and privacy notice."
- Button: "Continue to payment". It stays disabled until the box is ticked.
- The record stores the consent timestamp, policy version and parent user ID. No child age, photo or contact details are collected.

**States**
- Loading: video poster and text skeletons.
- Unpublished or missing slug: a 404, "This course has moved or isn't ready yet", with a "Browse courses" button.
- Payment pending: "Your payment is being confirmed. This usually takes a few seconds." The page polls order status, and a webhook is the source of truth.
- Payment failed: "Payment didn't go through. No money was taken, or it'll be refunded automatically by your bank." Button: "Try again".

## 3. Lesson player (`/[locale]/learn/[course]/[lesson]`)

**Purpose:** distraction-free learning that remembers where you stopped.

**Access**
- The server checks the enrolment, or whether the lesson is a free preview.
- If neither, it redirects to the course detail page with the toast "Enrol to unlock this lesson."
- The video plays only through a signed Bunny token URL, with an overlay watermark showing the student's name and email.
- Right-click download is disabled. There is no raw MP4 URL.

**Desktop layout**
- Slim header: logo, course title, "Your progress 7/18" ring, "Back to My Courses".
- Main area (left 8–9 columns):
  1. Video at 16:9. Controls: captions, speed (0.75–1.5x), quality, fullscreen, 10-second rewind.
  2. Title row: lesson H1 and a "Mark as complete" button.
  3. Prev/next row: "← Previous: Holding the pencil" and "Next: Light and shadow →".
  4. Tabs: **Notes**, **Resources**, **Q&A**, **Transcript**.
- **Lesson sidebar** (right 3–4 columns): sticky and scrollable. It lists sections and lessons with status icons (tick, current, lock for drip-locked). The current lesson is highlighted with a peacock left border. "Collapse sidebar" gives a theatre mode.

**Mobile layout**
- The video is pinned to the top.
- Below it, in order: title, the "Mark as complete" button, then a prev/next pair of buttons, each at least 44px.
- Tabs show as a horizontal segment: Notes · Resources · Q&A · Lessons. The **Lessons** tab replaces the sidebar on mobile.
- Landscape rotation goes to fullscreen video.

**Tabs**
- **Notes.**
  - Private text area: "Write what you noticed. Only you can see this."
  - Autosaves (debounced) and shows "Saved". The "Add timestamp" button inserts the current time, e.g. 02:14; tapping a timestamp seeks the video.
  - The notes list lives per lesson. There is also "Download all my notes (PDF)".
- **Resources.**
  - Rows of PDFs, e.g. "Practice sheet – eyes (A4)", each with a "Download" button.
  - Each download is a signed URL that expires in about 5 minutes and is logged to Downloads.
- **Q&A** (the admin can turn this off per course).
  - "Ask a question about this lesson", with a list of questions and the artist's replies.
  - Posts are rate-limited and plain text only.
- **Transcript.** Shown on desktop; on mobile it is inside Resources. It has a "Follow along" highlight.

**Progress saving**
- The player sends the position every 15 seconds, on pause and on page exit, using sendBeacon to a server route. The server stores `last_position` and `max_watched` per user and lesson.
- If the network fails, the position is kept in localStorage and retried later.
- On reopening a lesson, a "Resume from 06:42" chip appears, along with "Start over".

**Completion**
- A lesson auto-completes at 90% watched, or when the student taps "Mark as complete".
- Toast: "Lovely work! Lesson complete."
- After the video ends, the next lesson auto-plays after a 5-second countdown card ("Up next… Cancel"). This is off under reduced motion.
- When the course is complete, a full-width card shows a small rangoli self-draw animation.
  - H2: "You did it, [First name]!"
  - Copy: "You've finished [Course]. Your certificate is ready."
  - Buttons: "Download certificate" (primary), "Share on WhatsApp" and "Leave a review".

**States**
- Video loading: poster plus spinner.
- Video error: "The video is taking a break. Check your connection or try again." Buttons: "Retry" and "Report a problem".
- Locked lesson (drip): "This lesson opens on 12 Jan."
- No resources: "No sheets for this lesson. Just your pencil!"
- No notes: "Your notes will appear here."

## 4. Login, sign-up and account flows (`/[locale]/login`)

**Purpose:** one screen for both login and sign-up, phone first.

**Layout**
- Desktop: a centred 480px card on paper, with a faint kolam dot background and a lesson image on the left half.
- Mobile: full-screen card.
- Copy:
  - H1: "Welcome! Let's get you in".
  - Sub: "New here? Same steps. I'll create your account."

**Steps**
1. **Phone number.**
   - "+91" prefix, `type="tel"`, `inputmode="numeric"`, `autocomplete="tel"`.
   - Button: "Send OTP".
2. **OTP.**
   - 6 boxes with `autocomplete="one-time-code"` and paste support.
   - "Change number" link and "Resend OTP in 30s".
   - Button: "Verify".
   - Wrong code: "That code doesn't match. Please check the SMS." After 5 tries: "Too many tries. Please wait 10 minutes."
3. **Alternatives,** under a divider "or":
   - "Continue with Google".
   - "Use email instead", which sends a magic link or OTP to the email.
4. **First-time only** (after verifying):
   - "What should I call you?" (first name)
   - Email (optional for phone users)
   - Language preference: EN / मराठी / हिंदी
   - Two **separate, unticked** opt-ins: "Send me festival offers by email" and "WhatsApp me about new courses".
   - Notice link: "How I use your data".
   - Button: "Save and continue".
5. The user returns to the `?next=` URL, such as the course enrol or checkout.

**Guest checkout, then "create account"**
- Shop checkout never forces login. Courses do need an account, because access is tied to it.
- On the shop order success page:
  - H2: "Thank you! Your order #AR1042 is confirmed".
  - A card: "Track this order and check out faster next time." The button is "Create my account".
  - The phone number from checkout is pre-filled, so only the OTP is needed.
  - Once verified, the order is attached to the account by matching the phone/email used at checkout.
- The confirmation email and SMS carry the same link.

**Other account flows**
- **Logout:** in the account menu.
- **Session expiry:** "Please sign in again to keep your progress safe."
- **Account merge:** if Google and phone are different identities, the user can link both in Profile.
- **Delete my account:** in Profile, with a typed confirmation. It is a DPDP erasure request with a response time stated. Order records are kept as the law requires; this is stated in the confirmation.

## 5. Student dashboard (`/[locale]/dashboard`)

**Purpose:** a single home for learning and shopping.

**Layout**
- Desktop: left nav (3 columns) with My Courses, Orders, Wishlist, Downloads, Certificates, Addresses and Profile. Content takes 9 columns.
- Mobile: a "Hi, Priya" header, then a horizontally scrolling tab bar with ‹ › buttons. The default tab is My Courses.

**My Courses (default)**
1. **Continue watching** hero card: last lesson thumbnail, "Lesson 7 · Shading the cheeks", a resume-point bar and "Resume". The primary button sits here.
2. **In progress** grid: course card with progress bar, e.g. "45% · 8 of 18 lessons", and "Continue".
3. **Completed:** cards with a leaf "Completed" tag, "Download certificate" and "Rewatch".
- Empty: "No courses yet. Start with a free lesson, it's on me." Button: "Browse courses".

**Orders**
- A list of order cards: number, date, items with thumbnails, total, and status chip with text: Paid, Packed, Shipped, Delivered, Cancelled, Refunded.
- Order detail shows:
  - A Shiprocket tracking timeline: courier, AWB, "Track on courier site" and the latest scan.
  - Address and payment method.
  - "Download invoice" (GST).
  - "Need help?", which opens WhatsApp prefilled with the order number.
  - "Request return" when the order is within the return window and the product is eligible.
- Course orders appear here too and link to the course.
- Empty: "No orders yet. Find something you love." Button: "Visit the shop".

**Wishlist**
- Products and courses in tabs, each with "Add to cart" or "Enrol", and "Remove".
- A sold item shows a "Sold" badge plus "Enquire about a similar piece".
- Empty: "Tap the heart on anything you love and it'll wait here."

**Downloads**
- Grouped by course. Each PDF row shows lesson, size and "Download".
- Digital shop downloads are listed with their remaining download count.
- Empty: "Practice sheets from your lessons will collect here."

**Certificates**
- A card per completed course: thumbnail of the certificate, serial, date, "Download PDF", "Copy verify link" and "Share on LinkedIn".
- Locked state for in-progress courses: "Finish 10 more lessons to earn this."

**Addresses**
- Cards with "Default" tag, "Edit", "Delete" and "Add new address".
- Form fields: name, phone, pincode (fills city and state), flat/house, area, landmark, address type.
- Pincode check: "We deliver here in 4–6 days", or "COD not available for this pincode".

**Profile**
- Name, phone (verified tick), email, linked Google.
- **Language preference** radio. It also sets the default locale for redirects and emails.
- Marketing opt-ins as separate toggles.
- Kids Art: the child's first name, editable, with "Remove child name".
- "Download my data", "Delete my account" and "Sign out".

**States:** each tab has its own skeleton; error copy: "This section didn't load. Try again."

## 6. Certificate and public verification

**Certificate design** (A4 landscape PDF, generated on the server when the course completes, stored once, never regenerated)
- Paper background, a turmeric/marigold mandala border at low opacity, and a mandala at the top centre.
- Content, in order:
  - "Certificate of Completion", in Tiro Devanagari, with Marathi/Hindi sub-text if the student's language is MR/HI.
  - "This is to certify that"
  - **Student name**. For Kids Art, the child's first name plus "(enrolled by [parent first name])".
  - "has completed"
  - **Course title**
  - Level, lesson count and hours.
  - Completion date.
  - The artist's signature image and name, with "Artist & Teacher, [Brand]".
  - Serial `ART-2027-000142` and a QR code linking to the verify URL.
- The name is locked at issue. "Name wrong?" in the dashboard opens a reissue request that the admin approves.

**Verify page (`/[locale]/certificates/verify/[serial]`)**
- Public, `noindex`, with no personal data beyond what is printed on the certificate.
- **Valid:**
  - A leaf tick with "Verified".
  - H1: "This certificate is genuine".
  - Shows name, course, date, serial and the course link "Learn this course too".
- **Revoked:** "This certificate has been withdrawn." Text label plus icon.
- **Not found:** "I couldn't find a certificate with this number. Please check the code and try again." Includes a serial input box.
- Desktop: a centred card with the certificate thumbnail on the right. Mobile: a stacked card.
- Serial look-ups are rate-limited.

## 7. Artist admin panel (`/admin`)

**Principles**
- **Phone first.** The bottom nav has 5 items: Home, Orders, Enquiries, Add (+), More. On desktop the same items sit in a left sidebar.
- **Plain words.** "Add a painting", not "Create SKU". Every form has big image upload, autosaves a draft, and shows the toast "Saved ✓".
- **Help on tricky fields.** A "?" next to them gives a one-line explanation.
- **Safety.**
  - Destructive actions need a confirm sheet.
  - Admin login needs 2FA.
  - Roles: Owner, Orders-only, Content-only.
  - An activity log records who changed what.
- **Admin language.** EN/MR/HI chrome, chosen on the admin's own profile.

**7.1 Dashboard ("Namaste, Siddesh")**
- Cards in this order:
  1. Today's orders (count + "To pack: 3")
  2. New enquiries (count, with the oldest age, e.g. "2 waiting > 24h")
  3. Today's revenue / this month (₹)
  4. New students
  5. Reviews to approve
  6. Low stock
- Each card is tappable. Mobile shows a 2-column card grid; desktop shows a row of cards plus a 30-day revenue line chart.
- Quick actions: "Add a product", "Add a lesson", "Reply to enquiries".
- Empty day: "A quiet day. Perfect for painting."

**7.2 Products**
- **List:** thumbnail, title, price, stock, status chip (Live/Draft/Sold). Search box and filter by category.
- **Add/Edit** form, in order:
  1. Photos: drag in or camera; reorder; "Main photo" star.
  2. **Alt text** per image (required). Helper: "Describe it as you would to a friend on the phone."
  3. Title, description (simple editor) and story behind it.
  4. Category, medium, size.
  5. Type: Original / Print / Digital download.
  6. **Variants**, e.g. print sizes, each with price, stock and SKU.
  7. **Framing**: none / black / natural wood, each with an extra price.
  8. **Details (metafields)**: year, paper/canvas, dimensions in cm, weight for shipping, handling days.
  9. **"Sold" toggle**: keeps the page live with a Sold badge and "Enquire about similar".
  10. SEO title and description, prefilled.
  11. Translations tab: MR/HI fields.
- Footer buttons: "Save draft" and "Publish".

**7.3 Artwork gallery (not for sale)**
- Fields: photos, alt text, title, year, medium, story, gallery tab (Drawings / Paintings / Rangoli / Festival Specials / Commissions), festival tag, and "Link to a product" (optional).
- The list can be reordered by dragging; on mobile, use up/down buttons.

**7.4 Orders and shipping**
- **List** tabs: To pack · Ready to ship · Shipped · Delivered · Returns · All. Each row shows order number, customer, items, total, payment chip (Prepaid/COD) and age.
- **Order detail:** items, address, notes, payment ID.
- **Buttons:**
  - "Print packing slip".
  - "Ship with Shiprocket": choose package weight and size, pick courier (cheapest/fastest shown), then a pickup date. The label PDF and AWB are saved, and the customer gets the tracking link by SMS/email.
  - "Mark delivered" (manual fallback).
- Shiprocket webhook updates the status. If the label fails: "Shiprocket didn't accept this. Reason: pincode not serviceable." Buttons: "Try another courier" and "Ship manually".

**7.5 Refunds**
- From an order, tap "Refund". Choose full or partial (item checkboxes or an amount), a reason, and whether to restock.
- Confirm: "Refund ₹2,400 to Priya via Razorpay?"
- The status chip shows Requested → Processed, synced from the Razorpay webhook.
- A course refund revokes access after confirmation. A warning appears if lessons were watched: "Policy says no refund after access."

**7.6 Enquiries inbox**
- Tabs: Events · Portraits · Workshops · General.
- Status chips: New → Replied → Quoted → Advance paid → Done / Lost.
- Card shows name, date of event, city, budget and message.
- Buttons:
  - "WhatsApp reply": opens wa.me with a quick-reply template.
  - "Send quote": amount and note, which creates a Razorpay Payment Link and sends it.
  - "Add note" and "Change status".
- Overdue enquiries (more than 24h) are flagged with an icon plus "Waiting 2 days".
- Empty: "No new enquiries. Time to post a festival photo?"

**7.7 Courses and lessons builder**
1. **Course basics:** title, slug (auto), category, level, language(s), price/free, sale price, thumbnail plus alt text, intro video, what you'll learn (list), materials (list with product links), FAQ, Kids Art flag (turns on the consent step), Q&A on/off, certificate on/off, drip schedule (none / days after enrolment).
2. **Curriculum:**
   - Sections and lessons as a draggable list; mobile uses up/down buttons.
   - "Add section" and "Add lesson".
   - Per lesson:
     - Title.
     - Video: upload from phone straight to Bunny (resumable). Progress shows "Uploading 64%… you can keep working", then "Processing…" and "Ready".
     - Captions: upload a .vtt, or "Auto captions" via Bunny, which must be reviewed.
     - Transcript, PDFs (with titles), "Free preview" toggle, duration (auto).
3. **Preview as student** button.
4. **Publish** checklist. It blocks publishing until there is at least 1 lesson, every video is Ready, a thumbnail and alt text exist, and a price is set. Each missing item is listed in plain words.

**7.8 Students**
- Search by name or phone. Each row shows courses, progress % and last active.
- Detail page: per-course progress, certificates (with "Reissue" and "Revoke"), Q&A posts, and "Give free access" (e.g. a workshop attendee), which records a reason.

**7.9 Reviews moderation**
- A queue of product reviews and course reviews: stars, text, "Verified buyer" tag.
- Buttons: "Approve", "Hide" and "Reply publicly".
- Reported reviews show first.

**7.10 Festival pages**
- A template per festival (Diwali, Ganesh Chaturthi, Gudi Padwa, Weddings, plus custom).
- Fields: hero, intro, gallery picks (from 7.3), linked products and courses, enquiry button text, publish date, and "Show festive skin on site" with start and end dates.

**7.11 Homepage content**
- Blocks in fixed order, each with a show/hide toggle and editable fields:
  - Hero: image, headline, two buttons.
  - Category tiles.
  - Featured artworks (pick 4–8).
  - Meet the Artist.
  - Featured course.
  - Event section.
  - Testimonials (pick).
  - Instagram strip (6 uploaded images plus link).
  - Newsletter text.
- "Preview" opens a desktop/mobile toggle.

**7.12 Coupons**
- Fields: code, type (% or ₹), applies to (all / shop / courses / a specific item), minimum order, start/end, usage limit total and per customer, first-order only.
- The list shows uses and revenue. Buttons: "Pause" and "Duplicate".

**7.13 Translations (EN/MR/HI)**
- A table of interface strings and content fields, with filters for "Missing Marathi" and "Missing Hindi".
- A side-by-side editor shows EN on the left and the target language on the right.
- The site falls back to English when a string is missing, and shows a small "English" tag so users know.

**7.14 Settings**
- **Business:** legal name, address, GSTIN, grievance officer, WhatsApp number, reply-time promise.
- **Policies:** shipping, returns, refunds (including the digital no-refund-after-access clause), privacy, terms, commission advance, event cancellation. Each has a rich editor and a version history.
- **Shipping rates:** by weight or zone, free-shipping threshold, handling days per product type.
- **COD rules:** on/off, minimum and maximum order value, excluded categories (Originals, Courses, Digital), blocked pincodes, extra COD fee.
- **Payments:** Razorpay keys are entered once and masked; the test/live mode is shown clearly.
- **Staff and roles:** invite by phone or email.
- **Backups:** "Export orders/customers CSV".

**Admin states**
- Empty lists have a primary "Add your first …" button.
- Offline on a phone: "You're offline. Changes are saved on this phone and will upload when you're back." Text fields use draft localStorage; uploads pause and resume.

---

## 8. Ten key user flows

**1. Buy a course, then watch lesson 1**
1. Courses → tap the course card → detail page.
2. Tap "Enrol for ₹1,499" → login sheet → enter phone → OTP → name and language (first time only).
3. Return to the course → Razorpay opens with UPI first → pay.
4. "Confirming your payment…" → the webhook verifies the payment and creates the enrolment.
5. "You're in! Let's begin." → "Start Lesson 1".
6. The player loads a signed video → progress saves every 15s.

**2. Try a free sample lesson, then enrol**
1. Courses → "Try a lesson free" tile → modal player (no login).
2. At the end of the video: "Continue this course →" → detail page.
3. Enrol, as in flow 1.

**3. Kids Art enrolment by a parent**
1. Kids Art chip → course → "Enrol my child".
2. Login (parent) → consent screen → optional child first name → tick consent → "Continue to payment".
3. Pay → enrolment on the parent's account, with the consent record stored.
4. Dashboard shows the course under the parent; the certificate later prints the child's first name.

**4. Finish a course, then download the certificate**
1. Watch the final lesson → 90% watched, or tap "Mark as complete".
2. Every required lesson is complete → the server issues a serial and a PDF.
3. "You did it!" card → "Download certificate".
4. Later: Dashboard → Certificates → "Download PDF" / "Copy verify link".

**5. Verify a certificate (employer or school)**
1. Scan the QR code, or open `/certificates/verify/ART-2027-000142`.
2. See the "This certificate is genuine" card with name, course and date, or the not-found/revoked message.

**6. Guest shop checkout, then create an account**
1. Product → "Add to cart" → cart drawer → "Checkout".
2. Contact (phone/email) → address with pincode check → payment: UPI, cards, net banking, or COD if the rules allow.
3. Success page → "Create my account" → OTP to the prefilled phone → the order is attached.
4. Dashboard → Orders shows the order with tracking.

**7. Resume a lesson on another device**
1. Sign in on a laptop → Dashboard → "Continue watching" → "Resume".
2. The player opens at the saved position with the chip "Resume from 06:42".

**8. Artist adds a new course (from a phone)**
1. Admin → "+" → "Add a course".
2. Fill basics, set the price, upload the thumbnail and alt text → autosaves.
3. Curriculum → "Add section" → "Add lesson" → upload video from the gallery → "Processing…" until "Ready".
4. Add PDFs, captions, and the free-preview toggle on lesson 1.
5. "Preview as student" → "Publish". The checklist must pass.
6. Optionally switch on "Featured course" on the homepage.

**9. Artist handles an event enquiry through to the advance payment**
1. Push/email "New event enquiry" → Admin → Enquiries → open the card.
2. "WhatsApp reply" (template) → status Replied.
3. "Send quote" → amount → Razorpay Payment Link sent → status Quoted.
4. Payment webhook → status "Advance paid" → the invoice is generated.

**10. Artist ships an order, then refunds part of it**
1. Dashboard "To pack: 3" → order → "Print packing slip" → pack it.
2. "Ship with Shiprocket" → weight → courier → pickup → label PDF; the customer gets the tracking link.
3. The customer reports a damaged frame → order → "Refund" → partial: frame ₹800 → confirm.
4. Razorpay processes it → status Refunded → the customer sees it in Orders.

**Decisions to confirm with the owner**
- Course access length: lifetime or 12 months.
- Return window in days.
- Whether lesson Q&A is on by default.
- Whether a certificate needs 100% of lessons, or all lessons except optional ones.
- The minimum progress before a student may review (30% is proposed).
