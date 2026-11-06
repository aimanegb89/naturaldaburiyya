# Cart as a page, simpler product page

## 1. Cart opens like the other tabs
- Add a full **Cart page** at `/cart` with the same look as the current cart panel: items, size badges, quantity, delete confirmation, free-delivery progress, total, "Checkout" button, and "Go to shop" when it's empty.
- The **Cart** tab in the bottom bar goes to this page and lights up while you're on it, just like Home, Shop and My orders.
- The cart icon in the top bar on computers keeps opening the side panel. On phones it goes to the cart page.

## 2. Back button on the product page
- Remove the "Home / Shop / product name" trail at the top.
- Put a round back arrow in its place. It returns to the previous page, or to the Shop if the page was opened from a link. The arrow points the right way in Arabic and Hebrew.

## 3. One image per product
- Show only the first image. Remove the small thumbnails under it. Tapping the image to zoom still works.

## 4. Size and Add to cart visible without scrolling (phones)
- Make the product image shorter on phones, about 40% of the screen height instead of a full square.
- New order under the image:
  1. Name, price and stock status on one compact line
  2. Size choice (Small / Large)
  3. Quantity, Add to cart and favorite heart
  4. Description, health-goal tags and delivery notes
  5. Ingredients, how to enjoy and reviews (folded sections)
  6. "You may also like"
- Badges and the rating move into a smaller row, so they take less space.
- The add-to-cart bar fixed at the bottom of the phone screen stays. It shows the total and works with the chosen size.

## Technical notes
- New `src/pages/Cart.tsx` in `AppShell`. Reuse the cart panel's insides by moving its body into a shared `CartContents` component that the panel and page both use. Add the `/cart` route in `App.tsx`. `BottomNav` cart item: `navigate('/cart')`, `active: pathname === '/cart'`.
- In `ProductPage.tsx`: replace the breadcrumb `nav` with a back button (`navigate(-1)` if `window.history.state?.idx > 0`, else `/shop`), using an `rtl:rotate-180` arrow. Drop `img` state and thumbnails; use `p.gallery[0]`. Image: `h-[40vh] md:aspect-square`, `object-contain`. Reorder the info column as listed above.
- Update the AGENTS.md cart-drawer rule: drawer on desktop, `/cart` page on mobile.
