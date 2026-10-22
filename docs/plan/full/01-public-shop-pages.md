# Layout Spec: Public & Shop Pages (Desktop 1440 / Mobile 390)

This spec follows the brief (`docs/plan/art-website.md`) and the agreed design system and UX rules (brainstorm §5 and §7). Every feature in the brief is in scope. It brings back the language toggle, wishlist, Instagram grid, stats counters, pincode check, COD, kolam accents, corner ornaments, festivals and process. It keeps the brainstorm's improvements: Book an Event and Custom Portraits get prominent paths, enquiries continue on WhatsApp, each view has one kumkum primary button, and the contrast rules apply.

**Note:** no reference photos are in the project yet. The photo-type codes below stand in for them.

---

## 0. Conventions

**Tokens.** All tokens come from brainstorm §5:
- Colours: `paper #FAF6EF`, `surface #FFF`, `charcoal #1E1B18`, `muted #5F574F`, `border #857B70`, `kumkum #A6261D`, `peacock #0B5E73`, `marigold #E8890C`, `turmeric #F2B705`, `leaf #2E6B3C`.
- Spacing is written `s-N` (N = 4, 8, 12, 16, 24, 32, 48, 64, 96, 128).
- Fonts: Tiro Devanagari Marathi for headings (Martel when a bold weight is needed), Mukta for body.

**Grid**
- Desktop: 12 columns, 1200px container, 24px gutter, 120px side margins at 1440.
- Mobile: 4 columns, 20px margins, 16px gutter.
- Section padding: `s-96` top and bottom on desktop, `s-64` on mobile.

**Buttons**
- **Primary:** kumkum fill, white text, 48px tall. One per view.
- **Secondary:** charcoal 1.5px outline with charcoal text. On hover it fills charcoal and the text turns paper.
- **Tertiary:** peacock text link with an arrow →.

**Artwork frame.** Square corners, 12px white mat on desktop and 8px on mobile. Shadow: `0 2px 4px rgba(30,27,24,.08), 0 12px 32px rgba(30,27,24,.12)`. On hover the image (not the frame) scales to 1.03 over 400ms.

**Kolam accent**
- A dotted SVG grid, either 1.5px dots on a 24px pitch or a kolam loop tile, in charcoal.
- Opacity: 4% on paper sections and 6% in the hero, event section, newsletter and festival heroes.
- Never placed behind artwork images or body text blocks wider than 640px.

**Corner ornament**
- A quarter-mandala SVG line drawing, 1.5px stroke, in marigold or kumkum.
- Opacity 12–16%. Size 120px on desktop, 64px on mobile.
- Placed in the top-left and bottom-right corners of a section card or frame.
- Always `aria-hidden`.

**Mandala divider.** 240×24 SVG, centred, used between major sections at most twice per page.

**Motion**
- Scroll reveal: 16px rise plus fade, 500ms, once per section.
- Rangoli self-draw: SVG stroke-dashoffset over 1.6s.
- Under `prefers-reduced-motion`, all motion is off and everything shows in its final state.

**Language**
- Route prefix is `/en`, `/mr` or `/hi`. Switching language keeps the same path.
- The chosen language is stored in a cookie.
- `<html lang>` is set per locale, and Devanagari body text uses line-height 1.75.
- Each headline below has a Marathi version (MR). Hindi follows the same pattern and is supplied by the translator.

**States (apply everywhere)**
- **Loading:** skeleton blocks in `#F1EBE1` with a 1.2s shimmer (static under reduced motion). Full-page loads use the rangoli self-draw loader for the first visit only.
- **Error:** an inline kumkum message with an icon and text (never colour alone), plus a retry button.
- **Empty:** a small line-art rangoli, one sentence in the artist's voice, and one action.

**Photo type codes:**
- **ART:** artwork (drawings and paintings)
- **RNG:** rangoli close-ups
- **EVT:** event photos with people and venues
- **POR:** artist portrait
- **PRC:** process steps and time-lapse

---

## 1. Global elements

### 1.1 Announcement / festive banner
- Full-width strip above the header: 40px tall on desktop, 36px on mobile.
- **Default skin:** charcoal background, paper text, 14px.
- **Festive skin (owner toggles):**
  - Marigold background, charcoal text.
  - A 4% kolam dot pattern.
  - A 24px diya or rangoli glyph on the left.
- Shows one message only, never rotating. A link may be included (charcoal text, underlined).
- Dismiss button: × at 44px with label "Close announcement". Dismissal is remembered for the session.
- **Copy (festive):** "Diwali orders: last dispatch 2 Nov. Event rangoli dates are filling — book yours →"
- **Copy (default):** "Free shipping on orders above ₹2,999 · COD available"
- Mobile: text truncates to one line and the link text becomes "Details →".

### 1.2 Header: desktop (≥1280px)

**Row A: utility bar**
- 36px tall, paper background, 1px bottom border at 30% of `border`. Muted text, 14px.
- **Left:** language switcher, a globe icon with "English ▾". Its menu lists "English", "मराठी" (`lang="mr"`) and "हिंदी" (`lang="hi"`), each shown in its own script, with a check mark on the current one.
- **Centre:** "Replies within 4 hours on WhatsApp · +91 XXXXX XXXXX".
- **Right:** "Contact" · "Track order".
- Row A scrolls away with the page; Row B sticks.

**Row B: main header**
- 80px tall, paper background. Sticky. It hides on scroll down and reappears on scroll up, with a shadow when stuck.
- **Logo:** left, 3 columns wide, wordmark at 40px height. Links to Home.
- **Nav:** centred, Mukta 16px medium, `s-32` gaps.
  - The commission links come first: "Book an Event" and "Custom Portraits". A 6px marigold dot sits before "Book an Event" (decoration only).
  - A 1px × 24px border-colour divider follows.
  - Then "Shop ▾", "Artwork ▾", "Courses" and "About".
  - Home is the logo. Contact is in Row A and the footer.
  - There is **no** primary button in the header, so the page keeps its single kumkum CTA.
- **Shop mega-menu:** 3 columns of links (Drawings, Paintings, Rangoli Designs, Prints, Digital Downloads, Gift under ₹2,000) plus one ART image tile (4:5) titled "New this week".
- **Artwork ▾ menu:** Gallery, then the four festivals (Diwali, Ganesh Chaturthi, Gudi Padwa, Weddings), then Process.
- **Icons (right):** search, wishlist (with a count dot), account, and cart (with a count badge in a charcoal circle with paper text, 18px).
  - Each icon is a 44px target with an `aria-label`, for example "Cart, 2 items".
- **Active page:** 2px kumkum underline plus `aria-current`.

### 1.3 Header: mobile (<1280px)
- Banner at 36px, then a 56px sticky bar.
- **Left:** hamburger (44px), labelled "Open menu".
- **Centre:** logo at 32px height.
- **Right:** search and cart, both 44px.
- Wishlist, account and language move into the drawer.
- From 768 to 1279px the same pattern applies, with the logo moved left.

### 1.4 Slide-in menu drawer (mobile)
- Slides in from the left. Width is 88vw, max 360px. 300ms ease-out, with a charcoal scrim at 40%.
- **Background:** paper, with a kolam dot pattern at 8% and a corner ornament bottom-right at 14%.
- **Order:**
  1. Close button (×, 44px).
  2. Two large stacked "path cards". Each is a surface card, 72px tall, with a 56px RNG or ART thumbnail, title and subline:
     - **Book an Event:** "Weddings, festivals, corporate"
     - **Custom Portraits:** "From your photo, by hand"
  3. Nav list, 56px rows with a chevron: Shop (expands into categories), Artwork (expands into Gallery, Festivals, Process), Courses, About, Contact.
  4. Wishlist (n) and Account rows.
  5. Language segmented control `EN | मराठी | हिंदी`, full width, 44px.
  6. WhatsApp and phone links.
  7. Social icons.
- Focus is trapped inside the drawer. Esc or the scrim closes it, and focus returns to the hamburger.

### 1.5 Footer
- Charcoal background, paper text, peacock-light links (#7FC3D3 on charcoal, contrast >7).
- A 4% kolam pattern sits in the top band, over a mandala divider in marigold.
- **Desktop columns:**
  - **Brand (4 columns):** logo, then the brand line "Hand-drawn in [City], Maharashtra — art for your walls and your celebrations." Then name, address, phone, email and WhatsApp in NAP format, plus a "Grievance officer" link.
  - **Shop (2 columns):** Drawings, Paintings, Rangoli Designs, Prints, Digital Downloads.
  - **Work with me (2 columns):** Book an Event, Custom Portraits, Workshops, Courses.
  - **Help (2 columns):** Shipping, Returns, Privacy, Terms, Commission advance, Event cancellation, Track order.
  - **Newsletter (2 columns):**
    - Heading: "Festival designs in your inbox".
    - Email field and a secondary "Subscribe" button. This is the only CTA in the footer and is not kumkum.
    - A separate, unticked checkbox: "Also send me offers on WhatsApp".
    - After submitting, the double opt-in note reads: "Check your inbox to confirm."
- **Bottom row:**
  - Social icons for Instagram, YouTube and Facebook (44px).
  - Payment icons in monochrome paper: UPI, Razorpay, Visa, Mastercard, RuPay, COD.
  - "© 2026 [Brand Name] · GSTIN XXXX" and the language switcher.
- **Mobile:** brand block first, then the link groups as accordions (56px rows), then the newsletter, then the bottom row stacked.

### 1.6 Floating WhatsApp button
- 56px circle in leaf with a white glyph, bottom-right with `s-24` inset (`s-16` on mobile), shadow-md.
- Label: "Chat on WhatsApp".
- On first hover or scroll on desktop, a pill expands to the left reading "Ask me anything".
- The prefilled message depends on the page, e.g. "Hi! I'm looking at 'Monsoon Evening' (₹6,500)…"
- **Hidden** on mobile wherever a sticky bar exists (product, checkout, cart drawer open, filter sheet open). It sits above the cookie banner.

### 1.7 Cart drawer
- Slides in from the right. 440px wide on desktop; full width (100vw) on mobile, with the header and footer pinned. Focus is trapped inside.
- **Header:** "Your cart (2)" plus close.
- **Free-shipping meter (optional):** "You're ₹800 away from free shipping". A thin leaf bar plus text.
- **Line item:**
  - 80px 4:5 thumbnail with a 4px mat.
  - Title (Tiro 18px).
  - Meta line: type · size · framing (muted 14px).
  - Price.
  - Quantity stepper (44px buttons) for prints and digital items. Originals show "Original · only one" instead.
  - "Remove" text link, and "Move to wishlist".
- **States:**
  - **Item became sold:** kumkum inline "Someone just took this one home. It's been removed from your total." with a link "See similar".
  - **Updating:** a spinner on the line only.
  - **Empty:** rangoli line art and "Your cart is waiting for its first piece." Secondary button "Browse the shop".
- **Footer:**
  - Subtotal.
  - Note: "Shipping, COD fee and taxes at checkout".
  - Primary **"Checkout"**, then a tertiary "Keep browsing".
  - Trust line: "UPI · Cards · Net banking · Wallets · COD".

### 1.8 Search overlay
- Opens from the search icon or the `/` key. Full-screen paper overlay with 4% kolam.
- Input: 64px tall, Tiro 32px on desktop and 24px on mobile. Placeholder: "Search art, rangoli, courses…".
- **Before typing:** "Recent" (local) and "Popular" chips: Diwali rangoli, Pencil portrait, Charcoal, Sanskar Bharti, Gift under ₹2,000.
- **Typing (debounced 200ms):** grouped results for Shop (4 items with 48px thumbs and price), Artwork (4), Festivals and Pages (3), and Courses (2). Keyboard arrows move through the list.
- The last row is "See all results for 'ganesh' →", which goes to /search.
- **No match:** "Nothing yet for 'xyz'. Try 'rangoli' — or tell me what you need on WhatsApp."
- Esc closes the overlay and returns focus.

### 1.9 Cookie consent
- Bottom bar on a surface card: "Analytics help me understand what you love. Allow?"
- Buttons: "Allow" (secondary) and "Only essential" (secondary). The two are equal weight.

---

## 2. Shared components

### Product card
- Surface background with no border. Card gap is `s-24` on desktop and `s-16` on mobile.
- **Image:** a 4:5 container holding the artwork, shown uncropped (`object-fit: contain`) inside the white mat with the frame shadow.
  - Desktop hover: zoom to 1.03, and the second image (wall mock-up) cross-fades in.
- **Badge (top-left, 8px inset, max one):** priority is Sold Out > New > Sale.
  - **Sold Out:** kumkum fill, white text.
  - **New:** marigold fill, charcoal text.
  - **Sale:** charcoal fill, paper text. Shows "−15%".
  - 12px caps Mukta semibold, 6px radius.
- **Wishlist heart (top-right):** 44px. Outline when off; kumkum fill plus `aria-pressed="true"` when on. A small pop on toggle. Toast: "Saved to your wishlist" with "View".
- **Body (`s-12` padding):**
  - Title: Tiro 18px, 2 lines max.
  - Meta: "Charcoal · 30×40 cm · **Original**". The type (Original / Print / Digital) is a text label in this line, not a badge.
  - Price: Mukta 18px semibold. On sale, the old price is struck through in muted.
- **Button:** full-width secondary "Add to Cart", 44px. After adding, it reads "Added ✓" for 2s and the cart drawer opens.
  - **Sold out:** the button is replaced by the tertiary link "Commission something similar →" and the image desaturates by 30%.
  - **Digital:** the button reads "Add to Cart", with "Instant download" in the meta line.
- **Loading:** a skeleton of the same dimensions.

### Filter sidebar / bottom sheet
- **Desktop:** left sidebar, 3 columns wide, sticky at the top below the header. Groups are accordions, all open by default.
  1. **Category:** radio list with counts.
  2. **Medium:** checkboxes for Pencil, Charcoal, Acrylic, Watercolour, Rangoli colours, Poster colour.
  3. **Size:** checkboxes for Small (up to A4), Medium (A3), Large (A2+).
  4. **Price:** dual-thumb slider (44px thumbs) plus Min/Max number inputs, each ₹.
  5. **Availability:** Original, Print, Digital download.
  6. **Toggle:** "In stock only".
- Results update live, with an `aria-live` region announcing "24 pieces".
- **Applied chips** sit above the grid, each removable, plus "Clear all".
- **Mobile:**
  - Under the banner, a sticky 56px bar with two half-width secondary buttons: "Filter (2)" and "Sort: Newest".
  - The bottom sheet is 90vh with a grab handle, a title "Filter" and a close button. Groups are accordions.
  - Sticky footer: tertiary "Clear all" and primary **"Show 24 pieces"**.
- **Zero results:** "No pieces match all of that. Remove a filter, or ask me to make one." The chips stay visible.
- All filter state lives in the URL query, and the canonical URL points to the unfiltered collection.

### Sort
- A native `<select>` styled with the 6px radius, 44px tall.
- Options: Newest (default), Popularity, Price: low to high, Price: high to low.
- On mobile it opens as a small bottom sheet with radio rows.

### Pincode checker (product page)
- Label above the field: "Check delivery".
- 6-digit input (`inputmode="numeric"`, `autocomplete="postal-code"`), plus a secondary "Check" button (44px).
- **Success (leaf check icon plus text):** "Delivers by **Fri, 24 Oct** to Pune 411004 · COD available · Free shipping".
- **COD unavailable:** "Delivers by Mon, 27 Oct · Prepaid only for this pincode".
- **Unserviceable:** kumkum "I can't ship here yet — message me and I'll find a way." plus a WhatsApp link.
- **Invalid:** "Please enter a 6-digit pincode."
- **Loading:** the button shows a spinner.
- The pincode is remembered and pre-filled on every product page and at checkout.

### Framing selector
- A radio-card group, 3 across on desktop and stacked on mobile. Each card is 72px tall with a 40px swatch, name and price delta:
  - "Unframed — ships flat in a rigid mailer"
  - "Black wood frame, glass-free acrylic +₹1,800"
  - "Natural teak frame +₹2,400"
- The selected card gets a 2px charcoal border and a check icon.
- Choosing a frame swaps the gallery's first image to the matching wall mock-up and adds "+3 days for framing" to the delivery line.
- **Digital items:** the selector is hidden.
- **Prints:** a "Print size" selector (A4 / A3 / A2) appears first, as segmented 44px chips.

---

## 3. Home `/`
**Purpose:** show the artist's world in 5 seconds and send visitors down one of three paths. **Primary action:** Book an Event (in the hero).

1. **Hero**
   - **Desktop:** full-bleed RNG or ART image at a 2:1 ratio (1440×720). A paper-to-transparent gradient covers the left 45%.
   - **Text block** (columns 1–6, vertically centred):
     - **Display headline (64px):** "Art That Brings Colour to Every Celebration". MR: **"प्रत्येक सणाला रंग देणारी कला"**.
     - **Sub (20px muted):** "Hand-drawn portraits, paintings and rangoli from my studio in [City] — made slowly, with love, for your walls and your festivals."
     - **Buttons:** primary **"Book Event Rangoli"**, secondary "Shop Art", and the tertiary link "or learn with me →" (to Courses).
   - A 120px rangoli SVG draws itself beside the headline on first visit, followed by a 6% kolam.
   - **Mobile:** the image is 4:5 on top and the text stacks below on paper with `s-24` padding. Buttons are full width and stacked.
   - The hero image loads eagerly with high fetch priority.
2. **Book an Event band**
   - Paper background with 6% kolam and a corner ornament top-left.
   - **Desktop:** text in columns 1–5, and columns 6–12 hold a horizontal row of 3 EVT photos (3:2) with captions such as "Diwali 2025 · Pune society · 40 ft".
   - **Heading (H2):** "Let me colour your celebration". Sub: "Weddings, festivals, housewarmings and corporate events across Maharashtra. Starting from ₹4,500. I reply within 4 hours."
   - **Button:** secondary "Plan my event rangoli" (the hero already holds the primary).
   - **Mobile:** text first, then a swipeable EVT carousel with prev/next buttons and dots.
3. **Custom Portraits band**
   - **Desktop:** reversed 2-column layout. A before/after (photo → drawing) comparison slider sits in columns 1–6 at 1:1. Its 44px handle also works with the arrow keys, and there are "Show photo / Show drawing" buttons.
   - **Text:**
     - **Heading:** "Your photo, drawn by hand".
     - **Copy:** "Pencil from ₹2,500 · Charcoal from ₹3,500 · Colour from ₹6,000. Ready in 10–14 days."
     - **Button:** secondary "Start my portrait".
   - **Mobile:** stacked.
4. **Category tiles**
   - **Heading:** "Wander through my studio".
   - 5 tiles: Drawings, Paintings, Rangoli Designs, Custom Portraits, Courses. Each is 4:5 with an ART, RNG or POR image and the label below in Tiro 20px plus "→".
   - **Desktop:** 5 across. **Mobile:** a horizontal scroll at 72vw per tile, with arrow buttons.
   - Hover: zoom plus the arrow shifts 4px.
5. **Featured / Bestsellers carousel**
   - **Heading:** "Fresh from the easel". Tertiary "See all →".
   - Product cards, 4 visible on desktop and 1.6 on mobile (swipe), with prev/next buttons (44px).
   - **Empty:** the section hides.
6. **Meet the Artist strip**
   - **Desktop:** POR portrait at 4:5 in a rangoli frame with corner ornaments (columns 1–5). Text in columns 7–12.
   - **Heading:** "Hello, I'm Siddesh Mokashi".
   - **Copy:** "I grew up drawing rangoli on my grandmother's doorstep every morning. Twenty years later, I still start each day with colour on my fingers."
   - **Button:** secondary "Read My Story".
7. **Featured course**
   - A video thumbnail at 16:9 with a 72px play icon in a white circle with a charcoal glyph. It opens a modal preview.
   - Next to it: title, level, lesson count, then price "₹1,499" and a secondary "Enroll Now".
   - **Heading:** "Learn rangoli from home".
8. **Festivals strip**
   - **Heading:** "Rangoli through the festivals".
   - 4 tiles (3:4 RNG) for Diwali, Ganesh Chaturthi, Gudi Padwa and Weddings, each with its Marathi name under the English one.
9. **Stats line**
   - 4 counters inline: "1,200+ artworks · 3,000+ students · 450+ events · 2,500+ happy homes".
   - They count up when scrolled into view; under reduced motion they show the final value.
10. **Testimonials**
    - 3 cards with a 64px circular photo, a 5-star rating (text "5 out of 5"), a quote in Tiro 18px, and name plus context (e.g. "Wedding, Nashik").
    - **Desktop:** 3 columns. **Mobile:** carousel with buttons.
11. **Instagram grid**
    - **Heading:** "On Instagram @handle".
    - 6 images at 1:1, in 6 columns on desktop and 3×2 on mobile, with no gutters beyond 4px.
    - Hover: a charcoal 40% overlay with an IG glyph. Each image links out (`rel="noopener"`).
    - Fed by the IG Graph API, with a server-cached fallback of curated static images.
    - **Error:** the cached set shows silently.
12. **Newsletter band**
    - Marigold-tinted paper (#FBEBD3), 6% kolam, corner ornaments.
    - **Heading:** "Get festival designs before the festival". Sub: "One email a month. New rangoli patterns, early access to originals, festive offers."
    - Email input and a secondary "Send me designs".

---

## 4. Shop `/shop` and `/shop/[category]`
**Purpose:** browse and buy. **Primary action:** Add to Cart (secondary style on cards, since a listing page has no single primary).

1. **Page banner**
   - 240px tall on desktop and 160px on mobile. Paper with 4% kolam.
   - Breadcrumb: "Home / Shop / Paintings" (BreadcrumbList structured data).
   - **H1:** "Take a piece of my studio home". MR: **"माझ्या स्टुडिओतील कला, आता तुमच्या घरी"**.
   - **Category pages** use their own H1 plus a 2-line intro, for example:
     - **Paintings:** "Colour that holds a mood." MR "रंगांतून उलगडणारी भावना".
     - **Rangoli Designs:** "Sanskar Bharti, dot, flower and poster-colour rangoli — originals, stencils and printable patterns."
2. **Category tabs:** a pill row (All, Drawings, Paintings, Rangoli Designs, Prints, Digital Downloads), scrollable on mobile. Tabs are links to `/shop/[category]`.
3. **Toolbar:** "48 pieces" (muted), applied chips and Sort on the right. Mobile gets the sticky Filter/Sort bar described in §2.
4. **Body**
   - **Desktop:** filter sidebar (3 columns) plus a product grid (9 columns), 3 cards per row. At ≥1440 with the sidebar collapsed via "Hide filters", it shows 4 per row.
   - **Mobile:** 2 columns.
   - **Rangoli category:** adds the filter "Style: Sanskar Bharti / Dot / Flower / Poster colour / Traditional".
5. **Interstitial**
   - After row 2, a full-width tile: "Don't see your size? I'll paint one for you." with a tertiary link to /custom-portrait or WhatsApp.
6. **Pagination:** a secondary "Show more pieces" button (loads 12 more) plus "Showing 24 of 48". Page URLs `?page=2` remain for SEO.
   - **Loading:** 6 skeleton cards.
   - **Error:** "The gallery didn't load. Try again" with a button.

---

## 5. Product detail `/product/[slug]`
**Purpose:** decide and buy. **Primary action:** Add to Cart (kumkum). Buy Now is secondary.

1. **Breadcrumb.**
2. **Gallery and info**
   - **Desktop:** gallery in columns 1–7, info in columns 8–12. The info column is sticky.
   - **Gallery:**
     - The main image is 4:5 with a mat.
     - A vertical thumbnail strip on the left: 72px thumbs, 4–6 images. These include ART straight-on, a detail crop, a wall mock-up, a framed version, and the artist holding the piece (POR+ART) for scale. A PRC shot can be added.
     - Hover gives a 2× loupe zoom. Click opens a fullscreen lightbox with pinch-zoom and prev/next buttons.
     - **Mobile:** a full-width swipe gallery with dots, "1/5" and arrow buttons. Tap opens fullscreen.
   - **Info column:**
     - Type label "Original · one of one", or "Print · edition of 50, 12 left".
     - **H1** title in Tiro 48/32. Marathi title shown below in muted (`lang="mr"`).
     - Price at 28px.
     - "Inclusive of GST · Free shipping above ₹2,999".
     - Short artist note in italic: "I painted this the evening the first monsoon rain hit our terrace."
     - Spec list: Medium, Dimensions (cm and inches), Paper/Canvas, Year, Signed.
     - Print size selector (prints only), then the framing selector.
     - Quantity (prints and digital only).
     - **Primary "Add to Cart"** and **secondary "Buy Now"**, side by side at 50/50.
     - Wishlist heart (44px) beside the title.
     - Pincode checker.
     - Trust row of 3 icons with text: "Packed flat & insured" · "7-day returns on prints" · "Certificate of authenticity".
     - Accordions: Description and story, Shipping & delivery, Returns, Care instructions.
   - **States:**
     - **Sold out:** the buttons are replaced by a kumkum "Sold" label plus "This one has found its home." and a primary **"Commission something similar"** (to WhatsApp with context). The "Notify me of similar" email field is secondary.
     - **Digital:** "Instant download after payment · PDF, A4 & A3 · No refunds once downloaded" sits above the buttons (disclosed before purchase).
     - **Low stock:** "Only 3 prints left" in muted text with an icon.
3. **Sticky bar (mobile)**
   - Appears once the main CTA scrolls out of view. 72px tall, surface background, top shadow.
   - Contents: a 40px thumbnail, price and the primary "Add to Cart". The WhatsApp FAB is hidden while it shows.
4. **Story / process block (optional, per product):** a 2–3 PRC images row captioned "From the first line to the last".
5. **"You may also like":** 4 product cards in a carousel on mobile.
6. **Recently viewed:** a local list of up to 6 items. Hidden if empty.

---

## 6. Checkout `/checkout`
**Purpose:** pay with little friction. **Primary action:** "Pay ₹X securely", or "Place order" for COD.
- The header is minimal: logo, "Secure checkout" with a lock icon, and a "Need help?" WhatsApp link. No nav. No FAB.
- **H1:** "Almost there". MR: **"बस, थोडंच राहिलं"**.

**Layout**
- **Desktop:** steps in columns 1–7 and a sticky order summary in columns 8–12.
- **Mobile:** a collapsible "Show order summary · ₹8,300 ▾" bar at the top, and the steps stacked below.
- **Stepper:** 1 Address → 2 Delivery → 3 Payment, with numbered circles. A completed step shows a check, its summary, and "Edit".

**Step 1: Contact & address**
- Guest by default, with the tertiary link "Have an account? Sign in".
- **Fields (labels above):**
  - Mobile number with a fixed +91 prefix (`type="tel"`, `autocomplete="tel"`). Used for delivery and COD OTP.
  - Email (`autocomplete="email"`, optional for COD, required for digital).
  - Full name.
  - Pincode (6 digits; auto-fills city and state, with a spinner while it looks them up).
  - Flat / House / Building.
  - Area / Street.
  - Landmark (optional).
  - City.
  - State (select).
  - Address type chips: Home / Work.
  - Checkbox "Need a GST invoice?" which reveals GSTIN and business name.
  - Checkbox "Billing address same as shipping" (ticked by default).
- Validation runs on blur, with an inline kumkum message plus icon. An error summary at the top links to each field.
- **Button:** primary "Continue to delivery".
- **Digital-only orders:** skip the address step and ask for name and email only.

**Step 2: Delivery**
- Radio cards:
  - "Standard · 5–8 days · Free" (or ₹99)
  - "Express · 2–4 days · ₹249"
- A framed item adds "+3 days for framing", with the date shown, e.g. "Arrives by Thu, 30 Oct".
- Options:
  - Gift wrap (+₹99) with a 150-character gift note.
  - "Hide prices on the invoice".
- **Button:** primary "Continue to payment".

**Step 3: Payment** (Razorpay; a radio accordion, with UPI first and open by default)
1. **UPI**
   - On mobile: app buttons for GPay, PhonePe, Paytm and BHIM (intent flow), plus "Other UPI app".
   - On desktop: a QR code with a 10-minute timer, and a "Pay with UPI ID" field such as name@okhdfc, with verification.
2. **Credit / Debit card:** Razorpay-hosted fields; RuPay, Visa, Mastercard and Amex icons; "Save card securely" is off by default.
3. **Net banking:** a 6-bank tile grid (SBI, HDFC, ICICI, Axis, Kotak, BoB) plus "Other banks" as a select.
4. **Wallets:** Paytm, PhonePe, Amazon Pay, Mobikwik.
5. **Cash on Delivery**
   - "+₹49 COD fee · Available up to ₹10,000 · Not for digital or custom orders".
   - The phone is confirmed with a 6-digit OTP (`autocomplete="one-time-code"`).
   - **Disabled state:** greyed out, with the reason shown in text, e.g. "COD isn't available for pincode 7xxxxx".

**Button and notes**
- The primary button reads "Pay ₹8,300 securely", or for COD "Place order · pay ₹8,349 on delivery".
- Below it: "By placing this order you agree to the Terms, Shipping and Returns policies" with links. Policies are reachable before payment.
- **Original hold:** a muted banner, "I'm holding 'Monsoon Evening' for you for 15:00 min." When time runs out: "The hold expired, but it's still available — continue?"
- **Payment failed:** "Your bank didn't confirm the payment. No money was taken; if it was, it returns within 5–7 days." Primary "Try again", with another-method chips.
- **Processing:** a full overlay with the rangoli loader and "Confirming with your bank… please don't close this page."

**Order summary panel**
- Lines: 56px thumbnail, title, framing, price.
- A coupon field with a tertiary "Apply". States: "Code applied ✓ −₹500" or "This code has expired".
- Subtotal, shipping, COD fee, GST note, then the total in 24px.
- Trust: "Secured by Razorpay" plus the payment icons.

---

## 7. Order confirmation `/order/[id]`
**Purpose:** reassure the buyer and point to the next path. **Primary action:** "Track on WhatsApp" for physical orders, or "Download your files" for digital.

1. **Thank-you block**
   - Paper with 6% kolam and two corner ornaments. A 160px rangoli self-draws.
   - **H1:** "Thank you, Priya! Your art is on its way." MR: **"धन्यवाद! तुमची कला लवकरच तुमच्याकडे येईल"**.
   - "Order #ART-10482 · Confirmation sent to priya@… and WhatsApp".
2. **Note from the artist:** a POR thumbnail (64px circle) and "I'll pack this myself and send you a photo before it ships. — Siddesh Mokashi".
3. **Status timeline:** Placed ✓ → Packed → Shipped → Delivered, horizontal on desktop and vertical on mobile. Shipped shows the courier and AWB link once available.
4. **Details:** 2 columns on desktop, stacked on mobile.
   - Left: items.
   - Right: delivery address, estimated date, payment method ("UPI · Paid" or "COD · ₹8,349 due on delivery"), and "Download invoice (PDF)".
5. **Digital downloads:** file rows with a download button (5 downloads, expires in 30 days).
6. **Guest prompt:** "Track this order and check out faster next time." with "Create my account". The checkout phone is pre-filled, so only the OTP is needed (see `02-courses-accounts-admin.md` §4).
7. **Next paths:** 2 cards. "Planning a celebration? Book event rangoli" and "Learn the strokes I used — courses".
- **Error / not found:** "I can't find that order. Check the link in your email, or message me." Shown when the order ID doesn't match, with access protected by an email or phone token.

---

## 8. Artwork gallery `/artwork`
**Purpose:** the portfolio; build trust and spark enquiries. **Primary action:** open a piece, then Buy / Enquire.

1. **Banner**
   - **H1:** "Everything I've made — sold, kept and still waiting". MR: **"माझ्या हातून घडलेली प्रत्येक कलाकृती"**.
   - Intro: "Some of these live in homes across India now. Some I couldn't part with. Tap any piece to hear its story."
2. **Filter tabs:** All, Drawings, Paintings, Rangoli, Festival Specials, Commissions.
   - They act as a sticky (below the header) `role="tablist"`, scrollable with fade edges on mobile.
   - The URL is `?tab=`.
3. **Masonry:** 4 columns on desktop (24px gaps) and 2 on mobile (12px).
   - ART and RNG images at their natural ratios with a mat. Lazy-loaded with a blur-up placeholder.
   - **Hover (desktop):** a caption slides up with title, year and a "For sale" label (leaf text plus icon) or "Private collection".
   - **Loading:** "Load more" button plus infinite load on scroll (with a fallback button).
4. **Lightbox**
   - Fullscreen on a charcoal 95% background.
   - **Desktop:** image in 8 columns, an info panel in 4 columns on surface.
   - **Info panel:**
     - Title (H2), year, medium and size.
     - "The story" in 3–5 sentences.
     - CTAs:
       - **For sale:** primary "Buy this piece — ₹12,000".
       - **Prints only:** "Buy a print from ₹1,200".
       - **Not for sale:** "Commission something like this", which opens the WhatsApp prefill.
   - Prev/next buttons (56px), ←/→ keys, swipe on mobile, and a "3 / 64" counter. Esc closes it and focus returns to the tile.
   - **Mobile:** the image fills the top, and the info sits in a draggable bottom sheet (peek height 120px).
5. **Rangoli Through the Festivals:** 4 large tiles (3:4 RNG) linking to `/festivals/*`. Heading "Rangoli through the festivals". MR: "सणांमधील रांगोळी".
6. **Process section**
   - **Heading:** "How a rangoli comes alive".
   - **Desktop:** a 5-step horizontal stepper. Each step is a 1:1 PRC photo with a step number and caption, for example:
     1. "Dotting the grid"
     2. "First outlines in white"
     3. "Filling the colour"
     4. "Fine detail with a cone"
     5. "Diyas lit"
   - Below it, a time-lapse video (16:9) with a poster image. It never autoplays with sound; captions are included.
   - A tab switch offers "Rangoli / Charcoal portrait", which gives a second set of PRC steps.
   - **Mobile:** the steps are a swipe carousel with buttons.
7. **Closing CTA band:** "Love something here? I can make one just for you." Secondary buttons "Custom Portraits" and "Book an Event".

---

## 9. Festival page `/festivals/[festival]` (diwali, ganesh-chaturthi, gudi-padwa, weddings)
**Purpose:** rank for festival searches and convert to bookings and sales. **Primary action:** "Book my [festival] rangoli".

1. **Hero**
   - RNG at 2:1 on desktop and 4:5 on mobile. Corner ornaments in kumkum at 16%, plus kolam at 6%.
   - **H1 (EN with MR always shown):**
     - "Diwali Rangoli" / **"दिवाळीची रांगोळी"**
     - "Ganesh Chaturthi Rangoli" / **"गणेशोत्सवाची रांगोळी"**
     - "Gudi Padwa Rangoli" / **"गुढीपाडव्याची रांगोळी"**
     - "Wedding Rangoli" / **"लग्नसोहळ्याची रांगोळी"**
   - Sub for Diwali: "Five nights of light deserve a doorstep that glows. Here's what I've drawn for homes and societies over the years."
   - **Button:** primary "Book my Diwali rangoli".
2. **Date and deadline callout:** a marigold-tinted card with an icon. "Diwali 2026 falls on 8 Nov. Event bookings close 1 Nov; last shop dispatch 2 Nov."
3. **Design gallery:** a 3-column masonry of RNG images with captions (style · size · place). It opens the shared lightbox.
4. **Styles explained:** 4 cards (Sanskar Bharti, Dot, Flower, Poster colour), each with a 1:1 RNG image and 2 lines of text.
5. **Shop for the festival:** 4 product cards (stencils, printable patterns, festive prints) plus "See all festive pieces →".
6. **Learn it yourself:** a course card for this festival (e.g. "Festival Rangoli Designs").
7. **Event photos:** 3 EVT images at 3:2 with captions and one testimonial.
8. **FAQ:** an accordion with 5–6 questions (FAQPage structured data).
9. **Other festivals:** a row of 3 tiles.

---

## 10. Book an Event `/book-event`
**Purpose:** the main revenue path. **Primary action:** submit the enquiry, then continue on WhatsApp.

1. **Hero**
   - **Desktop:** EVT image in a 2-column split (columns 1–6 text, columns 7–12 a 4:5 image of the artist at a venue).
   - **H1:** "Let me colour your celebration". MR: **"तुमच्या सोहळ्याला माझ्या रांगोळीचे रंग"**.
   - Sub: "Weddings, festivals, housewarmings, naming ceremonies and corporate events across Maharashtra. Tell me the date — I'll reply within 4 hours."
   - **Button:** primary "Check my date", which scrolls to the form.
   - Trust row: "450+ events · 4.9★ on Google · Since 2012".
2. **Event types with starting prices**
   - 5 cards: 3 columns on desktop (wrapping 3+2), a single column on mobile.
   - Each card: 3:2 EVT image, title, "from ₹X", 2-line description, and a tertiary "Enquire →" that pre-selects the type in the form.
   - **Cards and prices:**
     - Wedding & sangeet, from ₹8,000
     - Festival & society, from ₹4,500
     - Corporate & office, from ₹12,000
     - Housewarming & naming, from ₹3,500
     - School & corporate workshops, from ₹6,000
3. **How it works:** 4 numbered steps with icons, a horizontal connector line on desktop and vertical on mobile.
   1. "Tell me about your event"
   2. "We chat on WhatsApp — design, size, colours"
   3. "Confirm with a 30% advance (secure payment link)"
   4. "I arrive early and draw"
4. **Gallery:** a 3-column grid (6 EVT and RNG images) with captions ("Wedding, Nashik · 12×8 ft · 6 hours") and a lightbox.
5. **Enquiry form**
   - A surface card with corner ornaments. Max width 720px on desktop, full width on mobile.
   - **Heading:** "Tell me about your event".
   - **Fields:**
     - Event type (radio chips).
     - Event date (native date picker; past dates blocked).
     - City.
     - Venue (Home / Society / Hall / Office / Outdoor).
     - Approx. size ("Not sure" is allowed; options: up to 4×4 ft, 6×6 ft, 10×10 ft, larger).
     - Style preference (multi-select chips: Sanskar Bharti, Flower, Dot, Portrait rangoli, Theme/logo).
     - Budget range (select).
     - Name.
     - WhatsApp number (+91).
     - Email (optional).
     - "Anything else?" (textarea).
     - Two separate, unticked consent boxes for marketing.
     - A honeypot field, hidden.
   - **Button:** primary "Send my enquiry".
   - **States:**
     - **Submitting:** spinner.
     - **Error:** field-level messages plus a summary.
     - **Rate limit:** "Too many tries — please message me on WhatsApp."
     - **Success:** the card swaps to: "Thank you, Priya! I've got your details." Then primary **"Continue on WhatsApp"**, which opens wa.me with a prefilled summary ("Hi! Wedding rangoli · 14 Dec · Nashik · ~10×10 ft…"). Then the line "Or wait — I'll reply within 4 hours."
6. **Testimonials:** 3 cards.
7. **FAQ:** travel charges, materials, cancellation (links to /policies/event-cancellation), GST invoice for companies, time needed.
- **Mobile:** a sticky bottom bar with the primary "Check my date" shows until the form is in view. The FAB is hidden.

---

## 11. Custom Portrait `/custom-portrait`
**Purpose:** the second revenue path. **Primary action:** "Start my portrait" (enquiry, then WhatsApp).

1. **Hero**
   - A before/after slider (photo → finished POR-style commission ART), 1:1, in columns 1–6. It has accessible buttons.
   - **H1:** "Your photo, drawn by hand". MR: **"तुमचा फोटो, माझ्या हाताने रेखाटलेला"**.
   - Sub: "A gift that people keep for life. Pencil, charcoal or colour — every line drawn by me, never traced or printed."
   - **Button:** primary "Start my portrait".
2. **Price table**
   - Rows are mediums: Pencil, Charcoal, Colour (watercolour/acrylic). Columns are sizes A4, A3, A2.
   - The cells show prices, plus a note: "+40% per extra face · framing optional".
   - **Mobile:** medium tabs, each showing a 3-row size list.
3. **Turnaround:** "10–14 days + shipping · Rush in 5 days (+30%)", with a calendar icon.
4. **How it works:** 4 steps.
   1. "Send your details"
   2. "Share photos on WhatsApp"
   3. "Pay 50% advance via secure link"
   4. "Approve a preview photo, then I ship"
5. **Photo tips:** a 2-column layout of good and bad examples (✓ / ✗ icons with text, not colour alone): "Natural light, eyes visible, phone camera is fine."
6. **Gallery of past commissions:** a 4-column masonry of ART with occasion captions ("50th anniversary, charcoal, A3").
7. **Enquiry form**
   - **Fields:**
     - Medium.
     - Size.
     - Number of faces (stepper).
     - Occasion and needed-by date.
     - Framing (yes/no).
     - Name.
     - WhatsApp.
     - Email.
     - Notes.
   - **No photo upload.** In its place, a note: "You'll send photos on WhatsApp after this step."
   - A live estimate pill updates as fields change: "Estimated ₹5,200".
   - **Success:** primary "Continue on WhatsApp", with the prefilled summary and estimate.
8. **FAQ:** revisions, deposit policy (links to /policies/commission-advance), shipping a framed piece.

---

## 12. About `/about`
**Purpose:** personal connection. **Primary action:** "Work with me" (goes to the paths).

1. **Hero**
   - POR at 4:5 in columns 1–5, inside a decorative rangoli frame: an SVG mandala border drawn around a 16px mat, plus corner ornaments.
   - **H1:** "Hello, I'm Siddesh Mokashi". MR: **"नमस्कार, मी सिद्धेश मोकाशी"**.
   - Lead: "I'm a self-taught-then-trained artist from [City]. I draw people, paint moods, and fill doorsteps with colour."
2. **Story:** a 2-column layout. The story text is in Tiro-headed paragraphs, max 640px wide. One PRC image (artist working) floats alongside.
   - Sub-headings: "Where it began" · "What I learned" · "Why rangoli still matters to me".
3. **Timeline**
   - A vertical centre line on desktop with alternating cards, and a single left line on mobile.
   - Each card: year (marigold dot plus charcoal text), title, one line, and an optional 3:2 photo. Examples: "2014 · First solo exhibition, Pune"; "2019 · State rangoli award"; "2023 · Featured in Lokmat".
4. **Stats counters**
   - 4 across on desktop, 2×2 on mobile. Number in Tiro 48/32, label in muted.
   - Labels: "Artworks created", "Students taught", "Events decorated", "Happy customers".
   - They count up over 1.2s once on view; under reduced motion the final values show. Kolam at 6%.
5. **Workshops and events gallery:** an EVT grid of 6 (3:2), with a lightbox.
6. **Work With Me:** 3 cards (Custom portraits, Event rangoli, School & corporate workshops), each with an image, 2 lines and a tertiary link.
   - Then the band's single primary **"Work with me"**, which goes to /contact with an enquiry type.
7. **Short testimonial quote:** one large quote in Tiro 28px.

---

## 13. Contact `/contact`
**Purpose:** reach the artist. **Primary action:** "Send message".

- **H1:** "Let's talk". MR: **"चला, बोलूया"**.
- Sub: "WhatsApp is fastest — I reply within 4 hours, 9 am–8 pm."

1. **Two columns**
   - **Columns 1–7: form.**
     - Name, phone, email.
     - Enquiry type (select: General, Custom portrait, Event rangoli, Workshop, Order help, Press). Choosing portrait or event shows "For faster quotes use the full form →".
     - Message.
     - Consent checkboxes, unticked.
     - Honeypot field.
     - Primary "Send message".
     - **Success:** "Got it — I'll write back soon." plus a WhatsApp link.
   - **Columns 8–12: details card** (with corner ornament).
     - WhatsApp button (secondary), phone, email, studio address, hours, social icons.
     - Grievance officer name and email (for compliance).
2. **Google Map:** a full-width embed, 400px tall on desktop and 280px on mobile. It shows as a click-to-load placeholder ("Show map") until consent is given, and has an "Open in Google Maps" link.
- **Mobile:** stacked, with the details card first (quick tap-to-call).

---

## 14. Search results `/search?q=`
**Purpose:** find anything. **Primary action:** open a result.

1. **Search bar:** 56px tall, prefilled with the query, with a "Search" secondary button.
2. **H1:** "Results for 'ganesh'" with a count, e.g. "18 found". MR for the empty-query headline: "तुम्ही काय शोधताय?"
3. **Tabs:** All · Shop (9) · Artwork (6) · Festivals (2) · Courses (1).
4. **All tab:** grouped sections, each showing up to 4 items plus "See all 9 →". Shop items are product cards, Artwork items are gallery tiles, Festivals and Pages are list rows.
5. **Single tab:** the same grid as the shop, with sort.
6. **No results:** "I couldn't find 'xyz'." Then suggestion chips, the category tiles, and "Or describe it to me on WhatsApp".
- **Mobile:** tabs scroll horizontally, and the grid is 2 columns.

---

## 15. Wishlist `/wishlist`
**Purpose:** come back and buy. **Primary action:** "Move to cart" (secondary per card).

- **H1:** "Pieces you loved". MR: **"तुम्हाला आवडलेल्या कलाकृती"**.
- **Guest note banner:** "Saved on this device. Sign in to keep them everywhere." with a tertiary link. Guest data is local and merges on login.
- **Grid:** product cards, 4 columns on desktop and 2 on mobile. The heart is filled; tapping it removes the item with an "Undo" toast (5s).
- **Card button:** "Move to cart".
- **Sold item:** the "Sold" badge, plus "Commission something similar →".
- **Price drop:** a "Now ₹X" leaf text label plus an icon.
- **Toolbar:** "Share my wishlist" (copies a read-only link; toast "Link copied") and "Add all available to cart".
- **Empty:** "Nothing saved yet. Tap the ♡ on any piece to keep it here." Secondary button "Browse the shop".

---

## 16. Policies `/policies/[slug]`
**Slugs:** shipping, returns, privacy, terms, commission-advance, event-cancellation, digital-products, grievance.

- **Desktop:** a sticky table of contents (3 columns, listing the H2s) plus content (7 columns, max 720px, body 18px).
- **Mobile:** an "On this page ▾" collapsible at the top.
- **H1** examples:
  - "Shipping policy" / MR **"शिपिंग धोरण"**
  - "Returns & refunds" / **"परतावा धोरण"**
  - "Privacy" / **"गोपनीयता धोरण"**
  - "Terms" / **"अटी व शर्ती"**
- Show "Last updated 19 Oct 2026" under the H1.
- Plain-language summary box at the top (paper-tinted, with an icon): "In short: prints can be returned within 7 days; originals within 3 days if damaged; digital files can't be refunded once downloaded."
- Tables for shipping zones, times and charges.
- At the bottom: "Questions? Message me" (a tertiary WhatsApp link). There is no primary button.

---

## 17. 404
**Purpose:** recover the visitor.

- Centred layout with a 200px rangoli that self-draws but is "unfinished" (a missing petal). Corner ornaments at 14%, kolam at 4%.
- **H1:** "This page wandered off the canvas". MR: **"हे पान कॅनव्हासबाहेर गेलं"**.
- Copy: "The link may be old, or I may have moved things around the studio."
- Search input, primary "Back to home", and tertiary links: Shop · Artwork · Book an Event · Custom Portraits.
- **Mobile:** the same layout, stacked and full width.

---

## 18. Reference photo usage

| Photo type | Where used | Ratio / treatment |
|---|---|---|
| **ART** (drawings, paintings) | Hero (option), category tiles, product cards and gallery, wall mock-ups, artwork masonry and lightbox, custom-portrait results and before/after, shop mega-menu tile, search thumbnails, wishlist, cart and order lines | Uncropped inside a mat; 4:5 card containers; natural ratio in masonry |
| **RNG** (rangoli) | Home hero (default for festive skin), Rangoli category tile, festival heroes and galleries, styles cards, artwork festival tiles, drawer path card, Instagram grid | 2:1 hero, 3:4 tiles, 1:1 style cards; never under text without a gradient |
| **EVT** (events, venues, people) | Home event band, Book an Event hero, type cards and gallery, festival "event photos", About workshop gallery, testimonials context | 3:2 with captions (event · place · size) |
| **POR** (artist portrait) | Home Meet the Artist, About hero in the rangoli frame, order-confirmation note, product "for scale" shot, drawer optional | 4:5 framed; 64px circle in notes |
| **PRC** (process steps, time-lapse) | Artwork process section, product story block, About story image, festival "learn it" support, course teaser poster | 1:1 steps; 16:9 video poster |

**Alt text and filenames**
- Every ART and RNG image carries artist-written alt text and a descriptive filename.
- Ornaments, kolam, dividers and wall-mock-up backgrounds use `alt=""`.
- A low-opacity watermark goes on full-size ART in the lightbox and zoom only, not on cards.
