> Where this file conflicts with `00-decisions.md`, `00-decisions.md` wins.

# Component Library Spec — Art Website (Next.js + Tailwind, EN / मराठी / हिंदी)

Scope note: built per the original brief (`docs/plan/art-website.md`) — every feature as a custom, fully working Next.js + Tailwind build — using the design tokens and UX/accessibility rules from `docs/plan/brainstorm.md` §5 and §7. The brainstorm's Shopify/phasing recommendation is not applied here; only its token values and accessibility rules are reused, since the owner has already decided on a custom trilingual build.

Conventions used throughout, to avoid repeating boilerplate per component:
- Default interactive control height is **48px** (matches the 48px spacing step and the 44×44px minimum target size rule with headroom).
- Hover = base colour at **90% opacity**, active/pressed = **80%**, disabled = **40%** opacity on fill with `muted` text, loading = fill unchanged + inline spinner, replacing label text with `aria-busy="true"` on the control.
- Focus ring (all focusable elements): **2px solid `peacock`, 2px outline-offset**, applied only via `:focus-visible` (never on mouse `:focus`), never `outline: none` without a replacement. This is the single focus-ring spec referenced as "Tokens: focus ring" below, so it isn't restated in every entry.
- Radius: `radius-ui` 6px (buttons/inputs/cards/badges/chips), `radius-none` 0px (artwork imagery, per "square corners"), `radius-full` 9999px (avatars, dots, stepper circular buttons, progress ring), `radius-sheet` 20px top corners only (bottom sheets/drawers — added because a 6px UI radius reads flat on a full-height sheet; everything else reuses the 2 radii the brainstorm specifies).
- `lang="mr"` / `lang="hi"` is set on any wrapping element containing Marathi/Hindi text so the Devanagari line-height override (§ Foundations → Type) and browser hyphenation/font-fallback apply automatically — this is cheaper than per-component Devanagari variants.

---

## 0. Foundations

### 0.1 Colour tokens

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `paper` | #FAF6EF | page background | — |
| `surface` | #FFFFFF | cards, drawers, inputs | — |
| `charcoal` | #1E1B18 | text, secondary buttons | 15.91 on paper |
| `muted` | #5F574F | metadata, placeholders, disabled text | 6.58 |
| `border` | #857B70 | input borders, dividers | 3.85 (UI, non-text) |
| `kumkum` | #A6261D | primary button, "Sold" badge, error text/icons | white-on-it 7.20 |
| `peacock` | #0B5E73 | links, focus ring, selected state | 6.81 |
| `marigold` | #E8890C | festive badge **fill only**, paired with charcoal text | never as text (2.43) |
| `turmeric` | #F2B705 | decoration only (dividers, loader stroke) | never as text (1.69) |
| `leaf` | #2E6B3C | success, "Available" | 5.94 |

Derived, functional-only tokens (not new hues — reuse the above with Tailwind's opacity modifier so no extra hex values are needed):
- `overlay`: `charcoal/60` (modal/lightbox backdrop), `charcoal/40` (drawer/sheet backdrop).
- `skeleton`: `border/20` base, `border/35` shimmer band.
- `divider-hairline`: `border/25` (1px rule for dropdowns, accordion rows, table rows).

**Dark-mode decision:** **No dark mode at launch.** The brief never requests it, the gallery mood depends on a warm paper background regardless of OS theme, and a second full palette doubles the token/contrast-audit surface for a solo-maintained site. We still avoid a refactor later: every colour is a CSS custom property (`--color-paper`, etc.) consumed by the Tailwind config rather than hard-coded hexes, so a `dark:` theme is a token swap, not a rewrite, if ever requested. Ship `<meta name="theme-color" content="#FAF6EF">` so mobile browser chrome matches instead of flashing white/black.

### 0.2 Type scale

Fonts: headings **Tiro Devanagari Marathi** (Martel for a bold-weight fallback), body **Mukta**. Both have first-class Devanagari + Latin glyphs, avoiding a font-per-language switch.

| Role | Desktop | Mobile | Latin line-height | Devanagari (`lang="mr"`/`"hi"`) line-height |
|---|---|---|---|---|
| Display | 64px | 40px | 1.1 | 1.3 |
| H1 | 48px | 32px | 1.15 | 1.35 |
| H2 | 36px | 26px | 1.2 | 1.4 |
| H3 | 24px | 20px | 1.25 | 1.45 |
| Body | 18px | 16px | 1.6 | 1.75 |
| Caption / metadata | 14px | 13px | 1.5 | 1.65 |
| Label (forms, chips) | 14px | 14px | 1.4 | 1.55 |

Reasoning for the extra heading line-heights (beyond the brief's body-only 1.6/1.75): Devanagari matras and reph marks clip at tight Latin heading line-heights, which the brief doesn't call out but WCAG 1.4.12 (Text Spacing) and plain legibility require once headings render in मराठी/हिंदी.

### 0.3 Spacing & grid

Spacing steps required: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px. **These map 1:1 onto Tailwind's default spacing scale** (`1,2,3,4,6,8,12,16,24,32`) — no custom spacing config needed (rung 4: native feature already covers it).

- Grid: 12 columns, 1200px container, on desktop; 4 columns, 20px margins, on mobile (20px = Tailwind's default `5` step, also already native).
- Breakpoints (Tailwind defaults, unmodified): `sm`640 `md`768 `lg`1024 `xl`1280 `2xl`1536. `lg` (1024) is the behaviour switch point (sidebar↔bottom-sheet, dropdown↔drawer); `xl` (1280) caps the content container at 1200px.

### 0.4 Elevation (shadow)

| Token | Use | Value |
|---|---|---|
| `shadow-xs` | resting card | `0 1px 2px rgb(30 27 24 / .05)` |
| `shadow-sm` | card hover lift, chip | `0 4px 12px rgb(30 27 24 / .08)` |
| `shadow-md` | dropdown, popover, toast | `0 8px 24px rgb(30 27 24 / .10)` |
| `shadow-lg` | drawer, modal, bottom sheet | `0 16px 48px rgb(30 27 24 / .16)` |
| `shadow-frame` | framed-art mat (product/gallery images) | `0 12px 28px rgb(30 27 24 / .18), 0 2px 6px rgb(230 160 10 / .08)` — a warm secondary shadow layer so the image reads like it's lit, not just dropped |

### 0.5 Z-index scale

`base 0` · `dropdown 20` · `sticky-header 30` · `fab 45` · `overlay-backdrop 40` · `drawer 50` · `modal 60` · `popover 65` · `toast 70` · `tooltip 80` · `skip-link 100` (always wins when focused, since it must appear above a sticky header).

### 0.6 Icon set

**Lucide** (MIT, `lucide-react`). Rationale: stroke-based line icons echo the rangoli linework mood instead of competing with it, tree-shakeable per-icon imports keep JS weight down (brainstorm §7 rule 14: JS under 150KB gzipped), and it ships as React components so no icon-font layout-shift/accessibility workaround is needed. Stroke width `1.75`, sizes `16 / 20 / 24 / 32`. Every icon used alone in a control gets `aria-hidden="true"` with the accessible name carried by the control's `aria-label` or visible text — never the icon itself.

### 0.7 Focus ring

`2px solid peacock`, `2px outline-offset`, `:focus-visible` only. On a `kumkum`-filled button the offset gap exposes the surrounding `paper`/`surface` colour, so the ring's 3:1 contrast (peacock vs paper = 6.81) is measured against neutral, not against the button fill — satisfying SC 2.4.11/2.4.13 without a second ring colour for coloured buttons.

---

## 1. Decorative

### Rangoli mandala divider
- **Purpose:** Section separator that signals "gallery," not a generic `<hr>`.
- **Anatomy:** Inline SVG, symmetrical radial line pattern, horizontal rule implied by viewBox aspect (e.g. 240×24).
- **Variants:** `thin` (default, single colour stroke), `festive` (adds `marigold`/`turmeric` accent dots, seasonal skin only).
- **Sizes:** `sm` (mobile, 160px wide) / `lg` (desktop, 240–320px wide), both centred.
- **States:** Static only — no hover/focus/disabled/etc. (purely decorative, not interactive).
- **Desktop vs mobile:** Same SVG scaled by container width; mobile drops the outer two rings of the mandala to avoid muddiness at small size.
- **Keyboard:** Not focusable.
- **ARIA:** `role="presentation"` / `aria-hidden="true"` — it carries no information a screen reader user needs, so it must be invisible to AT per §7 rule 10 ("decorative images use `alt=\"\"`").
- **Motion:** None by default (static stroke). If used as a scroll-reveal element, a single opacity/translate-Y fade-in (see §Media), fully skipped under `prefers-reduced-motion: reduce`.
- **Tokens:** stroke `peacock` or `kumkum` at 40% opacity, `turmeric`/`marigold` dot accents (festive variant only), spacing `32`/`48` vertical margin.

### Corner ornament
- **Purpose:** Frames hero/portrait imagery (About page artist portrait, brief: "decorative rangoli frame") without boxing the photo in a heavy border.
- **Anatomy:** 4 absolutely-positioned SVG corner marks layered over an image container.
- **Variants:** `single-line` (default), `double-line` (About hero only, slightly busier).
- **Sizes:** scales with container via `%`-based `width`/`height`, not fixed px, so it survives the 400% reflow requirement.
- **States:** Static.
- **Desktop vs mobile:** Same markup; ornament scale is clamped (`clamp()`) so it doesn't overwhelm a narrow mobile portrait crop.
- **Keyboard:** Not focusable.
- **ARIA:** `aria-hidden="true"`.
- **Motion:** None.
- **Tokens:** stroke `kumkum` or `peacock`, `radius-none` (no rounding — it's linework, not a shape).

### Kolam dot background
- **Purpose:** Low-opacity ambient texture behind hero/section backgrounds (brief: "never distracting from the art").
- **Anatomy:** CSS `background-image` radial-gradient dot grid (not SVG-per-dot, to keep payload near zero) tiled via `background-repeat`.
- **Variants:** `paper-tint` (default, `border` colour dots), `festive-tint` (adds a faint `marigold` dot every 4th position, seasonal skin).
- **Sizes:** dot spacing 24px mobile / 32px desktop (spacing-scale tokens, not new values).
- **States:** Static.
- **Desktop vs mobile:** Density only change above; never placed directly behind body text (contrast risk), only behind imagery/cards.
- **Keyboard / ARIA:** Pure CSS background — not in the DOM, so no `aria-hidden` needed.
- **Motion:** None (a moving background would fight §7's "never distracting from the art" rule and reduced-motion intent even if not literally an animation API).
- **Tokens:** `border` at 8–12% opacity max (enforced in code review, not just design, so it never approaches text-contrast-breaking density).

### Self-drawing rangoli loader
- **Purpose:** Branded loading state for first visit / route transitions / async data (replacing a generic spinner), per brief "a rangoli pattern that draws itself on page load."
- **Anatomy:** Inline SVG mandala path(s) animated via `stroke-dasharray`/`stroke-dashoffset` from 0% to 100% length, optional second pass filling with `turmeric`/`marigold`.
- **Variants:** `full` (first-visit splash, runs once — `sessionStorage` flag prevents repeat), `inline` (small, reusable loading spinner for buttons/async panels).
- **Sizes:** `full` 120–200px, `inline` 24/32px (matches icon sizes).
- **States:** `running` → `complete` (holds final drawn frame 300ms, then fades the overlay) · `reduced-motion` (see Motion).
- **Desktop vs mobile:** `full` variant is skipped entirely on mobile if it would delay first contentful paint beyond ~1s on slow data (§7 rule 13/14 performance budget) — degrade to the `inline` variant.
- **Keyboard:** Not focusable; if it blocks interaction (full-screen splash) it must auto-dismiss on a timer or on load-complete, never requiring a key/click to proceed (no trap).
- **ARIA:** `role="status" aria-live="polite"` with a visually-hidden `<span>Loading art…</span>` for the actual data-loading case; `aria-hidden="true"` for the purely decorative one-time splash (nothing is "loading" from the user's task perspective if content is already in the DOM).
- **Motion:** `prefers-reduced-motion: reduce` → skip the stroke-draw animation entirely, render the path already fully drawn/static plus a simple opacity fade, per brainstorm §5 ("all of it is turned off under prefers-reduced-motion").
- **Tokens:** stroke `peacock`/`kumkum`, fill accent `turmeric`, duration ~900ms ease-out (full), ~700ms linear loop (inline).

### Framed-art mat + shadow
- **Purpose:** Every artwork image (product card, gallery, lightbox, course thumbnail) reads as "art on a wall," per brief.
- **Anatomy:** Image wrapped in a container with a 12px white (`surface`) mat/padding, `radius-none` corners, `shadow-frame`.
- **Variants:** `card` (mat only, smaller shadow — list contexts), `hero` (mat + full `shadow-frame`, single prominent artwork), `flush` (no mat, used only inside the lightbox where the image itself is the full viewport).
- **Sizes:** mat is a fixed 12px regardless of breakpoint (brainstorm specifies 12px explicitly); outer image size is fully fluid/responsive.
- **States:** `default` · `hover` (parent card scale 1.03, see Motion) · `loading` (blur placeholder, see Media §Image) · `sold` (adds a diagonal/badge overlay, not a separate frame style, to keep one visual system).
- **Desktop vs mobile:** Identical structure; `hero` shadow intensity reduced ~25% on mobile so it doesn't read as muddy on small, dense screens.
- **Keyboard / ARIA:** The frame itself is non-interactive chrome; the image inside carries the real `alt` text and any click/keyboard handling belongs to the parent card/lightbox trigger, not the frame.
- **Motion:** hover zoom `scale(1.03)` over `400ms ease-out` on the image only (mat/shadow stay fixed so the "frame" doesn't warp) — `prefers-reduced-motion: reduce` disables the scale transform entirely (image stays static, only a shadow-depth change, if any, remains).
- **Tokens:** `surface` mat, `shadow-frame`, `radius-none`, motion `400ms`/`scale(1.03)`.

---

## 2. Navigation

### Header (desktop)
- **Purpose:** Primary wayfinding + cart/account/search entry, present on every page.
- **Anatomy:** Logo (left) · nav links (Home, Shop, Artwork, Courses, About, Contact) · icon cluster (search, wishlist, account, cart-with-count), sticky on scroll.
- **Variants:** `transparent-over-hero` (Home only, transitions to solid `surface` after scroll past hero), `solid` (every other page, default).
- **Sizes:** 72px tall desktop.
- **States:** `default` · `scrolled` (solid bg + `shadow-xs` appears) · `nav-link: default/hover(underline, peacock)/focus-visible/active(current page: aria-current)`.
- **Desktop vs mobile:** Full horizontal nav + icons on `lg+`; collapses to the Mobile header below under `lg`.
- **Keyboard:** Tab order = logo → nav links (left→right) → search → wishlist → account → cart. `Enter`/`Space` activates. Skip link (below) lets keyboard users bypass this entirely.
- **ARIA:** `<header>` landmark, nav wrapped in `<nav aria-label="Primary">`, current page link gets `aria-current="page"`, cart icon button has `aria-label="Cart, 3 items"` (count is part of the name, not a separate unlabelled badge).
- **Motion:** Background/shadow transition on scroll, `200ms ease` — not disabled under reduced-motion since it's a colour/opacity change, not a vestibular trigger (per WCAG 2.3.3's trigger-type distinction), but duration is still short enough to be a non-issue either way.
- **Tokens:** `surface` bg, `charcoal` text, `peacock` active/hover accent, `sticky-header` z-index, `shadow-xs`.

### Mobile header
- **Purpose:** Same nav/cart access, optimised for one-thumb reach, per brief ("logo centre, hamburger left, cart right").
- **Anatomy:** Hamburger icon-button (left) · logo (centre) · cart icon-button with count (right).
- **Variants:** None (single layout under `lg`).
- **Sizes:** 56px tall, icon-buttons 44×44px min hit area.
- **States:** `default` · hamburger `open/closed` (toggles to an "×" icon, `aria-expanded`).
- **Desktop vs mobile:** This *is* the mobile layout; swaps to desktop Header at `lg`.
- **Keyboard:** Hamburger is a real `<button>`; `Enter`/`Space` opens the drawer and moves focus into it.
- **ARIA:** Hamburger: `aria-expanded`, `aria-controls="mobile-drawer"`, `aria-label="Open menu"` (becomes "Close menu" when open — label changes with state, not just the icon).
- **Motion:** Icon morph (hamburger→×) 150ms; reduced-motion shows the swap as an instant icon change.
- **Tokens:** `surface` bg, `charcoal` icons, `kumkum` cart-count badge fill with white text (3:1+ and never colour-only — count is a number, not a colour dot).

### Mobile drawer (nav menu)
- **Purpose:** Full nav menu on mobile, per brief "slide-in menu drawer with rangoli-pattern background."
- **Anatomy:** Full-height panel sliding from left (or right — pick one and stay consistent with the language switcher's position), kolam-dot background, nav list, language switcher, close button.
- **Variants:** None.
- **Sizes:** 85% viewport width, max 360px.
- **States:** `open/closed`, each link `default/hover/focus-visible/active(current)`.
- **Desktop vs mobile:** Mobile-only; desktop uses the inline Header nav instead.
- **Keyboard:** Opening moves focus to the first focusable element (close button or first link). **Focus is trapped** inside while open (Tab/Shift+Tab cycle only within the drawer). `Esc` closes and **returns focus to the hamburger button** — this is §7 rule 5, non-negotiable.
- **ARIA:** `role="dialog" aria-modal="true" aria-label="Site menu"`, backdrop click closes it, backdrop itself is `aria-hidden` to AT (it's inert, not a separate dialog).
- **Motion:** Slide-in `300ms ease-out` + backdrop fade; reduced-motion swaps to an instant show/hide (no translate).
- **Tokens:** `surface` panel bg over kolam-dot texture, `drawer` z-index, `overlay-backdrop` (`charcoal/40`), `shadow-lg`.

### Language switcher
- **Purpose:** Toggle EN / मराठी / हिंदी, present in header (desktop) and drawer (mobile) — **not deferred**, since this build is trilingual from day one.
- **Anatomy:** 3-option segmented control or compact dropdown labelled by each language's own script ("EN · मराठी · हिंदी"), not translated into the current UI language (so a user can always find their language regardless of what's currently active).
- **Variants:** `inline-segmented` (header, room allows), `dropdown` (drawer/mobile, compact).
- **Sizes:** 48px tall control, each option min 44×44px tap target even in the compact dropdown's menu items.
- **States:** per option `default / hover / focus-visible / selected (aria-current / aria-selected) / active`.
- **Desktop vs mobile:** Segmented control desktop, dropdown/`<select>`-pattern mobile to save header width.
- **Keyboard:** Segmented control = `radiogroup` pattern, arrow keys move selection, `Enter`/`Space` confirms; dropdown = standard listbox keyboard pattern (↓/↑ to move, `Enter` to pick, `Esc` to close without changing).
- **ARIA:** `role="radiogroup" aria-label="Language"` with each option `role="radio" aria-checked`; changing language updates `<html lang>` immediately and announces via a visually-hidden `aria-live="polite"` region ("Language changed to मराठी") since the whole page's `lang` attribute changing is otherwise silent to AT.
- **Motion:** Selected-indicator slide, 150ms; reduced-motion = instant.
- **Tokens:** `peacock` selected state, `border` dividers between options, `radius-ui`.

### Breadcrumb
- **Purpose:** Orientation on Shop, Artwork, Course detail, etc. (brief: "page banner with title and breadcrumb").
- **Anatomy:** Ordered list of links with a separator glyph, current page as plain (non-link) text.
- **Variants:** `light` (on paper bg, default), `on-image` (over a banner photo — add a subtle `charcoal/40` text-shadow or scrim strip rather than inventing a new colour, to keep contrast without a new token).
- **Sizes:** Caption type scale (14/13px).
- **States:** link `default/hover(underline)/focus-visible`; current item has no interactive states (it's not a link).
- **Desktop vs mobile:** On mobile, collapse to "← Back to Shop" (last parent only) if the full chain would wrap awkwardly, rather than truncating with ellipses that lose information.
- **Keyboard:** Standard link tabbing, left→right.
- **ARIA:** `<nav aria-label="Breadcrumb"><ol>…</ol></nav>`, current page item gets `aria-current="page"`.
- **Motion:** None.
- **Tokens:** `muted` separators, `peacock` links, `charcoal` current item.

### Tabs
- **Purpose:** Filter switching without a page reload (Artwork gallery: "All, Drawings, Paintings, Rangoli, Festival Specials, Commissions"; Course categories).
- **Anatomy:** Horizontal row of tab buttons + one active underline/pill indicator + associated tabpanel.
- **Variants:** `underline` (default — matches the "90% neutral" rule, one accent line), `pill` (used only where the row sits on an image/dark band and needs a filled hit-target to read clearly).
- **Sizes:** 44px tall min (tap target rule), horizontal scroll with visible overflow fade if tabs exceed viewport width on mobile (never hidden without a scroll affordance).
- **States:** `default / hover / focus-visible / active(selected) / disabled` (e.g., a category with 0 items can be shown disabled rather than hidden, so users understand it exists but is empty).
- **Desktop vs mobile:** Mobile = horizontal swipe/scroll row; desktop = fits inline, wraps to a second row only as a last resort (prefer condensing labels first).
- **Keyboard:** Standard WAI-ARIA Tabs pattern — arrow keys (←/→) move between tabs and activate immediately (automatic activation, appropriate here since switching is cheap/local), `Home`/`End` jump to first/last, `Tab` exits the tablist into the panel.
- **ARIA:** `role="tablist"`, each tab `role="tab" aria-selected aria-controls`, panel `role="tabpanel" aria-labelledby`.
- **Motion:** Underline/pill indicator slides `200ms ease`; reduced-motion = instant position change. Panel content swap uses a quick cross-fade only, no layout-shifting animation.
- **Tokens:** `peacock` active indicator + text, `muted` inactive text, `border` hairline under the row.

### Pagination / Load more
- **Purpose:** Shop grid and Artwork gallery continuation.
- **Anatomy:** Primary pattern: a single centred "Load more" button (keeps one scannable grid, avoids page-number complexity for a 20–30 item catalogue — picking the simpler of two valid patterns per the component's actual data volume). Numbered pagination is offered as an alt variant for if/when the catalogue grows large enough that infinite "Load more" makes the footer unreachable.
- **Variants:** `load-more` (default), `numbered` (fallback for large catalogues).
- **Sizes:** Button = standard secondary button size (48px tall).
- **States:** `default / hover / focus-visible / active / loading (spinner replaces label, aria-busy) / disabled (no more results — becomes a plain "You've seen it all" text, not a dead button)`.
- **Desktop vs mobile:** Identical; full-width button on mobile, auto-width centred on desktop.
- **Keyboard:** Standard button; after new items load, focus **stays on the button** (don't force focus onto new content, which would be disorienting) and a visually-hidden `aria-live="polite"` region announces "12 more artworks loaded."
- **ARIA:** `aria-live="polite"` status region as above; numbered variant uses `<nav aria-label="Pagination"><ol>` with `aria-current="page"` on the active number.
- **Motion:** New cards fade/slide in on append, `250ms`, staggered only up to 3 items to avoid a long animated cascade; reduced-motion = instant append, no stagger.
- **Tokens:** secondary button tokens, `peacock` current-page number (numbered variant).

### Footer
- **Purpose:** Brand line, quick links, contact, social icons, newsletter, policies, payment icons — present on every page.
- **Anatomy:** Multi-column (desktop) / stacked accordion-free list (mobile) layout: Brand+short line → Quick links → Contact (phone/email/WhatsApp) → Social icon row → Newsletter form → Policy links → Payment method icons.
- **Variants:** None — one footer, localised per active language.
- **Sizes:** Icon links 44×44px min.
- **States:** Standard link/button states throughout; newsletter form shares the Form components' error/success states.
- **Desktop vs mobile:** Desktop = 4–5 column grid; mobile = single column, no collapsing accordion for link groups (collapsing footer links hides content behind an extra tap for no real space saving at this link count — skip the common "accordion footer" pattern here).
- **Keyboard:** Straightforward document-order tabbing; social icons each have distinct `aria-label`s ("Instagram", "YouTube", "Facebook") — never a bare icon.
- **ARIA:** `<footer role="contentinfo">`; payment icons are `alt="UPI"`, `alt="Razorpay"`, etc. (informative, not decorative, since they communicate accepted payment methods).
- **Motion:** None.
- **Tokens:** `charcoal` bg or `surface` (pick one consistently — recommend `surface` with a `border-t` hairline to stay within the "90% neutral" rule rather than a heavy dark footer band), `muted` secondary text, `peacock` links.

### Skip link
- **Purpose:** Let keyboard/screen-reader users bypass the header/nav straight to main content — required given the header repeats on every page.
- **Anatomy:** A single visually-hidden link, first focusable element in the DOM, becomes visible on focus.
- **Variants:** None.
- **Sizes:** Full visible pill, min 44px tall once revealed.
- **States:** `hidden (default, visually off-screen but in DOM)` → `visible (focus-visible)`.
- **Desktop vs mobile:** Identical behaviour everywhere.
- **Keyboard:** First `Tab` press on any page reveals it; `Enter` jumps focus to `<main id="main-content">`.
- **ARIA:** `<a href="#main-content">Skip to main content</a>` — plain semantic HTML, no extra ARIA needed; the target `<main>` should have `tabindex="-1"` so focus actually lands there.
- **Motion:** Instant show on focus (no fade — it needs to be unmissable immediately, this is one of the few places *not* to animate).
- **Tokens:** `kumkum` bg, white text, `skip-link` z-index (100, above the sticky header).

---

## 3. Commerce

### Product card
- **Purpose:** The core Shop/related-products unit (brief: "image, title, medium, size, price, wishlist heart, Add to Cart, badges").
- **Anatomy:** Framed-art image (hover zoom) → wishlist heart (top-right overlay) → optional badge (top-left overlay) → title → medium/size metadata → price (+ strike-through if on sale) → Add to Cart button.
- **Variants:** `grid` (default, Shop/gallery), `carousel-item` (Home featured strip — same card, no outer margin since the carousel handles spacing), `compact` (related-products rail, smaller type scale).
- **Sizes:** Fixed aspect-ratio image box (prevents layout shift) scaled by grid column: full `grid-cols-2` mobile / `grid-cols-3`–`4` desktop.
- **States:** `default / hover (image zoom 1.03, card shadow-xs→shadow-sm) / focus-visible (ring on the whole card if it's a single link-wrapped card, or on each interactive child if controls are separate) / sold-out (badge "Sold", Add to Cart replaced by disabled "Sold Out" button + "Notify me" link) / loading (skeleton, see Feedback) / wishlisted (heart filled + aria-pressed=true)`.
- **Desktop vs mobile:** 3–4 cols desktop / 2 cols mobile per brief; Add to Cart is always a visible button (not hover-reveal-only) on mobile since there's no hover state on touch.
- **Keyboard:** Card image/title are one link to the product page; wishlist heart and Add to Cart are separate, independently focusable buttons nested inside — never nested `<a>`-inside-`<a>`/button-inside-link markup (use a card with one primary link plus sibling absolutely-positioned buttons, not a link wrapping buttons).
- **ARIA:** Wishlist: `<button aria-pressed="true|false" aria-label="Add to wishlist">` (label flips to "Remove from wishlist" when pressed); badge text is real text, not a colour swatch, so "Sold"/"New"/"Sale" are read by AT without relying on colour (§7 rule 9).
- **Motion:** Image hover zoom per Decorative→Framed-art spec; reduced-motion disables the zoom transform only, nothing else on the card depends on motion.
- **Tokens:** `shadow-frame`, `radius-ui` (card container), `radius-none` (image), `kumkum` Sold badge, `marigold`+charcoal New badge, `leaf` Available text if shown.

### Price
- **Purpose:** Consistent ₹ display across card, PDP, cart, checkout.
- **Anatomy:** `₹` symbol + amount, optional "incl. GST" caption, optional strike-through original price + sale price, both always in `aria`-friendly reading order.
- **Variants:** `default`, `sale` (strike original + kumkum sale price + "Save ₹X"/" % off" text), `from` (course/variant pricing showing a starting price, e.g. "From ₹1,200").
- **Sizes:** Follows context type scale (H3 on PDP, Body-bold on cards).
- **States:** N/A (static display, no interaction) — but note *loading* uses a skeleton block matching the price's width, and *error* (price failed to load) shows "Price unavailable" text, never a blank space.
- **Desktop vs mobile:** Identical; sale variant's "Save ₹X" caption may wrap to its own line on mobile.
- **Keyboard:** N/A.
- **ARIA:** The strike-through original price gets a visually-hidden prefix "Original price:" and the sale price "Now:" via `sr-only` spans, since a screen reader doesn't otherwise convey `<s>`/strikethrough styling reliably — colour/line-through alone would fail §7 rule 9.
- **Motion:** None.
- **Tokens:** `charcoal` default price, `kumkum` sale price, `muted` strike-through original + "incl. GST" caption.

### Badge
- **Purpose:** Single status flag per card/product ("Original," "Print," "Sold Out," "New," "Sale").
- **Anatomy:** Small filled pill/rect, short text label, optional leading icon.
- **Variants:** `sold` (kumkum fill, white text), `new` (marigold fill, charcoal text — marigold fails as text colour per the token table, so it's always fill+dark-text here), `sale` (leaf-adjacent not used — use kumkum outline variant to avoid colour confusion with "Available," so Sale = kumkum fill), `original`/`print`/`digital` (neutral `border`-outlined, charcoal text — availability-type badges, not alert-type, so they stay low-key).
- **Sizes:** One size, 24px tall, min 44px touch target only if it doubles as a filter chip (otherwise it's static, non-interactive, no target-size requirement applies).
- **States:** Static display only (badges aren't interactive) — "at most one per card, in the order Sold > New > Sale" per brainstorm §5, enforced in the card's rendering logic, not the badge component itself.
- **Desktop vs mobile:** Identical.
- **Keyboard / ARIA:** Plain text content, no extra ARIA; if a badge is the *only* signal of a state (e.g. Sold), that same state must also be reflected elsewhere non-visually (e.g. the Add to Cart button becomes a disabled "Sold Out" button) — redundancy, not just colour, communicates it.
- **Motion:** None.
- **Tokens:** `radius-ui`, per-variant fill above.

### Wishlist toggle
- **Purpose:** Save-for-later heart icon, used on cards and PDP.
- **Anatomy:** Icon-only toggle button, heart outline ↔ filled.
- **Variants:** `overlay` (on card/PDP image, small circular `surface/90` backdrop behind the icon for contrast over photos), `inline` (PDP action row, paired with a text label "Wishlist").
- **Sizes:** 44×44px min hit area regardless of the icon's visual 20/24px size.
- **States:** `default / hover / focus-visible / active / pressed(saved) / disabled (e.g., while a request is in flight — shows the loader variant, see Decorative loader "inline") `.
- **Desktop vs mobile:** Identical; always visible (not hover-reveal) on mobile, visible-on-hover-or-focus permitted as a desktop refinement **only if** it's also always-visible once `:focus-visible` (so keyboard users never need a hover to discover it).
- **Keyboard:** `Enter`/`Space` toggles.
- **ARIA:** `<button aria-pressed="true|false" aria-label="Add to wishlist"/"Remove from wishlist">` — label text changes with state, icon fill alone never carries the meaning.
- **Motion:** Small heart "pop" scale (1→1.2→1) 200ms on toggle-to-saved; reduced-motion = instant fill swap, no scale.
- **Tokens:** `kumkum` filled/saved state, `charcoal` outline default, `surface/90` overlay backdrop.

### Quantity stepper
- **Purpose:** Choose item quantity on PDP/cart line item.
- **Anatomy:** `–` button · numeric input (editable) · `+` button.
- **Variants:** `default` (PDP, larger), `compact` (cart line item, smaller).
- **Sizes:** 44×44px min per button; numeric field min 44px wide.
- **States:** `default / hover(each button) / focus-visible(each button + the input) / disabled(– button when qty=1, + button when stock limit reached) / error (typed value exceeds stock → inline error, see Forms) `.
- **Desktop vs mobile:** Same control; on mobile the numeric field is `inputmode="numeric"` to bring up the number pad.
- **Keyboard:** `Tab` moves through `– → field → +`; `↑`/`↓` arrow keys on the focused field also increment/decrement (native `<input type="number">` behaviour, reused rather than reimplemented); typing a value directly works.
- **ARIA:** Group wrapped as `role="group" aria-label="Quantity"`; `–`/`+` buttons `aria-label="Decrease quantity"`/`"Increase quantity"`; the field itself `aria-live="polite"` region adjacent announces the new value only when changed via the buttons (typing announces natively via the input's own value, no extra live region needed there — avoids double-announcing).
- **Motion:** None beyond standard button press feedback.
- **Tokens:** `border` outline, `charcoal` text, `radius-ui`.

### Variant / framing selector
- **Purpose:** Choose size/framing/medium option on PDP (brief: "framing option").
- **Anatomy:** Group of selectable swatch/chip buttons (e.g. "Unframed / Black frame / Oak frame"), each optionally showing a price delta.
- **Variants:** `chip-group` (text chips, for size/medium), `swatch-group` (small image/colour thumbnail per option, for framing finishes — a photo communicates a frame finish far better than a text label alone).
- **Sizes:** Each option min 44×44px.
- **States:** `default / hover / focus-visible / selected / disabled (out of stock for that combination — shown, not hidden, with a visual strike + "Out of stock" sr-text, so users understand the option exists)`.
- **Desktop vs mobile:** Identical layout, wraps to multiple rows on narrow screens.
- **Keyboard:** Implemented as a `radiogroup` (only one framing choice active at a time) — arrow keys move selection, `Enter`/`Space` confirms, matching native radio behaviour rather than a custom click-only pattern.
- **ARIA:** `role="radiogroup" aria-label="Framing"`, each option `role="radio" aria-checked`, disabled options `aria-disabled="true"` plus visible label (not just opacity).
- **Motion:** Selected-state border/scale change, 150ms; reduced-motion = instant.
- **Tokens:** `peacock` selected border, `border` default, `muted` disabled.

### Pincode checker
- **Purpose:** Delivery-availability check on PDP (brief: "delivery pincode check").
- **Anatomy:** Single text input (`inputmode="numeric"`, 6-digit) + "Check" button, result message area below.
- **Variants:** None.
- **Sizes:** Input 48px tall, inline button on desktop, stacked full-width on narrow mobile widths.
- **States:** `default / focus-visible / loading (button shows inline spinner + aria-busy) / success ("Delivers by 12 Nov" — leaf text + check icon, not colour alone) / error ("Not deliverable to this pincode yet" / "Enter a valid 6-digit pincode" — kumkum text + icon, not colour alone) / empty (no pincode entered — Check button disabled until 6 digits present, avoiding a premature error state)`.
- **Desktop vs mobile:** Stacks vertically under ~375px width to keep the 44px touch targets from cramping.
- **Keyboard:** `Enter` in the field submits the same as clicking Check.
- **ARIA:** Result message region is `aria-live="polite"` so screen reader users hear the outcome without moving focus; input has `autocomplete="postal-code"` (helps autofill, part of §7 rule 6's "correct autocomplete").
- **Motion:** None beyond the loading spinner.
- **Tokens:** `leaf` success, `kumkum` error, `peacock` focus ring, standard input tokens.

### Cart drawer + line item
- **Purpose:** Persistent slide-in cart review without leaving the current page.
- **Anatomy (drawer):** Header ("Your Cart (3)" + close button) → scrollable line-item list → subtotal → "Checkout" primary button + "Continue Shopping" link, sticky footer.
- **Anatomy (line item):** Thumbnail → title + variant/framing text → price → quantity stepper (compact) → remove button.
- **Variants:** Drawer: `default`. Line item: `default / with-badge (e.g. "Ships in 5 days")`.
- **Sizes:** Drawer: 400px wide desktop, full-width mobile (or near-full with a visible edge, implementation choice).
- **States (drawer):** `open/closed / loading (initial fetch skeleton line items) / empty ("Your cart is empty" empty-state component with a Shop-link CTA) / updating (a line item's own removal/qty-change shows a brief inline spinner on that row only, not the whole drawer)`.
- **States (line item):** `default / hover / focus-visible(each control) / removing (fade-out before removal, respecting reduced-motion as an instant removal instead) / error (e.g. stock dropped below requested qty — inline warning text on that row)`.
- **Desktop vs mobile:** Same drawer pattern both sizes (not a separate mobile "cart page") since the brief calls for a drawer explicitly; on very small screens it can cover the full viewport, functioning like a full-screen dialog.
- **Keyboard:** Opens → focus moves to the drawer heading/close button. **Focus trapped** inside while open. `Esc` closes **and returns focus** to whatever opened it (the header cart icon) — §7 rule 5.
- **ARIA:** `role="dialog" aria-modal="true" aria-label="Shopping cart"`; removing a line item announces via an `aria-live="polite"` region ("Removed: [Product name] from cart"); the header cart icon's `aria-label` count updates to match.
- **Motion:** Slide-in `300ms`; reduced-motion = instant show/hide, same as Mobile drawer.
- **Tokens:** `surface` panel, `drawer` z-index, `overlay-backdrop`, `shadow-lg`, `kumkum` primary Checkout button.

### Sticky add-to-cart bar
- **Purpose:** Mobile-only persistent purchase action on PDP (brief: "sticky Add to Cart bar on product pages").
- **Anatomy:** Fixed-bottom bar: price (compact) + "Add to Cart" (or "Buy Now") button, appears once the page's own inline Add-to-Cart button scrolls out of view.
- **Variants:** `add-to-cart` (default) / `sold-out` (disabled state, matches PDP's own sold-out messaging) / `select-variant-first` (if a required variant/framing choice hasn't been made yet, the bar's button opens/scrolls to the selector instead of adding, rather than silently failing).
- **Sizes:** Bar 64px tall, button full remaining width, 44px+ tall.
- **States:** standard button states (default/hover/focus-visible/active/disabled/loading-after-tap).
- **Desktop vs mobile:** **Mobile only** (≤`lg`) — desktop keeps the inline PDP Add-to-Cart always in view given the layout's typical above-the-fold placement, so a sticky bar is unnecessary there.
- **Keyboard:** It's a real, focusable button in the tab order appended near the end of the page's DOM (visually fixed, but positioned logically after the main PDP content so tab order still matches reading order — a common pitfall with fixed-position elements).
- **ARIA:** Standard button semantics; no separate live region needed since Add-to-Cart's result is better confirmed via a toast (see Feedback).
- **Motion:** Slide-up-in on first appearance, `200ms`; reduced-motion = instant appearance. **Must hide/yield when the WhatsApp FAB or Cart drawer would overlap it** — z-index and position logic coordinate the two (see WhatsApp floating button).
- **Tokens:** `surface` bg, `shadow-lg` (bar sits above content), `kumkum` primary button.

### Filter sidebar & bottom sheet
- **Purpose:** Shop filtering by category/medium/size/price/availability (brief's full filter set).
- **Anatomy (sidebar, desktop):** Vertical stack of collapsible filter groups (accordion-style), each with checkboxes/range control, "Clear all" link, applied-filter count.
- **Anatomy (bottom sheet, mobile):** "Filters (2)" trigger button in the toolbar → sheet slides up from bottom with the same filter groups, sticky "Show N results" primary button at the sheet's bottom.
- **Variants:** `sidebar` (`lg+`), `bottom-sheet` (`<lg`) — same underlying filter-group components, two different containers.
- **Sizes:** Sidebar fixed ~280px column; sheet ~85% viewport height max, scrollable body.
- **States:** `default / group-expanded/collapsed / option: default/hover/focus-visible/checked / loading (grid refetching — sidebar/sheet itself stays interactive, only the product grid shows a skeleton) / empty (0 results for the current filter combo → inline "No artworks match these filters" message + "Clear filters" button, shown in the grid area, not inside the sheet) `.
- **Desktop vs mobile:** As above; the mobile sheet additionally requires a visible "Show N results" count that updates live as filters are toggled, so the user isn't surprised after closing the sheet.
- **Keyboard:** Sidebar: standard checkbox/accordion tabbing, no trap (it's inline content, not a dialog). Bottom sheet: **is** a dialog — focus moves in on open, **trapped**, `Esc` closes and returns focus to the "Filters" trigger button (§7 rule 5).
- **ARIA:** Sidebar filter groups: `<fieldset><legend>` per group (native semantics beat ARIA roles here — rung 4). Bottom sheet: `role="dialog" aria-modal="true" aria-label="Filters"`. Applied filter count on the trigger button is part of its accessible name: `aria-label="Filters, 2 applied"`.
- **Motion:** Sheet slide-up `300ms`; accordion group expand/collapse `200ms` height transition; reduced-motion = instant for both.
- **Tokens:** `surface` bg, `radius-sheet` (bottom sheet top corners), `shadow-lg`, `peacock` checked-state accent, `border` group dividers.

### Sort select
- **Purpose:** "Newest, Price low–high, high–low, Popularity" (brief).
- **Anatomy:** Native-feeling `<select>`-pattern dropdown, current sort shown as the trigger's label.
- **Variants:** None.
- **Sizes:** 44px tall trigger.
- **States:** `default / hover / focus-visible / open / selected-option`.
- **Desktop vs mobile:** Reuse the actual native `<select>` element styled with Tailwind rather than a custom-built listbox — a real `<select>` gets correct mobile OS picker UI, keyboard support, and screen-reader support for free (rung 4: native platform feature beats a custom ARIA listbox for this simple single-choice case).
- **Keyboard:** Native `<select>` keyboard behaviour (arrow keys, type-ahead, `Enter`/`Esc`) — no custom implementation needed.
- **ARIA:** Native `<select>` + `<label>` (visually can be a compact icon+"Sort" label) — no extra ARIA required since it's native.
- **Motion:** None beyond the OS-native picker.
- **Tokens:** standard input tokens (`border`, `radius-ui`, `peacock` focus ring).

### Checkout stepper
- **Purpose:** Orient the user through Cart → Address → Payment → Review.
- **Anatomy:** Horizontal (desktop) / condensed (mobile) step indicator with step number/label, current step highlighted, completed steps checked and clickable-back.
- **Variants:** `horizontal` (desktop, all steps visible), `compact` ("Step 2 of 4: Address" text + thin progress bar, mobile — full horizontal steppers crowd a 390px viewport).
- **Sizes:** Step circles 32px with connecting line; compact bar 4px tall.
- **States:** `upcoming / current / completed (checkmark, clickable to go back) / error (a required field in that step is invalid, step marker shows an error dot)`.
- **Desktop vs mobile:** As above variants.
- **Keyboard:** Completed steps are real links/buttons (`Enter`/`Space` to jump back); upcoming steps are not interactive (can't skip ahead) and are `aria-disabled`, not just visually muted.
- **ARIA:** `<nav aria-label="Checkout progress"><ol>` with `aria-current="step"` on the active one.
- **Motion:** Progress fill transition `250ms`; reduced-motion = instant.
- **Tokens:** `peacock` current/completed, `border` upcoming, `kumkum` error dot.

### Payment method selector
- **Purpose:** Choose UPI / cards / net banking / COD at checkout, **UPI listed first** (§7 rule 7, non-negotiable ordering).
- **Anatomy:** Vertical radio-card list, each option showing its icon + label, UPI option expands to show a VPA input or QR when selected.
- **Variants:** `default` (radio-card list).
- **Sizes:** Each option row min 56px tall (comfortably above the 44px minimum, since it's a primary decision point).
- **States:** `default / hover / focus-visible / selected(expanded if UPI) / disabled (e.g. COD unavailable for a given order — shown with reason text, not hidden, so users aren't confused about why it's missing) / error (payment failed → inline error banner, see Forms)`.
- **Desktop vs mobile:** Identical list; UPI's expanded QR/VPA sub-section stacks full-width on mobile.
- **Keyboard:** `radiogroup` pattern — arrow keys move selection, `Enter`/`Space` confirms, matching the Variant selector's pattern for consistency.
- **ARIA:** `role="radiogroup" aria-label="Payment method"`, each `role="radio" aria-checked`; the UPI-first order is reflected in DOM order too, not just visual order (so screen reader users encounter it first as well).
- **Motion:** Expand/collapse of the selected option's sub-section, `200ms` height transition; reduced-motion = instant.
- **Tokens:** `peacock` selected border, `border` default, `kumkum` error banner.

### Order summary
- **Purpose:** Itemised recap on cart/checkout/review step.
- **Anatomy:** Mini line-item list (thumbnail+title+qty+price) → subtotal → shipping → GST line → total, often in a sticky side column on desktop.
- **Variants:** `cart-page`, `checkout-sticky` (condensed, sticky on scroll), `confirmation` (post-order, read-only, includes order number).
- **Sizes:** Sticky column ~360px desktop; full-width, non-sticky, placed above the form on mobile (so users see what they're paying for before filling address/payment — avoids the "surprise total at the bottom" pattern).
- **States:** `default / loading (recalculating shipping/GST after an address change → inline skeleton on the affected line only) / error (e.g. a line item went out of stock between cart and checkout → inline warning + link back to cart)`.
- **Desktop vs mobile:** As above placement difference.
- **Keyboard / ARIA:** Mostly static text; the total should be in a `<dl>` (term/definition pairs: "Subtotal" / "₹X") for correct semantic association, and any live-recalculating total announces its change via `aria-live="polite"` so a screen reader user notices the total shifted after an address entry.
- **Motion:** Recalculation shows a brief skeleton/shimmer on the changed line, no animated number count-up (that would be an unnecessary showy delay on a figure the user needs accurately and fast).
- **Tokens:** `charcoal` totals, `muted` line labels, `border` divider above the grand total, `leaf` savings line if applicable.

---

## 4. Media

### Image (lazy + blur placeholder)
- **Purpose:** Every artwork/photo on the site, performance-budgeted per §7 rule 13/14.
- **Anatomy:** `next/image` with a low-res blur `placeholder` (generated at build/upload time), responsive `sizes`, WebP/AVIF output.
- **Variants:** `eager` (hero/above-the-fold — loaded immediately, not lazy, per §7 rule 13), `lazy` (everything below the fold, default).
- **Sizes:** Fully responsive via `sizes` attribute per breakpoint/grid column, not fixed px.
- **States:** `loading (blur placeholder visible) / loaded (crossfade to sharp image, 200ms) / error (broken image → a neutral placeholder graphic + the alt text still visible as a caption, never a browser's broken-image icon)`.
- **Desktop vs mobile:** Same component; `sizes` values differ so mobile doesn't download the desktop-resolution asset.
- **Keyboard:** N/A (unless the image is itself a link/button trigger, in which case the *parent* control carries keyboard behaviour, per Product card's note).
- **ARIA:** Every artwork image has **artist-written, descriptive `alt` text** (§7 rule 10) — never the filename, never "image of painting." Purely decorative images (the kolam background, divider SVGs) use `alt=""` so AT skips them.
- **Motion:** Blur-to-sharp crossfade `200ms`; reduced-motion keeps the crossfade (it's a load-completion cue, not a distraction-motion pattern) but skips any additional scale/parallax some hero treatments might add.
- **Tokens:** `skeleton` tint during blur phase, `radius-none` (artwork), `shadow-frame` where applicable (see Decorative).

### Image gallery with zoom (PDP)
- **Purpose:** Multiple product photos with a closer look, per brief ("image gallery with zoom").
- **Anatomy:** Main large image + thumbnail strip (desktop) or swipeable main image with dot indicators (mobile); tap/click or pinch to zoom.
- **Variants:** `desktop-thumbnails` (click thumbnail to swap main image, hover/click-hold on main image for a magnified inset or click-to-open lightbox), `mobile-swipe` (swipe between images, tap to open full lightbox for zoom).
- **Sizes:** Main image area ~1:1 or product's natural aspect ratio, consistent across all images in the set to avoid layout jump when swapping.
- **States:** `default / hover(zoom cursor affordance, desktop) / focus-visible(thumbnails) / active(selected thumbnail) / loading(per-image skeleton)`.
- **Desktop vs mobile:** As above; **the zoom/magnify interaction (drag/hover) always has a non-gesture alternative** — a visible "zoom in" icon button that opens the full lightbox, since §7 rule 3 requires a button alternative for any swipe/drag/hover-only interaction.
- **Keyboard:** Thumbnails are a tabbable row (`←`/`→` optional convenience, `Tab` works regardless); main image zoom-button is a standard focusable button opening the Lightbox.
- **ARIA:** Thumbnail strip is a `listbox`-like set of buttons with `aria-label="View image 2 of 5"` each; the currently shown main image's `alt` text updates to match whichever photo is active.
- **Motion:** Main image crossfade on thumbnail change, `150ms`; reduced-motion = instant swap.
- **Tokens:** `peacock` selected-thumbnail border, `shadow-frame`, `radius-none`.

### Masonry grid
- **Purpose:** Artwork gallery full-portfolio layout (brief: "masonry gallery layout").
- **Anatomy:** CSS-only masonry via `columns`/`break-inside: avoid` (no JS layout library needed — rung 3/4, native CSS multi-column or `grid-template-rows: masonry` where supported, with a `columns` fallback) — avoids pulling in a masonry JS dependency for what CSS already does.
- **Variants:** `2-col` mobile, `3-col` tablet, `4-col` desktop.
- **Sizes:** Column count by breakpoint; image heights stay natural/varied (that's the point of masonry).
- **States:** `loading (skeleton blocks in a plausible masonry rhythm) / empty (no artworks in the selected tab filter → empty state) / default`.
- **Desktop vs mobile:** Column-count only difference.
- **Keyboard:** Each item is a focusable trigger (opens Lightbox); grid order in the DOM matches visual reading order top-to-bottom, left-to-right as closely as CSS columns allow (a known minor limitation of CSS multi-column masonry — visual order can read top-to-bottom-per-column rather than strict row order; acceptable here since items are independent artworks, not a sequential reading flow).
- **ARIA:** Grid container `role="list"`, items `role="listitem"` only if semantics need reinforcing beyond native `<ul>/<li>` (prefer plain `<ul><li>` first — native semantics, no ARIA needed at all in most cases).
- **Motion:** Scroll-reveal fade-up per item, once per section, batched (not one keyframe per image) to avoid jank; reduced-motion = items appear instantly, no fade/translate.
- **Tokens:** spacing `16`/`24` gutters, `shadow-frame`, `radius-none`.

### Lightbox
- **Purpose:** Fullscreen artwork view with title/year/medium/story + Buy/Enquire link (brief, Artwork page).
- **Anatomy:** Fullscreen overlay, large image, metadata panel (title, year, medium, story text), close button, prev/next arrows, optional "Buy / Enquire" CTA.
- **Variants:** `with-commerce` (shows Buy/Enquire, Shop-linked artworks), `story-only` (not-for-sale pieces — brief explicitly includes these).
- **Sizes:** Fullscreen on mobile; large centred modal with visible backdrop on desktop.
- **States:** `open/closed / loading(next image) / default`.
- **Desktop vs mobile:** Desktop shows metadata panel beside the image; mobile stacks metadata below/in a collapsible drawer under the image to keep the photo the focus on small screens.
- **Keyboard:** Opens → focus moves to the close button or the image region. **Focus trapped.** `←`/`→` arrow keys navigate prev/next (with visible on-screen arrow buttons as the pointer/AT-discoverable alternative — §7 rule 3). `Esc` closes and **returns focus** to the grid item that opened it (§7 rule 5).
- **ARIA:** `role="dialog" aria-modal="true" aria-label="[Artwork title]"`; prev/next buttons `aria-label="Previous artwork"/"Next artwork"`; a visually-hidden `aria-live="polite"` announces "Image 3 of 12" on navigation.
- **Motion:** Fade-in overlay + slight scale-in of the image, `250ms`; image transition between items is a crossfade, not a slide (simpler, cheaper, and avoids a strong directional-motion trigger); reduced-motion = instant show, instant image swap, no crossfade.
- **Tokens:** `overlay-backdrop` (`charcoal/60`, darker than the drawer backdrop since it's a fullscreen takeover), `modal` z-index, `surface` metadata panel bg.

### Carousel (swipe + buttons)
- **Purpose:** Home featured-artwork strip, testimonials, Instagram strip.
- **Anatomy:** Horizontal scroll-snap track + visible prev/next buttons + (optional) dot indicators.
- **Variants:** `product` (artwork cards), `testimonial` (quote cards), `auto-rotating` (used sparingly — only if content truly benefits, e.g. never for product carousels since users should control browsing pace).
- **Sizes:** Item width responsive, 1.2 items peeking per view on mobile (signals scrollability), 3–4 on desktop.
- **States:** `default / hover(buttons appear/intensify, desktop) / focus-visible(buttons + individual items) / disabled(prev button at start, next button at end — not hidden, so keyboard users don't lose a consistent tab stop)`.
- **Desktop vs mobile:** Mobile relies on native touch-scroll (CSS `scroll-snap-type`, no JS swipe library needed — rung 4) **plus** visible prev/next buttons are still rendered (small, edge-positioned) as the required non-gesture alternative (§7 rule 3) even though touch users may never need them.
- **Keyboard:** Prev/next buttons are standard focusable buttons; the scroll track itself is also natively focusable/scrollable via arrow keys once focused (native overflow scroll container semantics), so keyboard users have two ways in.
- **ARIA:** `aria-roledescription="carousel"` on the track is optional/skippable complexity for a simple scroll-snap row (native scrollable region + labelled buttons already communicate it clearly — avoid over-ARIA-ing a native scroll container). Buttons: `aria-label="Previous artworks"/"Next artworks"`.
- **Motion:** Scroll-snap uses the browser's native smooth/instant scroll; `auto-rotating` variant (if used for testimonials) **pauses on hover/focus and entirely under `prefers-reduced-motion`**, since auto-advancing content is a known distraction/vestibular concern (WCAG 2.2.2).
- **Tokens:** `shadow-xs` nav buttons (`surface/90` bg over imagery), `peacock` focus ring, spacing `16` gutter between items.

### Video player wrapper
- **Purpose:** Course lesson video (brief: "clean player... videos protected from direct download").
- **Anatomy:** `<video>` element (or a hosting provider's embed, e.g. Mux/Bunny, chosen for DRM/signed-URL protection — a build decision outside this spec's scope) wrapped with custom controls matching the site's visual language: play/pause, scrubber, volume, captions toggle, fullscreen, speed.
- **Variants:** `lesson` (full controls + captions), `preview` (free sample lesson — same controls, watermark overlay).
- **Sizes:** Responsive 16:9 container, controls bar min 44px tall with each control button min 44×44px.
- **States:** `paused/playing/buffering(spinner overlay)/ended(shows "Next lesson" CTA)/error(network/playback failure → inline message + retry button, never a silent black box)`.
- **Desktop vs mobile:** Native fullscreen API on mobile tap; desktop shows the lesson sidebar alongside instead of fullscreen-first.
- **Keyboard:** Standard media-player keyboard map: `Space`/`k` play/pause, `←`/`→` seek, `↑`/`↓` volume, `f` fullscreen, `c` captions toggle — all also available via visible buttons (keyboard shortcuts are an addition, never the only way).
- **ARIA:** Custom control buttons each carry `aria-label`s; captions are **required** per §7 rule 11 (Phase-level requirement, but since this build does everything from the brief, ship captions + a transcript link at launch, not deferred); the player region `aria-label="Video: [Lesson title]"`.
- **Motion:** Controls bar fade-out after inactivity (standard player UX), reappears on mouse-move/tap/keyboard-focus; not subject to reduced-motion (it's an opacity visibility toggle tied to input, not a decorative animation) but must never fully hide while a control is keyboard-focused.
- **Tokens:** `charcoal/70` controls-bar scrim, `kumkum` progress fill, `surface` icon buttons.

### Instagram grid
- **Purpose:** Home "On Instagram" 6-image strip (brief).
- **Anatomy:** Static 2×3/3×2 grid of curated images, each linking out to the actual Instagram post.
- **Variants:** `static-curated` (recommended — manually chosen images via CMS/config, not a live API embed, since a live embed adds a third-party script, tracking, and a failure point for 6 images that rarely change; rung 1/5 — simplest approach that meets the brief's visible requirement).
- **Sizes:** Square crops, consistent across all 6.
- **States:** `default/hover(subtle zoom, matches Framed-art motion token)/focus-visible`.
- **Desktop vs mobile:** 3-col desktop / 2-col mobile grid.
- **Keyboard:** Each tile is a real link (`<a target="_blank" rel="noopener noreferrer">`) — descriptive accessible name like "View this rangoli on Instagram," never "Click here."
- **ARIA:** `alt` text describing the image content (it's informative, not decorative, since it's the only context for an otherwise bare photo link); opening in a new tab is announced via visually-hidden "(opens in new tab)" appended to the link name.
- **Motion:** Hover zoom, same as Framed-art spec; reduced-motion disables it identically.
- **Tokens:** `radius-none`, spacing `4`/`8` tight grid gutter (Instagram-grid convention).

---

## 5. Learning

### Course card
- **Purpose:** Course listing unit (brief: "thumbnail, title, level, lessons, duration, language, price/Free, rating, Enroll").
- **Anatomy:** Thumbnail with centred play-icon overlay → Level chip → title → metadata row (lessons · duration · language) → rating stars (display) → price or "Free" → "Enroll" button.
- **Variants:** `default`, `enrolled` (swaps price/Enroll for a progress bar + "Continue" button — used once accounts exist).
- **Sizes:** Matches Product card's grid sizing conventions for visual consistency across the site (3–4 desktop / 2 mobile).
- **States:** `default/hover(thumbnail zoom + play-icon scale)/focus-visible/loading(skeleton)/sold-out(rare, e.g. a capped-seat live cohort — "Waitlist" button instead of Enroll)`.
- **Desktop vs mobile:** Identical layout; metadata row wraps to two lines on narrow cards rather than truncating with ellipsis (truncated duration/lesson-count is information loss, not just a visual nicety).
- **Keyboard:** Same single-link-plus-nested-button pattern as Product card (card → course detail; Enroll is its own nested button with its own focus stop, especially since Enroll may trigger a different action — e.g., opening payment — than just navigating).
- **ARIA:** Play-icon overlay is `aria-hidden` (decorative, the card's own link/heading already conveys "this is a video course"); rating stars use the Rating display component's ARIA (see Feedback).
- **Motion:** Shares Framed-art/Product-card hover-zoom motion tokens exactly, for visual consistency between Shop and Courses.
- **Tokens:** `shadow-frame`, `peacock` "Free" or price text, Level chip tokens below.

### Level chip
- **Purpose:** Beginner / Intermediate / Advanced indicator.
- **Anatomy:** Small pill, text label only (no colour-only level coding, since 3 arbitrary colours mapped to difficulty isn't inherently meaningful and risks §7 rule 9 if colour were the only cue — text label always present).
- **Variants:** `beginner`/`intermediate`/`advanced` — all share the same neutral `border`-outlined style; difficulty is conveyed by the word, not a traffic-light colour system (avoids implying "advanced = danger/red").
- **Sizes:** One size, 24px tall.
- **States:** Static.
- **Desktop vs mobile:** Identical.
- **Keyboard/ARIA:** Plain text, no ARIA needed.
- **Motion:** None.
- **Tokens:** `border` outline, `charcoal` text, `radius-ui`.

### Curriculum accordion with lock states
- **Purpose:** Course detail lesson list (brief: "curriculum accordion with locked/unlocked lessons").
- **Anatomy:** Module header (collapsible) → lesson rows: icon (lock/play/check) + title + duration + (if applicable) a "Preview" tag for the free sample lesson.
- **Variants:** `pre-enrollment` (locked rows show a lock icon, click opens an enroll prompt instead of the lesson; the single designated "free sample" row is always unlocked and marked "Preview"), `enrolled` (locked icon replaced by play/complete-check, all rows playable).
- **Sizes:** Rows min 44px tall (several are also tap-targets).
- **States (module):** `expanded/collapsed`. **States (lesson row):** `locked/unlocked/in-progress/completed`.
- **Desktop vs mobile:** Identical; same single-column accordion both breakpoints (no desktop-only side-by-side variant needed for a linear list — simplest structure that works everywhere).
- **Keyboard:** Standard WAI-ARIA Accordion pattern for module headers (`Enter`/`Space` toggles, `Tab` moves to next header or, if expanded, into its lesson rows); lesson rows are buttons/links with their own `Enter`/`Space` activation.
- **ARIA:** Module header: `aria-expanded aria-controls`; locked lesson row: real disabled-looking but still-announced state via `aria-disabled="true"` on a button that, when activated, opens an "Enroll to unlock" prompt rather than doing nothing (a disabled control that silently does nothing is worse than one that explains why) — so practically it stays a focusable, non-`disabled` button with `aria-label="[Lesson title] — locked, enroll to unlock"`.
- **Motion:** Expand/collapse height transition `200ms`; reduced-motion = instant.
- **Tokens:** `peacock` play/unlocked icon, `muted` lock icon, `leaf` completed checkmark, `border` row dividers.

### Progress bar & ring
- **Purpose:** Course completion progress (dashboard "My Courses," lesson video scrubber context).
- **Anatomy:** `bar` = horizontal track + filled portion + percentage label; `ring` = circular SVG stroke progress, percentage centred inside.
- **Variants:** `bar` (course card/dashboard list), `ring` (dashboard hero stat / certificate-eligibility indicator).
- **Sizes:** Bar 8px tall track; ring 48px (card) / 96px (dashboard hero) diameter.
- **States:** `0% (not started) / in-progress / 100% (complete — fill colour switches from peacock to leaf, plus a checkmark, not colour alone) `.
- **Desktop vs mobile:** Identical, scales by container.
- **Keyboard:** N/A (display-only; if it doubles as a link to "resume where you left off," that's a separate wrapping link with its own accessible name including the percentage, e.g. "Continue Rangoli for Beginners, 60% complete").
- **ARIA:** `role="progressbar" aria-valuenow aria-valuemin="0" aria-valuemax="100" aria-label="Course progress"`.
- **Motion:** Fill animates to its value on first mount, `500ms ease-out`; reduced-motion = fill appears instantly at its final value, no animated sweep.
- **Tokens:** `peacock` in-progress fill, `leaf` complete fill, `border` track.

### Lesson sidebar
- **Purpose:** Video player page navigation between lessons (brief: "lesson sidebar, next/previous lesson buttons").
- **Anatomy:** Reuses the Curriculum accordion component exactly (enrolled variant), displayed as a persistent side column next to the video on desktop.
- **Variants:** `desktop-persistent` (always visible beside the player), `mobile-collapsible` (a "Lessons" toggle button opens it as a bottom sheet, reusing the Filter bottom sheet's dialog pattern, since the video needs full width on mobile).
- **Sizes:** Desktop ~320px fixed column.
- **States:** Shares the Curriculum accordion's lesson-row states (`locked/unlocked/in-progress/completed`), plus `current` (the lesson actively playing — highlighted, `aria-current="true"`).
- **Desktop vs mobile:** As above variants.
- **Keyboard:** Same as Curriculum accordion; additionally, dedicated "Previous lesson"/"Next lesson" buttons near the player itself (not only inside the sidebar list) so keyboard users don't need to navigate the full list just to advance sequentially.
- **ARIA:** Current lesson row gets `aria-current="true"`; Previous/Next buttons `aria-label` includes the target lesson's title ("Next: Mixing Rangoli Colours") so the destination is clear before activating, not just "Next."
- **Motion:** Mobile sheet reuses Bottom sheet's slide/backdrop motion spec.
- **Tokens:** Shares Curriculum accordion tokens; `peacock/10` background wash on the current-lesson row.

### Notes editor
- **Purpose:** Lesson-page "notes/resources tab" (brief).
- **Anatomy:** Plain `<textarea>` with an autosave status caption ("Saved" / "Saving…"), **not** a rich-text/WYSIWYG editor — a student's personal lesson notes don't need bold/italic/embeds, and a full rich-text editor is unused complexity for this use case (explicit simplification: plain textarea now, upgrade to rich text only if real usage shows a need).
- **Variants:** None.
- **Sizes:** Min height ~160px, resizable vertically (`resize-y`).
- **States:** `default/focus-visible/saving(caption shows "Saving…")/saved(caption "Saved" + timestamp)/error(autosave failed → inline retry message, content is never silently lost — keep it in the field regardless of save state)`.
- **Desktop vs mobile:** Identical; full width within the lesson layout both ways.
- **Keyboard:** Native textarea behaviour; no custom keymap needed.
- **ARIA:** `<label for="notes">Your notes</label>`; autosave status is an `aria-live="polite"` caption so screen reader users get the "Saved" confirmation without hunting for it.
- **Motion:** None (status text just updates).
- **Tokens:** standard textarea tokens (`border`, `radius-ui`, `peacock` focus ring), `muted` status caption.

### Certificate card
- **Purpose:** Course-completion certificate on the dashboard (brief: "certificate download on completion").
- **Anatomy:** Preview thumbnail of the certificate (student name + course + date, pre-filled from the account — never re-asked at this point, satisfying the Redundant Entry rule, §7/brainstorm §7 cross-reference), course title, completion date, "Download PDF" button.
- **Variants:** `earned` (download enabled), `locked` (course not yet 100% complete — shows the progress ring instead of a thumbnail, with "Complete the course to unlock your certificate").
- **Sizes:** Matches card-grid sizing on the dashboard.
- **States:** `earned/locked/generating(brief loading state if the PDF is generated on-demand rather than pre-rendered)`.
- **Desktop vs mobile:** Identical.
- **Keyboard:** Download button is a standard link/button to the PDF file.
- **ARIA:** `aria-label="Download certificate for [Course title], completed [date]"` on the download control (more useful than a bare "Download").
- **Motion:** None.
- **Tokens:** `shadow-frame` (it's a certificate — treat it with the same "framed" visual respect as artwork), `leaf` earned-state accent, `border` locked-state outline.

---

## 6. Forms

> Shared across all form controls below: label sits **above** the field (§7 rule 6), every field has an explicit `<label for>`, correct `type`/`inputmode`/`autocomplete`, and errors use icon **+** colour **+** text (never colour alone, §7 rule 9).

### Text input
- **Anatomy:** Label → input → optional helper text → optional error text.
- **Variants:** `default`, `with-icon` (leading/trailing icon, e.g. search).
- **Sizes:** 48px tall (one size — no need for sm/lg input variants across a short, consistent form set).
- **States:** `default/hover/focus-visible/filled/disabled/error/success(e.g. a checked-available username)`.
- **Desktop vs mobile:** Same markup; mobile gets the matching virtual keyboard via `inputmode`/`type` (e.g. `type="email"` brings the @-key layout).
- **Keyboard:** Native input behaviour.
- **ARIA:** `aria-invalid="true"` + `aria-describedby` pointing at the error-message id when in error state.
- **Motion:** Border-colour/error-shake-free transition `150ms` (no shake animation — it's a dated pattern that can trigger motion sensitivity for no accessibility benefit); reduced-motion = instant colour change regardless.
- **Tokens:** `border` default, `peacock` focus ring, `kumkum` error border+text, `leaf` success border+text, `radius-ui`.

### Phone input (+91)
- **Anatomy:** Fixed, non-editable "+91" prefix segment + 10-digit number field.
- **Variants:** None (India-only at launch — no country-select dropdown needed, rung 1: the brief's audience is India-based, so a full international phone-country-picker is unused complexity).
- **Sizes:** 48px tall.
- **States:** Same set as Text input, plus `invalid-length` (fewer/more than 10 digits after the prefix).
- **Desktop vs mobile:** `inputmode="tel"` brings the numeric phone keypad on mobile.
- **Keyboard:** Native.
- **ARIA:** `autocomplete="tel-national"`, label reads "Phone number" with the "+91" prefix visually and programmatically part of the field group (`aria-describedby` referencing a prefix label if it's a separate visual element, so AT announces "+91" isn't lost).
- **Motion:** None beyond Text input's.
- **Tokens:** Shares Text input tokens.

### OTP input
- **Anatomy:** 6 single-digit boxes (or a single field styled to look segmented — see note), auto-advance on digit entry, auto-submit on completion.
- **Variants:** None.
- **Sizes:** Each box 44×44px min.
- **States:** `empty/filled(per box)/focus-visible(current box)/error(wrong code — all boxes get the error state + a shared error message, fields clear for retry)/success(auto-verified)`.
- **Desktop vs mobile:** Identical; `inputmode="numeric" autocomplete="one-time-code"` lets mobile browsers **auto-fill from SMS**, which is a real accessibility/usability win worth the small extra markup effort (native platform feature, rung 4).
- **Keyboard:** Typing a digit auto-advances focus to the next box; `Backspace` on an empty box moves focus to the previous box; paste support fills all boxes from a 6-digit clipboard value at once (common real-world OTP-copy pattern).
- **ARIA:** Each box `aria-label="Digit 1 of 6"`; on error, a single `aria-live="assertive"` message ("Incorrect code, please try again") is read once — not per-box, to avoid redundant announcements.
- **Motion:** Error state = brief red flash on the boxes (colour-paired with the text message, not alone), no shake.
- **Tokens:** Shares Text input's border/focus/error tokens, `radius-ui`.

### Select
- **Anatomy:** Native `<select>` + label (see Sort select — same component, reused for any single-choice dropdown form field, e.g. "Enquiry type").
- **Variants:** `single-choice` (native select, default), `searchable` (only if a list genuinely exceeds ~15 options where scanning becomes hard — none of this brief's forms currently need it, so it's noted as an available escalation, not built by default).
- **Sizes:** 48px tall.
- **States:** `default/hover/focus-visible/open/disabled/error`.
- **Keyboard/ARIA:** Native `<select>` — free correct behaviour (rung 4), as in Sort select.
- **Motion:** None (native OS picker).
- **Tokens:** Shares Text input tokens.

### Checkbox
- **Anatomy:** Native `<input type="checkbox">` visually restyled, paired label (label text itself is clickable, not just the box).
- **Variants:** `default`, `card` (a larger clickable card wrapping checkbox+label+description — used for multi-select filter options where a bigger tap target helps).
- **Sizes:** Visual box 20px, but the **clickable area (box + label)** is the real 44px+ target, not the box alone.
- **States:** `unchecked/checked/indeterminate(e.g. "select all" parent)/focus-visible/disabled/error(required consent checkbox left unticked on submit)`.
- **Keyboard:** `Space` toggles when focused (native behaviour).
- **ARIA:** Native checkbox semantics; indeterminate set via the DOM property (`el.indeterminate = true`), which exposes correctly to AT automatically.
- **Motion:** Checkmark draw-in `100ms`; reduced-motion = instant check appearance.
- **Tokens:** `peacock` checked fill, `border` unchecked, `kumkum` error outline.

### Radio
- **Anatomy:** Native `<input type="radio">` restyled, grouped under a `<fieldset><legend>`.
- **Variants:** `default`, `card` (same rationale as Checkbox card variant — e.g. payment method/framing selectors, though those two specific instances are specified as dedicated Commerce components above; this is the generic reusable primitive they're built from).
- **Sizes/States/Keyboard/ARIA:** As native radio group semantics (arrow keys move selection within a group, native).
- **Motion:** Same as Checkbox.
- **Tokens:** Shares Checkbox tokens.

### Textarea
- **Anatomy/Variants/Sizes:** Same as Text input, `resize-y`, min 4 visible rows.
- **States/Keyboard/ARIA/Motion/Tokens:** Identical to Text input (this is the same primitive, just multi-line — no separate spec needed beyond noting the shared base, rung 2: reuse rather than re-describe).

### File upload
- **Purpose:** Used sparingly in this build — e.g. a practice-sheet or profile-photo upload on the student dashboard (portrait *reference* photos are explicitly collected over WhatsApp per the brainstorm's security notes, not uploaded to the site, so this component is not used for that flow).
- **Anatomy:** Drag-and-drop zone + a real, always-visible "Choose file" button (drag-and-drop is never the only way in, satisfying §7 rule 3's spirit even for file input), filename/thumbnail preview once selected, remove button.
- **Variants:** `single-file`, `image-only` (profile photo — client-side type/size validation before upload).
- **Sizes:** Drop zone min 120px tall, button 48px.
- **States:** `empty/dragging-over(visual highlight)/uploading(progress bar)/uploaded(preview+remove)/error(wrong file type/too large — specific text error, e.g. "File must be under 5MB," not a generic "Upload failed")`.
- **Desktop vs mobile:** Drag-and-drop is desktop-only behaviour by nature; mobile relies entirely on the native file picker via the "Choose file" button, which is already the required non-drag alternative.
- **Keyboard:** The "Choose file" button is a label wrapping a visually-hidden native `<input type="file">`, so it's natively keyboard-operable (`Enter`/`Space` opens the OS file picker) — no custom keyboard handling needed (rung 4).
- **ARIA:** Upload progress `role="progressbar"`; error text linked via `aria-describedby`.
- **Motion:** Progress bar fill is the only animation, not subject to reduced-motion (it reflects real upload progress, not decoration).
- **Tokens:** `border` dashed drop-zone outline, `peacock` dragging-over highlight, `kumkum` error text.

### Consent checkbox
- **Purpose:** Newsletter/WhatsApp-marketing opt-ins, parent/guardian consent for kids'-art purchases — **always unticked by default**, each consent type its own separate checkbox (never one bundled "I agree to everything").
- **Anatomy/Variants/Sizes/Keyboard/ARIA/Motion/Tokens:** Identical to the Checkbox primitive above.
- **States:** Adds one specific rule: this checkbox is **never pre-checked** and submitting the form with it required-but-unticked produces a clear inline error ("Please confirm you're the parent/guardian to continue"), not a silent block on the submit button.

### Form errors & success
- **Purpose:** Consistent inline validation pattern across every form in the site.
- **Anatomy (error):** Field border turns `kumkum`, an error icon appears, error text appears directly below the field, and (on submit) a summary list of all errors appears at the top of the form linking to each field.
- **Anatomy (success):** Field border turns `leaf` briefly (e.g. "Pincode valid"), or for whole-form success, a dedicated success panel/toast replaces the form (e.g. "Message sent").
- **Variants:** `inline-field`, `form-level-summary`, `toast` (see below).
- **States:** N/A — this *is* the states shared by other components; specified once here to avoid repeating the same error pattern 15 times above.
- **Keyboard:** On submit with errors, focus moves to the **error summary** (not silently to the first field), which lists each problem as a link; activating a link moves focus to that field.
- **ARIA:** Error summary is `role="alert"` (or a focused heading + `aria-live="assertive"` region) so it's announced immediately; each field's error text has a unique `id` referenced by that field's `aria-describedby`; `aria-invalid="true"` on the field itself.
- **Motion:** None beyond the standard field colour transition.
- **Tokens:** `kumkum` error, `leaf` success, `charcoal` summary heading text.

### Toast
- **Purpose:** Transient confirmation (Add to Cart, Wishlist saved, Notes saved failure, etc.).
- **Anatomy:** Small rounded panel, icon + message, auto-dismiss timer, optional action link ("View Cart"), manual close button.
- **Variants:** `success`(leaf icon), `error`(kumkum icon), `info`(peacock icon) — icon **and** text differ per type, never colour alone.
- **Sizes:** Auto-width, max ~360px, min height 48px.
- **States:** `entering/visible/exiting`.
- **Desktop vs mobile:** Bottom-right stack desktop, bottom-centre (above any sticky add-to-cart bar / tab bar) mobile — stacking order/position must avoid covering the sticky bar's button.
- **Keyboard:** The close button and any action link are focusable; a toast **never steals focus on appearance** (that would interrupt whatever the user was doing) — it's announced via ARIA instead.
- **ARIA:** `role="status" aria-live="polite"` for success/info, `role="alert" aria-live="assertive"` for error (errors need more urgency); auto-dismiss timing is generous enough (≥5s, or persists until manually dismissed for errors) to meet WCAG 2.2.1's timing-adjustable spirit.
- **Motion:** Slide-up+fade-in `200ms`, auto-dismiss fade-out `200ms`; reduced-motion = instant appear/disappear, timer duration unchanged (timing isn't a motion concern).
- **Tokens:** `surface` bg, `shadow-md`, per-variant icon colour (`leaf`/`kumkum`/`peacock`), `toast` z-index.

### Modal / dialog
- **Purpose:** Generic confirmation/decision dialogs (e.g. "Remove this item?", "Leave without saving notes?") — the base primitive that Cart drawer/Lightbox/Bottom sheet extend with their own layout, but share focus/keyboard behaviour with.
- **Anatomy:** Centred panel, heading, body text, action buttons (primary + secondary/cancel), close icon-button.
- **Variants:** `confirmation`(short, 1-2 buttons), `content`(larger, scrollable body — e.g. a policy excerpt shown inline).
- **Sizes:** Max-width ~480px (confirmation) / ~640px (content), auto height, scrollable body if content exceeds viewport.
- **States:** `open/closed`.
- **Desktop vs mobile:** Centred overlay desktop; on narrow mobile widths it can expand to near-full-width with safe margins, but stays a centred/bottom dialog rather than converting to a full Bottom sheet (that's a distinct, separate component used when the content is inherently sheet-like, e.g. filters).
- **Keyboard:** Opens → focus to the heading or primary action. **Trapped.** `Esc` closes (treated as "Cancel") and **returns focus** to the triggering element (§7 rule 5, applied consistently with Drawer/Lightbox/Bottom sheet).
- **ARIA:** `role="dialog" aria-modal="true" aria-labelledby="[heading id]" aria-describedby="[body id]"`.
- **Motion:** Backdrop fade + panel scale-in (0.95→1) `200ms`; reduced-motion = instant show, no scale.
- **Tokens:** `overlay-backdrop`, `modal` z-index, `surface` panel, `shadow-lg`, `radius-ui`.

### Bottom sheet
- **Purpose:** Mobile-preferred alternative to a centred modal for content that benefits from a "slide up from the edge of the device" metaphor (Filters, Lesson sidebar on mobile).
- **Anatomy/States/Desktop-mobile/Keyboard/ARIA/Motion/Tokens:** As specified under Filter sidebar & bottom sheet above — this is the same underlying primitive; not re-specified to avoid duplicating the exact same dialog-focus-trap/Esc/return-focus rules a third time (rung 2: reuse, don't restate).

---

## 7. Feedback

### Skeletons
- **Purpose:** Loading placeholders for cards, images, text blocks, price, line items — used everywhere above as the referenced "loading" state.
- **Anatomy:** Grey block(s) shaped to approximate the real content's layout (image-ratio box, text-line bars of varying width), optional shimmer gradient sweep.
- **Variants:** `card`, `image`, `text-line`, `avatar-circle` (matches whatever shape it's standing in for).
- **Sizes:** Matches the real component's dimensions exactly, to avoid layout shift when content swaps in (this is the actual purpose — CLS prevention, not just a visual nicety).
- **States:** `loading → loaded (instant content swap, no cross-fade needed since the skeleton's job is just to hold space and signal activity)`.
- **Desktop vs mobile:** Same shapes, scaled to the real component's responsive size at each breakpoint.
- **Keyboard:** Not focusable.
- **ARIA:** The containing region has `aria-busy="true"` while skeletons are shown (flips to `false` on load); skeletons themselves are `aria-hidden="true"` (they carry no information).
- **Motion:** Shimmer sweep `1.2s` linear infinite loop; **fully disabled** under `prefers-reduced-motion: reduce` (static grey blocks only — a continuously looping animation is exactly the kind of thing that rule exists for).
- **Tokens:** `skeleton`/`border` shimmer tokens, matches the real component's `radius`.

### Empty states
- **Purpose:** Empty cart, empty wishlist, no search/filter results, no orders yet, no notes yet.
- **Anatomy:** Small illustration/icon (can reuse a simplified rangoli motif for brand consistency) → short heading → one line of supporting text → one primary action (e.g. "Browse the Shop").
- **Variants:** One shared component, content props vary per context.
- **Sizes:** Centred block, generous vertical padding (spacing `64`/`96`) so it doesn't look like a broken page.
- **States:** N/A (it *is* a state of its parent container).
- **Desktop vs mobile:** Same, text/illustration scale down slightly on mobile.
- **Keyboard/ARIA:** Primary action is a normal focusable link/button; the heading should be a real heading element at the appropriate level for the page's outline, not just styled text (so AT users navigating by headings still find it).
- **Motion:** Simple fade-in, `200ms`; reduced-motion = instant.
- **Tokens:** `muted` supporting text, `charcoal` heading, `kumkum`/`peacock` primary action per context.

### Error pages
- **Purpose:** 404, 500, and a generic "something went wrong" boundary — same underlying component as Empty states, different copy/icon, kept as one reusable primitive (rung 2).
- **Anatomy:** Status illustration/code → heading ("Page not found" / "Something went wrong") → one line of plain-language explanation → primary action ("Go to Home" / "Try again") → secondary link ("Contact us").
- **Variants:** `404`, `500`, `network-error` (e.g. failed checkout call — includes a "Retry" button since the issue may be transient).
- **Sizes:** Full-page centred layout (keeps the header/footer so navigation never dead-ends).
- **States:** N/A.
- **Desktop vs mobile:** Same, scaled.
- **Keyboard/ARIA:** Page `<h1>` states the error plainly (not just an HTTP code) so screen reader users immediately understand what happened; "Retry" button where applicable has `aria-live="polite"` feedback on its own loading/failure.
- **Motion:** None beyond the shared Empty-state fade-in.
- **Tokens:** Shares Empty state tokens.

### Rating stars (display + input)
- **Purpose:** Testimonials, course cards (display); a review-submission form (input).
- **Anatomy (display):** 5 star icons, filled proportionally to the rating (supports halves visually), numeric value available to AT via label.
- **Anatomy (input):** 5 selectable star buttons, implemented as a `radiogroup` of 5 radios (whole-star selection only — no half-star input, since fractional manual rating adds UI complexity for marginal precision gain the use case doesn't need).
- **Variants:** `display`, `input`.
- **Sizes:** Icons 16px (inline, card context) / 24px (PDP/review form).
- **States (input):** `default/hover(preview fill up to hovered star)/focus-visible(current radio)/selected/disabled(after submission, becomes display-only)`.
- **Desktop vs mobile:** Identical; input's hover-preview has no meaningful mobile equivalent (no hover) — tapping a star directly selects it, which is sufize since selection itself is the primary interaction either way.
- **Keyboard:** Input = native radio-group arrow-key behaviour (←/→ moves the rating up/down one star, `Enter`/`Space` not even required since radios select on focus-move, matching native radio semantics).
- **ARIA:** Display: whole control wrapped as `role="img" aria-label="Rated 4.5 out of 5 stars"` (prevents a screen reader from announcing 5 separate meaningless star icons). Input: `role="radiogroup" aria-label="Your rating"`, each star `role="radio" aria-label="Rate 3 stars" aria-checked`.
- **Motion:** Hover-preview fill transition `100ms` (desktop only); reduced-motion = instant.
- **Tokens:** `marigold` or `turmeric`-adjacent fill — **note:** since both those tokens are banned as text colour but this is a graphical fill (an icon shape, not text), they're usable here; pick `marigold` fill with a `charcoal` outline stroke so the star shape reads clearly even for a user with low colour vision (shape + outline, not fill-colour alone, conveys "filled vs empty").

### Testimonial card
- **Purpose:** Customer/student reviews with photo and rating (brief, Home).
- **Anatomy:** Photo (or initials-avatar fallback) → name → role caption ("Customer" / "Rangoli for Beginners student") → rating stars (display) → quote text → optional "Verified buyer" badge.
- **Variants:** `customer`, `student`, `with-video` (optional short video testimonial — adds a play-icon overlay on the photo instead of a static image, reusing the Video player wrapper on click).
- **Sizes:** Fits the Carousel item sizing (Home strip) or a static grid (About page).
- **States:** `default` (static content) — no interactive states of its own beyond the optional video trigger.
- **Desktop vs mobile:** Carousel on Home (see Carousel), simple stacked list on About if used there instead.
- **Keyboard/ARIA:** Quote wrapped in `<blockquote>` with `<cite>` for the name (native semantic elements, free correctness); avatar images use real `alt` text ("Photo of [Name]") or `alt=""` if it's a generic placeholder avatar rather than an actual customer photo.
- **Motion:** Shares Carousel's motion spec where used inside one.
- **Tokens:** `surface` card bg, `shadow-xs`, `muted` role caption, `leaf` "Verified buyer" badge.

### Stats counter
- **Purpose:** "Artworks created, students taught, events decorated, happy customers" (brief, About page).
- **Anatomy:** Large number + short label, optionally animating from 0 to the final value when scrolled into view.
- **Variants:** `animated` (desktop default, motion allowed), `static` (reduced-motion fallback — see Motion).
- **Sizes:** Number at Display/H1 scale, label at Caption scale.
- **States:** `before-view(0 or hidden)/animating/settled`.
- **Desktop vs mobile:** Identical; grid of 4 stacks to 2×2 on mobile.
- **Keyboard:** N/A (static display).
- **ARIA:** The whole stat is wrapped `role="img" aria-label="500 plus artworks created"` (or simply ensure the final number is present as real text with the animation happening on a visually-separate, `aria-hidden` element) so a screen reader announces the end value once, instead of reading rapidly-changing numbers or nothing at all during the count-up — this is the correct fix, not an afterthought.
- **Motion:** Count-up `1200ms ease-out`, once per page view, triggered on scroll-into-view; **fully disabled** under `prefers-reduced-motion: reduce` — the final number renders immediately with no animation, per brainstorm §5's blanket reduced-motion rule.
- **Tokens:** `kumkum` or `peacock` number colour (pick one consistently, recommend `charcoal` actually for restraint — the "90% neutral" rule applies here too, numbers don't need to shout), `muted` label.

### Timeline
- **Purpose:** About page "milestones: exhibitions, awards, workshops, media features" (brief).
- **Anatomy:** Vertical ordered list, each entry = year + title + short description, connected by a simple CSS line (no JS/SVG path-drawing needed — a `border-left` on the list plus a dot per item achieves the same visual with zero extra dependency, rung 3/4).
- **Variants:** `vertical` only (kept to one layout — a horizontal-scroll timeline is a common pattern but adds swipe/keyboard-nav complexity this content doesn't need at typical milestone-list lengths; vertical works at every breakpoint unmodified).
- **Sizes:** Connector dot 12px, line 2px.
- **States:** Static.
- **Desktop vs mobile:** Identical (this is exactly why the vertical-only choice above is the lazy-correct one — no breakpoint-specific variant to build or maintain).
- **Keyboard/ARIA:** Semantic `<ol>` of entries; each entry's year acts as a `<time datetime="...">` element (native semantics over custom ARIA, rung 4).
- **Motion:** Scroll-reveal fade-up per entry, same batching/reduced-motion rule as Masonry grid.
- **Tokens:** `peacock` connector line+dots, `charcoal` titles, `muted` descriptions.

### WhatsApp floating button
- **Purpose:** Enquiries/custom orders (brief: floating WhatsApp button, present globally).
- **Anatomy:** Fixed-position circular icon button, bottom-right (or bottom-left, pick one and keep it consistent with the Mobile drawer's opening edge so the two don't conflict spatially), opens `https://wa.me/[number]?text=[prefilled enquiry message]` in a new tab.
- **Variants:** `default` (icon only), `expanded` (icon + "Chat with us" label, shown on first load / before first scroll, then collapses to icon-only — a cheap discoverability aid, not required but low-cost).
- **Sizes:** 56×56px (above the 44px minimum, deliberately larger since it's a primary conversion action per the brainstorm's revenue-ranking of enquiries).
- **States:** `default/hover/focus-visible/active` · **`hidden`** — must yield when it would overlap the Sticky add-to-cart bar (PDP mobile) or any open Drawer/Modal/Sheet (those already have their own primary actions and higher z-index; the FAB should not float on top of or behind an open overlay in a confusing way).
- **Desktop vs mobile:** Same component both; position respects safe-area-inset padding on notched mobile devices.
- **Keyboard:** Standard link/button; opening a new tab is announced via a visually-hidden "(opens WhatsApp in a new tab)" suffix in its accessible name.
- **ARIA:** `aria-label="Chat with us on WhatsApp (opens in new tab)"`.
- **Motion:** Icon-only↔expanded-label transition `200ms`; reduced-motion = instant, no slide/scale; the button itself never pulses/bounces continuously (a persistently animating FAB is a classic unnecessary-distraction anti-pattern the brief's "never distracting from the art" principle rules out).
- **Tokens:** WhatsApp's own brand green is used **only** for this one element (it's a recognised, functional brand mark, not part of the site's rangoli palette) — `fab` z-index, `shadow-md`.

---

## 8. Per-page accessibility test checklist (WCAG 2.2 AA)

Run this on **every** page before sign-off; page-specific rows follow the global list.

### Global (every page, every language)
- [x] `<html lang="en">` and switches to `lang="mr"`/`lang="hi"` correctly when the language switcher is used (3.1.1, 3.1.2).
- [x] Skip link is the first focusable element and jumps to `<main>` (2.4.1).
- [x] Heading order is logical (one `<h1>`, no skipped levels) (1.3.1, 2.4.6).
- [x] Every image has correct `alt` (descriptive for art/content images, `alt=""` for decorative) (1.1.1).
- [x] Colour contrast: body text ≥4.5:1, large text/UI components ≥3:1 — spot-check `marigold`/`turmeric` are never used as text (1.4.3, 1.4.11).
- [x] Zoom to 400%/reflow to 320px wide: no horizontal scroll, no content/functionality loss (1.4.10).
- [x] Text spacing override (line-height 1.5×, paragraph spacing 2×, etc.) doesn't clip or overlap content (1.4.12).
- [x] All interactive elements reachable and operable by keyboard alone, in a logical order matching visual order (2.1.1, 2.4.3).
- [x] No keyboard trap anywhere outside intentional dialogs (and those release correctly) (2.1.2).
- [x] Focus indicator visible on every focused element, 2px `peacock`, never suppressed (2.4.7, 2.4.11, 2.4.13).
- [x] Every icon-only button/link has an accessible name (`aria-label` or visually-hidden text) (4.1.2).
- [x] Every touch target ≥24×24px minimum, ≥44×44px on primary actions, with adequate spacing (2.5.8).
- [x] Any drag/swipe interaction has a button alternative (2.5.7).
- [x] No content flashes more than 3×/second (2.3.1) — relevant to the loader/animations.
- [x] `prefers-reduced-motion: reduce` disables hover-zoom, scroll-reveal, rangoli self-draw, carousel auto-rotate, count-up, shimmer (per brainstorm §5).
- [x] Status messages (toasts, cart updates, form results) use `aria-live`/`role="status"`/`role="alert"` appropriately, without moving focus unexpectedly (4.1.3).
- [x] WhatsApp FAB doesn't overlap/obscure other controls at any breakpoint and has an accessible name (2.4.11, 4.1.2).
- [ ] Cookie/consent banner (brainstorm §8) doesn't trap focus and is dismissible by keyboard (2.1.2).

### Home
- [ ] Hero image/slider has a visible button alternative to any auto-rotation; auto-rotation pauses on hover/focus and under reduced motion (2.2.2).
- [ ] Category tiles, featured carousel, Instagram grid: all operable by keyboard with visible focus (2.1.1, 2.4.7).
- [ ] Newsletter signup: label above field, error summary + per-field errors, consent checkbox unticked by default (3.3.1, 3.3.2).

### Shop (listing)
- [ ] Filter sidebar (desktop)/bottom sheet (mobile): sheet traps focus, closes on Esc, returns focus to trigger (2.4.3, 2.1.2).
- [ ] Sort `<select>` is a real native select or fully keyboard-operable custom listbox (4.1.2).
- [x] Badges ("Sold," "New," "Sale") communicated via text, not colour alone (1.4.1).
- [ ] "Load more"/pagination announces newly loaded item count via a live region without stealing focus (4.1.3).
- [ ] Empty filter-result state has a real heading and a "Clear filters" action (2.4.6).

### Product detail
- [ ] Image gallery zoom has a non-gesture (button) alternative (2.5.7).
- [x] Variant/framing `radiogroup` is keyboard-operable, selected state isn't colour-only (4.1.2, 1.4.1).
- [x] Pincode checker result announced via `aria-live`, input has `autocomplete="postal-code"` (4.1.3, 1.3.5).
- [x] Sticky Add-to-Cart bar (mobile) sits in correct tab order matching the visual flow, doesn't cover the WhatsApp FAB in a way that both become untappable (2.4.3, 2.5.8).
- [x] Add to Cart success is confirmed via a toast/live region, not colour change alone (4.1.3).

### Cart & checkout
- [ ] Cart drawer traps focus, closes on Esc, returns focus to the cart icon (2.1.2, 2.4.3).
- [ ] Guest checkout works end to end with no forced account creation (brainstorm §7 rule 8).
- [ ] Checkout stepper: completed steps are real, keyboard-operable links back; upcoming steps correctly `aria-disabled` (4.1.2).
- [x] Payment method list has UPI listed first in both visual and DOM order (brainstorm §7 rule 7).
- [x] All address/payment fields: label above field, correct `type`/`inputmode`/`autocomplete`, inline + summary error handling (3.3.1, 3.3.2, 1.3.5).
- [ ] No information already given earlier in the same checkout session is re-requested (3.3.7).
- [ ] Order summary total updates are announced via `aria-live` after any recalculation (4.1.3).

### Artwork (gallery)
- [ ] Masonry grid tab order is sensible even where CSS column order diverges slightly from strict visual row order; verify it doesn't actively confuse (2.4.3).
- [x] Lightbox: focus trapped, prev/next have visible buttons (not swipe-only), Esc returns focus to the originating grid item (2.1.2, 2.5.7, 2.4.3).
- [x] Not-for-sale artworks still get full artist-written alt text and story content, exactly like purchasable ones (1.1.1).
- [ ] Filter tabs (All/Drawings/Paintings/Rangoli/Festival/Commissions) use the ARIA Tabs keyboard pattern (4.1.2).

### Courses (listing + detail)
- [ ] Course cards: Level chip text is present (not colour-only), rating stars have an `role="img"` accessible name (1.4.1, 1.1.1).
- [ ] Curriculum accordion: locked lessons are announced as locked with a reason, not silently inert (4.1.2).
- [ ] Free sample lesson is reachable and playable without login (verify no auth wall accidentally blocks it).
- [ ] Video player: captions available and on by default or one click away, transcript link present, all controls keyboard-operable with visible focus (1.2.2, 2.1.1, 2.4.7).

### Student dashboard
- [ ] Progress bar/ring has `role="progressbar"` with correct `aria-valuenow`/label (4.1.2).
- [ ] Certificate download button's accessible name includes course + date, not just "Download" (2.4.6, 4.1.2).
- [ ] Student name/email isn't re-requested anywhere it's already known from the account (3.3.7).
- [ ] Notes editor autosave status is announced via `aria-live`, content never lost on an autosave failure (4.1.3).

### About / Contact
- [ ] Timeline entries use semantic `<ol>`/`<time>`, readable without relying on the connecting line graphic (1.3.1).
- [ ] Stats counters announce the final value correctly to AT regardless of animation state/reduced-motion (4.1.3, 2.3.3).
- [ ] Contact form: label above field, enquiry-type select is a real `<select>`, honeypot/rate-limit don't block legitimate keyboard/AT submission (3.3.1, 4.1.2).
- [ ] Google Map embed has an accessible title/label and doesn't trap keyboard focus while scrolling the page (2.1.2, 2.4.6).

---

## 9. Tailwind config token map (`theme.extend`)

```js
// tailwind.config.js (theme.extend excerpt)
// Colours are CSS custom properties so a future dark theme is a variable swap,
// not a refactor (see Foundations 0.1, dark-mode decision).
module.exports = {
  darkMode: false, // not shipped at launch — see Foundations 0.1 for rationale
  theme: {
    extend: {
      colors: {
        paper:    'var(--color-paper, #FAF6EF)',
        surface:  'var(--color-surface, #FFFFFF)',
        charcoal: 'var(--color-charcoal, #1E1B18)',
        muted:    'var(--color-muted, #5F574F)',
        border:   'var(--color-border, #857B70)',
        kumkum:   'var(--color-kumkum, #A6261D)',
        peacock:  'var(--color-peacock, #0B5E73)',
        marigold: 'var(--color-marigold, #E8890C)', // fill only, never text
        turmeric: 'var(--color-turmeric, #F2B705)', // decoration only, never text
        leaf:     'var(--color-leaf, #2E6B3C)',
        whatsapp: '#25D366', // brand mark exception, FAB only
      },

      // Spacing: Tailwind's default scale (0.25rem steps) already covers
      // 4/8/12/16/24/32/48/64/96/128px via keys 1/2/3/4/6/8/12/16/24/32 —
      // intentionally NOT overridden (rung 4: native scale already fits).

      fontFamily: {
        heading: ['"Tiro Devanagari Marathi"', '"Martel"', 'serif'],
        body: ['"Mukta"', 'sans-serif'],
      },

      // fontSize values are [size, { lineHeight }] pairs for the *Latin*
      // line-heights. Devanagari overrides apply via a `:lang(mr), :lang(hi)`
      // rule in globals.css (a language-attribute CSS selector is the
      // correct native tool here, not a parallel Tailwind font-size scale).
      fontSize: {
        display:   ['4rem',    { lineHeight: '1.1' }],   // 64px desktop
        'display-sm': ['2.5rem', { lineHeight: '1.1' }], // 40px mobile
        h1:        ['3rem',    { lineHeight: '1.15' }],  // 48px
        'h1-sm':   ['2rem',    { lineHeight: '1.15' }],  // 32px
        h2:        ['2.25rem', { lineHeight: '1.2' }],   // 36px
        'h2-sm':   ['1.625rem',{ lineHeight: '1.2' }],   // 26px
        h3:        ['1.5rem',  { lineHeight: '1.25' }],  // 24px
        'h3-sm':   ['1.25rem', { lineHeight: '1.25' }],  // 20px
        body:      ['1.125rem',{ lineHeight: '1.6' }],   // 18px
        'body-sm': ['1rem',    { lineHeight: '1.6' }],   // 16px
        caption:   ['0.875rem',{ lineHeight: '1.5' }],   // 14px
        'caption-sm': ['0.8125rem', { lineHeight: '1.5' }], // 13px
        label:     ['0.875rem',{ lineHeight: '1.4' }],   // 14px
      },

      // Devanagari line-height overrides, consumed via :lang() in globals.css,
      // not as Tailwind utility classes (keeps one font-size scale, not two).
      lineHeight: {
        deva:      '1.75', // body
        'deva-heading': '1.4', // headings, see Foundations 0.2 table
      },

      borderRadius: {
        none: '0px',     // artwork imagery
        ui: '6px',        // buttons, inputs, cards, badges, chips
        sheet: '20px',    // bottom sheet / drawer top corners only
        full: '9999px',   // avatars, dots, stepper buttons, progress ring
      },

      boxShadow: {
        xs: '0 1px 2px rgb(30 27 24 / 0.05)',
        sm: '0 4px 12px rgb(30 27 24 / 0.08)',
        md: '0 8px 24px rgb(30 27 24 / 0.10)',
        lg: '0 16px 48px rgb(30 27 24 / 0.16)',
        frame: '0 12px 28px rgb(30 27 24 / 0.18), 0 2px 6px rgb(230 160 10 / 0.08)',
      },

      zIndex: {
        base: '0',
        dropdown: '20',
        'sticky-header': '30',
        'overlay-backdrop': '40',
        fab: '45',
        drawer: '50',
        modal: '60',
        popover: '65',
        toast: '70',
        tooltip: '80',
        'skip-link': '100',
      },

      // Breakpoints intentionally left as Tailwind defaults:
      // sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536
      // (lg = sidebar<->sheet / dropdown<->drawer switch point,
      //  xl = 1200px content container cap).
      container: {
        center: true,
        padding: '1.25rem', // 20px mobile margin, per brief's 4-col/20px grid
        screens: { xl: '1200px' },
      },

      // Focus ring (applied via a `.focus-ring` utility or per-component
      // `focus-visible:` classes, not a global outline reset):
      // outline: 2px solid theme('colors.peacock');
      // outline-offset: 2px;
      ringColor: {
        focus: 'var(--color-peacock, #0B5E73)',
      },
    },
  },
}
```

```css
/* globals.css — Devanagari line-height + motion/reset pieces that belong
   in CSS, not the Tailwind config (native :lang() and media-query
   selectors, not reimplemented as utility classes). */
:lang(mr), :lang(hi) {
  line-height: 1.75; /* body text in Marathi/Hindi */
}
:lang(mr) h1, :lang(mr) h2, :lang(mr) h3,
:lang(hi) h1, :lang(hi) h2, :lang(hi) h3 {
  line-height: 1.4; /* headings need less than body but more than Latin */
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

:focus-visible {
  outline: 2px solid theme('colors.peacock');
  outline-offset: 2px;
}
:focus:not(:focus-visible) {
  outline: none;
}
```

Skipped on purpose, add when the need actually shows up: a second (dark) theme, a mega-menu grid, a JS masonry/carousel library, a rich-text notes editor, a searchable-select component, and a numbered-pagination UI — each has a one-line rationale next to it above (YAGNI/native-feature/reuse), and each has a stated upgrade path if real usage proves it's needed.
