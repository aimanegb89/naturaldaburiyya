// Tiny event so the cart icon can pulse when something is added.
export const CART_BUMP_EVENT = 'cart:bump';
export const bumpCartBadge = () => window.dispatchEvent(new Event(CART_BUMP_EVENT));
