#!/usr/bin/env python3
"""Render meeting transcripts (markdown, local-only folders) into the Meetings section of src/page.html.

Full transcripts are wrapped in PRIVATE markers. The Vercel site is password-protected
(middleware.js), so build.sh includes them; if the password gate is ever removed, switch
build.sh back to stripping the PRIVATE blocks.

Run:  python3 tools/build_meetings.py && ./build.sh
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "src/page.html"
MEETINGS = [  # (id, title, date, source label, markdown file)
    ("m-2026-10-01", "Community Preparedness & Fundraising", "1 Oct 2026", "Fireflies, 66 min",
     ROOT / "fireflies/2026-10-01-super-el-nino-community-preparedness-fundraising.md"),
    ("m-2026-09-22", "SENRI kickoff call", "22 Sep 2026", "Harmonica, ~77 min",
     next((ROOT / "whatsapp/attachments").glob("*senri-kickoff*.md"), None)),
]
START, END = "<!-- MEETINGS START -->", "<!-- MEETINGS END -->"


def inline(s: str) -> str:
    s = html.escape(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    return re.sub(r"`(.+?)`", r"<code>\1</code>", s)


def md_to_html(md: str) -> tuple[str, str]:
    """Return (header_html, transcript_html): everything before '## Transcript' is the header."""
    head, _, body = md.partition("## Transcript")
    return render(head), render(body)


def render(md: str) -> str:
    out, in_list = [], False
    for line in md.splitlines():
        line = line.rstrip()
        if line.startswith("- "):
            if not in_list:
                out.append("<ul class=\"tight\">")
                in_list = True
            out.append(f"<li>{inline(line[2:])}</li>")
            continue
        if in_list:
            out.append("</ul>")
            in_list = False
        if not line or line.startswith("# "):
            continue
        if line.startswith("## "):
            out.append(f"<h4>{inline(line[3:])}</h4>")
        elif m := re.match(r"^\*\*\[(\d+m)\] (.+?):\*\* (.*)", line):  # Fireflies: **[05m] Name:** text
            out.append(f"<p class=\"turn\"><span class=\"ts\">{m[1]}</span><b>{inline(m[2])}:</b> {inline(m[3])}</p>")
        elif m := re.match(r"^\[(\d\d:\d\d:\d\d)\] \*\*(.+?):\*\* (.*)", line):  # Harmonica: [00:01:10] **Name:** text
            out.append(f"<p class=\"turn\"><span class=\"ts\">{m[1]}</span><b>{inline(m[2])}:</b> {inline(m[3])}</p>")
        else:
            out.append(f"<p>{inline(line)}</p>")
    if in_list:
        out.append("</ul>")
    return "\n".join(out)


def section() -> str:
    parts = [START, '<section id="meetings">', "  <h2>Meetings</h2>",
             "  <p>Records of the Super El Niño Response group's calls, newest first.</p>"]
    for mid, title, date, src, path in MEETINGS:
        if not path or not path.exists():
            continue
        head, transcript = md_to_html(path.read_text())
        parts += [f'  <article class="meeting" id="{mid}">',
                  f"    <h3>{html.escape(title)} <span class=\"note\">· {date} · {src}</span></h3>",
                  head,
                  "<!-- PRIVATE START -->",
                  f"    <details class=\"transcript\"><summary>Full transcript</summary>\n{transcript}\n    </details>",
                  "<!-- PRIVATE END -->",
                  "  </article>"]
    parts += ["</section>", END]
    return "\n".join(parts)


def main() -> None:
    page = PAGE.read_text()
    new = section()
    if START in page:
        page = page[:page.index(START)] + new + page[page.index(END) + len(END):]
    else:
        anchor = '<section id="contacts">'
        assert page.count(anchor) == 1, "contacts section anchor not found"
        page = page.replace(anchor, new + "\n\n" + anchor)
    PAGE.write_text(page)
    print("meetings section written")


if __name__ == "__main__":
    main()
