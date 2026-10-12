"""나레이션 생성: narration/script.json → public/narration/*.mp3 + src/narration-manifest.json

Microsoft Edge 온라인 음성(edge-tts)으로 자연스러운 한국어 리포터/나레이터 음성을 만든다.
필요: pip install edge-tts, 그리고 speech.platform.bing.com 접속 허용.

사용법: python3 scripts/narrate.py [--voice ko-KR-InJoonNeural] [--rate +8%]
"""
import argparse
import asyncio
import json
import os
import subprocess

import edge_tts

ROOT = os.path.join(os.path.dirname(__file__), "..")
SCRIPT = os.path.join(ROOT, "narration", "script.json")
OUT_DIR = os.path.join(ROOT, "public", "narration")
MANIFEST = os.path.join(ROOT, "src", "narration-manifest.json")


def duration_of(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


async def synth(text, voice, rate, pitch, path):
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(path)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice")
    parser.add_argument("--rate")
    args = parser.parse_args()

    with open(SCRIPT, encoding="utf-8") as f:
        script = json.load(f)
    voice = args.voice or script["voice"]
    rate = args.rate or script.get("rate", "+0%")
    pitch = script.get("pitch", "+0Hz")

    os.makedirs(OUT_DIR, exist_ok=True)
    lines = []
    for line in script["lines"]:
        path = os.path.join(OUT_DIR, f"{line['id']}.mp3")
        await synth(line["text"], voice, rate, pitch, path)
        dur = duration_of(path)
        lines.append({**line, "file": f"narration/{line['id']}.mp3", "duration": round(dur, 3)})
        print(f"{line['id']:>10}  {dur:4.1f}s  {line['text']}")

    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump({"voice": voice, "lines": lines}, f, ensure_ascii=False, indent=2)
    print("manifest ->", os.path.abspath(MANIFEST))


if __name__ == "__main__":
    asyncio.run(main())
