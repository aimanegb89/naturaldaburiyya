# Midnight & Champagne theme + light/dark/auto switch, and order tracking page

## 1. Theme
- Dark mode = Midnight & Champagne: obsidian background #0D0E11, slate cards #1A1C22, hairline borders #2A2D36, champagne-gold buttons and highlights, warm ivory text, muted slate secondary text.
- Light mode = a matching light version: warm ivory background, white cards, charcoal text, the same champagne-gold accents (replaces the current sage/cream look).
- Theme switch with three options: Light, Dark, Auto (follows the phone/computer setting). Default: Auto. The choice is remembered.
- The switch sits in the header (computer), in the side menu (phone), and in the manager settings page.
- Check every page in both modes: home, shop, product, cart, checkout, profile, manager pages; fix any hardcoded colors, and make sure the logo and photos look good on dark.

## 2. Order tracking page (`/track`)
- Customer enters an order number (shown on the confirmation screen, e.g. #A1B2C3) plus the phone number used in the order, and sees: status steps (Received -> Preparing -> Done), items, total, and order date.
- Tracking link: the confirmation screen shows a "Track order" button and a copyable link (`/track/<code>`) that opens the status directly, no sign-in needed. The link is also included in the WhatsApp message when that channel is on.
- Signed-in customers get a "Track" button on each order in their profile.
- Status updates live while the page is open when the manager moves the order between tabs.
- Arabic / Hebrew / English, right-to-left respected.

## Technical details
- `next-themes` ThemeProvider (attribute="class", defaultTheme="system"); rewrite `:root` and `.dark` tokens in `src/index.css`; new `ThemeToggle` component (3-option segmented control).
- Migration: add `orders.tracking_code` (short unique code, default generated, backfilled) and store the customer phone on the order if not already present.
- New edge function `track-order`: looks up by tracking code (link) or code + phone (form), returns only safe fields (status, items, total, dates) — no address or personal data. Orders stay private in the database.
- `place-order` returns `tracking_code`; Checkout confirmation and WhatsApp message use it; Profile orders link to `/track/<code>`.
- Live updates via polling every 20s (avoids opening the orders table to the public).
- Routes `/track` and `/track/:code` inside `AppShell`; record the tracking rule in AGENTS.md.
