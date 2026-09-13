# Plan: Make Product Detail Image More Visible

## Goal
In the product detail modal, make the item image larger and fully visible (not cropped), occupying roughly 50% of the open modal height.

## Current state
`src/components/ProductDetailModal.tsx` shows the product image in a fixed `h-[140px]` container with `object-cover`, which crops taller product photos.

## Changes
1. In `src/components/ProductDetailModal.tsx`:
   - Change the image container from fixed `h-[140px]` to a relative height that takes ~50% of the modal viewport (`h-[45vh]` or `max-h-[50%]` depending on dialog flex behavior).
   - Switch the image `object-cover` to `object-contain` so the full product photo is visible without cropping.
   - Keep the shimmer loader, rounded top corners, and popular badge positioning.
   - Ensure the modal body still scrolls if content overflows.

2. Verify the modal on a mobile viewport (390x844) by opening a product and checking that the image is no longer cropped and occupies about half of the modal.

## Out of scope
- No changes to other modals, cards, or global styles.
- No changes to product data or cart logic.
