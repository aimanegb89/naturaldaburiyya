# AGENTS.md

- Product data lives in `src/data/products.ts`; extra merchandising data (goals, ingredients, new/popularity) in `src/data/product-meta.ts`, merged by `src/lib/catalog.ts` — UI should consume `catalog`, so products keep one source of truth.
- New UI copy uses inline `useTx()({ ar, he, en })` from `src/lib/i18n.ts`; the legacy `t()` keys remain for existing strings — avoids growing the giant translation map.
- Storefront pages wrap content in `AppShell` (header, footer, bottom nav); the cart drawer is mounted once in `App.tsx` and opened via `useCartDrawer` — so any page can open the cart.
- `vite.config.ts` defines fallback public backend URL/key because published builds were shipping without `.env` — do not remove.
