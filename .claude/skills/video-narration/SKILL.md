---
name: video-narration
description: Remotion 영상(video/)에 자연스러운 한국어 나레이션(리포터·나레이터 스타일 TTS)과 자막을 넣는다. "나레이션 넣어줘", "텍스트 읽어줘", "TTS", "음성 입혀줘", "리포터처럼 읽어줘", "목소리 바꿔줘", "자막 넣어줘" 같은 요청에 사용.
---

# 영상 나레이션 넣기

`video/` Remotion 프로젝트에 장면별 나레이션 음성과 자막을 넣는다. 음성은 Microsoft Edge 온라인 신경망 음성(edge-tts)으로 만든다.

## 준비
- `pip install edge-tts`
- 네트워크에서 `speech.platform.bing.com` 접속이 허용돼 있어야 한다. 막혀 있으면(DNS 오류, 403) 클라우드 환경 설정의 Network access에서 이 도메인을 허용해 달라고 사용자에게 알린다. 로봇 같은 대체 음성(espeak 등)으로 몰래 바꾸지 않는다.

## 순서
1. **대본 쓰기** — `video/narration/script.json`의 `lines`를 고친다.
   - `scene`은 `src/JejuFun.tsx`의 `SCENES` 키(intro, hero, beach, food, tangerine, outro), `offset`은 장면 시작 후 몇 초 뒤에 말할지.
   - 한 줄은 장면 길이(4~5초)보다 0.5초 이상 짧아야 한다. 한국어는 `rate +8%`에서 초당 약 7음절이 기준이다.
   - 리포터 스타일: 현장감 있는 현재형("~입니다", "~인데요?"), 쉼표로 호흡을 끊고, 장면마다 핵심 한 문장.
2. **음성 만들기** — `cd video && python3 scripts/narrate.py`
   - 결과: `public/narration/<id>.mp3`, `src/narration-manifest.json`(줄마다 길이 포함)
   - 출력된 길이가 장면 길이를 넘으면 문장을 줄이거나 `--rate +15%`로 다시 만든다.
3. **렌더링** — `npx remotion render JejuFun out/jeju-fun.mp4`
   - 나레이션 구간에는 배경음악이 자동으로 줄어들고(`BGM_DUCKED`), 화면 아래에 자막이 뜬다.
   - 이 클라우드 환경에서는 `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`을 붙인다.
4. 음량을 `ffmpeg -i out/jeju-fun.mp4 -af ebur128 -f null -`로 확인한다(SNS 기준 약 -14 LUFS).

## 목소리
| 용도 | voice |
|---|---|
| 밝은 여성 리포터 (기본) | `ko-KR-SunHiNeural` |
| 차분한 남성 나레이터 | `ko-KR-InJoonNeural` |
| 부드러운 남성 (다국어) | `ko-KR-HyunsuMultilingualNeural` |

`python3 scripts/narrate.py --voice ko-KR-InJoonNeural`처럼 바꿔서 만들 수 있다.

## 배경음악 바꾸기
실제 악기로 녹음된 음원을 `video/public/audio/`에 넣고 `src/JejuFun.tsx`의 `BGM_FILE` 경로만 바꾼다. 저작권 표기가 필요한 음원(CC BY 등)이면 `video/README.md`에 출처를 적는다.
