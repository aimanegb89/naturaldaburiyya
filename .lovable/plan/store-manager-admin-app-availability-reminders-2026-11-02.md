# Store manager admin app + availability reminders

## What you get
- **A separate admin app** (its own project) where only the store manager can sign in.
- **Products screen:** see all products, edit names (AR/HE/EN), descriptions, prices (small/large), category, photo, popular flag.
- **Add new products** with photo upload.
- **Availability switch** on each product (Available / Unavailable). The shop shows unavailable items as "Out of stock" and blocks adding them to the cart.
- **Reminder push:** if any product was switched to Unavailable, the manager's phone gets a notification the next day at **16:50** (10 minutes before the 17:00 opening): "These products are still marked unavailable: ... — update if they're back." It stops once they're marked available again.

## Steps
1. **Move products into the database** (this project). Copy the 26 current products and their photos in, so the shop reads from the database instead of the built-in list. Shop looks the same.
2. **Manager role:** only accounts marked as admin can change products; everyone can read them.
3. **Create the admin app** as a second project connected to the same backend: sign-in, product list, edit/add form, availability toggle, "Enable notifications" button.
4. **Connect Firebase** for phone push (you'll get a connect card; needs a free Firebase project with web push enabled). The manager opens the admin app in its own tab on their phone once and taps "Enable notifications".
5. **Daily 16:50 check** (Jerusalem time, once a day): finds products marked unavailable since before today and sends the push to the manager's devices.
6. Test: edit a product, toggle availability, see the change in the shop, send a test push.

## What I need from you
- The email of the manager's account (to make it admin).
- A Firebase project when the connect card appears.
- Note: iPhones only receive web push if the admin app is added to the Home Screen first.

## Technical details
- New `products` table (multilingual fields, prices, category, image_url, is_popular, is_available, unavailable_since, sort_order) + `product-images` storage bucket; seed from `src/data/products.ts`. `catalog.ts` switches to a React Query fetch with the static list as fallback, keeping product-meta merging.
- `user_roles` + `has_role()`; RLS: public select, admin insert/update/delete. Trigger sets `unavailable_since` when `is_available` flips false, clears it when true.
- `admin_push_tokens` table (admin-only) storing FCM tokens.
- Edge function `availability-reminder` (FCM v1 via connector gateway), deletes stale tokens; scheduled with pg_cron once daily at 16:50 Asia/Jerusalem (cron in UTC, adjusted for DST by running at both 13:50 and 14:50 UTC and checking local time in the function).
- Admin app is created via a new project; it uses the same backend URL/key and `firebase-messaging-sw.js`.
