# 귤이의 제주 대모험 (Remotion)

Discover Jeju 사이트 사진(`../assets`)으로 만든 28초 세로형(1080x1920) 쇼츠 영상입니다.

- 미리보기: `npm install && npm run studio`
- 렌더링: `npm run render` → `out/jeju-fun.mp4`
- 완성본: `jeju-fun.mp4` (여성 리포터 나레이션), `jeju-fun-male.mp4` (남성 아이돌 팬 토크 느낌 나레이션)
- 남성 버전 렌더링: `npx remotion render JejuFunBoy out/jeju-fun-male.mp4`

장면: 인트로 → 제주 도착 → 바다 → 먹방 게이지 → 감귤밭 → 아웃트로
폰트: Jua (SIL OFL)

## 사운드
- 배경음악: 실제 악기(우쿨렐레)로 녹음된 Kevin MacLeod의 "Carefree"를 28초로 자르고 마지막 1초를 페이드아웃했어요(`public/audio/bgm.mp3`, -14 LUFS). 더 이상 직접 합성한 음악이 아닙니다.
- 효과음: 휘익(서핑)과 작은 뽁(제목) 두 가지만 낮은 음량으로 씁니다. `scripts/make_audio.py`로 직접 합성한 오리지널 → `public/audio/pop.wav`, `whoosh.wav`

## 카드뉴스 쇼츠 (`CardShort`)
`webapp/`(카드뉴스·대본 → 세로 쇼츠 웹앱)이 렌더링하는 일반 컴포지션입니다. 템플릿 3종(강의·교육 / 정보·뉴스 / 가게·상품), 카드 이미지·사진·글자 카드 장면, 자막, 배경음악 덕킹, 마무리 화면을 지원하고 길이는 나레이션에 맞춰 자동으로 정해져요(`calculateMetadata`).
미리보기: `npm run studio` → CardShort. 긴 영상용 배경음악은 `public/audio/carefree-long.mp3`, `calm-long.mp3`(200초, -14 LUFS).

글꼴: Jua (SIL OFL), Pretendard (SIL OFL, `public/fonts/Pretendard-LICENSE.txt`)

### 음원 출처 (CC BY 4.0)
"Carefree" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/

"Clean Soul" Kevin MacLeod (incompetech.com) — CardShort 의 '차분한 곡'
Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/

## 나레이션 (TTS)
`narration/script.json`에 장면별 리포터 스타일 대본이 있어요. `python3 scripts/narrate.py`를 실행하면 음성(`public/narration/*.mp3`)과 자막 목록(`src/narration-manifest.json`)이 만들어져 영상에 들어갑니다(나레이션 동안 배경음악 자동 감소).

- 기본 엔진: Supertone **Supertonic 2** (`pip install supertonic`), 밝은 여성 목소리 `F4`, 속도 1.1. 컨테이너 안에서 직접 돌아가는 한국어 신경망 TTS로, 처음 한 번만 Hugging Face(`Supertone/supertonic-2`)에서 모델을 받습니다.
  라이선스: 모델은 BigScience OpenRAIL-M(사용 제한 조항을 지키면 상업적 사용 가능), 추론 코드는 MIT.
- 다른 엔진: `python3 scripts/narrate.py --engine edge` → Microsoft Edge 온라인 음성(`pip install edge-tts`, 기본 `ko-KR-SunHiNeural`). 일반 PC에서는 잘 되지만, Claude 클라우드 세션에서는 Microsoft 서버가 403으로 거부해서 쓸 수 없어요.

### 두 가지 나레이션 버전
| 컴포지션 | 대본 | 목소리 | 결과 |
|---|---|---|---|
| `JejuFun` | `narration/script.json` (리포터 말투) | Supertonic `F4` 밝은 여성 | `public/narration/`, `src/narration-manifest.json` |
| `JejuFunBoy` | `narration/script-male.json` (밝고 장난스러운 아이돌 팬 토크 해요체) | Supertonic **3** `M1` 밝고 부드러운 20대 초반 남성 | `public/narration-male/`, `src/narration-manifest-male.json` |

다시 만들기: `python3 scripts/narrate.py` (여성), `python3 scripts/narrate.py --script narration/script-male.json` (남성).
목소리는 대본 파일의 `supertonic.model`(`supertonic-2`/`supertonic-3`)과 `supertonic.voice`(F1~F5, M1~M5)로 고르고, 한 번만 바꿔 보려면 `--voice M4`처럼 붙이면 됩니다. 내장 목소리를 섞을 수도 있어요: `"voice": {"M1": 0.7, "F3": 0.3}`.
`voice-compare.mp3`: 남성 후보 목소리 비교(같은 문장, 0.5초 간격) — ① Supertonic 3 `M1`(채택) ② `M1` 70% + `F3` 30% ③ `M1` 70% + `F5` 30%.

> 실존 인물(연예인·아이돌 등)의 목소리를 복제하거나 흉내 내지 않습니다. 참조 음성 없이 오픈 모델의 내장 목소리만 씁니다.
> Supertonic 2·3 모델: OpenRAIL-M(상업적 사용 가능, 사용 제한 조항 준수), 코드: MIT.

자세한 사용법은 `.claude/skills/video-narration/SKILL.md`.
