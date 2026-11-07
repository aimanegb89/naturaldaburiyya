# Order cancellation, working hours, live store status, and a separate admin app

## 1. Cancel an order (manager app)
- Each order card on the board gets a "Cancel order" button (for New and Preparing orders).
- Tapping it opens a confirmation pop-up with quick reasons: Out of stock, Store closing, Customer request, Other (free text). The manager confirms or goes back.
- A cancelled order leaves the active tabs and shows in Done with a red "Cancelled" badge and the reason.
- Customer tracking page shows "Cancelled" with the reason instead of the progress bar.

## 2. Tell the customer by phone notification
- After placing an order, the confirmation screen and the tracking page show "Get notified about your order". Tapping it asks the phone for notification permission. This works for guests too, because the permission is tied to the order rather than the account.
- When the manager cancels, the customer gets a notification like "Your order #123 was cancelled: Out of stock". Tapping it opens the tracking page.
- Limitation: customers who never allow notifications see the cancellation only on the tracking page. On iPhone, notifications work only if the shop app was added to the Home Screen.

## 3. Working hours and open/closed status
- New "Working hours" section in admin Settings: set opening and closing times for each weekday, or mark a day as closed (Jerusalem time).
- New "Store status" switch with three choices: Automatic (follows working hours), Open now, Closed now. The manager can close the shop during working hours, or open it outside them. "Open now" and "Closed now" return to Automatic when the next scheduled opening or closing time arrives, so the manager can't forget them.
- When the shop is closed, customers can still browse and fill their cart, but checkout is blocked with "We're closed now, we open at 08:00". The server also refuses orders while closed, so an old open page can't get around it.

## 4. Live status label in the top bar
- Customer app: a small pill in the header, green "Open · until 22:00" or grey "Closed · opens 08:00". It updates live when the manager changes the status.
- Manager app: the same pill in the admin header. Tapping it jumps to the store status switch.

## 5. Installing both apps on one phone
- The manager app moves to **admin.naturaldaburiyya.com**, with the shop staying on naturaldaburiyya.com. Phones treat two different addresses as two separate apps, so both can be installed side by side and notifications open the right one.
- On the admin address, the start page is the orders board, with its own app name, icon and install file. Shop pages there redirect to the main domain. The old naturaldaburiyya.com/admin redirects to the new address.
- You add the subdomain in Domains (Connect domain → admin.naturaldaburiyya.com). I'll walk you through it after the build.
- After that, managers delete the old installed manager app, open admin.naturaldaburiyya.com, sign in, and install. On iPhone this is done in Safari with Share → Add to Home Screen.
- Managers sign in once more on the new address.

## Technical details
- DB: `orders.cancel_reason text`, `orders.cancelled_at`; status `cancelled` excluded from auto-done. New `order_push_tokens(order_id, token)` (service_role only, written via edge function). `store_settings`: `hours jsonb` (per weekday open/close or closed), `manual_status text` ('auto'|'open'|'closed'), `manual_until timestamptz`. Shared SQL function `store_is_open()` evaluated in Asia/Jerusalem.
- Edge functions: new `cancel-order` (admin check via has_role, sets status/reason, sends FCM to order tokens through `_shared/fcm.ts`, prunes dead tokens); new `register-order-push` (validates tracking_code, stores token); `place-order` rejects with `store_closed` when `store_is_open()` is false; `track-order` returns cancel reason.
- Client: `useStoreStatus` hook (store_settings + realtime + minute timer) used by header pill, admin pill, and Checkout guard; customer push reuses `src/lib/push.ts` with a customer variant; service worker click opens `/track`.
- Subdomain: hostname check `admin.` in `App.tsx` routes `/` to the admin shell and serves `manifest-admin.webmanifest` with `scope: /`; `useAdminManifest`/inline script updated; OAuth redirect uses `window.location.origin`; FCM admin links use the admin origin; AGENTS.md PWA rule updated.
