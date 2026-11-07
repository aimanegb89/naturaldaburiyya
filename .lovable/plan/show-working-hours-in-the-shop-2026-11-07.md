# Show working hours in the shop

The shop shows hours in two places today: "Daily 17:00 – 00:00" on the home page and a fixed "open daily" line on the Contact page. These are typed-in text and don't follow the hours the manager sets. Both will switch to the live hours.

## What customers will see
1. **Top bar label is tappable.** Tapping "Open / Closed" opens a small card that shows:
   - The status, for example "Open until 22:00" or "Closed, opens Sunday 09:00".
   - The full week, with today highlighted. Closed days say "Closed", and days with two slots show both (09:00–14:00, 17:00–22:00).
   - Upcoming special dates (holidays or different hours) for the next 14 days.
2. **Contact page:** the opening-hours card shows the same weekly list instead of the fixed text.
3. **Home page:** the "Daily 17:00 – 00:00" line shows today's real hours, plus "Open now" or "Closed now".
4. **Manual override:** when the manager has closed the shop manually, the card says "Temporarily closed".

Everything appears in Arabic, Hebrew or English and right-to-left where needed. It updates live when the manager changes the hours.

## Technical details
- Make `weekly_hours` and `date_overrides` readable through the existing public `store_settings` SELECT policy (already "Anyone reads"), extend `useStoreStatus` cache to also hold them, and refresh on the same realtime channel.
- New `src/components/StoreHours.tsx`: `WeeklyHoursList` (localized weekday names via `Intl` with Asia/Jerusalem, today highlight, overrides within 14 days) and `StoreHoursPopover` wrapping `StatusPill` (shadcn Popover).
- Use it in `Header.tsx`, `Contact.tsx` (replace `t('openDaily')`) and `HomeSections.tsx` line 132.
