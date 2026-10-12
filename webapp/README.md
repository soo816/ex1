# 카드쇼츠 — 카드뉴스·대본 → 세로 쇼츠 만들기

카드뉴스 이미지를 올리거나 대본을 붙여 넣으면, 자연스러운 한국어 나레이션·자막·배경음악이 들어간 **세로 영상(1080×1920, 9:16, 30fps)** 을 만들어 주는 웹앱입니다. 휴대폰 화면에 맞춰 만들었고, 컴퓨터에서도 잘 보여요.

- AI 글쓰기·로그인·결제 없음. 내 컴퓨터(또는 서버) 한 대에서 돌아갑니다.
- 영상은 `video/` 폴더의 Remotion 프로젝트(`CardShort` 컴포지션)로 만들고, 목소리는 Supertonic(컴퓨터 안에서 도는 한국어 TTS)으로 만듭니다.

## 이렇게 써요 (4단계)

| 단계 | 하는 일 |
|---|---|
| 1. 내용 넣기 | 카드뉴스 이미지 여러 장 올리기(▲▼로 순서 바꾸기) 그리고/또는 대본 붙여 넣기 — 빈 줄로 나눈 문단 하나가 장면 하나. 둘 다 넣으면 문단 1↔카드 1 식으로 짝지어지고, 남는 문단은 글자 카드, 남는 카드는 나레이션 없이 들어가요. |
| 2. 장면 다듬기 | 장면마다 화면 종류(카드 이미지 / 내 사진 / 글자 카드), 나레이션(80자 안쪽 추천, 최대 120자), 순서 바꾸기·삭제·추가 |
| 3. 스타일 | 템플릿(강의·교육 / 정보·뉴스 / 가게·상품), 목소리(여성 리포터·추천 / 남성), 배경음악(경쾌한 곡 / 차분한 곡 / 없음), 자막 켜기·끄기, 영상 제목(비우면 제목 화면 없음), 마무리 화면 문구 |
| 4. 만들기 | 음성 만드는 중 → 영상 만드는 중 NN% → 완료. 미리보기·다운로드·음악 출처 문구 복사, "수정해서 다시 만들기"(입력 유지) |

화면 모습: `docs/screenshots/` (step1-input, step2-scenes, step2-textcard, step3-style, step4-progress, step4-result)
샘플 영상: `samples/edu.mp4`(강의·교육), `samples/news.mp4`(정보·뉴스, 글자 카드만), `samples/shop.mp4`(가게·상품, 남성 목소리)

## 내 컴퓨터에서 실행하기

필요한 것: **Node.js 18 이상, Python 3.10 이상, ffmpeg, Chromium**(없으면 Remotion 이 처음 렌더링할 때 자동으로 받아요). 메모리 4GB 이상 권장.

```bash
cd webapp
npm install            # video/ 프로젝트 의존성도 같이 설치돼요
pip install supertonic # 나레이션 TTS (처음 실행 때 Hugging Face 에서 모델을 받아요)
npm start
```

브라우저에서 http://localhost:3000 을 열면 됩니다. 처음 켤 때 영상 프로젝트를 준비(번들링)하느라 30초쯤 걸려요.

설정(환경 변수, 모두 선택):

| 이름 | 기본값 | 설명 |
|---|---|---|
| `PORT` | 3000 | 서버 포트 |
| `PYTHON` | python3 | supertonic 이 설치된 Python |
| `JOBS_DIR` | webapp/jobs | 올린 사진·만든 영상 보관 폴더 (24시간 뒤 자동 삭제) |
| `REMOTION_BROWSER_EXECUTABLE` | 자동 | 쓸 Chromium 경로 |

### Docker 로 실행하기

```bash
# 저장소 맨 위 폴더에서
docker build -f webapp/Dockerfile -t card-shorts .
docker run -p 3000:3000 card-shorts
```

## 구조

```
webapp/
  server/index.js   Express 서버: 입력 검사 → 작업 대기열(한 번에 하나) → TTS → Remotion 렌더링 → 진행률 조회
  server/tts.py     나레이션 생성 (video/scripts/narrate.py 의 함수를 그대로 사용)
  public/           화면 (빌드 도구 없는 HTML·CSS·JS)
  scripts/          e2e.mjs(API 로 샘플 3개 만들기), screenshots.mjs(화면 캡처), make-sample-cards.mjs(가상 카드뉴스)
video/src/CardShort.tsx   영상 템플릿 (장면 길이 = max(3.5초, 나레이션 + 0.8초))
```

API

- `POST /api/jobs` — multipart: `data`(JSON) + `images`(JPG·PNG·WEBP, 한 장 10MB 이하). 장면은 15개까지.
  `data` 예: `{"template":"edu","voice":"female_reporter","music":"upbeat","subtitles":true,"title":"…","ctaMain":"…","ctaSub":"…","scenes":[{"kind":"image","image":0,"narration":"…"},{"kind":"text","headline":"…","subline":"…","narration":"…"}]}`
- `GET /api/jobs/:id` — `{status: queued|tts|render|done|error, progress, message, videoUrl, posterUrl, attribution}`
- `GET /jobs/:id/output.mp4` — 완성 영상

## 목소리

| 선택 | 엔진 | 설정 |
|---|---|---|
| 여성 리포터 (기본) | Supertonic 2 | `F4`, 속도 1.1 — `video/jeju-fun.mp4` 와 같은 목소리 |
| 남성 | Supertonic 3 | `M1`, 속도 1.05 |

발음 안전장치(`server/tts.py`): 이모지·특수기호는 빼고 읽고, "10%" → "십 퍼센트", 전화번호 "02-000-0000" → "공이, 공공공, 공공공공"처럼 바꿔 읽어요(자막은 적은 그대로 보여요). "10시"·"12명" 같은 표현은 그대로도 잘 읽어요. 그 밖에 어색하게 읽히는 말은 나레이션에 한글로 풀어 적어 주세요.
실존 인물(연예인 등)의 목소리를 복제하거나 흉내 내지 않습니다.

## 라이선스·출처

- **Remotion**: 개인, 비영리, 직원 3명 이하 회사는 무료. 그보다 큰 회사가 쓰면 회사 라이선스가 필요해요 → https://www.remotion.dev/license
- **Supertonic 2·3 모델**: BigScience OpenRAIL-M (상업적 사용 가능, 사용 제한 조항 준수), 추론 코드 MIT
- **배경음악** (CC BY 4.0 — 영상을 올릴 때 출처 표기 필수, 결과 화면에 문구가 나와요)
  - 경쾌한 곡: "Carefree" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/
  - 차분한 곡: "Clean Soul" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/
- **글꼴**: Pretendard, Jua — SIL Open Font License 1.1 (파일은 `video/public/` 에 포함, 인터넷에서 따로 받지 않아요)
- 샘플 카드뉴스·문구는 모두 가상의 내용입니다(가상 전화번호 포함).

## 알아 둘 점

- 한 번에 영상 하나씩 만들어요. 다른 사람이 만들고 있으면 순서를 기다려요. 30초 영상은 이 개발용 컴퓨터(CPU 4개)에서 약 1~2분 걸렸어요.
- 작업 목록은 서버 메모리에 있어서, 서버를 다시 켜면 진행 중이던 작업 상태가 사라져요(파일은 24시간 뒤 지워짐).
- 아이폰 HEIC 사진은 사파리에서 올리면 JPEG 로 바뀌어 올라가요. 다른 브라우저에서 HEIC 가 안 열리면 JPG 로 바꿔 주세요.

## 나중에 인터넷에 올리려면

1. **서버 고르기**: 렌더링에 CPU·메모리를 많이 써요. CPU 4개·메모리 8GB 이상 가상 서버(예: 클라우드 VM)에 위 Docker 이미지를 올리는 게 가장 간단해요.
2. **HTTPS·도메인**: 앞단에 Caddy·Nginx 같은 리버스 프록시를 두고 HTTPS 인증서를 붙여요. 업로드 크기 제한을 100MB 정도로 늘려 주세요.
3. **막아야 할 것**: 지금은 로그인이 없어 누구나 영상을 만들 수 있어요. 공개하기 전에 간단한 비밀번호(기본 인증)나 하루 사용 횟수 제한을 꼭 넣으세요.
4. **보관**: 여러 대로 늘리거나 서버를 자주 껐다 켠다면 작업 목록을 Redis·DB 에, 영상 파일을 객체 저장소(S3 등)에 두도록 바꿔야 해요.
5. **라이선스 다시 확인**: 회사(직원 4명 이상)로 서비스하면 Remotion 회사 라이선스가 필요해요. 음악 출처 표기는 계속 보여 주세요.
6. (2단계 아이디어) 대본 자동 작성(Claude API)은 `server/index.js` 의 `TODO(2단계)` 자리에 붙이면 돼요. API 키는 코드에 넣지 말고 환경 변수로.
