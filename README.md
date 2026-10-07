# FocusGuard

A local-first Chrome extension for focused browsing, with an optional Next.js companion. No API keys or cloud account are required for the extension product.

## Start here

- Load `extension/` through Chrome → `chrome://extensions` → Developer mode → Load unpacked.
- Or extract `public/focusguard-extension.zip`, then load the extracted folder.
- Pin the toolbar icon, reload existing web tabs, set rules, and start a session.
- Use **Open full dashboard** in the popup for reports and settings.
- For the optional web companion: Node 22+, `npm ci`, `npm run dev`, then open http://localhost:3000/extension in the same Chrome profile.

The localhost page shows real extension status only after installation. It never substitutes fake data for a missing connection.

## Included

Persistent focus sessions; block/ask/allow rules; temporary allowances; strict mode; Pomodoro cycles; rapid-tab-switch reminders; local foreground time estimates; daily reports; named session journal; focus presets and targets; seven-day charts; offline URL warnings and experimental phishing-model analysis; CSV/JSON export; history clearing; and an install guide. Rule evaluation and time accounting are separated from Chrome integration for testing.

## Verify and package

```sh
npm run test:extension
npm run check:extension
npm run lint:product
npm run build
npm run package:extension
```

See [extension/README.md](extension/README.md) for permissions, architecture, and manual Chrome acceptance tests. See [PROJECT_PRESENTATION.md](PROJECT_PRESENTATION.md) for the recruiter walkthrough and discussion points.

## What is and is not verified

Automated tests cover the state machine and mocked Chrome worker integration. A production Next.js build validates TypeScript. The redesigned companion has been exercised in Chrome for navigation, start/finish, preferences, rule add/edit/remove, presets, CSV/JSON download, and local URL checks. The v2.3 service worker is covered by mocked integration tests; the installed extension needs one reload for the new URL model and task-label/open-controls actions. Real suspension/idle behavior and on-page blocking still need the manual checklist. This is a voluntary overlay-based productivity tool; it is not tamper-proof network filtering and is not a security reputation engine.

## Offline URL model

The supplied mlp02 random forest is bundled as inert JSON. URL checks run in browser memory with no API key or Python service. Address warnings are separate from the experimental model result; unknown certificate, content and reputation inputs produce an inconclusive result when evidence is insufficient. See [URL_MODEL.md](URL_MODEL.md) for provenance, reproduction and inference limitations.

## Privacy and boundaries

The extension stores domain totals, session timing, and rules in local browser storage. It makes no network API requests and uploads no page contents or browsing activity. Reports retain 30 days and the last 100 sessions. Exported JSON and CSV are local downloads. CSV labels are quoted and guarded against spreadsheet formulas. Clearing history preserves settings. Chrome-protected pages do not allow the content script. Stopping a session is always available from the popup.

The original Supabase prototype remains under `/protected` and `/auth` for future development. It is not the extension dashboard and does not sync extension records. The main `/` and `/extension` routes do not contact Supabase or load third-party analytics. `lint:product` checks the completed web entry points; the legacy prototype has its own existing code and full `npm run lint` may report its pre-existing issues.

No deployment, Chrome Web Store submission, or browser installation is performed automatically.
