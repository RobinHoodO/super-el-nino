# Super El Niño

Research and tools for the Super El Niño Response group (SENRI): supporting communities preparing for the 2026–27 El Niño.

| Path | What |
|---|---|
| `site/index.html` | **El Niño 2026–27 Watch**, the research overview. Deployed to Vercel on every push to `main`. |
| `research/el-nino-research-plan.txt` | The group's El Niño Research Plan (full text; `.rtf` original alongside) |
| `research/deep-research-prompt.md` | Prompt for deep research tools |
| `resources.md` | Links shared in the group, sorted by topic |
| `vercel.json` | Static deploy config (serves `site/`) |

## Update the page
Edit `site/index.html`, commit, push to `main`. Vercel redeploys automatically.

## Not in this repo (local only)
`whatsapp/` (group chat export + `sync_chat.py`) and `fireflies/` (call transcripts) contain other people's messages and personal data. They are gitignored on purpose. Never commit them.
