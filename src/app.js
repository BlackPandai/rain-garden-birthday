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

const IMAGE_RATIO = 819 / 546;

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
    "umbrella-charm": { x: 80, y: 58 },
    "paw-prints": { x: 58, y: 74 },
    "rain-card": { x: 60, y: 52 },
  },
  "living-room": {
    "photo-frame": { x: 54, y: 52 },
    "moyu-bed": { x: 34, y: 71 },
    "lamp-direction": { x: 68, y: 45 },
  },
  window: {
    "inside-photo": { x: 27, y: 68 },
    "moyu-tail": { x: 30, y: 78 },
    "outside-light": { x: 71, y: 41 },
  },
  "courtyard-pond": {
    "courtyard-lantern": { x: 18, y: 34 },
    "courtyard-bridge": { x: 66, y: 62 },
    "courtyard-moon": { x: 61, y: 15 },
  },
  bedroom: {
    "to-memory": { x: 11, y: 64 },
    "to-together": { x: 76, y: 55 },
    "to-future": { x: 84, y: 67 },
  },
};

function getCurrentScene() {
  return scenes.find((scene) => scene.id === state.currentSceneId) ?? scenes[0];
}

function setState(nextState) {
  state = nextState;
  inspectedChoice = null;
  saveState(state);
  render();
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
    <section class="screen point-click point-click--${scene.id}" style="--scene-image: url('${sceneImages[scene.id]}');">
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
}

function renderHotspots(scene) {
  const points = hotspotPoints[scene.id] ?? {};

  return scene.choices
    .map((choice) => {
      const point = points[choice.id];
      if (!point) {
        return "";
      }

      const position = getHotspotPosition(point);
      if (!position.visible) {
        return "";
      }

      return `
        <button
          class="scene-hotspot"
          type="button"
          data-choice-id="${choice.id}"
          style="left: ${position.left}px; top: ${position.top}px;"
          aria-label="${choice.label}"
        >
          <span></span>
          <strong>${choice.label}</strong>
        </button>
      `;
    })
    .join("");
}

function getHotspotPosition(point) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const imageRatio = IMAGE_RATIO;
  const viewportRatio = viewportWidth / viewportHeight;
  const imageWidth = viewportRatio > imageRatio ? viewportWidth : viewportHeight * imageRatio;
  const imageHeight = viewportRatio > imageRatio ? viewportWidth / imageRatio : viewportHeight;
  const offsetX = (viewportWidth - imageWidth) / 2;
  const offsetY = (viewportHeight - imageHeight) / 2;
  const left = offsetX + imageWidth * (point.x / 100);
  const rawTop = offsetY + imageHeight * (point.y / 100);
  const top = Math.max(72, Math.min(rawTop, viewportHeight - 150));

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

app.addEventListener("click", (event) => {
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
    render();
  }
});

render();
