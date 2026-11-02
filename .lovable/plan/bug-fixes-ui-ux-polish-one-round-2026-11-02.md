# Bug fixes + UI/UX polish (one round)

Covers both uploaded lists, with your decisions applied:
- **Tracking:** looking up an order by its number goes away. The Track tab only shows the customer's own live orders (signed-in customers see their account's orders; guests see the orders placed on that device). Tracking links keep working.
- **Order numbers:** they stay 3 digits, but no two active orders can share a number. When every number is taken, the system says so instead of reusing one.

## Part 1: Security and money
- Agent (MCP) orders go through the normal order path. Prices are recalculated on the server, and the customer's name and phone are required.
- The app can no longer write orders straight into the database.
- Phone login hardening: nobody can create a fake phone-login account using email and password. Code attempts are counted in a way that can't be bypassed, and codes are stored with a secret key. On first sign-in the customer can give their name.
- Reviews never show a phone number or email as the reviewer name. Existing bad names are cleared.
- Placing an order: sends are limited per phone and per device, a double tap can't create two orders, the order and its items are saved together or not at all, and errors are clear and translated.
- Push notifications:
  - A device is removed only when Firebase says it is truly invalid.
  - The daily reminder uses correct Jerusalem time and sends once per day.
  - Notifications go out in parallel.
  - A device is unregistered when the manager signs out.
- Sign-in links can no longer send users to an outside website.

## Part 2: Correctness
- Auto-"done" for forgotten orders runs on the server every 5 minutes and uses the last status change. Pressing "back" on an old order sticks.
- Checkout:
  - Real error messages, including which product is unavailable, with an option to remove it.
  - The WhatsApp button appears on the confirmation screen only when the WhatsApp channel is on.
  - The total shown matches the server's total.
  - Fields have character limits.
- Prices: one shared rule decides the price. When a product has no large price, the size picker is hidden, so customers never see ₪0.
- Cart: bad saved data is cleaned out, quantity is capped at 50, and prices and availability are refreshed from the live menu.
- Product popup and product page: availability and prices behave the same everywhere. The selected size and quantity reset when you switch products.
- Menu updates show up without reloading the page.
- Profile page:
  - Order statuses are translated, and favorites show live product names.
  - If an address can't be deleted, you see an error message.
  - Addresses are checked before saving.
  - Phone accounts don't see the password section.
- Login page:
  - The back button now says "change phone number".
  - Phone numbers are checked the same way the server checks them.
  - Every error has a message in Arabic, Hebrew and English.
- Wishlist: hearts you add as a guest are kept when you sign in.
- Admin product editor:
  - Prices are checked before saving.
  - Old images are deleted when you replace them.
  - Uploaded file names are cleaned up.
- Admin page: a manager is never wrongly shown "no permission". A loading error is shown as an error.
- Star ratings load from a fast summary instead of downloading every review.

## Part 3: UI/UX
- Readable text: nothing smaller than 12px, and body text is 14px or larger.
- Accessibility:
  - Every icon-only button gets a label in all three languages.
  - Buttons you tap are at least 44px.
  - You can see which button has keyboard focus.
  - Animations stop for people who turn off motion in their phone settings.
- Checkout:
  - Field errors show right next to each field.
  - On phones, the confirm button stays at the bottom and shows the total.
  - Delivery and payment wording matches the active order channel.
- Loading: placeholder product cards show while the menu loads. Images load lazily and keep their shape, and the banner image gets a lighter version.
- Out of stock looks the same everywhere: a greyed image and a disabled "Out of stock" button.
- Manager orders board:
  - A sound and vibration play for new orders, and the browser tab shows a count.
  - Each order shows "x min ago" and is highlighted when it has waited too long.
  - Action buttons are bigger, and status labels are clearer.
- Profile, login, checkout and consent pages match the newer design.
- Theme: one green and white palette, with matching app colors. Dark mode is checked for readable contrast.
- Product page: on phones, the add-to-cart bar stays at the bottom. The duplicate price is removed, and the cart badge reacts when you add an item.
- Track page:
  - Friendly status text with an estimated time.
  - Empty-state messages when there are no orders.
  - A "reorder" button on past orders.
- Right-to-left layout:
  - Prices, phone numbers and order numbers display the right way round.
  - Arrows flip correctly in every language.
- Sharing preview image and the admin app icon are added. The install hint shows once and can be found again in the menu.

## Cleanup
- Remove the leftover zip file, extra lockfiles and unused tools.
- Make the notification helper use the same Firebase version as the app.
- Rewrite the outdated notes file, add a sample settings file, and update the project rules.

## Technical details
- Migrations go through the project's migration tool instead of hand-written numbered files. They do the following:
  - Remove the client INSERT policies and grants on orders and order_items.
  - Add `orders.idempotency_key`, which must be unique.
  - Add a `create_order_with_items` function that runs with elevated rights.
  - Add `otp_try` for attempt counting and an `otp_rate_limit` table keyed by IP.
  - Add an `order_rate_limit` table.
  - Add a trigger on auth.users that rejects the `@phone.natural.local` domain unless `app_metadata.provider_phone` is set.
  - Rewrite `assign_order_number` so numbers are unique among active orders, and raise an error when none are free.
  - Change the `orders.address_id` foreign key to `ON DELETE SET NULL`.
  - Add a pg_cron sweep every 5 minutes that uses `updated_at`.
  - Add `store_settings.last_reminder_date`.
  - Add a storage DELETE policy for admins.
  - Add a `product_rating_summary` view.
  - Backfill: clear bad `reviewer_name` values.
- New secrets: `OTP_HMAC_SECRET` and `CRON_SECRET`. I generate both.
- Edge functions: update `place-order`, `whatsapp-otp`, `track-order`, `availability-reminder` and `_shared/fcm.ts`. `track-order` drops number-only lookups and its sweep.
- Rate limits are simple per-hour counters in tables. The backend has no built-in rate limiting, so these are a lightweight version.
- Catalog: replace the remounting `key={version}` with a `useSyncExternalStore` store.
- `vite.config.ts`: use `loadEnv` and keep the hard-coded fallbacks.
- I won't run build and lint by hand; the automatic build log is checked after each step. I will run the existing tests and spot-check the main flows in a headless browser.

## Design decisions for you afterwards
- The new-order sound (I'll use a short soft chime).
- The ETA wording on the Track page.
- The banner image used for the sharing preview.
