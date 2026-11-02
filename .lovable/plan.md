# Navigation, Settings, Shop and Theme update

## 1. New "My Orders" page (bottom bar)
- New page `/orders` with two parts:
  - **Track an order**: enter order number + phone (same lookup as the current tracking page; tracking links keep working).
  - **Order history**: signed-in customers see their past orders with status and a "Track" link; guests see a sign-in prompt.
- Bottom bar becomes: Home, Shop, My Orders, Cart. Profile and Wishlist are removed from it.

## 2. Side menu
- Add **Profile** (or Sign in when signed out), **Wishlist**, **My Orders** and **Settings** links.
- Language and theme switches move out of the menu into Settings.

## 3. Settings page
- New page `/settings` with: Language (العربية / עברית / English) and Theme (Light / Dark / Auto).

## 4. Shop page
- Opening Shop shows all products grouped by category (a heading per category), no sorting applied by default.
- Sorting still available; picking one switches to a flat sorted list.

## 5. Back button from category
- When a category is opened from the home page, the Shop page shows a back button (arrow points the right way in RTL) that returns to Home.

## 6. Theme back to original green and white
- Light mode: white/cream background, sage-green primary, charcoal text, terracotta/gold accents (the original look).
- Dark mode: a matching dark green version. Light / Dark / Auto toggle stays.

## Technical notes
- Update `BottomNav.tsx`, `Header.tsx` sheet; new `src/pages/Orders.tsx`, `src/pages/Settings.tsx`, routes in `App.tsx`.
- Shop: default sort `none` → grouped render by `SHOP_CATEGORIES`; `?from=home` param set by home category tiles shows back button.
- Restore earlier `:root` tokens in `src/index.css`; rewrite `.dark` tokens in green tones; update memory/AGENTS.md theme line.
