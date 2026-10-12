"""나레이션 생성: narration/script.json → public/narration/*.mp3 + src/narration-manifest.json

엔진 두 가지:
- supertonic (기본): Supertone "Supertonic 2" 한국어 신경망 TTS를 컨테이너 안에서 직접 돌린다(ONNX, 인터넷은 첫 모델 다운로드 때만).
  필요: pip install supertonic. 모델은 Hugging Face Supertone/supertonic-2 (OpenRAIL-M).
- edge: Microsoft Edge 온라인 음성(edge-tts). 일반 PC에서는 잘 되지만 클라우드 세션에서는 403으로 막힌다.
  필요: pip install edge-tts, speech.platform.bing.com 접속.

만든 음성은 앞뒤 무음을 자르고 같은 음량(LOUDNESS_LUFS)으로 맞춘다.

사용법: python3 scripts/narrate.py [--script narration/script-male.json] [--engine supertonic|edge]
        [--voice F4 | ko-KR-SunHiNeural] [--speed 1.2] [--rate +8%] [--out narration-male] [--manifest src/narration-manifest-male.json]

출력 위치는 대본의 "out"(public/ 아래 폴더)과 "manifest" 값을 따르고, 없으면 public/narration/, src/narration-manifest.json.
"""
import argparse
import asyncio
import json
import os
import re
import subprocess
import tempfile

ROOT = os.path.join(os.path.dirname(__file__), "..")
DEFAULT_SCRIPT = os.path.join(ROOT, "narration", "script.json")
DEFAULT_OUT = "narration"  # public/ 아래 폴더
DEFAULT_MANIFEST = os.path.join("src", "narration-manifest.json")

LOUDNESS_LUFS = -14.0  # 쇼츠 기준 음량. 배경음악은 나레이션 동안 약 -27 LUFS로 줄어든다


def duration_of(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def loudness_of(path):
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path, "-af", "ebur128", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])


def finish(raw, path):
    """앞뒤 무음 자르기 → 음량 맞추기 → mp3."""
    trim = (
        "silenceremove=start_periods=1:start_threshold=-45dB,"
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
        "adelay=30:all=1,apad=pad_dur=0.08"
    )
    with tempfile.TemporaryDirectory() as tmp:
        trimmed = os.path.join(tmp, "trimmed.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", trim, "-ar", "44100", trimmed], check=True)
        gain = LOUDNESS_LUFS - loudness_of(trimmed)
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", trimmed,
             "-af", f"volume={gain:.2f}dB,alimiter=limit=0.89:level=false",
             "-ac", "1", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "128k", path],
            check=True,
        )


def synth_supertonic(lines, cfg, raw_paths):
    import numpy as np
    from supertonic import TTS, Style

    tts = TTS(model=cfg.get("model", "supertonic-2"))
    voice = cfg["voice"]
    if isinstance(voice, dict):
        # 내장 목소리 섞기, 예: {"M1": 0.7, "F5": 0.3} (가중치 합 1)
        styles = {name: tts.get_voice_style(name) for name in voice}
        style = Style(sum(w * styles[n].ttl for n, w in voice.items()),
                      sum(w * styles[n].dp for n, w in voice.items()))
    else:
        style = tts.get_voice_style(voice)
    for i, (line, raw) in enumerate(zip(lines, raw_paths)):
        np.random.seed(cfg.get("seed", 0) + i)  # 같은 대본이면 매번 같은 음성
        speed = line.get("speed", cfg.get("speed", 1.05))
        wav, _ = tts.synthesize(line["text"], voice_style=style, lang="ko", speed=speed,
                                total_steps=cfg.get("steps", 16))
        tts.save_audio(wav, raw)


async def synth_edge(lines, cfg, raw_paths):
    import edge_tts

    for line, raw in zip(lines, raw_paths):
        communicate = edge_tts.Communicate(line["text"], cfg["voice"], rate=cfg.get("rate", "+0%"),
                                           pitch=cfg.get("pitch", "+0Hz"))
        await communicate.save(raw)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", choices=["supertonic", "edge"])
    parser.add_argument("--voice")
    parser.add_argument("--speed", type=float, help="supertonic 말하기 속도 (기본 script.json)")
    parser.add_argument("--rate", help="edge-tts 말하기 속도, 예: +15%%")
    parser.add_argument("--script", default=DEFAULT_SCRIPT, help="대본 파일")
    parser.add_argument("--out", help="mp3를 넣을 public/ 아래 폴더 (예: narration-male)")
    parser.add_argument("--manifest", help="video/ 기준 manifest 경로 (예: src/narration-manifest-male.json)")
    args = parser.parse_args()

    with open(args.script, encoding="utf-8") as f:
        script = json.load(f)
    out_name = args.out or script.get("out", DEFAULT_OUT)
    out_dir = os.path.join(ROOT, "public", out_name)
    manifest = os.path.join(ROOT, args.manifest or script.get("manifest", DEFAULT_MANIFEST))
    engine = args.engine or script.get("engine", "supertonic")
    cfg = dict(script[engine])
    if args.voice:
        cfg["voice"] = args.voice
    if args.speed:
        cfg["speed"] = args.speed
    if args.rate:
        cfg["rate"] = args.rate

    os.makedirs(out_dir, exist_ok=True)
    lines = script["lines"]
    with tempfile.TemporaryDirectory() as tmp:
        ext = "wav" if engine == "supertonic" else "mp3"
        raw_paths = [os.path.join(tmp, f"{line['id']}.{ext}") for line in lines]
        if engine == "supertonic":
            synth_supertonic(lines, cfg, raw_paths)
        else:
            asyncio.run(synth_edge(lines, cfg, raw_paths))

        out = []
        for line, raw in zip(lines, raw_paths):
            path = os.path.join(out_dir, f"{line['id']}.mp3")
            finish(raw, path)
            dur = duration_of(path)
            entry = {k: v for k, v in line.items() if k != "speed"}
            out.append({**entry, "file": f"{out_name}/{line['id']}.mp3", "duration": round(dur, 3)})
            print(f"{line['id']:>10}  {dur:4.2f}s  {line['text']}")

    voice_name = cfg["voice"]
    if isinstance(voice_name, dict):
        voice_name = "+".join(f"{n}*{w}" for n, w in voice_name.items())
    voice = f"{engine}:{voice_name}"
    with open(manifest, "w", encoding="utf-8") as f:
        json.dump({"voice": voice, "lines": out}, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("manifest ->", os.path.abspath(manifest))


if __name__ == "__main__":
    main()
