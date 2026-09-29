# PRECISION — Notion Workspace Integration

This release adds an additive Notion bridge. The existing UPSC datasets and engine files are preserved; the integration is layered on top through `notion-bridge.js`, `api/notion.js`, UI hooks and CSS.

## Vercel environment variables

Add these in the Vercel Project → Settings → Environment Variables:

- `NOTION_TOKEN` — Notion internal integration secret with access to the CA Tracker database.
- `NOTION_DATABASE_ID` — optional; defaults to the current CA Tracker Pro — Daily Log database.
- `NOTION_DATA_SOURCE_ID` — optional; defaults to the current CA Tracker Pro — Daily Log data source.
- `NOTION_VERSION` — optional; defaults to `2025-09-03`.

The browser never receives `NOTION_TOKEN`; all reads/writes are proxied through `/api/notion`.

## Included Notion operations

- Read database rows and full page details.
- Update editable database properties, including `Completed`.
- Mark an entry Read/Completed and write the checkbox back to Notion.
- Create, duplicate and archive entries.
- Add comments from the portal.
- Upload an image to an entry and append it as a native Notion image block.
- Image preview with zoom in/out/reset in the portal.
- Notion-style color chips using the database's select/multi-select color semantics.
- Search/filter by title, source, topic, GS paper, status, priority and completion state.
- Bulk completion/status edits.
- Optimistic local edits with refresh-after-write and conflict-safe re-fetch using Notion `last_edited_time`.
- 15-second polling while the Notion Workspace panel is open, plus manual Sync Now.
- AI context binding for the selected Notion entry/database row.

## AI-oriented Notion controls

The Notion panel exposes AI actions for:

- Explain this entry for Prelims.
- Convert this entry into a concise revision card.
- Draft a Mains answer framework in Hindi.
- Suggest topic tags.
- Find likely duplicate/repeat-angle entries in the currently synced corpus.
- Summarise the page and attached images/blocks available to the portal.
- Mark as Read after review.

AI receives Notion context only through the server-side AI route; Notion credentials are not put into client-side prompts.

## Important

The ChatGPT-connected Notion workspace can be inspected here, but a separately deployed Vercel app cannot reuse ChatGPT's private connector session. The Vercel deployment therefore needs the Notion integration token configured as an environment variable.
