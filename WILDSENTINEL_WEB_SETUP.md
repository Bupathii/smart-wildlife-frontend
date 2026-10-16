# WildSentinel — Web Frontend UI Edition

Source: user's uploaded `frontend(2).zip`. This package preserves the original React / Vite frontend and its routes, authorization rules, API modules, forms, map components, conflict-report workflows, and tests. It contains UI/branding changes only.

## What's new
- Original elephant crest and WildSentinel name in navigation and sign-in pages
- Redesigned responsive sidebar, command-center dashboard, top navigation and footer
- Live alert-feed overview cards (no invented ranger or patrol counts)
- Dark/light theme toggle stored in the browser
- More consistent styles for existing screens, inputs, tables and cards
- Subtle entrance and hover animations, with reduced-motion support
- Cleaner UI for existing unimplemented placeholder modules; no functional capabilities are claimed for them
- New favicon, title and web app description

## Preserved
- Existing React Router destinations and role-based permissions
- All `src/api/` modules, auth flow, session token handling, map/tracking tools, patrol and conflict reporting logic
- Existing `package.json`, `package-lock.json`, tests and backend URLs/configuration

## Install / run
1. Back up your existing `smart-wildlife-frontend` project.
2. Merge the extracted `smart-wildlife-frontend` directory into the existing one.
3. Keep your original `.env` settings and Git metadata. They are intentionally **not** supplied in this ZIP.
4. In PowerShell:
   ```powershell
   cd "C:\Users\Lenovo\Desktop\Y3S2\CSEE\Assignment 2\project\smart-wildlife-frontend"
   npm ci
   npm run build
   npm run dev
   ```
5. Open the Local URL displayed by Vite.

## Checks performed
- All 46 JavaScript/JSX source files parsed without syntax errors using the TypeScript parser.
- Stylesheet parsed with no syntax errors; local module imports validated.
- The full `npm run build` was **not** verified in the preparation environment because npm dependencies could not be installed. Run `npm ci` and `npm run build` locally before relying on the app.

## Notes
- Dark mode is applied through the web UI and persisted locally; on map-heavy pages some third-party map tiles may remain in their supplied map style.
- Placeholder modules (e.g., Rangers, Camera Traps, Incidents, Users and Settings) still require their own implementations if functionality is desired.
- Frontend package does **not** contain a Node/Express backend and does not configure database secrets.
