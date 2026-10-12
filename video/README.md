# 귤이의 제주 대모험 (Remotion)

Discover Jeju 사이트 사진(`../assets`)으로 만든 28초 세로형(1080x1920) 쇼츠 영상입니다.

- 미리보기: `npm install && npm run studio`
- 렌더링: `npm run render` → `out/jeju-fun.mp4`
- 완성본: `jeju-fun.mp4`

장면: 인트로 → 제주 도착 → 바다 → 먹방 게이지 → 감귤밭 → 아웃트로
폰트: Jua (SIL OFL)

## 사운드
- 배경음악: 실제 악기(우쿨렐레)로 녹음된 Kevin MacLeod의 "Carefree"를 28초로 자르고 마지막 1초를 페이드아웃했어요(`public/audio/bgm.mp3`, -14 LUFS). 더 이상 직접 합성한 음악이 아닙니다.
- 효과음: 휘익(서핑)과 작은 뽁(제목) 두 가지만 낮은 음량으로 씁니다. `scripts/make_audio.py`로 직접 합성한 오리지널 → `public/audio/pop.wav`, `whoosh.wav`

### 음원 출처 (CC BY 4.0)
"Carefree" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/

## 나레이션 (TTS)
`narration/script.json`에 장면별 리포터 스타일 대본이 있어요. `python3 scripts/narrate.py`를 실행하면 음성(`public/narration/*.mp3`)과 자막 목록(`src/narration-manifest.json`)이 만들어져 영상에 들어갑니다(나레이션 동안 배경음악 자동 감소).

- 기본 엔진: Supertone **Supertonic 2** (`pip install supertonic`), 밝은 여성 목소리 `F4`, 속도 1.1. 컨테이너 안에서 직접 돌아가는 한국어 신경망 TTS로, 처음 한 번만 Hugging Face(`Supertone/supertonic-2`)에서 모델을 받습니다.
  라이선스: 모델은 BigScience OpenRAIL-M(사용 제한 조항을 지키면 상업적 사용 가능), 추론 코드는 MIT.
- 다른 엔진: `python3 scripts/narrate.py --engine edge` → Microsoft Edge 온라인 음성(`pip install edge-tts`, 기본 `ko-KR-SunHiNeural`). 일반 PC에서는 잘 되지만, Claude 클라우드 세션에서는 Microsoft 서버가 403으로 거부해서 쓸 수 없어요.

자세한 사용법은 `.claude/skills/video-narration/SKILL.md`.
