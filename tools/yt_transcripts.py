#!/usr/bin/env python3
"""Fetch YouTube transcripts with Apify (pintostudio/youtube-transcript-scraper) into research/videos/.

Needs APIFY_TOKEN in the environment. On this Mac:
  oprun --env-file ~/Thrivbe-AI/Thrivbe-OS/.env -- python3 tools/yt_transcripts.py
Skips videos that already have a transcript file. Add new videos to VIDEOS.
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

ACTOR = "pintostudio~youtube-transcript-scraper"
OUT = Path(__file__).resolve().parent.parent / "research/videos"
VIDEOS = {  # id: (title, channel)
    "KxNHlkNuqG0": ("This El Niño Is About To Cause a Global Catastrophe", "The World, The Universe And Us"),
    "7oupDKBxs-I": ("ClimateWatch: El Niño strengthens, October update", "WeatherWatchTV"),
    "Ou5wECGoStc": (None, None),  # title filled from YouTube oEmbed
}


def oembed(vid: str) -> tuple[str, str]:
    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={vid}&format=json"
    with urllib.request.urlopen(url, timeout=30) as r:
        d = json.load(r)
    return d["title"], d["author_name"]


def fetch(vid: str, token: str) -> list:
    req = urllib.request.Request(
        f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items?timeout=240",
        data=json.dumps({"videoUrl": f"https://www.youtube.com/watch?v={vid}", "targetLanguage": "en"}).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.load(r)


def to_text(items: list) -> list[tuple[float, str]]:
    """Normalise the actor output to [(start_seconds, text)]."""
    segs = []
    for it in items:
        for s in it.get("data") or it.get("transcript") or ([it] if "text" in it else []):
            segs.append((float(s.get("start") or s.get("offset") or 0), str(s.get("text", "")).strip()))
    return [s for s in segs if s[1]]


def main() -> None:
    token = os.environ.get("APIFY_TOKEN")
    if not token:
        sys.exit("APIFY_TOKEN missing (run via oprun)")
    OUT.mkdir(parents=True, exist_ok=True)
    for vid, (title, channel) in VIDEOS.items():
        md = OUT / f"{vid}.md"
        if md.exists():
            print(f"skip {vid} (exists)")
            continue
        if not title:
            title, channel = oembed(vid)
        items = fetch(vid, token)
        (OUT / f"{vid}.json").write_text(json.dumps(items, ensure_ascii=False, indent=1))
        segs = to_text(items)
        if not segs:
            print(f"WARN {vid}: no transcript segments; raw output saved")
            continue
        lines = [f"# {title}", "", f"- Channel: {channel}", f"- Video: https://www.youtube.com/watch?v={vid}",
                 "- Transcript: YouTube captions via Apify (auto-generated captions may contain errors)", "", "## Transcript", ""]
        para, start = [], segs[0][0]
        for t, text in segs:  # group into ~30-second paragraphs with a timestamp
            if para and t - start >= 30:
                lines.append(f"**[{int(start // 60):02d}:{int(start % 60):02d}]** {' '.join(para)}")
                para, start = [], t
            para.append(text)
        if para:
            lines.append(f"**[{int(start // 60):02d}:{int(start % 60):02d}]** {' '.join(para)}")
        md.write_text("\n\n".join(lines) + "\n")
        print(f"ok {vid}: {len(segs)} segments -> {md.name}")


if __name__ == "__main__":
    main()
