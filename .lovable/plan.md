# Contact page + Install App button for managers

## 1. Contact us as its own page
- Remove the whole bottom section from every page, including the contact block and the copyright line.
- Add a new **Contact us** page (`/contact`) that shows the same details in a clean card layout, RTL-aware and in all three languages, with the copyright line at the bottom of that page.
- Point the existing "Contact us" button in the side menu (and the desktop top menu link) to this new page.

## 2. Install App button in manager Settings
- Add an "Install the app" card at the top of `/admin/settings`.
- Android / computer (Chrome, Edge): one tap opens the browser's install prompt.
- iPhone: tapping shows the short steps (Share, then "Add to Home Screen").
- If the app is already installed (opened from the home screen), the card shows "Installed".

## Technical details
- New `src/pages/Contact.tsx` wrapped in `AppShell`; route added in `App.tsx`; Header links changed from `/#contact` to `/contact`.
- `Footer` removed from `AppShell`; its contact content and copyright move to the Contact page.
- Extract the install logic from `InstallBanner.tsx` into a small `useInstallPrompt` hook, reused by the banner and a new `InstallAppCard` in `SettingsPage.tsx`.

## 3. Separate manager app (fixes install opening the shop)
Right now there is only one app definition, and it always starts at the shop home page, so installing from `/admin` still opens the customer app.
- Add a second app definition for managers: name "Natural Admin", starts at `/admin`, its own identity so it installs alongside the shop app.
- On manager pages, the site switches to this manager definition (and iPhone home-screen title "Natural Admin"), so installing from there opens the manager screen.
- The new Install button in Settings uses this manager app.
- If you already installed it, delete the old home-screen icon and install again after publishing (phones remember the old start page).

Technical: `public/manifest-admin.webmanifest` (`id`/`start_url` `/admin`, `scope` `/admin`); the `Admin` shell swaps the `<link rel="manifest">` href and `apple-mobile-web-app-title` on mount and restores them on unmount.
