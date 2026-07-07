import {
  canOpenEggGift,
  completeScene,
  createInitialState,
  loadState,
  rememberSceneChoice,
  saveState,
  shouldShowChoice,
  unlockEggGift,
  unlockMainGift,
} from "./state.js";
import { eggGift, mainGift, scenes } from "./content.js";

const app = document.querySelector("#app");

let state = loadState();
let hasStarted = false;
let inspectedChoice = null;
let suppressNextClick = false;
let isBoxGateOpen = false;
let backgroundMusic = null;
let rainAudioContext = null;
let rainSource = null;
let preloadPromise = null;

const IMAGE_RATIO = 819 / 546;
const MOBILE_PAN_QUERY = "(max-width: 700px)";
const BOX_CODE = "07070522";
const GIFT_OPENING_DURATION_MS = 1400;
const BGM_VOLUME = 0.42;
const RAIN_VOLUME = 0.055;

const sceneImages = {
  entrance: "./assets/rain-garden-entrance.png",
  "living-room": "./assets/rain-garden-living-room.png",
  "courtyard-pond": "./assets/warm-rainy-jiangnan-garden.png",
  bedroom: "./assets/rain-garden-bedroom.png",
};

const moyuImage = "./assets/moyu-brown-cocker-dog-transparent.png";
const PRELOAD_IMAGE_SOURCES = [
  ...Object.values(sceneImages),
  moyuImage,
  "./assets/ticket.png",
];

const hotspotPoints = {
  entrance: {
    "umbrella-charm": { x: 76, y: 60 },
    "rain-card": { x: 60, y: 54 },
  },
  "living-room": {
    "tea-cups": { x: 28, y: 78 },
    "moyu-bed": { x: 77, y: 76 },
  },
  "courtyard-pond": {
    "courtyard-lantern": { x: 17, y: 35 },
    "courtyard-bridge": { x: 63, y: 62 },
    "courtyard-moon": { x: 68, y: 10 },
  },
  bedroom: {
    "to-main-gift": { x: 87, y: 65 },
    "bedroom-card": { x: 78, y: 46 },
  },
};

const panByScene = Object.fromEntries(scenes.map((scene) => [scene.id, 0.5]));
let dragState = null;

function getCurrentScene() {
  return scenes.find((scene) => scene.id === state.currentSceneId) ?? scenes[0];
}

function setState(nextState) {
  state = nextState;
  inspectedChoice = null;
  saveState(state);
  render();
}

function clearInspectedChoice() {
  inspectedChoice = null;
  updateSceneDialog(getCurrentScene());
}

function isMobilePanEnabled() {
  return window.matchMedia(MOBILE_PAN_QUERY).matches;
}

function getScenePan(sceneId) {
  return panByScene[sceneId] ?? 0.5;
}

function setScenePan(sceneId, pan) {
  panByScene[sceneId] = Math.max(0, Math.min(1, pan));
  syncSceneLayout();
}

function render() {
  if (!hasStarted) {
    renderIntro();
    return;
  }

  const scene = getCurrentScene();

  if (scene.id === "bedroom" && isBoxGateOpen && !state.mainGiftUnlocked) {
    renderBoxGate();
    return;
  }

  if (scene.id === "bedroom" && state.mainGiftUnlocked) {
    renderMainGift();
    return;
  }

  renderScene(scene);
}

function renderIntro() {
  app.innerHTML = `
    <section class="screen intro-screen" style="--scene-image: url('${sceneImages.entrance}');">
      <div class="painted-scene" aria-hidden="true"></div>
      <div class="scene-vignette" aria-hidden="true"></div>
      <article class="card intro-card">
        <p class="eyebrow">Rain Garden Birthday</p>
        <h1>雨园生日寻礼</h1>
        <p>雨落在江南园林的窗上，摸鱼已经在玄关留下了第一串爪印。</p>
        <button class="button" type="button" data-action="start">开始寻礼</button>
      </article>
    </section>
  `;
}

function renderScene(scene) {
  app.innerHTML = `
    <section class="screen point-click point-click--${scene.id}" data-scene-id="${scene.id}" style="--scene-image: url('${sceneImages[scene.id]}');">
      <div class="painted-scene" aria-hidden="true"></div>
      <div class="scene-vignette" aria-hidden="true"></div>
      ${renderHotspots(scene)}
      ${renderEggHotspot(scene)}
      ${renderDialog(scene)}
    </section>
  `;

  requestAnimationFrame(syncSceneLayout);
}

function renderDialog(scene) {
  const feedback = inspectedChoice
    ? `${inspectedChoice.detail} ${scene.completionText}`
    : scene.body;
  const dialogClass = inspectedChoice ? "dialog--expanded" : "dialog--compact";
  const choiceNote = inspectedChoice?.isDecoy
    ? "这好像只是摸鱼故意留下的岔路。再看看真正有回应的地方。"
    : "摸鱼轻轻甩了甩耳朵，像是在催你继续。";
  const actionMarkup = inspectedChoice && !inspectedChoice.isDecoy
    ? '<div class="actions"><button class="button" type="button" data-action="continue-scene">继续跟上摸鱼</button></div>'
    : "";

  return `
    <article class="card dialog ${dialogClass}">
      <img class="moyu-avatar" src="${moyuImage}" alt="摸鱼" />
      <div class="dialog-copy">
        <p class="eyebrow">${scene.eyebrow}</p>
        <p id="feedback">${feedback}</p>
        <p class="moyu">${inspectedChoice ? choiceNote : scene.puzzlePrompt}</p>
        ${actionMarkup}
      </div>
    </article>
  `;
}

function updateSceneDialog(scene) {
  const dialog = document.querySelector(".dialog");
  if (!dialog) {
    return;
  }

  dialog.outerHTML = renderDialog(scene);
}

function renderHotspots(scene) {
  const points = hotspotPoints[scene.id] ?? {};

  return scene.choices
    .filter((choice) => shouldShowChoice(state, scene.id, choice.id))
    .map((choice) => {
      const point = points[choice.id];
      if (!point) {
        return "";
      }

      return `
        <button
          class="scene-hotspot"
          type="button"
          data-choice-id="${choice.id}"
          data-x="${point.x}"
          data-y="${point.y}"
          aria-label="${choice.label}"
        >
          <span></span>
          <strong>${choice.label}</strong>
        </button>
      `;
    })
    .join("");
}

function renderEggHotspot(scene) {
  if (scene.id !== "courtyard-pond" || !canOpenEggGift(state)) {
    return "";
  }

  return `
    <button
      class="scene-hotspot scene-hotspot--egg"
      type="button"
      data-action="open-egg-gift"
      data-x="68"
      data-y="10"
      aria-label="看雨后的月亮"
    >
      <span></span>
      <strong>看雨后的月亮</strong>
    </button>
  `;
}

function syncSceneLayout() {
  const stage = app.querySelector(".point-click");
  if (!stage) {
    return;
  }

  const sceneId = stage.dataset.sceneId;
  const pan = getScenePan(sceneId);
  stage.style.setProperty("--pan-x", `${pan * 100}%`);

  for (const hotspot of stage.querySelectorAll(".scene-hotspot")) {
    const position = getHotspotPosition({
      x: Number(hotspot.dataset.x),
      y: Number(hotspot.dataset.y),
    }, pan);

    hotspot.style.left = `${position.left}px`;
    hotspot.style.top = `${position.top}px`;
    hotspot.hidden = !position.visible;
  }
}

function getHotspotPosition(point, pan) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let imageWidth;
  let imageHeight;
  let offsetX;
  let offsetY;

  if (isMobilePanEnabled()) {
    imageHeight = viewportHeight;
    imageWidth = viewportHeight * IMAGE_RATIO;
    offsetX = (viewportWidth - imageWidth) * pan;
    offsetY = 0;
  } else {
    const viewportRatio = viewportWidth / viewportHeight;
    imageWidth = viewportRatio > IMAGE_RATIO ? viewportWidth : viewportHeight * IMAGE_RATIO;
    imageHeight = viewportRatio > IMAGE_RATIO ? viewportWidth / IMAGE_RATIO : viewportHeight;
    offsetX = (viewportWidth - imageWidth) / 2;
    offsetY = (viewportHeight - imageHeight) / 2;
  }

  const left = offsetX + imageWidth * (point.x / 100);
  const rawTop = offsetY + imageHeight * (point.y / 100);
  const top = Math.max(56, Math.min(rawTop, viewportHeight - 56));

  return {
    left: Math.round(left),
    top: Math.round(top),
    visible: left > -96 && left < viewportWidth + 96,
  };
}

function renderMainGift() {
  app.innerHTML = `
    <section class="screen point-click ending-screen" style="--scene-image: url('${sceneImages.bedroom}');">
      <div class="painted-scene ending-scene" aria-hidden="true">
        <div class="gift-card"><span>${mainGift.badge}</span></div>
      </div>
      <div class="scene-vignette" aria-hidden="true"></div>
      <article class="card dialog">
        <p class="eyebrow">雨声轻了一些</p>
        <img class="moyu-avatar" src="${moyuImage}" alt="摸鱼" />
        <div class="dialog-copy">
          <h1>${mainGift.title}</h1>
          <p>${mainGift.body}</p>
          <p class="moyu">${mainGift.poeticHint}</p>
          <p class="feedback" id="clear-hint"></p>
          <div class="actions">
            <button class="button" type="button" data-action="clear-main-gift-hint">让摸鱼说得更明白一点</button>
            <button class="button secondary" type="button" data-action="return">回到庭院，再听一会儿雨</button>
            <button class="button secondary" type="button" data-action="restart">从头开始</button>
          </div>
        </div>
      </article>
    </section>
  `;
}

function renderBoxGate() {
  const attempt = state.passwordAttempts ?? 0;
  const errorLines = [
    "",
    "木盒没有动，雨声像是漏掉了一拍。",
    "摸鱼把纸往手边推了推，像是在提醒：最后一步在纸上。",
    "摸鱼点了点两行字：先是被雨等到的人，再是一路跟回家的小尾巴。",
  ];
  const feedback = errorLines[Math.min(attempt, errorLines.length - 1)];

  app.innerHTML = `
    <section class="screen point-click ending-screen" style="--scene-image: url('${sceneImages.bedroom}');">
      <div class="painted-scene ending-scene" aria-hidden="true">
        <div class="gift-card"><span>八</span></div>
      </div>
      <div class="scene-vignette" aria-hidden="true"></div>
      <article class="card dialog">
        <img class="moyu-avatar" src="${moyuImage}" alt="摸鱼" />
        <div class="dialog-copy">
          <p class="eyebrow">小木盒</p>
          <h1>雨里的数字</h1>
          <p>盒盖没有立刻打开，只从缝隙里漏出一点暖光。纸上留着几句残影：门边一枚，水里一枚，暖处一枚，纸角一双。</p>
          <p class="moyu">输入八位线索</p>
          <div class="box-code-row">
            <input
              class="box-code-input"
              id="box-code"
              inputmode="numeric"
              autocomplete="off"
              maxlength="8"
              pattern="[0-9]*"
              aria-label="输入八位线索"
            />
            <button class="button" type="button" data-action="submit-box-code">打开小木盒</button>
          </div>
          <p class="feedback" id="box-feedback">${feedback}</p>
          <div class="actions">
            <button class="button secondary" type="button" data-action="review-clues">再去看看线索</button>
          </div>
        </div>
      </article>
    </section>
  `;

  requestAnimationFrame(() => document.querySelector("#box-code")?.focus());
}

function renderGiftOpening() {
  app.innerHTML = `
    <section class="screen point-click gift-opening" style="--scene-image: url('${sceneImages.bedroom}');">
      <div class="painted-scene ending-scene" aria-hidden="true"></div>
      <div class="scene-vignette" aria-hidden="true"></div>
      <div class="gift-opening-stage" aria-live="polite">
        <div class="gift-opening-glow" aria-hidden="true"></div>
        <div class="gift-opening-box" aria-hidden="true">
          <div class="gift-opening-lid"></div>
          <div class="gift-opening-ribbon gift-opening-ribbon--vertical"></div>
          <div class="gift-opening-ribbon gift-opening-ribbon--horizontal"></div>
          <div class="gift-opening-base"></div>
        </div>
        <p>小木盒轻轻打开，雨声也亮了一下。</p>
      </div>
    </section>
  `;
}

function renderTicketModal() {
  app.insertAdjacentHTML("beforeend", `
    <div class="ticket-modal" role="dialog" aria-modal="true" aria-label="${eggGift.title}">
      <div class="ticket-modal__backdrop" data-action="close-ticket"></div>
      <article class="ticket-modal__card">
        <button class="ticket-modal__close" type="button" data-action="close-ticket" aria-label="关闭船票">x</button>
        <p class="eyebrow">${eggGift.badge}</p>
        <h1>${eggGift.title}</h1>
        <img class="ticket-modal__image" src="${eggGift.image}" alt="${eggGift.alt}" />
        <p>${eggGift.body}</p>
      </article>
    </div>
  `);
}

function preloadResources() {
  if (!preloadPromise) {
    preloadPromise = Promise.allSettled([
      ...PRELOAD_IMAGE_SOURCES.map(preloadImage),
      preloadBackgroundMusic(),
    ]);
  }

  return preloadPromise;
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
  });
}

function preloadBackgroundMusic() {
  ensureBackgroundMusic();
  backgroundMusic.preload = "auto";
  backgroundMusic.load();

  return Promise.resolve();
}

function ensureBackgroundMusic() {
  if (!backgroundMusic) {
    backgroundMusic = new Audio("./assets/bgm.mp3");
    backgroundMusic.loop = true;
    backgroundMusic.volume = BGM_VOLUME;
  }

  return backgroundMusic;
}

function startBackgroundMusic() {
  ensureBackgroundMusic();

  if (backgroundMusic.paused) {
    backgroundMusic.play().catch(() => {
      // Browsers may still reject playback until a direct user gesture.
    });
  }

  startRainAmbience();
}

function startRainAmbience() {
  const context = getRainAudioContext();
  if (!context) {
    return;
  }

  context.resume();
  createRainNoise(context);
}

function getRainAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return null;
  }

  if (!rainAudioContext) {
    rainAudioContext = new AudioContext();
  }

  return rainAudioContext;
}

function createRainNoise(context) {
  if (rainSource) {
    return;
  }

  const bufferSize = context.sampleRate * 2;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < bufferSize; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * 0.42;
  }

  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 1800;

  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 420;

  const rainGain = context.createGain();
  rainGain.gain.value = RAIN_VOLUME;

  rainSource = context.createBufferSource();
  rainSource.buffer = buffer;
  rainSource.loop = true;
  rainSource.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(rainGain);
  rainGain.connect(context.destination);
  rainSource.start();
}

app.addEventListener("pointerdown", (event) => {
  const stage = event.target.closest(".point-click[data-scene-id]");
  if (!stage || event.target.closest("button") || !isMobilePanEnabled()) {
    return;
  }

  const sceneId = stage.dataset.sceneId;
  dragState = {
    pointerId: event.pointerId,
    sceneId,
    startX: event.clientX,
    startPan: getScenePan(sceneId),
    moved: false,
  };
  stage.classList.add("is-panning");
  stage.setPointerCapture(event.pointerId);
});

app.addEventListener("pointermove", (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) {
    return;
  }

  const viewportWidth = window.innerWidth;
  const imageWidth = window.innerHeight * IMAGE_RATIO;
  const maxOffset = Math.max(1, imageWidth - viewportWidth);
  const deltaX = event.clientX - dragState.startX;

  if (Math.abs(deltaX) > 6) {
    dragState.moved = true;
    suppressNextClick = true;
  }

  setScenePan(dragState.sceneId, dragState.startPan - deltaX / maxOffset);
});

function endDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) {
    return;
  }

  app.querySelector(".point-click")?.classList.remove("is-panning");
  dragState = null;
}

app.addEventListener("pointerup", endDrag);
app.addEventListener("pointercancel", endDrag);

app.addEventListener("click", (event) => {
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }

  const choiceButton = event.target.closest("[data-choice-id]");
  const actionButton = event.target.closest("[data-action]");

  if (choiceButton) {
    const scene = getCurrentScene();
    inspectedChoice = scene.choices.find((item) => item.id === choiceButton.dataset.choiceId);
    updateSceneDialog(scene);
    return;
  }

  if (!actionButton) {
    if (inspectedChoice) {
      clearInspectedChoice();
      return;
    }

    const feedback = document.querySelector("#feedback");
    if (feedback) {
      feedback.textContent = "摸鱼在旁边嗅了嗅，这里暂时没有特别的东西。";
    }
    return;
  }

  const action = actionButton.dataset.action;

  if (action === "start") {
    state = createInitialState();
    saveState(state);
    inspectedChoice = null;
    isBoxGateOpen = false;
    hasStarted = true;
    startBackgroundMusic();
    render();
    return;
  }

  if (action === "continue-scene" && inspectedChoice) {
    const scene = getCurrentScene();
    const withChoice = rememberSceneChoice(state, scene.id, inspectedChoice.id);

    if (scene.id === "bedroom" && !state.mainGiftUnlocked) {
      isBoxGateOpen = true;
      setState(withChoice);
      return;
    }

    setState(completeScene(withChoice, scene.id));
    return;
  }

  if (action === "submit-box-code") {
    const input = document.querySelector("#box-code");
    const value = input?.value.trim() ?? "";

    if (value === BOX_CODE) {
      isBoxGateOpen = false;
      state = unlockMainGift(state);
      saveState(state);
      renderGiftOpening();
      window.setTimeout(() => {
        setState(completeScene(state, "bedroom"));
      }, GIFT_OPENING_DURATION_MS);
      return;
    }

    state = {
      ...state,
      passwordAttempts: (state.passwordAttempts ?? 0) + 1,
    };
    saveState(state);
    renderBoxGate();
    return;
  }

  if (action === "review-clues") {
    isBoxGateOpen = false;
    render();
    return;
  }

  if (action === "clear-main-gift-hint") {
    document.querySelector("#clear-hint").textContent = mainGift.clearHint;
    return;
  }

  if (action === "open-egg-gift") {
    if (!canOpenEggGift(state)) {
      document.querySelector("#feedback")?.replaceChildren("摸鱼看了看卧室的方向，像是还有一件事要先完成。");
      return;
    }

    state = unlockEggGift(state);
    saveState(state);
    renderTicketModal();
    return;
  }

  if (action === "close-ticket") {
    document.querySelector(".ticket-modal")?.remove();
    return;
  }

  if (action === "return") {
    hasStarted = true;
    isBoxGateOpen = false;
    setState({
      ...state,
      currentSceneId: "courtyard-pond",
      completedScenes: [],
      hintLevelByScene: {},
    });
    return;
  }

  if (action === "restart") {
    hasStarted = false;
    isBoxGateOpen = false;
    setState(createInitialState());
  }
});

window.addEventListener("resize", () => {
  if (hasStarted) {
    syncSceneLayout();
  }
});

preloadResources();
render();
