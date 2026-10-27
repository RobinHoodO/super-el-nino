#!/usr/bin/env python3
"""Render meeting transcripts (markdown, local-only folders) into the Meetings section of src/page.html.

Writes two things:
- the Meetings section inside src/page.html: summaries for everyone, full transcripts inside
  PRIVATE markers (kept on the private Claude artifact, stripped from the public site by build.sh);
- src/meetings.html: the full-transcript page, served at /meetings behind the password
  form in middleware.js.

Run:  python3 tools/build_meetings.py && ./build.sh
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "src/page.html"
MEETINGS_PAGE = ROOT / "src/meetings.html"
SITE_MEETINGS = "https://superelninomcp.thrivbe.com/meetings/"
MEETINGS = [  # (id, title, date, source label, markdown file)
    ("m-2026-10-01", "Community Preparedness & Fundraising", "1 Oct 2026", "Fireflies, 66 min",
     ROOT / "fireflies/2026-10-01-super-el-nino-community-preparedness-fundraising.md"),
    ("m-2026-09-22", "SENRI kickoff call", "22 Sep 2026", "Harmonica, ~77 min",
     next((ROOT / "whatsapp/attachments").glob("*senri-kickoff*.md"), None)),
]
START, END = "<!-- MEETINGS START -->", "<!-- MEETINGS END -->"
VSTART, VEND = "<!-- VIDEOS START -->", "<!-- VIDEOS END -->"
VIDEO_DIR = ROOT / "research/videos"
# Public page shows our own short summaries + link; full transcripts only on the password page
# (they are other people's copyrighted words).
VIDEOS = [  # (youtube id, title, channel, summary bullets)
    ("Ou5wECGoStc", "Why El Niño 2026 has scientists worried", "BBC News · The Global Story", [
        "Climate scientist Tom Di Liberto (Climate Central, former NOAA El Niño forecaster) explains how weaker trade winds shift Pacific thunderstorms and knock over 'dominoes' worldwide.",
        "Expected hits: drought and fires in the Philippines, Indonesia and Australia; a weak Indian monsoon; floods in the Horn of Africa after years of drought; drought in Central America, northern South America and the Amazon.",
        "Panama declared an El Niño emergency (canal water). Markets move on El Niño forecasts; coffee prices are unlikely to fall.",
        "1982–83 caught the world by surprise; the Pacific buoy network built afterwards is why this event was forecast months ahead. 'We have no excuse.'",
        "Warning: US famine early warning (USAID) is gone and NOAA staff cuts have hurt public trust in forecasts. Advice: plan now, in the off-season (emergency kit, evacuation routes).",
    ]),
    ("KxNHlkNuqG0", "This El Niño Is About To Cause a Global Catastrophe", "New Scientist · The World, The Universe And Us", [
        "Pacific waters may reach +4 °C above average in places, far beyond the previous record. 2027 is almost certain to be the hottest year on record.",
        "Climate Impact Lab (University of Chicago) projects about 450,000 extra heat deaths in the Southern Hemisphere over six months (moderate scenario), with a second wave likely in India and Pakistan next spring. Famine, fire, disease and floods come on top.",
        "El Niño is natural, but a warmer world amplifies its droughts, floods and storms: it 'loads the dice'.",
        "California faces El Niño storms plus a peak in the 18-year king-tide cycle and has declared a pre-emptive state of emergency. The Amazon faces a severe rain deficit near its tipping point.",
        "Scientists propose emergency ocean measures: cut fishing quotas now and possibly test local marine cloud brightening over reefs. Idea floated: an ocean-wide state of emergency under the new High Seas Treaty.",
    ]),
    ("7oupDKBxs-I", "ClimateWatch: El Niño strengthens, October update", "WeatherWatchTV (New Zealand)", [
        "Niño-3.4 at +2.72 °C against a +0.8 °C threshold, and still strengthening. Peak around November, staying high to the end of January, easing in February–March.",
        "Seas up to 7 °C above normal off Peru and Ecuador; cooler than usual around Fiji, Vanuatu, New Caledonia and New Zealand, so fewer cyclones in the western Pacific.",
        "Indian Ocean Dipole neutral but leaning positive; Southern Annular Mode neutral after a stormy, negative September.",
        "Drying is showing in New Zealand (Northland to Hawke's Bay) and Queensland; Fiji, Tonga and Rarotonga look dry over the next two weeks.",
    ]),
]


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


def section(full_only: bool = False) -> str:
    """Meetings section. full_only=True renders the transcript page (no PRIVATE markers)."""
    parts = ([] if full_only else [START]) + ['<section id="meetings">', "  <h2>Meetings</h2>",
             "  <p>Records of the Super El Niño Response group's calls, newest first.</p>"]
    for mid, title, date, src, path in MEETINGS:
        if not path or not path.exists():
            continue
        head, transcript = md_to_html(path.read_text())
        details = f"    <details class=\"transcript\" open><summary>Full transcript</summary>\n{transcript}\n    </details>"
        parts += [f'  <article class="meeting" id="{mid}">',
                  f"    <h3>{html.escape(title)} <span class=\"note\">· {date} · {src}</span></h3>",
                  head]
        if full_only:
            parts.append(details)
        else:
            parts += [f'    <p><a href="{SITE_MEETINGS}#{mid}">Read the full transcript</a> <span class="note">(group password)</span></p>',
                      "<!-- PRIVATE START -->", details.replace(" open>", ">"), "<!-- PRIVATE END -->"]
        parts.append("  </article>")
    parts += ["</section>"] + ([] if full_only else [END])
    return "\n".join(parts)


def videos_section(full: bool = False) -> str:
    """Video summaries; full=True adds the transcripts (password page only)."""
    parts = ([] if full else [VSTART]) + ['<section id="videos">', "  <h2>Videos</h2>",
             "  <p>Explainers and updates worth watching. Summaries are ours; transcripts are from YouTube captions via Apify.</p>"]
    for vid, title, channel, bullets in VIDEOS:
        url = f"https://www.youtube.com/watch?v={vid}"
        parts += [f'  <article class="meeting" id="v-{vid}">',
                  f'    <h3><a href="{url}">{html.escape(title)}</a> <span class="note">· {html.escape(channel)}</span></h3>',
                  '    <ul class="tight">' + "".join(f"<li>{html.escape(b)}</li>" for b in bullets) + "</ul>"]
        md = VIDEO_DIR / f"{vid}.md"
        if full and md.exists():
            _, transcript = md_to_html(md.read_text())
            parts.append(f"    <details class=\"transcript\"><summary>Full transcript</summary>\n{transcript}\n    </details>")
        elif md.exists():
            parts.append(f'    <p><a href="{SITE_MEETINGS}#v-{vid}">Read the transcript</a> <span class="note">(group password)</span></p>')
        parts.append("  </article>")
    parts += ["</section>"] + ([] if full else [VEND])
    return "\n".join(parts)


def meetings_page(page: str) -> str:
    """Standalone transcript page reusing the overview's <title>-less style block."""
    style = page[page.index("<style>"):page.index("</style>") + len("</style>")]
    fonts = page[page.index('<link rel="preconnect"'):page.index("<style>")]
    return "\n".join(['<title>Meetings · Super El Niño</title>', fonts.strip(), style,
                      '<div class="wrap">',
                      '<p><a href="/">← El Niño 2026–27 Watch</a></p>',
                      section(full_only=True),
                      videos_section(full=True),
                      "</div>"]) + "\n"


def main() -> None:
    page = PAGE.read_text()
    new = section()
    if START in page:
        page = page[:page.index(START)] + new + page[page.index(END) + len(END):]
    else:
        anchor = '<section id="contacts">'
        assert page.count(anchor) == 1, "contacts section anchor not found"
        page = page.replace(anchor, new + "\n\n" + anchor)
    vids = videos_section()
    if VSTART in page:
        page = page[:page.index(VSTART)] + vids + page[page.index(VEND) + len(VEND):]
    else:
        anchor = '<section id="sources">'
        assert page.count(anchor) == 1, "sources section anchor not found"
        page = page.replace(anchor, vids + "\n\n" + anchor)
    PAGE.write_text(page)
    MEETINGS_PAGE.write_text(meetings_page(page))
    print("meetings section + src/meetings.html written")


if __name__ == "__main__":
    main()
