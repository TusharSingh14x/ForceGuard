# FocusGuard — resume and interview notes

**Project title:** FocusGuard — Privacy-first Browser Productivity Extension

**Stack:** JavaScript, TypeScript, Chrome Manifest V3, React, Next.js, Chrome Storage and Messaging APIs, scikit-learn model export and offline forest inference.

## Resume bullets

- Built a Manifest V3 browser extension with persistent focus sessions, domain/subdomain policies, temporary access expiry, strict mode, and Pomodoro scheduling.
- Developed a React/Next.js workspace for named sessions, website rule management, local activity charts, and CSV/JSON exports; kept extension data in browser storage.
- Ported a 128-tree phishing classifier for offline URL analysis with explainable address warnings and missing-feature bounds; verified browser/sklearn prediction parity alongside state, permission and export regression tests.

Use two or three bullets depending on space. Do not claim user counts, productivity gains, malware detection, cloud synchronization, or production deployment without evidence.

## A 90-second explanation

“FocusGuard helps users control distraction in their browser. The extension applies block, ask-first, and allow policies during focus sessions. A service worker persists state and handles tab, idle, and alarm events, while an isolated content script displays reminders. The web workspace connects through a narrowly scoped localhost message bridge. Activity is aggregated by domain and exported locally. I built it around recoverable state, clear permission boundaries, and explainable behavior.”

## Useful discussion for security companies

- Why privileged controls validate the message sender and supported origins.
- Why history is withheld from ordinary content scripts and storage access is restricted.
- Domain suffix matching and the more-specific-rule exception.
- Persistent state and serialized writes across Manifest V3 worker restarts.
- Avoiding credential/path disclosure in URL-check output and spreadsheet formulas in CSV labels.
- Limits: overlays are voluntary controls; URL warnings and experimental model scores do not establish website safety; missing evidence can make model inference inconclusive.

## Current validation

34 automated state/view/URL-model/worker tests pass, including inference parity against 128 sklearn reference vectors. The production build checks TypeScript; product lint and extension syntax checks pass. Chrome companion checks confirmed navigation, start/finish, preference saves, rule creation/edit/removal, presets, CSV/JSON file downloads, and local URL analysis. The installed worker must be reloaded to v2.3.0 for the offline URL model, task labels and Open extension controls. Follow the manual checklist for permission coverage, overlays, expiry, idle/suspension and phase transitions before recording your recruiter demo.
