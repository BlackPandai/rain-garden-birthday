import {
  applyChoice,
  chooseEnding,
  completeScene,
  createInitialState,
  loadState,
  saveState,
  unlockEnding,
} from "./state.js";
import { endings, scenes } from "./content.js";

const app = document.querySelector("#app");

let state = loadState();
let hasStarted = false;
let inspectedChoice = null;
let suppressNextClick = false;

const IMAGE_RATIO = 819 / 546;
const MOBILE_PAN_QUERY = "(max-width: 700px)";

const sceneImages = {
  entrance: "./assets/rain-garden-entrance.png",
  "living-room": "./assets/rain-garden-living-room.png",
  window: "./assets/rain-garden-window-room.png",
  "courtyard-pond": "./assets/warm-rainy-jiangnan-garden.png",
  bedroom: "./assets/rain-garden-bedroom.png",
};

const moyuImage = "./assets/moyu-brown-cocker-dog-transparent.png";

const hotspotPoints = {
  entrance: {
    "umbrella-charm": { x: 80, y: 69 },
    "paw-prints": { x: 58, y: 82 },
    "rain-card": { x: 60, y: 51 },
  },
  "living-room": {
    "photo-frame": { x: 56, y: 50 },
    "moyu-bed": { x: 34, y: 75 },
    "lamp-direction": { x: 67, y: 43 },
  },
  window: {
    "inside-photo": { x: 27, y: 70 },
    "moyu-tail": { x: 31, y: 77 },
    "outside-light": { x: 70, y: 40 },
  },
  "courtyard-pond": {
    "courtyard-lantern": { x: 17, y: 36 },
    "courtyard-bridge": { x: 66, y: 62 },
    "courtyard-moon": { x: 61, y: 16 },
  },
  bedroom: {
    "to-memory": { x: 10, y: 70 },
    "to-together": { x: 74, y: 53 },
    "to-future": { x: 85, y: 69 },
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

  if (scene.id === "bedroom" && state.completedScenes.includes("bedroom")) {
    renderEnding();
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
  const feedback = inspectedChoice
    ? `${inspectedChoice.detail} ${scene.completionText}`
    : scene.body;

  app.innerHTML = `
    <section class="screen point-click point-click--${scene.id}" data-scene-id="${scene.id}" style="--scene-image: url('${sceneImages[scene.id]}');">
      <div class="painted-scene" aria-hidden="true"></div>
      <div class="scene-vignette" aria-hidden="true"></div>
      ${renderHotspots(scene)}
      <article class="card dialog ${inspectedChoice ? "dialog--expanded" : "dialog--compact"}">
        <img class="moyu-avatar" src="${moyuImage}" alt="摸鱼" />
        <div class="dialog-copy">
          <p class="eyebrow">${scene.eyebrow}</p>
          <p id="feedback">${feedback}</p>
          <p class="moyu">${inspectedChoice ? "摸鱼轻轻甩了甩耳朵，像是在催你继续。" : scene.puzzlePrompt}</p>
          ${inspectedChoice ? '<div class="actions"><button class="button" type="button" data-action="continue-scene">继续跟上摸鱼</button></div>' : ""}
        </div>
      </article>
    </section>
  `;

  requestAnimationFrame(syncSceneLayout);
}

function renderHotspots(scene) {
  const points = hotspotPoints[scene.id] ?? {};

  return scene.choices
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

function renderEnding() {
  const endingId = chooseEnding(state);
  const ending = endings[endingId];
  const unlockedState = unlockEnding(state, endingId);

  if (unlockedState !== state) {
    state = unlockedState;
    saveState(state);
  }

  const unlockedEndingCount = state.unlockedEndings.length;

  app.innerHTML = `
    <section class="screen point-click ending-screen" style="--scene-image: url('${sceneImages.bedroom}');">
      <div class="painted-scene ending-scene" aria-hidden="true">
        <div class="gift-card"><span>${ending.badge}</span></div>
      </div>
      <div class="scene-vignette" aria-hidden="true"></div>
      <article class="card dialog">
        <p class="eyebrow">已找到 ${unlockedEndingCount} / 3 份心意</p>
        <img class="moyu-avatar" src="${moyuImage}" alt="摸鱼" />
        <div class="dialog-copy">
          <span class="ending-badge">${ending.badge}</span>
          <h1>${ending.title}</h1>
          <p>${ending.body}</p>
          <p class="moyu">${ending.poeticHint}</p>
          <p class="feedback" id="clear-hint"></p>
          <div class="actions">
            <button class="button" type="button" data-action="clear-ending-hint">让摸鱼说得更明白一点</button>
            <button class="button secondary" type="button" data-action="return">回到庭院寻找隐藏结局</button>
            <button class="button secondary" type="button" data-action="restart">从头开始</button>
          </div>
        </div>
      </article>
    </section>
  `;
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
    render();
    return;
  }

  if (!actionButton) {
    const feedback = document.querySelector("#feedback");
    if (feedback && !inspectedChoice) {
      feedback.textContent = "摸鱼在旁边嗅了嗅，这里暂时没有特别的东西。";
    }
    return;
  }

  const action = actionButton.dataset.action;

  if (action === "start") {
    state = createInitialState();
    saveState(state);
    inspectedChoice = null;
    hasStarted = true;
    render();
    return;
  }

  if (action === "continue-scene" && inspectedChoice) {
    const scene = getCurrentScene();
    const withChoice = applyChoice(state, inspectedChoice.weights);
    const finalPreference =
      scene.id === "bedroom" ? Object.keys(inspectedChoice.weights)[0] : scene.finalPreference;
    setState(completeScene(withChoice, scene.id, finalPreference));
    return;
  }

  if (action === "clear-ending-hint") {
    const ending = endings[chooseEnding(state)];
    document.querySelector("#clear-hint").textContent = ending.clearHint;
    return;
  }

  if (action === "return") {
    hasStarted = true;
    setState({
      ...state,
      currentSceneId: "courtyard-pond",
      completedScenes: [],
      imprints: { oldMemory: 0, companionship: 0, future: 0 },
      finalPreference: null,
      hintLevelByScene: {},
    });
    return;
  }

  if (action === "restart") {
    hasStarted = false;
    setState(createInitialState());
  }
});

window.addEventListener("resize", () => {
  if (hasStarted) {
    syncSceneLayout();
  }
});

render();
