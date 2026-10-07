# FocusGuard — local-first focus extension

## Install (Chrome 120+ or a compatible Chromium browser)

1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select this `extension` directory (not the whole mj1 repository).
3. Pin FocusGuard to the toolbar. Reload existing web tabs after installation or updating.
4. Open the popup, choose site rules, save, and start a session. **Open full dashboard** shows local activity and session history.

No API key, account, Next.js server, or Supabase instance is needed for the extension. It works locally and makes no network API requests.

## Features

- Persistent focus sessions with start/stop controls, a badge, and an on-page timer.
- Domain/subdomain rules: block, ask-first, and allow. Specific rules override parent domains.
- Temporary site allowances with expiry; strict mode disables temporary bypass of blocked sites. You can always stop from the toolbar.
- Pomodoro focus/break cycles. Site reminders pause during breaks and resume afterward.
- Rapid-switch reminders, with reloads excluded from switch counts; interruption prompts are counted in local reports.
- Intent-labelled sessions, daily focus targets, a seven-day focus chart, and Deep Work / Study / Sprint presets.
- Add a block, ask, or allow rule for the active website directly from the toolbar; settings still validate domain syntax and preserve specific-rule precedence.
- Offline URL analysis: bare-domain input, destination disclosure, URL-shortener warnings, transport/hostname traits, a bundled 128-tree experimental phishing model, and redacted check-report download. Missing model inputs remain unknown; no URL is sent to a service. This is not a malware or reputation verdict.
- Foreground activity estimates excluding idle/unfocused browsing and break phases. Alarm sampling is approximate, capped after sleep; not billed-time tracking.
- Local-day reports, last 100 completed sessions, JSON/CSV export, and local history deletion. Reports retain 30 days.
- Background-worker restoration and serialized writes. No browsing URLs, page contents, or keystrokes are uploaded.

## Architecture

`popup/dashboard -> runtime messages -> service worker -> local storage`
`tab/focus/idle/alarm events -> time accounting + rule evaluation -> isolated content overlay`

`core.mjs` contains the testable state machine. `background.js` handles Chrome APIs and persists state. `content.js` renders inside a Shadow DOM. The popup and full dashboard share a compact four-view UI and logic. The Next.js companion exposes sessions, rules, reports, settings, and typed URL checks. Shared view helpers normalize older state and prevent non-finite progress values. `url-check.mjs` performs lexical analysis and missing-feature inference bounds on bundled `models/url-forest.json`; no page or reputation service is fetched.

The optional localhost web companion can control sessions, edit rules/preferences, export reports, and open extension controls at http://localhost:3000 or http://127.0.0.1:3000. Other sites cannot start/stop sessions, change rules, read history, or clear history. Content scripts receive only their own page's decision and public session state. Extension storage is restricted to trusted extension contexts.

## Permission rationale

- tabs: inspect the active hostname and observe switches.
- storage: persist sessions, rules, and aggregate reports locally.
- alarms: wake the worker for phase transitions and accounting.
- idle: avoid counting time while the device is idle/locked.
- notifications: optional focus/break reminders.
- HTTP/HTTPS host access: display reminders on user-configured domains. Chrome protected pages, its store, PDFs, and other extension pages may not allow injection.

## Honest limits

This is a voluntary productivity aid, not tamper-proof parental control. A user or a hostile page can remove/bypass overlays; page scripts may continue loading under them. It does not block network requests. The URL feature includes an experimental machine-learning model; it has not been validated as protection for live browsing. Switching browser profiles/uninstalling loses local data unless exported. Localhost companion pages are trusted; do not run untrusted code at those origins. No automatic cloud sync is implemented; the pre-existing Supabase dashboard is a separate optional subsystem.

## Verify before presenting

After changing files, click Reload on FocusGuard in `chrome://extensions` and reload existing web tabs. Rule overlays require site access on the affected domains; localhost-only access enables the companion alone.

Run `npm run test:extension` and `npm run check:extension` from the repository root. Then perform real-browser acceptance checks:

1. Start, navigate to reddit.com, confirm the block; stop from popup and confirm it disappears.
2. Set youtube.com to ask, temporarily allow, verify access and expiry.
3. Remove a default rule, save, reload the worker, and verify it stays removed.
4. Set 1-minute focus/break cycles; verify the phase and block behavior after each transition.
5. Change tabs, lock/idle the device, and compare the approximate reports. Verify Chrome-internal tabs are not counted.
6. Close the popup, let the worker suspend, reopen, and confirm state restoration.
7. Export history; clear it; confirm settings remain.
8. Attempt a page postMessage from an unrelated origin; verify no session change.

Automated tests cover the pure state machine and a mocked Chrome worker, including cold restoration, message authorization, rule persistence, and strict-mode bypass attempts. Chrome-specific acceptance checks still require loading the unpacked extension. No Chrome Web Store publication or deployment has been performed.

The Next.js companion is at `/extension` (run `npm run dev` from mj1). It has a download link and reads live local extension activity without a Supabase account. `npm run package:extension` rebuilds its downloadable ZIP.
