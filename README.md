# Super El Niño

Research and tools for the Super El Niño Response group (SENRI): supporting communities preparing for the 2026–27 El Niño.

| Path | What |
|---|---|
| `src/page.html` | **El Niño 2026–27 Watch**, the research overview (source) |
| `site/index.html` | Built page, deployed to https://super-el-nino.vercel.app on every push to `main` |
| `build.sh` | Builds `site/index.html` from `src/page.html` |
| `middleware.js` | Password-only form in front of `/meetings` (password = Vercel env var `SITE_PASSWORD`). Everything else is public. |
| `tools/build_meetings.py` | Renders meeting summaries into `src/page.html` and full transcripts into `src/meetings.html` |
| `research/el-nino-research-plan.txt` | The group's El Niño Research Plan (full text; `.rtf` original alongside) |
| `research/deep-research-prompt.md` | Prompt for deep research tools |
| `resources.md` | Links shared in the group, sorted by topic |
| `vercel.json` | Static deploy config (serves `site/`) |

## Update the page
1. Edit `src/page.html` (single source; also published as the Claude artifact https://claude.ai/artifact/11cWwKkrQaCNjXwaDCBhcn).
2. Run `./build.sh` (wraps it into `site/index.html`).
3. Commit and push to `main`. Vercel redeploys automatically.

## Not in this repo (local only)
`whatsapp/` (group chat export + `sync_chat.py`) and `fireflies/` (call transcripts) contain other people's messages and personal data. They are gitignored on purpose. Never commit them.
