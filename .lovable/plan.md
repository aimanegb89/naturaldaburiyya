# Order cancellation, working hours, live store status, and a separate admin app

## 1. Cancel an order (manager app)
- Each order card on the board gets a "Cancel order" button (for New and Preparing orders).
- Orders that are already done or cancelled can't be cancelled, and tapping twice cancels only once.
- Tapping it opens a "Cancel order #123?" pop-up that warns it can't be undone, with quick reasons: Out of stock, Store closing, Customer request, Other (free text). The manager confirms or goes back.
- A cancelled order leaves the active tabs and shows in Done with a red "Cancelled" badge and the reason.
- Customer tracking page shows "Cancelled" with the reason instead of the progress bar.

## 2. Tell the customer by phone notification
- After placing an order, the confirmation screen and the tracking page show "Get notified about your order". Tapping it asks the phone for notification permission. This works for guests too, because the permission is tied to the order rather than the account.
- When the manager cancels, the customer gets one notification, in the language they used to order, such as "Order cancelled: your order #123 was cancelled by the store (Out of stock)". Tapping it opens the order. If the notification fails, the order stays cancelled.
- Limitation: customers who never allow notifications see the cancellation only on the tracking page. On iPhone, notifications work only if the shop app was added to the Home Screen.

## 3. Working hours and open/closed status
- New "Store availability" section in the manager app. It shows the current status, the mode (Automatic or Manual), today's hours, and the next opening or closing time.
- Weekly hours: each weekday can have one or more time slots (for example 09:00–14:00 and 17:00–22:00), or be marked closed. Late-night slots that run past midnight work too. All times are Jerusalem time.
- Special dates: closed days or different hours for a specific date, such as a holiday or a temporary closure.
- Three modes: Automatic (follows the hours), Manually open, Manually closed. A manual choice stays on until the manager taps "Back to automatic".
- Every manual status change and every cancellation is saved in a history log, with who did it and when.
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
- DB: `orders.cancel_reason`, `cancelled_at`, `cancelled_by`, `locale`; `cancelled` excluded from auto-done. New `order_push_tokens(order_id, token)` (service_role only). `store_settings` stays the single source of truth: `weekly_hours jsonb` (weekday → list of {open, close}, close<open = overnight), `date_overrides jsonb` (date → closed or slots), `manual_mode text` ('auto'|'open'|'closed'). New `store_audit_log(actor, action, details, created_at)` admin-read only. SQL `store_status()` returns is_open/mode/next_change in Asia/Jerusalem, also checking yesterday's overnight slots.
- Edge functions: new `cancel-order` (has_role admin; atomic `UPDATE ... WHERE status IN ('new','preparing')` so duplicates no-op; audit row; then localized FCM to order tokens through `_shared/fcm.ts`, errors logged not rolled back); new `set-store-status` (admin, writes mode + audit); new `register-order-push` (validates tracking_code, stores token); `place-order` rejects with `store_closed` when `store_is_open()` is false; `track-order` returns cancel reason.
- Client: `useStoreStatus` hook (store_settings + realtime + minute timer) used by header pill, admin pill, and Checkout guard; customer push reuses `src/lib/push.ts` with a customer variant; service worker click opens `/track`.
- Subdomain: hostname check `admin.` in `App.tsx` routes `/` to the admin shell and serves `manifest-admin.webmanifest` with `scope: /`; `useAdminManifest`/inline script updated; OAuth redirect uses `window.location.origin`; FCM admin links use the admin origin; AGENTS.md PWA rule updated.
