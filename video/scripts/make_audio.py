"""귤이의 제주 대모험 — 배경음악과 효과음을 직접 합성한다 (저작권 걱정 없는 오리지널).

사용법: python3 scripts/make_audio.py  →  public/audio/*.wav
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


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def t_(dur):
    return np.arange(int(SR * dur)) / SR


def env(n, a=0.005, d=0.3, sustain=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * (sustain + (1 - sustain) * np.exp(-t / d))
    fade = np.minimum(1, (n - np.arange(n)) / (SR * 0.01))
    return e * fade


# ---------- 악기 ----------

def pluck(freq, dur):
    """Karplus-Strong 우쿨렐레 느낌 뜯는 소리."""
    n = int(SR * dur)
    period = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, period)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % period]
        nxt = buf[(i + 1) % period]
        buf[i % period] = 0.996 * 0.5 * (buf[i % period] + nxt)
    return out * env(n, 0.002, dur)


def glock(freq, dur):
    t = t_(dur)
    x = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2.76 * t) + 0.15 * np.sin(2 * np.pi * freq * 5.4 * t)
    return x * env(len(t), 0.002, 0.35)


def bass(freq, dur):
    t = t_(dur)
    x = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
    return x * env(len(t), 0.005, 0.25, sustain=0.3)


def kick():
    t = t_(0.25)
    f = 50 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)


def snare():
    t = t_(0.18)
    noise = rng.uniform(-1, 1, len(t))
    return (0.7 * noise + 0.3 * np.sin(2 * np.pi * 190 * t)) * np.exp(-t * 22)


def hat():
    t = t_(0.05)
    noise = np.diff(rng.uniform(-1, 1, len(t) + 1))
    return noise * np.exp(-t * 80)


def clap():
    t = t_(0.15)
    noise = rng.uniform(-1, 1, len(t))
    e = np.exp(-t * 30) + 0.6 * np.exp(-np.maximum(0, t - 0.012) * 40) * (t > 0.012)
    return noise * e


def place(track, sound, at, gain=1.0):
    i = int(at * SR)
    if i >= len(track):
        return
    j = min(len(track), i + len(sound))
    track[i:j] += sound[: j - i] * gain


# ---------- 배경음악 ----------

def make_bgm():
    bpm = 120
    beat = 60 / bpm  # 0.5초
    bar = beat * 4  # 2초
    total = 28.0
    mix = np.zeros(int(SR * (total + 1)))

    # C - G - Am - F (밝고 경쾌한 진행), 4마디마다 반복
    chords = [
        (48, [60, 64, 67, 72]),
        (43, [59, 62, 67, 71]),
        (45, [60, 64, 69, 72]),
        (41, [60, 65, 69, 72]),
    ]
    # 글로켄슈필 멜로디 (박 단위 위치, 음, 길이) — C 장조 펜타토닉 위주
    motif_a = [(0, 76, 0.5), (0.5, 79, 0.5), (1, 81, 1), (2, 79, 0.5), (2.5, 76, 0.5), (3, 74, 1),
               (4, 74, 0.5), (4.5, 76, 0.5), (5, 79, 1), (6, 76, 1), (7, 74, 1),
               (8, 72, 0.5), (8.5, 74, 0.5), (9, 76, 1), (10, 79, 0.5), (10.5, 81, 0.5), (11, 84, 1),
               (12, 81, 0.5), (12.5, 79, 0.5), (13, 77, 1), (14, 76, 0.5), (14.5, 74, 0.5), (15, 72, 1)]
    motif_b = [(0, 84, 0.5), (0.5, 83, 0.5), (1, 79, 0.5), (1.5, 76, 0.5), (2, 79, 1), (3, 84, 1),
               (4, 83, 0.5), (4.5, 79, 0.5), (5, 74, 0.5), (5.5, 79, 0.5), (6, 83, 2),
               (8, 81, 0.5), (8.5, 84, 0.5), (9, 88, 1), (10, 84, 0.5), (10.5, 81, 0.5), (11, 76, 1),
               (12, 77, 0.5), (12.5, 81, 0.5), (13, 84, 1), (14, 83, 0.5), (14.5, 79, 0.5), (15, 74, 1)]

    pluck_cache = {}

    def get_pluck(m, d):
        key = (m, d)
        if key not in pluck_cache:
            pluck_cache[key] = pluck(hz(m), d)
        return pluck_cache[key]

    n_bars = 13  # 26초 + 마지막 엔딩
    for b in range(n_bars):
        start = b * bar
        root, notes = chords[b % 4]
        intro = b < 2  # 처음 두 마디는 가볍게
        # 우쿨렐레 스트럼: 다운-다운업-업다운업 리듬
        for k, (pos, dirn) in enumerate([(0, 1), (1, 1), (1.5, -1), (2.5, -1), (3, 1), (3.5, -1)]):
            order = notes if dirn > 0 else notes[::-1]
            for s_i, m in enumerate(order):
                place(mix, get_pluck(m, 0.9), start + pos * beat + s_i * 0.012, 0.22 if dirn > 0 else 0.15)
        # 베이스: 1, 3박 + 당김
        place(mix, bass(hz(root), 0.45), start, 0.55)
        place(mix, bass(hz(root), 0.25), start + 1.5 * beat, 0.4)
        place(mix, bass(hz(root + 7), 0.45), start + 2 * beat, 0.5)
        place(mix, bass(hz(root + 12), 0.25), start + 3.5 * beat, 0.35)
        # 드럼
        if not intro:
            for q in range(4):
                place(mix, kick(), start + q * beat, 0.8 if q % 2 == 0 else 0.55)
            place(mix, clap(), start + beat, 0.35)
            place(mix, clap(), start + 3 * beat, 0.35)
            place(mix, snare(), start + 3 * beat, 0.2)
        for e in range(8):
            place(mix, hat(), start + e * beat / 2, 0.18 if e % 2 else 0.1)
        # 멜로디: 2마디부터, 8마디 단위로 A → B
        if b >= 2:
            phrase = motif_a if ((b - 2) // 4) % 2 == 0 else motif_b
            base_beat = ((b - 2) % 4) * 4
            for pos, m, d in phrase:
                if base_beat <= pos < base_beat + 4:
                    place(mix, glock(hz(m), d * beat + 0.3), start + (pos - base_beat) * beat, 0.32)

    # 엔딩: 26초에 C 코드 한 방 + 반짝임
    end = n_bars * bar
    for s_i, m in enumerate([48, 60, 64, 67, 72, 76]):
        place(mix, pluck(hz(m), 2.0), end + s_i * 0.02, 0.3)
    place(mix, bass(hz(36), 1.5), end, 0.6)
    place(mix, kick(), end, 0.9)
    for i, m in enumerate([84, 88, 91, 96]):
        place(mix, glock(hz(m), 0.8), end + 0.1 + i * 0.08, 0.25)

    mix = mix[: int(SR * total)]
    fade = np.ones_like(mix)
    fade[-int(SR * 0.8):] = np.linspace(1, 0, int(SR * 0.8))
    mix *= fade
    # 부드러운 소프트 클리핑
    mix = np.tanh(mix * 1.2)
    save("bgm.wav", mix)


# ---------- 효과음 ----------

def make_sfx():
    # 띠용~ (착지)
    t = t_(0.6)
    f = 180 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4) + 200 * np.exp(-t * 6)
    save("boing.wav", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5))

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

    # 띠리링~ (MAX 달성, 상승 아르페지오)
    x = np.zeros(int(SR * 1.2))
    for i, m in enumerate([72, 76, 79, 84, 88, 91]):
        place(x, glock(hz(m), 0.6), i * 0.07, 1.0)
    save("levelup.wav", x)

    # 꽥! (깜짝 놀람: 하강 슬라이드)
    t = t_(0.5)
    f = 900 * np.exp(-t * 5) + 150
    sq = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
    save("shock.wav", sq * 0.5 * np.exp(-t * 5))

    # 반짝반짝 (아웃트로)
    x = np.zeros(int(SR * 1.5))
    for i in range(10):
        place(x, glock(hz(84 + int(rng.integers(0, 12))), 0.5), i * 0.09, 0.8)
    save("sparkle.wav", x)

    # 냠냠 (먹방)
    t = t_(0.15)
    f = 220 + 80 * np.sin(2 * np.pi * 30 * t)
    save("chomp.wav", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 25))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    make_sfx()
    make_bgm()
    print("done ->", os.path.abspath(OUT))
