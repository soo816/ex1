# 귤이의 제주 대모험 (Remotion)

Discover Jeju 사이트 사진(`../assets`)으로 만든 28초 세로형(1080x1920) 쇼츠 영상입니다.

- 미리보기: `npm install && npm run studio`
- 렌더링: `npm run render` → `out/jeju-fun.mp4`
- 완성본: `jeju-fun.mp4`

장면: 인트로 → 제주 도착 → 바다 → 먹방 게이지 → 감귤밭 → 아웃트로
폰트: Jua (SIL OFL)

## 사운드
배경음악(우쿨렐레 + 글로켄슈필, 140BPM)과 효과음(띠용·뽁·휘익·냠냠·레벨업·깜짝·반짝)은 `scripts/make_audio.py`로 직접 합성한 오리지널이라 저작권 걱정 없이 쓸 수 있어요.
다시 만들기: `python3 scripts/make_audio.py` → `public/audio/`

## 나레이션 (TTS)
`narration/script.json`에 장면별 리포터 스타일 대본이 있어요. `pip install edge-tts` 후 `python3 scripts/narrate.py`를 실행하면 음성과 자막이 영상에 들어갑니다(나레이션 동안 배경음악 자동 감소).
`speech.platform.bing.com` 접속이 필요합니다. 자세한 사용법은 `.claude/skills/video-narration/SKILL.md`.
