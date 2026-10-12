---
name: video-narration
description: Remotion 영상(video/)에 자연스러운 한국어 나레이션(리포터·나레이터 스타일 TTS)과 자막을 넣는다. "나레이션 넣어줘", "텍스트 읽어줘", "TTS", "음성 입혀줘", "리포터처럼 읽어줘", "목소리 바꿔줘", "자막 넣어줘" 같은 요청에 사용.
---

# 영상 나레이션 넣기

`video/` Remotion 프로젝트에 장면별 나레이션 음성과 자막을 넣는다.

## 엔진
| 엔진 | 언제 | 준비 |
|---|---|---|
| `supertonic` (기본) | 클라우드 세션 포함 어디서나 | `pip install supertonic` — Supertone "Supertonic 2" 한국어 신경망 TTS를 로컬(ONNX)에서 돌린다. 첫 실행 때 Hugging Face `Supertone/supertonic-2` 모델을 받는다. 라이선스: 모델 OpenRAIL-M, 코드 MIT |
| `edge` | 일반 PC | `pip install edge-tts` — Microsoft Edge 온라인 음성. **클라우드 세션에서는 `speech.platform.bing.com`이 403을 돌려줘서 안 된다** (네트워크를 Full로 열어도 마찬가지) |

로봇 같은 대체 음성(espeak, pyttsx3 등)으로 몰래 바꾸지 않는다. 자연스러운 엔진이 하나도 안 되면 나레이션을 빼고 사용자에게 알린다.

## 순서
1. **대본 쓰기** — `video/narration/script.json`의 `lines`를 고친다.
   - `scene`은 `src/JejuFun.tsx`의 `SCENES` 키(intro 4s, hero 5s, beach 5s, food 5s, tangerine 4.5s, outro 4.5s), `offset`은 장면 시작 후 몇 초 뒤에 말할지.
   - `offset + 길이`가 장면 길이보다 0.5초 이상 짧아야 한다. supertonic 속도 1.1에서 한국어는 초당 약 6~7음절.
   - 리포터 스타일: 현장감 있는 현재형("~입니다", "~인데요?"), 쉼표로 호흡을 끊고, 장면마다 핵심 한 문장.
   - 한 줄만 빠르게 하려면 그 줄에 `"speed": 1.2`를 넣는다. 단, 1.2 이상은 발음이 뭉개질 수 있어 문장을 줄이는 쪽이 낫다.
2. **음성 만들기** — `cd video && python3 scripts/narrate.py`
   - 결과: `public/narration/<id>.mp3`(앞뒤 무음 제거, -14 LUFS로 맞춤), `src/narration-manifest.json`(줄마다 길이 포함)
   - 같은 대본이면 매번 같은 음성이 나온다(`seed`). 마음에 안 들면 `script.json`의 `supertonic.seed`를 바꿔 본다.
   - 길이가 넘치면 문장을 줄이거나 `--speed 1.15`로 다시 만든다.
3. **알아듣기 쉬운지 확인** — faster-whisper(small, `language="ko"`)로 각 mp3를 받아쓰게 해서 대본과 거의 같은지 본다. ("귤이"를 "규리"로 받아쓰는 건 발음상 정상)
4. **렌더링** — `npx remotion render JejuFun out/jeju-fun.mp4`
   - 나레이션 구간에는 배경음악이 자동으로 줄어들고(`BGM_DUCKED`), 화면 아래에 자막이 뜬다.
   - 이 클라우드 환경에서는 `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`을 붙인다.
5. 음량을 `ffmpeg -i out/jeju-fun.mp4 -af ebur128 -f null -`로 확인한다(SNS 기준 약 -14 LUFS).

## 목소리
| 엔진 | voice | 느낌 |
|---|---|---|
| supertonic | `F4` (기본) | 밝은 여성 리포터 |
| supertonic | `F1`~`F5`, `M1`~`M5` | 다른 여성/남성 목소리 |
| edge | `ko-KR-SunHiNeural` | 밝은 여성 리포터 |
| edge | `ko-KR-InJoonNeural` | 차분한 남성 나레이터 |

`python3 scripts/narrate.py --voice M2`처럼 바꿔서 만들 수 있다. edge는 `--engine edge --voice ko-KR-InJoonNeural --rate +15%`.

## 배경음악 바꾸기
실제 악기로 녹음된 음원을 `video/public/audio/`에 넣고 `src/JejuFun.tsx`의 `BGM_FILE` 경로만 바꾼다. 음원은 28초로 자르고 -14 LUFS로 맞춘 뒤 넣으면 `BGM_VOLUME`/`BGM_DUCKED`를 그대로 쓸 수 있다. 저작권 표기가 필요한 음원(CC BY 등)이면 `video/README.md`에 출처를 적는다.
