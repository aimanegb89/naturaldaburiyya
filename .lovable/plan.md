# Payment method icons + product page overlap fix

## 1. Payment method shown properly to the manager
Today checkout adds the English word "Cash"/"Card" to the start of the order note, so the manager sees it as a note, always in English.

- Save the payment method as its own field on each order (cash or card), not inside the note.
- The customer's real note stays as the note (only shown when they wrote one).
- On the manager's orders board, each order shows a payment icon badge: a banknote icon for cash, a card icon for card, with a tooltip/label in the app's language (Arabic/Hebrew/English).
- Older orders: if their note starts with "Cash" or "Card", that part is read as the payment method and removed from the note shown.
- Push notifications to the manager also show the payment method in Arabic.

## 2. "Add to cart" bar covering the product page
On phones the floating add-to-cart bar sits above the bottom menu and covers the "You may also like" cards and the scroll-to-top button.

- Increase the empty space at the bottom of the product page so the last content scrolls fully above the bar.
- Move the scroll-to-top button up on the product page so it sits above the bar instead of under it.

## Technical details
- Migration: `orders.payment_method text` (nullable, check in ('cash','card')); update `create_order_with_items` to insert `p_order->>'payment_method'`.
- `place-order`: accept `payment_method` enum (default 'cash'), pass through; include it in FCM body. Checkout sends it and stops prefixing notes.
- OrdersBoard: `Banknote` / `CreditCard` lucide icons with `useTx` labels; legacy fallback parses `^(Cash|Card)( · )?` from notes.
- ProductPage: `pb-[200px]` on mobile; ScrollToTop accepts a route-aware bottom offset (raised on `/product/*`).
