# Fix working-hours editor + customer notifications from first install

## Part 1 — Working-hours editor fixes (manager app)
1. **Clear From / To fields**: each time slot shows a labelled "من / From" and "إلى / To" field, always in reading order (correct in Arabic/Hebrew RTL), delete button at the end of the row, not between the times.
2. **Phone layout**: on narrow screens each day stacks (day name on top, slots below, full width), nothing clipped; desktop keeps one row per day.
3. **Midnight closing text**: a closing time of 00:00 shows as "closes tonight at 12:00 AM (midnight)" instead of "closes Sunday 00:00". Same fix in the customer header pill and hours list (shows "17:00 – midnight").

## Part 2 — Customer notifications from first install
1. **Ask once, early**: after the customer installs the app (or on the 2nd visit in the browser), show a friendly in-app card "Get notified about offers and your orders" with Allow / Later. Only on Allow do we trigger the phone's permission popup (browsers block popups that appear without a tap). "Later" re-asks after 7 days.
2. **Device registration**: each allowing device is saved with its language, and linked to the customer account if signed in (also linked later when they sign in).
3. **Automatic order updates**: every order placed from a registered device automatically gets status pushes (ready, cancelled) — no separate opt-in on the tracking page anymore.
4. **Manager broadcast**: new "Send notification" section in manager settings: title + message (Arabic/Hebrew/English), optional link (product or shop page), preview count of devices, confirm, then send. Recent sends listed.
5. **Profile toggle**: in the side menu, "Notifications on/off" so customers can turn it off.

## Technical details
- New table `customer_push_devices` (token unique, locale, user_id nullable, enabled, last_seen) with GRANTs + RLS; writes only via edge function `register-device` (anon allowed, rate limited).
- `place-order` accepts the device token and inserts into `order_push_tokens`, reusing existing cancel/status push path.
- New edge function `broadcast-push` (admin check via `has_role`), sends per-locale text through `_shared/fcm.ts` in batches, disables invalid tokens; table `push_broadcasts` for history.
- Reuse `src/lib/push.ts` and the existing Firebase messaging worker; new `NotificationPrompt` component mounted in `AppShell` (not on /admin).
- Time formatting helper in `src/lib/storeStatus.tsx` treats 00:00 end as end-of-day.
- iPhone note: pushes work only after "Add to Home Screen" (Apple limitation); the card explains this on iOS Safari.
