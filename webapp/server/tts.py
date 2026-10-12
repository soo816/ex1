"""웹앱용 나레이션 생성기 — video/scripts/narrate.py 의 함수를 그대로 쓴다.

입력(stdin, JSON): {"voice": "female_reporter" | "male", "outDir": "...", "lines": [{"id": "s0", "text": "..."}]}
출력(stdout, JSON): {"lines": [{"id": "s0", "file": "s0.mp3", "duration": 3.21}]}
"""
import json
import os
import re
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "video", "scripts"))
from narrate import duration_of, finish, synth_supertonic  # noqa: E402

# 사용자가 가장 마음에 들어 한 jeju-fun.mp4 의 여성 리포터 설정이 기본값
VOICES = {
    "female_reporter": {"model": "supertonic-2", "voice": "F4", "speed": 1.1, "steps": 16, "seed": 0},
    "male": {"model": "supertonic-3", "voice": "M1", "speed": 1.05, "steps": 16, "seed": 0},
}

# 발음 안전장치: 이모지·특수기호를 빼고 공백을 정리한다
ALLOWED = re.compile(r"[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ\s.,!?~…'\"%()·:;\-]")


DIGITS = "영일이삼사오육칠팔구"
PHONE_DIGITS = "공일이삼사오육칠팔구"


def sino(n):
    """정수를 한자어 수사로: 10 → 십, 250 → 이백오십 (0~99999999)"""
    if n == 0:
        return "영"
    out = ""
    for unit_big, big in ((10**4, "만"), (1, "")):
        part, n = divmod(n, unit_big)
        if not part:
            continue
        chunk = ""
        for unit, name in ((1000, "천"), (100, "백"), (10, "십"), (1, "")):
            d, part = divmod(part, unit)
            if d:
                chunk += ("" if d == 1 and name else DIGITS[d]) + name
        out += ("" if chunk == "일" and big else chunk) + big
    return out


def read_number(m):
    whole, _, frac = m.group(1).partition(".")
    text = sino(int(whole))
    if frac:
        text += "점" + "".join(DIGITS[int(d)] for d in frac)
    return text


def normalize(text):
    # 전화번호(02-000-0000 등)는 한 자리씩: 공이, 공공공, …
    text = re.sub(
        r"\d{2,4}-\d{3,4}-\d{4}",
        lambda m: ", ".join("".join(PHONE_DIGITS[int(d)] for d in part) for part in m.group(0).split("-")),
        text,
    )
    # 10% → 십 퍼센트
    text = re.sub(r"(\d+(?:\.\d+)?)\s*%", lambda m: read_number(m) + " 퍼센트", text)
    return text


def clean(text):
    text = ALLOWED.sub(" ", normalize(text))
    return re.sub(r"\s+", " ", text).strip()


def main():
    req = json.load(sys.stdin)
    cfg = VOICES[req.get("voice", "female_reporter")]
    out_dir = req["outDir"]
    os.makedirs(out_dir, exist_ok=True)
    lines = [{"id": l["id"], "text": clean(l["text"])} for l in req["lines"]]
    lines = [l for l in lines if l["text"]]
    result = []
    with tempfile.TemporaryDirectory() as tmp:
        raws = [os.path.join(tmp, f"{l['id']}.wav") for l in lines]
        synth_supertonic(lines, cfg, raws)
        for line, raw in zip(lines, raws):
            name = f"{line['id']}.mp3"
            path = os.path.join(out_dir, name)
            finish(raw, path)
            result.append({"id": line["id"], "file": name, "duration": round(duration_of(path), 3)})
    json.dump({"lines": result}, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
