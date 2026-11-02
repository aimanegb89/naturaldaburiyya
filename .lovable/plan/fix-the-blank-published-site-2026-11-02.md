Fix the blank published site

What's happening: the site is now public and loads, but it crashes right away with "supabaseUrl is required". The published version was built without the app's backend connection settings, so nothing renders.

Cause: the project's ignore list excludes the settings file that holds those connection details. It's there in the editor, but it's left out when the site is published.

Fix:
1. Remove the `.env` lines from `.gitignore` so the connection settings go into the published build. (These are public, safe-to-share values, not secrets.)
2. Republish the site.
3. Open the published link and confirm the shop loads with no errors.
