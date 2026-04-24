# Fixes Applied

## How to run locally

```bash
cd naturaldaburiyya-fixed

# 1. Create your .env file
cp .env.example .env
# Then fill in your Supabase credentials in .env

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```
Then open http://localhost:5173 in your browser.

---

## Changes made

### 🔴 Bug Fixes

1. **Cart now persists across page refreshes** (`CartContext.tsx`)
   - Cart is saved to `localStorage` and restored on load.

2. **Fixed wrong toast key on phone validation** (`CartDrawer.tsx`)
   - Was using `t('invalidEmail')` — now correctly uses `t('invalidPhone')`.

3. **Fixed `useMemo` stale closure in Menu** (`Menu.tsx`)
   - `currentProducts` now correctly recomputes when `searchQuery` or `language` changes.

4. **Fixed favicon type mismatch** (`index.html`)
   - Changed `type="image/svg+xml"` → `type="image/x-icon"` to match the `.ico` file.

### 🟡 UX & Reliability

5. **WhatsApp order message is now localized** (`CartDrawer.tsx`)
   - Order message sent to WhatsApp now uses Arabic, Hebrew, or English labels
     depending on the user's selected language.

6. **Supabase client no longer crashes the app** (`supabase/client.ts`)
   - Changed hard `throw new Error` to a `console.warn` — the app loads
     normally even without Supabase env vars; auth features just won't work.

### 💡 To do (not auto-fixed)

- Compress `src/assets/logo.png` (currently 1MB) — use squoosh.app or imagemin
- Add an `og:image` meta tag in `index.html` for social sharing previews
- Update the canonical URL from `https://natural-shop.com` to your real domain
