# 카드쇼츠 웹앱 실행용 이미지 — 저장소 루트에서 빌드한다:
#   docker build -f webapp/Dockerfile -t card-shorts .
#   docker run -p 3000:3000 card-shorts
FROM node:22-bookworm

# ffmpeg, Python, 한글·이모지 글꼴, Chromium(Remotion 렌더러) 실행에 필요한 라이브러리
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg python3 python3-venv fonts-noto-cjk fonts-noto-color-emoji \
      libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libgbm1 libasound2 libxrandr2 \
      libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libpango-1.0-0 libcairo2 libcups2 \
    && rm -rf /var/lib/apt/lists/*

# 나레이션 TTS (Supertonic) — 모델도 미리 받아 둔다
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir supertonic \
    && /opt/venv/bin/python -c "from supertonic import TTS; TTS(model='supertonic-2'); TTS(model='supertonic-3')"
ENV PYTHON=/opt/venv/bin/python

WORKDIR /app
COPY video/package*.json video/
COPY webapp/package*.json webapp/
RUN cd webapp && npm ci --no-audit --no-fund
COPY video video
COPY webapp webapp
# Remotion 이 쓸 Chromium(headless shell) 미리 받기
RUN cd webapp && node --input-type=module -e "import { ensureBrowser } from '@remotion/renderer'; await ensureBrowser();"

ENV PORT=3000
EXPOSE 3000
WORKDIR /app/webapp
CMD ["npm", "start"]
