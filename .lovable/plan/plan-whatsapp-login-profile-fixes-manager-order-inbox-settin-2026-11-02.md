# Plan: WhatsApp login, profile fixes, manager order inbox, settings

## 1. WhatsApp code sign-in (default)
- Sign-in page opens on a "Phone (WhatsApp)" tab by default; "Email" stays as a second tab.
- Customer enters phone, gets a 6-digit code on WhatsApp, types it in, and is signed in. First-time phones get an account created automatically (name asked once).
- Codes expire after 5 minutes, max 5 tries, max 1 new code per 60 seconds.
- Needs the WhatsApp Business connection (see section 5). Meta must approve a short "authentication" message template (can take up to 48 hours) before codes can be sent to customers.

## 2. Profile page
- Fix right-to-left layout on all tabs (labels, inputs, icons, back/sign-out row, tab bar).
- Move the Edit button to the top of the "My information" card, next to the header, small (icon + word), on the left side in Arabic/Hebrew (opposite the title). Save/Cancel appear in the same spot while editing.

## 3. Orders go to the manager app
- Confirming an order saves it and sends a push notification to every manager phone ("New order #1234 – ₪85"). Customer sees a confirmation screen instead of being sent to WhatsApp (when that mode is on).
- Guests can still order: name + phone are saved with the order.
- New manager home page: list of orders with three tabs at the top — New, Preparing, Done — with counts. Each order card shows customer, phone (tap to call/WhatsApp), address, items, sizes, total, notes, time. Buttons move it: New -> Preparing -> Done. List refreshes live when a new order arrives.
- Product management moves under Settings (section 4).

## 4. Manager settings page
- Bottom/top menu in the manager app: Orders | Settings.
- Settings:
  - Order delivery: toggle "Push notification" or "WhatsApp message" (applies to all customers instantly).
  - Notifications: enable on this phone + send test.
  - Menu management: the current product list, add/edit, availability switches.
  - QR code.

## 5. What I need from you to test Firebase notifications
1. Open Connectors -> Firebase Cloud Messaging -> edit the connection -> tick "Include web push" and paste from Firebase Console (Project settings):
   - Web API key and App ID (General tab, under your Web app — create a Web app there if none exists).
   - VAPID public key (Cloud Messaging tab -> Web Push certificates -> Generate key pair).
2. Publish, then open the live site (not the editor preview) on the manager phone, signed in as aimanegb@gmail.com, go to /admin -> Settings -> Enable notifications -> Allow.
3. iPhone: first add the site to the Home Screen and open it from the icon (iOS 16.4+), then enable.
4. Press "Test" — a notification should arrive.
For WhatsApp codes: connect your WhatsApp Business number via the connector card I'll show.

## Technical details
- DB migration: `orders` add `status` values (new/preparing/done), `customer_name`, `customer_phone`, allow `user_id` null for guests; admin SELECT/UPDATE policies via `has_role`; realtime on orders. New `store_settings` (single row, `order_channel` text; public read, admin write). New `phone_otps` (phone, code_hash, expires_at, attempts; service-role only).
- Order creation moves into an edge function `place-order` (validates with zod, recomputes prices from `products`, inserts order+items with service role, sends FCM to `admin_push_tokens` reusing the reminder's gateway code in `_shared/fcm.ts`).
- Edge functions `whatsapp-otp-send` / `whatsapp-otp-verify`: send via WhatsApp connector gateway template; on verify, find/create user with synthetic email `<digits>@phone.natural.local` + phone in profile, then `admin.generateLink({type:'magiclink'})` and return the hashed token; client calls `supabase.auth.verifyOtp({ token_hash, type:'email' })` to get a session.
- Admin routes: `/admin` (orders), `/admin/settings`; split Admin.tsx into `OrdersBoard`, `ProductsManager`, `SettingsPage`.
- Checkout reads `store_settings.order_channel` to choose push vs WhatsApp.
