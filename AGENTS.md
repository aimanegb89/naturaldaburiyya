# AGENTS.md

- Products live in the `products` table (edited at `/admin`, admin role via `user_roles`); `CatalogProvider` loads them into `catalog` in `src/lib/catalog.ts`, with `src/data/products.ts` as fallback list and image source; merchandising extras stay in `src/data/product-meta.ts` — so the manager edits products without code changes.
- New UI copy uses inline `useTx()({ ar, he, en })` from `src/lib/i18n.ts`; the legacy `t()` keys remain for existing strings — avoids growing the giant translation map.
- Storefront pages wrap content in `AppShell` (header, footer, bottom nav); the cart drawer is mounted once in `App.tsx` and opened via `useCartDrawer` — so any page can open the cart.
- `vite.config.ts` defines fallback public backend URL/key because published builds were shipping without `.env` — do not remove.
- Availability reminder: `availability-reminder` edge function sends FCM pushes to `admin_push_tokens`; pg_cron calls it at 13:50 and 14:50 UTC and the function acts only at 16:xx Jerusalem — DST-safe single daily send.
- Orders are created only via the `place-order` edge function (recomputes prices server-side, pushes to managers via `_shared/fcm.ts`); `store_settings.order_channel` decides if checkout also opens WhatsApp — so guest and signed-in orders both land in the manager inbox.
- Phone sign-in uses the `whatsapp-otp` edge function (WhatsApp template `login_code`), mapping each phone to a synthetic `<digits>@phone.natural.local` account and signing in via a magic-link token hash — Lovable Cloud has no native WhatsApp OTP.
- Manager app: `/admin` (Admin shell with OrdersBoard) and `/admin/settings` (channel toggle, push, ProductsManager).
- Order tracking: public lookups go through the `track-order` edge function using `orders.tracking_code` (+ phone for manual search) and return only status/items/total — orders stay private under RLS.
- Theme: `next-themes` (class, default system) with `:root`/`.dark` tokens in `src/index.css`; toggle is `ThemeToggle`.
