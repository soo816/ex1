"""귤이의 제주 대모험 — 효과음(뽁·휘익)을 직접 합성한다 (저작권 걱정 없는 오리지널).

배경음악은 실제 악기 음원(Kevin MacLeod, CC BY 4.0)을 쓴다 → README.md 참고.

사용법: python3 scripts/make_audio.py  →  public/audio/pop.wav, whoosh.wav
"""
import os
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
rng = np.random.default_rng(7)


def save(name, x):
    x = x / max(1e-9, np.max(np.abs(x))) * 0.9
    data = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    if data.ndim == 1:
        data = np.stack([data, data], axis=1)
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def t_(dur):
    return np.arange(int(SR * dur)) / SR


def make_sfx():
    # 뽁 (말풍선, 글자)
    t = t_(0.12)
    f = 900 * np.exp(-t * 25) + 300
    save("pop.wav", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35))

    # 휘익 (서핑 슬라이드)
    t = t_(0.7)
    noise = rng.uniform(-1, 1, len(t))
    # 간단한 대역 통과: 이동 평균 차이, 중심이 점점 올라가는 느낌
    lp = np.convolve(noise, np.ones(8) / 8, mode="same")
    shape = np.sin(np.pi * t / t[-1]) ** 2
    save("whoosh.wav", lp * shape * (0.5 + 0.5 * np.sin(2 * np.pi * (2 + 6 * t) * t)))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    make_sfx()
    print("done ->", os.path.abspath(OUT))
