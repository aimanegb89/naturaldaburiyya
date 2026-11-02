# AGENTS.md

- Products live in the `products` table (edited at `/admin`, admin role via `user_roles`); `CatalogProvider` loads them into `catalog` in `src/lib/catalog.ts`, with `src/data/products.ts` as fallback list and image source; merchandising extras stay in `src/data/product-meta.ts` — so the manager edits products without code changes.
- New UI copy uses inline `useTx()({ ar, he, en })` from `src/lib/i18n.ts`; the legacy `t()` keys remain for existing strings — avoids growing the giant translation map.
- Storefront pages wrap content in `AppShell` (header, footer, bottom nav); the cart drawer is mounted once in `App.tsx` and opened via `useCartDrawer` — so any page can open the cart.
- `vite.config.ts` defines fallback public backend URL/key because published builds were shipping without `.env` — do not remove.
- Availability reminder: `availability-reminder` edge function sends FCM pushes to `admin_push_tokens`; pg_cron calls it at 13:50 and 14:50 UTC and the function acts only at 16:xx Jerusalem — DST-safe single daily send.
