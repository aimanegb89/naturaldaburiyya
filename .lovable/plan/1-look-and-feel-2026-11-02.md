Premium redesign of the Natural Daburiyya store

Decisions from your answers: works on phones and computers; checkout stays WhatsApp + cash/card on delivery; filters by Category and Health goal; signed-in customers can post star reviews.

## 1. Look and feel
- New earthy palette: warm cream background, sage/olive greens, charcoal text, warm terracotta-gold for buttons.
- Arabic-friendly typography (e.g. Tajawal/IBM Plex Sans Arabic for Arabic, a refined serif for English headings), proper right-to-left in Arabic and Hebrew.
- Soft shadows, rounded cards, smooth hover and page-fade animations.

## 2. Header and navigation
- Sticky header: logo, links (Shop, About, Benefits, Contact), language switcher, wishlist heart with count, cart icon with live badge.
- Instant search in the header that finds products by name, category, health goal or ingredient.
- Phones: keep the bottom tab bar (adds Wishlist), plus a menu button for the links. Computers: full top menu.

## 3. Homepage
- Hero: large lifestyle photo (new generated image), headline about 100% natural wellness, "تسوق الآن / Shop Now" button.
- Featured Categories: rounded image tiles with icons (Juices, Smoothies, Cocktails, Yogurt, Supplements).
- Best Sellers grid: price, star rating, quick add to cart, Quick View.
- Trust strip: 100% Natural, No Chemicals, Fast Local Delivery, Secure Ordering.
- Short About and Contact sections (using your existing shop details and hours).

## 4. Shop page (new /shop)
- Filters: category and health goal (energy, immunity, detox, muscle, relax). Side panel on computers, slide-up sheet on phones.
- Sorting: price low-high, high-low, newest, best selling.
- Cards with badges (Natural, New, Popular), "Available" indicator, hover lift.

## 5. Product page (new /product/:id)
- Image gallery with thumbnails and full-screen zoom.
- Size selector, quantity +/-, animated Add to Cart with a success toast.
- Expandable sections: Ingredients, How to enjoy, Customer Reviews (read for everyone, write when signed in).
- "You may also like" scrolling row.
- Quick View on cards keeps the existing pop-up for fast adding.

## 6. Cart and checkout
- Cart slides in from the side with thumbnails, quantity controls, subtotal and a free-delivery progress bar.
- Checkout: single page in clear steps (Contact, Address, Payment: cash or card on delivery), with inline error messages; confirms via WhatsApp as today, and saves the order for signed-in users.

## 7. Polish
- Skeleton loaders while reviews/orders load, toasts for cart and wishlist actions, smooth transitions.

## Placeholders to confirm later
- Free-delivery threshold (I'll use ₪100 until you tell me), health-goal tags and ingredient lists per product, and "best seller"/"new" flags will be my best guesses; you can correct them.

## Technical section
- Design tokens rewritten in index.css / tailwind.config.ts (HSL), desktop breakpoints re-enabled; keep explicit px sizing given the doubled spacing scale. Update project memory (mobile-only rule replaced).
- Extend products data with `goals`, `ingredients`, `isNew`, `popularity`, `gallery`.
- New table `product_reviews` (product_id text, user_id uuid, rating 1-5, comment, created_at) with grants + RLS: public read, authenticated insert/update/delete own; average rating computed client-side.
- Wishlist uses the existing `favorites` table for signed-in users, local storage for guests.
- New routes: /shop, /product/:id; new components: Header, SearchCommand, FilterPanel, ProductGallery, ReviewsSection, CrossSellRow, TrustStrip, CategoryGrid.
- Translations added for all new text in AR/HE/EN.
- Verify with Playwright on phone and desktop sizes: browse, filter, add to cart, checkout, post a review.
