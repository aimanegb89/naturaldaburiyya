# Contact page + Install App button for managers

## 1. Contact us as its own page
- Take the contact block (address, hours, phone, WhatsApp, map) out of the bottom of every page. Keep only a slim strip at the bottom with the copyright line.
- Add a new **Contact us** page (`/contact`) that shows the same details in a clean card layout, RTL-aware and in all three languages.
- Point the existing "Contact us" button in the side menu (and the desktop top menu link) to this new page.

## 2. Install App button in manager Settings
- Add an "Install the app" card at the top of `/admin/settings`.
- Android / computer (Chrome, Edge): one tap opens the browser's install prompt.
- iPhone: tapping shows the short steps (Share, then "Add to Home Screen").
- If the app is already installed (opened from the home screen), the card shows "Installed".

## Technical details
- New `src/pages/Contact.tsx` wrapped in `AppShell`; route added in `App.tsx`; Header links changed from `/#contact` to `/contact`.
- `Footer.tsx` reduced to the copyright bar; contact content moved to the page.
- Extract the install logic from `InstallBanner.tsx` into a small `useInstallPrompt` hook, reused by the banner and a new `InstallAppCard` in `SettingsPage.tsx`.
