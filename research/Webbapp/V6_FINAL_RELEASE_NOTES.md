# PRECISION UPSC GS-I Portal — V6 Final

This release continues from v5 and implements the latest StudyTracker / OMR / PYQ / AI requirements in the working static portal.

## Timer & dashboard
- 23 distinct UPSC Prelims + Mains / CSAT / Philosophy Optional subject timers.
- LocalStorage + IndexedDB persistence envelope with 365-day expiry.
- Navigation and page-visibility pause/recovery.
- 14-day 2D study graph, streak, goals, subject totals, recent activity, export.
- Global timer chip remains visible while a test or study timer is active.

## OMR / evaluation
- Clear OMR detections automatically enter Review and Key Vault Draft.
- Ambiguous / multiple marks remain manual.
- Final key is bound to the exact random paper code and requires 100/100 valid entries.
- Added ambiguous clear, audit export, draft preview and persistent key vault actions.

## PYQ
- Master PYQ data is merged into the integrated layer so 2014–2025 records open with question text and options.
- 2026 metadata stays separated from the official paper and links back to the UPSC official paper page rather than copying the full paper.

## AI
- Gemini 3.8 Flash endpoint updated to current generation config.
- Search grounding, deep local retrieval, persistent history and an expanded capability registry are wired into the AI prompt.
- AI settings use the actual panel controls and persist locally.

## Device lock
- Uses a platform WebAuthn passkey on the deployed HTTPS origin; refresh invokes the device authenticator when enabled.

## Visual system
- Light transparent glass / liquid background, separated subject colours, StudyTracker-inspired dashboard hierarchy, responsive controls.
