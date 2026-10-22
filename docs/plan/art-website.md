# Art Website — Brief & Plan

## Brief (verbatim)

ROLE
You are a senior UI/UX designer and front-end developer. Design and build a complete, responsive e-commerce + learning website for an Indian artist.

ARTIST & BRAND
- Artist name: Siddesh Mokashi
- Brand name / logo text: [Brand Name]
- Art forms: pencil & charcoal drawings, colour paintings, rangoli designs (traditional, festive, sanskar bharti, dot, flower, poster-colour rangoli), custom portraits, and art courses
- Location: [City, Maharashtra, India]
- Audience: art lovers, gift buyers, festival/event clients, students and hobbyists who want to learn drawing and rangoli
- Use the attached reference photos as the primary visual source: pull the colour palette, textures and mood from them, and use them as artwork and product images.

DESIGN DIRECTION
- Mood: handmade, warm, vibrant, festive yet premium and uncluttered. It should feel like an art gallery, not a generic online store.
- Colour palette: derived from the reference photos; suggested base of warm off-white / paper texture background, with rangoli accents in deep marigold, kumkum red, peacock blue, turmeric yellow and leaf green. Charcoal black for text.
- Typography: an elegant serif or hand-lettered display font for headings (e.g. Playfair Display / Yatra One for a Devanagari touch), clean sans-serif for body text (e.g. Poppins / Mukta).
- Decorative elements: subtle rangoli mandala motifs as section dividers, corner ornaments and loading animations; dotted kolam-style patterns as background accents (low opacity, never distracting from the art).
- Imagery: large, high-quality artwork images with generous whitespace; soft shadows like framed art on a wall.
- Micro-interactions: gentle hover zoom on artwork, a rangoli pattern that "draws itself" on page load, smooth scroll reveal animations.
- Optional language toggle: English / मराठी / हिंदी.

GLOBAL ELEMENTS (all pages)
- Header: logo left; menu (Home, Shop, Artwork, Courses, About, Contact); icons for search, wishlist, account, cart with item count.
- Mobile header: logo centre, hamburger menu left, cart right; slide-in menu drawer with rangoli-pattern background.
- Footer: short brand line, quick links, contact (phone, email, WhatsApp), Instagram/YouTube/Facebook icons, newsletter signup, policies (shipping, returns, privacy, terms), payment icons (UPI, Razorpay, cards).
- Floating WhatsApp button for enquiries and custom orders.
- Prices in ₹ INR.

PAGE 1 — HOME
1. Hero section: full-width slider or single hero image of a signature artwork/rangoli, headline (e.g. "Art That Brings Colour to Every Celebration"), sub-text, two buttons: "Shop Art" and "Learn With Me".
2. Category tiles: Drawings, Paintings, Rangoli Designs, Custom Portraits, Courses — each with an image and hover effect.
3. Featured / bestseller artworks: horizontal carousel of product cards.
4. "Meet the Artist" strip: artist photo, 2–3 line intro, "Read My Story" button.
5. Featured course: video thumbnail with play icon, course title, price, "Enroll Now".
6. Custom order / event rangoli section: "Book rangoli for weddings, festivals and corporate events" with enquiry button.
7. Testimonials: customer and student reviews with photos and star ratings.
8. Instagram feed grid (6 images).
9. Newsletter signup with festive offers message.

PAGE 2 — SHOP
- Page banner with title and breadcrumb.
- Left sidebar filters (desktop) / bottom-sheet filter button (mobile): category, medium (pencil, charcoal, acrylic, watercolour, rangoli colours), size, price range, availability (original / print / digital download).
- Sort by: newest, price low–high, high–low, popularity.
- Product grid: 3–4 columns desktop, 2 columns mobile.
- Product card: image, title, medium, size, price, wishlist heart, "Add to Cart" button, badges like "Original", "Print", "Sold Out", "New".
- Product detail page: image gallery with zoom, title, price, description, medium, dimensions, framing option, quantity, Add to Cart / Buy Now, delivery pincode check, shipping & return info, "You may also like" section.
- Cart and checkout: cart drawer, address form, UPI / cards / net banking / COD options, order summary.

PAGE 3 — ARTWORK (Portfolio / Gallery)
- Masonry gallery layout of all artworks (including not-for-sale pieces).
- Filter tabs: All, Drawings, Paintings, Rangoli, Festival Specials, Commissions.
- Click to open fullscreen lightbox with title, year, medium, short story behind the artwork, and a "Buy / Enquire" link if available.
- Optional section: "Rangoli Through the Festivals" — Diwali, Ganesh Chaturthi, Gudi Padwa, weddings.
- Process section: time-lapse or step photos showing how a rangoli/drawing is made.

PAGE 4 — COURSES (E-content videos)
- Banner: "Learn Drawing & Rangoli From Home".
- Course cards: thumbnail, title, level (Beginner / Intermediate / Advanced), number of lessons, duration, language, price or "Free", rating, "Enroll" button.
- Course categories: Pencil Sketching Basics, Portrait Drawing, Rangoli for Beginners, Festival Rangoli Designs, Kids Art.
- Course detail page: intro video preview, what you'll learn, lesson list (curriculum accordion with locked/unlocked lessons), materials needed, instructor info, reviews, FAQ, enroll/buy button.
- Student dashboard (after login): "My Courses", progress bar per course, continue watching, downloadable practice sheets (PDF), certificate download on completion.
- Video player: clean player with lesson sidebar, next/previous lesson buttons, notes/resources tab; videos protected from direct download.
- Free sample lesson section to attract new learners.

PAGE 5 — ABOUT
- Artist portrait photo with a decorative rangoli frame.
- Artist story: journey, inspiration, training, years of experience.
- Timeline of milestones: exhibitions, awards, workshops, media features.
- Stats counters: artworks created, students taught, events decorated, happy customers.
- Workshop / event photo gallery.
- "Work With Me" section: custom portraits, event rangoli, school/corporate workshops, with contact button.
- Contact form: name, phone, email, enquiry type, message; Google Map embed.

RESPONSIVE REQUIREMENTS
- Provide both desktop (1440px) and mobile (390px) layouts for every page.
- Mobile-first: touch-friendly buttons (min 44px), swipeable carousels, sticky "Add to Cart" bar on product pages, bottom-sheet filters, single-column course lessons.
- Images lazy-loaded and optimised for fast loading on mobile data.

TECHNICAL & FEATURES
- Suggested stack: [choose one: Shopify / WooCommerce + LearnDash / Next.js + Tailwind + Razorpay].
- Payment gateway: Razorpay (UPI, cards, net banking, wallets).
- User accounts for both shoppers and students.
- SEO-friendly page titles and alt text for every artwork image.
- Accessibility: good colour contrast, readable font sizes, keyboard navigation.

OUTPUT REQUIRED
1. Desktop and mobile design for each of the 5 pages (plus product detail, course detail and cart/checkout).
2. A style guide: colours with hex codes, fonts, buttons, cards, icons, spacing.
3. Placeholder text written in a warm, personal artist voice (English, optionally Marathi).
4. Use the attached reference photos in place of placeholders wherever they fit.

## Orchestration steps

### Step 1 — Choose stack and design architecture
Covers TECHNICAL & FEATURES: pick the stack, routing, data model, auth, Razorpay and video-hosting approach.

### Step 2 — Build style guide and design tokens
Covers DESIGN DIRECTION + OUTPUT REQUIRED #2.

### Step 3 — Build global layout
Covers GLOBAL ELEMENTS.

### Step 4 — Build Home page
Covers PAGE 1.

### Step 5 — Build Shop listing
Covers PAGE 2 banner, filters, sort, grid, product card.

### Step 6 — Build Product detail page
Covers PAGE 2 product detail.

### Step 7 — Build Cart and Razorpay checkout
Covers PAGE 2 cart and checkout.

### Step 8 — Build Artwork gallery
Covers PAGE 3.

### Step 9 — Build Courses listing and course detail
Covers PAGE 4 banner, cards, categories, detail page, free sample.

### Step 10 — Add shopper and student accounts
Covers TECHNICAL & FEATURES user accounts.

### Step 11 — Build Student dashboard and protected video player
Covers PAGE 4 dashboard and video player.

### Step 12 — Build About page and contact form
Covers PAGE 5.

### Step 13 — Test responsive, accessibility and SEO
Covers RESPONSIVE REQUIREMENTS + SEO/accessibility items.
