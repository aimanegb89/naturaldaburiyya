# Show active orders automatically in the Track tab

## What the customer sees
- When the Track tab opens, every order that isn't Done yet appears right away. Each one has its number, a progress bar (Received, Preparing, Done), its items and its total.
- The progress bars update on their own every 20 seconds. When an order becomes Done, it stays in the Track tab with a full bar for 30 minutes. After that it appears only in History.
- The "type order number" search box stays below the list, for orders made on another phone.
- If there are no active orders, only the search box is shown.

## Which orders appear
- Signed-in customers: their own orders that aren't done yet.
- Guests: orders placed from this phone/browser, which the app remembers after checkout.

## Technical details
- Checkout: after `place-order` succeeds, add the `tracking_code` to the `natural-my-orders` list in localStorage (keep the 10 most recent).
- TrackOrder: build the list of codes from the signed-in user's recent orders plus the codes saved in localStorage, without duplicates. Fetch each one through `track-order`. Show an order as a progress card when it isn't done, or when it is done and `updated_at` was less than 30 minutes ago. Poll every 20s.
- Orders done more than 30 minutes ago are left out of the Track tab and are removed from the localStorage list.
- Move the progress card into a small `TrackedOrderCard` component that both the auto list and the manual search use.
