// 카드쇼츠 프론트엔드 (빌드 도구 없이 쓰는 순수 JS)
(() => {
  const $ = (sel) => document.querySelector(sel);
  const LIMIT = { scenes: 15, narrationHint: 80, narration: 120, headline: 40, subline: 60, rawBytes: 30 * 1024 * 1024, bytes: 10 * 1024 * 1024 };
  const MAX_SIDE = 1600;

  let uid = 0;
  const state = {
    step: 1,
    cards: [], // { id, blob, url, name }
    scenes: [], // { id, kind: card|photo|text, cardId, photo: {blob,url}, headline, subline, narration }
    scenesFrom: "", // 장면을 만든 입력(카드·대본)의 지문 — 바뀌면 다시 만든다
    jobId: null,
    pollTimer: null,
  };

  // ---------- 공통 ----------

  let toastTimer;
  const toast = (msg, bad = true) => {
    const t = $("#toast");
    t.textContent = msg;
    t.className = "toast" + (bad ? " bad" : "");
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 4500);
  };

  const len = (s) => [...(s || "")].length;
  const el = (tag, props = {}, children = []) => {
    const n = document.createElement(tag);
    Object.assign(n, props);
    for (const c of [].concat(children)) if (c != null) n.append(c);
    return n;
  };

  // 사진을 1600px 이하 JPEG 로 줄인다 (아이폰 HEIC 도 사파리에서는 여기서 JPEG 로 바뀐다)
  const prepareImage = async (file) => {
    if (file.size > LIMIT.rawBytes) throw new Error(`'${file.name}' 파일이 너무 커요. 30MB 이하 사진을 올려 주세요.`);
    let bmp;
    try {
      bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      throw new Error(`'${file.name}'은(는) 열 수 없는 사진 형식이에요. JPG나 PNG로 바꿔서 올려 주세요.`);
    }
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; // 투명 PNG 는 흰 바탕으로
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    if (!blob || blob.size > LIMIT.bytes) throw new Error(`'${file.name}' 사진을 줄이지 못했어요. 다른 사진을 골라 주세요.`);
    return { blob, url: URL.createObjectURL(blob), name: file.name };
  };

  // ---------- 1. 내용 넣기 ----------

  const renderCards = () => {
    const list = $("#cardList");
    list.innerHTML = "";
    state.cards.forEach((c, i) => {
      const up = el("button", { type: "button", textContent: "▲", title: "앞으로", disabled: i === 0, onclick: () => moveCard(i, -1) });
      const down = el("button", { type: "button", textContent: "▼", title: "뒤로", disabled: i === state.cards.length - 1, onclick: () => moveCard(i, 1) });
      const del = el("button", { type: "button", textContent: "✕", title: "빼기", onclick: () => removeCard(i) });
      list.append(
        el("li", {}, [
          el("img", { src: c.url, alt: `카드 ${i + 1}` }),
          el("span", { className: "num", textContent: i + 1 }),
          el("div", { className: "tools" }, [up, down, del]),
        ]),
      );
    });
    updateScriptHint();
  };

  const moveCard = (i, d) => {
    const j = i + d;
    [state.cards[i], state.cards[j]] = [state.cards[j], state.cards[i]];
    renderCards();
  };
  const removeCard = (i) => {
    state.cards.splice(i, 1);
    renderCards();
  };

  const addCardFiles = async (files) => {
    for (const f of files) {
      if (state.cards.length >= LIMIT.scenes) {
        toast(`카드는 ${LIMIT.scenes}장까지 올릴 수 있어요.`);
        break;
      }
      try {
        const img = await prepareImage(f);
        state.cards.push({ id: ++uid, ...img });
      } catch (e) {
        toast(e.message);
      }
    }
    renderCards();
  };

  const paragraphs = () =>
    $("#script")
      .value.split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter(Boolean);

  const updateScriptHint = () => {
    const n = paragraphs().length;
    const c = state.cards.length;
    const hint = $("#scriptHint");
    const total = Math.max(n, c);
    hint.className = "hint" + (total > LIMIT.scenes ? " bad" : "");
    if (!n && !c) hint.textContent = "";
    else if (n && c) hint.textContent = `카드 ${c}장 + 문단 ${n}개 → 장면 ${total}개` + (n > c ? ` (남는 문단 ${n - c}개는 글자 카드로)` : n < c ? ` (문단이 없는 카드 ${c - n}장은 나레이션 없이)` : "");
    else hint.textContent = n ? `문단 ${n}개 → 글자 카드 장면 ${n}개` : `카드 ${c}장 → 장면 ${c}개`;
  };

  // 문단의 첫 문장을 글자 카드 큰 문구로
  const headlineFrom = (text) => {
    const first = text.split(/(?<=[.!?…])\s/)[0].replace(/[.…]+$/, "");
    return [...first].length <= 24 ? first : [...first].slice(0, 22).join("") + "…";
  };

  const buildScenes = () => {
    const paras = paragraphs();
    const n = Math.max(paras.length, state.cards.length);
    state.scenes = [];
    for (let i = 0; i < n; i++) {
      const card = state.cards[i];
      const narration = paras[i] || "";
      state.scenes.push(
        card
          ? { id: ++uid, kind: "card", cardId: card.id, headline: "", subline: "", narration }
          : { id: ++uid, kind: "text", headline: headlineFrom(narration), subline: "", narration },
      );
    }
  };

  // ---------- 2. 장면 다듬기 ----------

  const counter = (text) => {
    const n = len(text);
    const cls = n > LIMIT.narration ? " bad" : n > LIMIT.narrationHint ? " warn" : "";
    const msg = n > LIMIT.narration ? ` · ${LIMIT.narration}자를 넘었어요` : n > LIMIT.narrationHint ? " · 조금 길어요" : "";
    return { cls: "count" + cls, text: `${n} / ${LIMIT.narrationHint}자${msg}` };
  };

  const renderScenes = () => {
    const list = $("#sceneList");
    list.innerHTML = "";
    state.scenes.forEach((sc, i) => {
      const head = el("div", { className: "scene-head" }, [
        el("span", { className: "no", textContent: `장면 ${i + 1}` }),
        el("button", { className: "icon-btn", type: "button", textContent: "▲", title: "위로", disabled: i === 0, onclick: () => moveScene(i, -1) }),
        el("button", { className: "icon-btn", type: "button", textContent: "▼", title: "아래로", disabled: i === state.scenes.length - 1, onclick: () => moveScene(i, 1) }),
        el("button", { className: "icon-btn del", type: "button", textContent: "✕", title: "삭제", onclick: () => removeScene(i) }),
      ]);

      const kinds = el(
        "div",
        { className: "kind" },
        [
          ["card", "카드 이미지"],
          ["photo", "내 사진"],
          ["text", "글자 카드"],
        ].map(([k, label]) =>
          el("button", {
            type: "button",
            className: sc.kind === k ? "on" : "",
            textContent: label,
            onclick: () => {
              sc.kind = k;
              if (k === "card" && !sc.cardId && state.cards[0]) sc.cardId = state.cards[0].id;
              if (k === "text" && !sc.headline) sc.headline = headlineFrom(sc.narration || "");
              renderScenes();
            },
          }),
        ),
      );

      let visual;
      if (sc.kind === "card") {
        const card = state.cards.find((c) => c.id === sc.cardId);
        const select = el(
          "select",
          { onchange: (e) => ((sc.cardId = Number(e.target.value)), renderScenes()) },
          [el("option", { value: "", textContent: state.cards.length ? "카드 고르기" : "1단계에서 카드를 올려 주세요", disabled: true, selected: !card })].concat(
            state.cards.map((c, ci) => el("option", { value: c.id, textContent: `카드 ${ci + 1}`, selected: c.id === sc.cardId })),
          ),
        );
        visual = el("div", { className: "visual" }, [
          card ? el("img", { src: card.url, alt: "" }) : el("div", { className: "ph", textContent: "카드 없음" }),
          el("div", { className: "side" }, [select]),
        ]);
      } else if (sc.kind === "photo") {
        const input = el("input", {
          type: "file",
          accept: "image/*",
          hidden: true,
          onchange: async (e) => {
            const f = e.target.files[0];
            if (!f) return;
            try {
              sc.photo = await prepareImage(f);
              renderScenes();
            } catch (err) {
              toast(err.message);
            }
          },
        });
        const pick = el("label", { className: "btn ghost small" }, [input, sc.photo ? "사진 바꾸기" : "사진 고르기"]);
        visual = el("div", { className: "visual" }, [
          sc.photo ? el("img", { src: sc.photo.url, alt: "" }) : el("div", { className: "ph", textContent: "사진을 골라 주세요" }),
          el("div", { className: "side" }, [pick]),
        ]);
      } else {
        visual = el("div", { className: "text-fields" }, [
          el("input", { type: "text", maxLength: LIMIT.headline, placeholder: "화면 문구 (큰 글씨)", value: sc.headline, oninput: (e) => (sc.headline = e.target.value) }),
          el("input", { type: "text", maxLength: LIMIT.subline, placeholder: "작은 문구 (선택)", value: sc.subline, oninput: (e) => (sc.subline = e.target.value) }),
        ]);
      }

      const c = counter(sc.narration);
      const count = el("div", { className: c.cls, textContent: c.text });
      const narration = el("textarea", {
        rows: 3,
        placeholder: "나레이션 (비워 두면 음성 없이 3.5초)",
        value: sc.narration,
        oninput: (e) => {
          sc.narration = e.target.value;
          const cc = counter(sc.narration);
          count.className = cc.cls;
          count.textContent = cc.text;
        },
      });

      list.append(el("li", { className: "scene" }, [head, kinds, visual, narration, count]));
    });
    $("#addScene").disabled = state.scenes.length >= LIMIT.scenes;
  };

  const moveScene = (i, d) => {
    const j = i + d;
    [state.scenes[i], state.scenes[j]] = [state.scenes[j], state.scenes[i]];
    renderScenes();
  };
  const removeScene = (i) => {
    if (state.scenes.length === 1) return toast("장면은 하나 이상 있어야 해요.");
    state.scenes.splice(i, 1);
    renderScenes();
  };

  // ---------- 검사 ----------

  const checkStep1 = () => {
    if (!state.cards.length && !paragraphs().length) return "카드뉴스 이미지를 올리거나 대본을 붙여 넣어 주세요.";
    if (Math.max(state.cards.length, paragraphs().length) > LIMIT.scenes) return `장면은 ${LIMIT.scenes}개까지예요. 카드나 문단을 줄여 주세요.`;
    return null;
  };

  const checkScenes = () => {
    for (const [i, sc] of state.scenes.entries()) {
      const n = i + 1;
      if (sc.kind === "card" && !state.cards.find((c) => c.id === sc.cardId)) return `${n}번 장면에 카드를 골라 주세요.`;
      if (sc.kind === "photo" && !sc.photo) return `${n}번 장면에 사진을 골라 주세요.`;
      if (sc.kind === "text" && !sc.headline.trim() && !sc.narration.trim()) return `${n}번 글자 카드에 '화면 문구'를 적어 주세요.`;
      if (len(sc.narration.trim()) > LIMIT.narration) return `${n}번 장면 나레이션이 너무 길어요. ${LIMIT.narration}자 이내로 줄여 주세요.`;
    }
    return null;
  };

  // ---------- 단계 이동 ----------

  const fingerprint = () => JSON.stringify([state.cards.map((c) => c.id), $("#script").value]);

  const go = (step) => {
    state.step = step;
    for (let i = 1; i <= 4; i++) $(`#step${i}`).hidden = i !== step;
    document.querySelectorAll("#steps li").forEach((li) => {
      const s = Number(li.dataset.step);
      li.className = s === step ? "active" : s < step ? "done" : "";
    });
    $("#prev").style.visibility = step === 1 || step === 4 ? "hidden" : "visible";
    $("#actions").hidden = step === 4;
    $("#next").textContent = step === 3 ? "🎬 영상 만들기" : "다음";
    window.scrollTo({ top: 0 });
  };

  $("#next").onclick = () => {
    if (state.step === 1) {
      const err = checkStep1();
      if (err) return toast(err);
      if (fingerprint() !== state.scenesFrom) {
        buildScenes();
        state.scenesFrom = fingerprint();
      }
      renderScenes();
      go(2);
    } else if (state.step === 2) {
      const err = checkScenes();
      if (err) return toast(err);
      go(3);
    } else if (state.step === 3) {
      submit();
    }
  };
  $("#prev").onclick = () => go(Math.max(1, state.step - 1));

  $("#addScene").onclick = () => {
    state.scenes.push({ id: ++uid, kind: "text", headline: "", subline: "", narration: "" });
    renderScenes();
    $("#sceneList").lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ---------- 만들기 ----------

  const styleValues = () => ({
    template: document.querySelector("input[name=template]:checked").value,
    voice: document.querySelector("input[name=voice]:checked").value,
    music: document.querySelector("input[name=music]:checked").value,
    subtitles: $("#subtitles").checked,
    title: $("#title").value.trim(),
    ctaMain: $("#ctaMain").value.trim(),
    ctaSub: $("#ctaSub").value.trim(),
  });

  const submit = async () => {
    const err = checkScenes();
    if (err) return toast(err);
    const form = new FormData();
    const blobs = []; // 업로드할 이미지 (같은 카드는 한 번만)
    const indexOf = (key, blob) => {
      let i = blobs.findIndex((b) => b.key === key);
      if (i < 0) i = blobs.push({ key, blob }) - 1;
      return i;
    };
    const scenes = state.scenes.map((sc) => {
      const base = { narration: sc.narration.trim(), headline: sc.headline.trim(), subline: sc.subline.trim() };
      if (sc.kind === "text") return { kind: "text", ...base };
      const img = sc.kind === "card" ? state.cards.find((c) => c.id === sc.cardId) : sc.photo;
      return { kind: "image", image: indexOf(sc.kind === "card" ? `c${sc.cardId}` : `p${sc.id}`, img.blob), ...base };
    });
    form.append("data", JSON.stringify({ ...styleValues(), scenes }));
    blobs.forEach((b, i) => form.append("images", b.blob, `image${i}.jpg`));

    $("#next").disabled = true;
    try {
      const res = await fetch("/api/jobs", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "서버에 보내지 못했어요. 인터넷 연결을 확인해 주세요.");
      state.jobId = body.id;
      showProgress(body);
      go(4);
      poll();
    } catch (e) {
      toast(e.message || "서버에 보내지 못했어요. 인터넷 연결을 확인해 주세요.");
    } finally {
      $("#next").disabled = false;
    }
  };

  const ORDER = ["queued", "tts", "render", "done"];
  const showProgress = (job) => {
    $("#progressView").hidden = job.status === "done" || job.status === "error";
    $("#resultView").hidden = job.status !== "done";
    $("#errorView").hidden = job.status !== "error";
    const now = ORDER.indexOf(job.status);
    document.querySelectorAll("#stages li").forEach((li) => {
      const i = ORDER.indexOf(li.dataset.stage);
      li.className = i < now ? "done" : i === now ? "now" : "";
    });
    const pct = job.status === "render" ? job.progress : job.status === "done" ? 100 : 0;
    $("#pct").textContent = job.status === "render" ? `${job.progress}%` : "";
    $("#barFill").style.width = `${job.status === "queued" ? 3 : job.status === "tts" ? 10 : 10 + pct * 0.9}%`;
    $("#queueHint").textContent = job.status === "queued" && job.queuePosition > 1 ? `앞에 ${job.queuePosition - 1}개의 영상이 만들어지고 있어요.` : "";
    if (job.status === "done") {
      if (job.posterUrl) $("#player").poster = job.posterUrl;
      $("#player").src = job.videoUrl;
      $("#download").href = job.videoUrl;
      $("#attribution").hidden = !job.attribution;
      $("#attributionText").textContent = job.attribution || "";
    }
    if (job.status === "error") $("#errorText").textContent = job.message;
  };

  const poll = () => {
    clearTimeout(state.pollTimer);
    state.pollTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/jobs/${state.jobId}`);
        const job = await res.json();
        if (!res.ok) throw new Error(job.error);
        showProgress(job);
        if (job.status !== "done" && job.status !== "error") poll();
      } catch (e) {
        showProgress({ status: "error", message: e.message || "진행 상황을 가져오지 못했어요." });
      }
    }, 1200);
  };

  $("#copyAttribution").onclick = async () => {
    try {
      await navigator.clipboard.writeText($("#attributionText").textContent);
      toast("출처 문구를 복사했어요.", false);
    } catch {
      toast("복사하지 못했어요. 글자를 길게 눌러 직접 복사해 주세요.");
    }
  };
  $("#editAgain").onclick = () => go(3);
  $("#backToEdit").onclick = () => go(2);
  $("#startOver").onclick = () => {
    if (!confirm("입력한 내용을 모두 지우고 새로 만들까요?")) return;
    location.reload();
  };

  // ---------- 시작 ----------

  $("#cardInput").onchange = (e) => {
    addCardFiles([...e.target.files]);
    e.target.value = "";
  };
  const drop = $("#cardDrop");
  drop.ondragover = (e) => (e.preventDefault(), drop.classList.add("drag"));
  drop.ondragleave = () => drop.classList.remove("drag");
  drop.ondrop = (e) => {
    e.preventDefault();
    drop.classList.remove("drag");
    addCardFiles([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/")));
  };
  $("#script").oninput = updateScriptHint;

  // 테스트·스크린샷용: window.cardShorts.state 로 상태를 볼 수 있다
  window.cardShorts = { state };
  go(1);
})();
