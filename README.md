# Super El Niño

Research and tools for the Super El Niño Response group (SENRI): supporting communities preparing for the 2026–27 El Niño.

| Path | What |
|---|---|
| `src/page.html` | **El Niño 2026–27 Watch**, the research overview (source) |
| `site/index.html` | Built page, deployed to Cloudflare Workers (`super-el-nino`) |
| `build.sh` | Builds `site/index.html` from `src/page.html` |
| `worker.js` | Cloudflare Worker entry: password-only form in front of `/meetings` (password = Worker secret `SITE_PASSWORD`), plus `/mcp` and the OpenAI challenge. Everything else is public static assets. |
| `tools/build_meetings.py` | Renders meeting summaries into `src/page.html` and full transcripts into `src/meetings.html` |
| `research/el-nino-research-plan.txt` | The group's El Niño Research Plan (full text; `.rtf` original alongside) |
| `research/deep-research-prompt.md` | Prompt for deep research tools |
| `resources.md` | Links shared in the group, sorted by topic |
| `vercel.json` | Legacy Vercel config; keeps https://super-el-nino.vercel.app (and the `api/` functions) alive because `plugin/mcp.json` points there |
| `wrangler.jsonc` | Workers config (serves `site/`, runs the Worker for `/meetings*`, `/mcp` and the OpenAI challenge) |
| `mcp.js` | Native Worker port of the MCP endpoint at `/mcp` (Fetch API) |
| `api/mcp.js` | Same MCP endpoint for the legacy Vercel deploy. Keep the tool list in sync with `mcp.js` |
| `api/openai-apps-challenge.js` | OpenAI plugin domain-verification endpoint (Vercel copy; the Worker serves the same token) |

## Update the page
1. Edit `src/page.html` (single source; also published as the Claude artifact https://claude.ai/artifact/11cWwKkrQaCNjXwaDCBhcn).
2. Run `./build.sh` (wraps it into `site/index.html`).
3. Commit and push, then deploy: `oprun --env-file /Users/robinsverd/Thrivbe-AI/Thrivbe-OS/.env -- npx wrangler deploy </dev/null`.
4. Set or rotate the meetings password: `npx wrangler secret put SITE_PASSWORD` (same `oprun` wrapper).

## Not in this repo (local only)
`whatsapp/` (group chat export + `sync_chat.py`) and `fireflies/` (call transcripts) contain other people's messages and personal data. They are gitignored on purpose. Never commit them.
