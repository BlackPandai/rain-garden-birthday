# Rain Garden Birthday Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first static web puzzle game where the player explores a rainy Jiangnan garden villa, follows 摸鱼, accumulates hidden imprints, and unlocks three birthday gift endings.

**Architecture:** Use a small dependency-free static app so it can be hosted on any static site platform. Keep game content in data files, game rules in pure functions, rendering in one focused UI module, and persistence in localStorage.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node.js built-in test runner for rule tests, Python `http.server` or any static server for local preview.

---

## File Structure

- Create `index.html`: app shell, metadata, and module entrypoint.
- Create `styles.css`: mobile-first visual design, rainy Jiangnan atmosphere, accessible tap targets.
- Create `src/state.js`: pure game state transitions, imprint scoring, ending selection, and persistence helpers.
- Create `src/content.js`: scene, clue, puzzle, hint, and ending content.
- Create `src/app.js`: DOM rendering, input handling, scene navigation, and integration with state/content.
- Create `tests/state.test.mjs`: Node tests for scoring, tie-breaks, replay unlocks, and fallback clue behavior.
- Create `README.md`: local preview, deployment notes, birthday-day checklist.

The first implementation should not add frameworks, build tools, image pipelines, or backend services. If richer art/audio is added later, it can fit into the same static structure.

## Task 1: Project Shell

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/app.js`
- Create: `README.md`

- [ ] **Step 1: Create the app shell**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#172425" />
    <title>雨园生日寻礼</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main id="app" class="app" aria-live="polite"></main>
    <script type="module" src="./src/app.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create baseline mobile styles**

Create `styles.css`:

```css
:root {
  color-scheme: dark;
  --bg: #10191a;
  --panel: rgba(22, 34, 35, 0.88);
  --panel-soft: rgba(255, 255, 255, 0.07);
  --text: #f3efe4;
  --muted: #b8c4bd;
  --accent: #d8c18f;
  --accent-strong: #f0d99d;
  --danger-soft: #7b514f;
  --shadow: rgba(0, 0, 0, 0.35);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
  margin: 0;
}

body {
  background:
    radial-gradient(circle at 20% 0%, rgba(84, 111, 105, 0.32), transparent 34rem),
    linear-gradient(180deg, #142122 0%, #0b1112 100%);
  color: var(--text);
}

button,
input {
  font: inherit;
}

.app {
  width: min(100%, 34rem);
  min-height: 100vh;
  margin: 0 auto;
  padding: 1rem;
}

.screen {
  min-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
}

.card {
  padding: 1.1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  background: var(--panel);
  box-shadow: 0 1rem 2.5rem var(--shadow);
}

.eyebrow {
  margin: 0 0 0.45rem;
  color: var(--accent);
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1,
h2 {
  line-height: 1.2;
}

p {
  color: var(--muted);
  line-height: 1.75;
}

.actions {
  display: grid;
  gap: 0.75rem;
}

.button {
  width: 100%;
  min-height: 3.25rem;
  border: 0;
  border-radius: 999px;
  padding: 0.85rem 1rem;
  background: var(--accent);
  color: #1b1710;
  font-weight: 700;
}

.button.secondary {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: var(--panel-soft);
  color: var(--text);
}

.choice {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 1rem;
  padding: 0.95rem;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  text-align: left;
}

.choice strong {
  display: block;
  margin-bottom: 0.3rem;
  color: var(--accent-strong);
}

.feedback {
  min-height: 2rem;
  color: var(--accent-strong);
}

.moyu {
  border-left: 0.25rem solid var(--accent);
  padding-left: 0.9rem;
}

.ending-badge {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  background: rgba(216, 193, 143, 0.16);
  color: var(--accent-strong);
}
```

- [ ] **Step 3: Create a temporary app entrypoint**

Create `src/app.js`:

```js
const app = document.querySelector("#app");

app.innerHTML = `
  <section class="screen">
    <article class="card">
      <p class="eyebrow">Rain Garden Birthday</p>
      <h1>雨园生日寻礼</h1>
      <p>雨落在江南园林的窗上，摸鱼已经在玄关留下了第一串爪印。</p>
      <div class="actions">
        <button class="button" type="button">开始寻礼</button>
      </div>
    </article>
  </section>
`;
```

- [ ] **Step 4: Create project README**

Create `README.md`:

```markdown
# rain-garden-birthday

手机优先的静态网页解谜生日礼物游戏。

## Local Preview

```bash
python3 -m http.server 5173
```

Open `http://localhost:5173`.

## Design

See `docs/superpowers/specs/2026-07-02-rain-garden-birthday-design.md`.
```

- [ ] **Step 5: Preview the shell**

Run:

```bash
python3 -m http.server 5173
```

Expected: opening `http://localhost:5173` shows the title, intro copy, and start button.

## Task 2: State Model And Tests

**Files:**
- Create: `src/state.js`
- Create: `tests/state.test.mjs`
- Modify: `README.md`

- [ ] **Step 1: Write failing tests for imprint scoring and ending choice**

Create `tests/state.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  applyChoice,
  completeScene,
  chooseEnding,
  unlockEnding,
  getClearGiftHint,
} from "../src/state.js";

test("applyChoice adds hidden imprint score", () => {
  const state = createInitialState();
  const next = applyChoice(state, { oldMemory: 2, companionship: 0, future: 1 });

  assert.deepEqual(next.imprints, {
    oldMemory: 2,
    companionship: 0,
    future: 1,
  });
  assert.deepEqual(state.imprints, {
    oldMemory: 0,
    companionship: 0,
    future: 0,
  });
});

test("chooseEnding picks highest imprint", () => {
  const state = {
    ...createInitialState(),
    imprints: { oldMemory: 1, companionship: 4, future: 2 },
  };

  assert.equal(chooseEnding(state), "companionship");
});

test("chooseEnding uses final preference to break a tie", () => {
  const state = {
    ...createInitialState(),
    imprints: { oldMemory: 3, companionship: 3, future: 1 },
    finalPreference: "oldMemory",
  };

  assert.equal(chooseEnding(state), "oldMemory");
});

test("chooseEnding falls back to future when still tied", () => {
  const state = {
    ...createInitialState(),
    imprints: { oldMemory: 2, companionship: 2, future: 2 },
  };

  assert.equal(chooseEnding(state), "future");
});

test("unlockEnding records ending and unlocks return after first ending", () => {
  const state = unlockEnding(createInitialState(), "future");

  assert.deepEqual(state.unlockedEndings, ["future"]);
  assert.equal(state.canReturnToGarden, true);
});

test("completeScene advances scene and records final preference", () => {
  const state = completeScene(createInitialState(), "entrance", "companionship");

  assert.equal(state.currentSceneId, "living-room");
  assert.equal(state.finalPreference, "companionship");
  assert.deepEqual(state.completedScenes, ["entrance"]);
});

test("getClearGiftHint returns explicit fallback copy", () => {
  assert.equal(
    getClearGiftHint("future"),
    "去庭院或池塘边找防水小卡片、二维码或信封；它会指向机票、旅行基金或红包口令。"
  );
});
```

- [ ] **Step 2: Run tests and verify they fail because module is missing**

Run:

```bash
node --test tests/state.test.mjs
```

Expected: FAIL with `Cannot find module` or missing exports from `src/state.js`.

- [ ] **Step 3: Implement state model**

Create `src/state.js`:

```js
export const SCENE_ORDER = ["entrance", "living-room", "window", "courtyard-pond", "bedroom"];

export const GIFT_HINTS = {
  oldMemory: "去卧室或窗边找一份和回忆有关的实体礼物，例如相册、手写信或纪念小物。",
  companionship: "去客厅或玄关找一份和日常陪伴有关的实体礼物，例如香薰、毯子、首饰或摸鱼定制物。",
  future: "去庭院或池塘边找防水小卡片、二维码或信封；它会指向机票、旅行基金或红包口令。",
};

export function createInitialState() {
  return {
    currentSceneId: "entrance",
    completedScenes: [],
    imprints: {
      oldMemory: 0,
      companionship: 0,
      future: 0,
    },
    finalPreference: null,
    unlockedEndings: [],
    canReturnToGarden: false,
    hintLevelByScene: {},
  };
}

export function applyChoice(state, weights) {
  return {
    ...state,
    imprints: {
      oldMemory: state.imprints.oldMemory + (weights.oldMemory ?? 0),
      companionship: state.imprints.companionship + (weights.companionship ?? 0),
      future: state.imprints.future + (weights.future ?? 0),
    },
  };
}

export function completeScene(state, sceneId, finalPreference = null) {
  const currentIndex = SCENE_ORDER.indexOf(sceneId);
  const nextSceneId = SCENE_ORDER[currentIndex + 1] ?? sceneId;
  const completedScenes = state.completedScenes.includes(sceneId)
    ? state.completedScenes
    : [...state.completedScenes, sceneId];

  return {
    ...state,
    currentSceneId: nextSceneId,
    completedScenes,
    finalPreference: finalPreference ?? state.finalPreference,
  };
}

export function chooseEnding(state) {
  const entries = Object.entries(state.imprints);
  const maxScore = Math.max(...entries.map(([, score]) => score));
  const tied = entries.filter(([, score]) => score === maxScore).map(([key]) => key);

  if (tied.length === 1) {
    return tied[0];
  }

  if (state.finalPreference && tied.includes(state.finalPreference)) {
    return state.finalPreference;
  }

  if (tied.includes("future")) {
    return "future";
  }

  return tied[0];
}

export function unlockEnding(state, endingId) {
  const unlockedEndings = state.unlockedEndings.includes(endingId)
    ? state.unlockedEndings
    : [...state.unlockedEndings, endingId];

  return {
    ...state,
    unlockedEndings,
    canReturnToGarden: true,
  };
}

export function getClearGiftHint(endingId) {
  return GIFT_HINTS[endingId];
}

export function nextHintLevel(state, sceneId) {
  const current = state.hintLevelByScene[sceneId] ?? 0;
  return {
    ...state,
    hintLevelByScene: {
      ...state.hintLevelByScene,
      [sceneId]: Math.min(current + 1, 3),
    },
  };
}

export function saveState(state, storage = window.localStorage) {
  storage.setItem("rain-garden-birthday-state", JSON.stringify(state));
}

export function loadState(storage = window.localStorage) {
  const raw = storage.getItem("rain-garden-birthday-state");
  return raw ? JSON.parse(raw) : createInitialState();
}

export function resetState(storage = window.localStorage) {
  storage.removeItem("rain-garden-birthday-state");
  return createInitialState();
}
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```bash
node --test tests/state.test.mjs
```

Expected: PASS for all tests.

- [ ] **Step 5: Update README test command**

Modify `README.md` to include:

```markdown
## Tests

```bash
node --test tests/state.test.mjs
```
```

## Task 3: Game Content Data

**Files:**
- Create: `src/content.js`
- Modify: `tests/state.test.mjs`

- [ ] **Step 1: Add content shape tests**

Append to `tests/state.test.mjs`:

```js
import { scenes, endings } from "../src/content.js";

test("content defines five scenes in route order", () => {
  assert.deepEqual(
    scenes.map((scene) => scene.id),
    ["entrance", "living-room", "window", "courtyard-pond", "bedroom"]
  );
});

test("each scene has choices and layered moyu hints", () => {
  for (const scene of scenes) {
    assert.ok(scene.title);
    assert.ok(scene.body);
    assert.ok(scene.choices.length >= 1);
    assert.equal(scene.hints.length, 3);
  }
});

test("content defines three gift endings", () => {
  assert.deepEqual(Object.keys(endings).sort(), ["companionship", "future", "oldMemory"]);
});
```

- [ ] **Step 2: Run tests and verify content module is missing**

Run:

```bash
node --test tests/state.test.mjs
```

Expected: FAIL because `src/content.js` does not exist.

- [ ] **Step 3: Create content data**

Create `src/content.js`:

```js
export const scenes = [
  {
    id: "entrance",
    eyebrow: "玄关",
    title: "湿伞与爪印",
    body: "你推开门，雨声被留在身后。门垫上有一串湿漉漉的小爪印，摸鱼把一张卡片压在伞柄下。",
    puzzlePrompt: "先看哪一个线索？",
    choices: [
      {
        id: "umbrella-charm",
        label: "看伞柄上的小挂饰",
        detail: "挂饰背面刻着一个日期，像是某次一起淋雨回家的晚上。",
        weights: { oldMemory: 2 },
      },
      {
        id: "paw-prints",
        label: "跟着摸鱼的湿爪印",
        detail: "爪印没有去远处，而是绕到客厅门口，像是在等你跟上。",
        weights: { companionship: 2 },
      },
      {
        id: "rain-card",
        label: "读伞边的小卡片",
        detail: "卡片写着：雨停以后，我们去更远的地方。",
        weights: { future: 2 },
      },
    ],
    completionText: "摸鱼轻轻叫了一声，带你走向客厅。",
    finalPreference: "companionship",
    hints: [
      "摸鱼低头闻了闻门垫。",
      "摸鱼叼起卡片，又把它放回伞边。",
      "先点一个你最在意的玄关线索，就能继续往里走。",
    ],
  },
  {
    id: "living-room",
    eyebrow: "客厅",
    title: "暖灯与影子",
    body: "客厅只亮着一盏暖灯。照片、抱枕和摸鱼的小窝都被摆成了奇怪的角度，墙上影子像一句还没拼好的话。",
    puzzlePrompt: "你想调整哪件东西？",
    choices: [
      {
        id: "photo-frame",
        label: "扶正那张照片",
        detail: "照片里的你们靠得很近，背后也是一场雨。",
        weights: { oldMemory: 2 },
      },
      {
        id: "moyu-bed",
        label: "整理摸鱼的小窝",
        detail: "小窝下面露出一张纸：普通的日子，也想和你一起慢慢过。",
        weights: { companionship: 3 },
      },
      {
        id: "lamp-direction",
        label: "转动暖灯的方向",
        detail: "灯影在墙上连成一条路，指向窗外的庭院。",
        weights: { future: 1, companionship: 1 },
      },
    ],
    completionText: "影子终于拼成一句：今天不查案，今天只寻礼。",
    finalPreference: "companionship",
    hints: [
      "摸鱼趴到自己的小窝边。",
      "摸鱼用鼻子碰了碰暖灯下的纸角。",
      "调整客厅里最像日常陪伴的物件，会让影子完整。",
    ],
  },
  {
    id: "window",
    eyebrow: "窗边",
    title: "雨痕与花窗",
    body: "雨水沿着花窗慢慢滑下。窗内有旧照片，窗外能看见庭院的微光。摸鱼坐在窗边，尾巴扫过一串水痕。",
    puzzlePrompt: "你顺着哪边继续看？",
    choices: [
      {
        id: "inside-photo",
        label: "看窗边的旧照片",
        detail: "照片背面写着：原来那天的雨声，我一直记得。",
        weights: { oldMemory: 3 },
      },
      {
        id: "moyu-tail",
        label: "看摸鱼尾巴扫过的水痕",
        detail: "水痕像一只小狗绕着你们转圈。",
        weights: { companionship: 1, oldMemory: 1 },
      },
      {
        id: "outside-light",
        label: "看窗外庭院的微光",
        detail: "远处池塘边有一点光，好像在等雨停。",
        weights: { future: 3 },
      },
    ],
    completionText: "花窗上的雨痕连成顺序，指向庭院和池塘。",
    finalPreference: "future",
    hints: [
      "摸鱼一直盯着窗上的水痕。",
      "摸鱼用爪子碰了碰窗边照片，又看向窗外。",
      "窗内偏旧忆，窗外偏来日；选一个你更想追的方向。",
    ],
  },
  {
    id: "courtyard-pond",
    eyebrow: "庭院与池塘",
    title: "倒影与石径",
    body: "庭院里雨声更清楚。池塘倒映着廊灯，石径上有几处被摸鱼踩湿的脚印。",
    puzzlePrompt: "你先靠近哪里？",
    choices: [
      {
        id: "pond-reflection",
        label: "看池塘里的倒影",
        detail: "倒影不是现在的屋檐，而像一张未来的登机牌。",
        weights: { future: 3 },
      },
      {
        id: "stone-path",
        label: "按爪印走过石径",
        detail: "每一步都像摸鱼在说：跟我来，别错过。",
        weights: { companionship: 2 },
      },
      {
        id: "rain-sound",
        label: "听庭院里的雨声",
        detail: "雨声让你想起很多次一起躲雨的晚上。",
        weights: { oldMemory: 2 },
      },
    ],
    completionText: "池边的线索被点亮，最后的祝福只差一步。",
    finalPreference: "future",
    hints: [
      "摸鱼停在第一块湿石头旁。",
      "摸鱼看了看池塘倒影，又看了看你。",
      "按摸鱼停下的位置观察池边线索，就能找到通往结局的方向。",
    ],
  },
  {
    id: "bedroom",
    eyebrow: "卧室",
    title: "生日反转",
    body: "卧室里没有谜案，只有一盏很暖的灯。前面所有雨声、爪印和卡片，终于拼成一句生日祝福。",
    puzzlePrompt: "把最后一句祝福交给谁？",
    choices: [
      {
        id: "to-memory",
        label: "交给那些一起走过的日子",
        detail: "旧照片轻轻亮起。",
        weights: { oldMemory: 2 },
      },
      {
        id: "to-together",
        label: "交给今晚在身边的彼此和摸鱼",
        detail: "摸鱼趴在灯下，像守着一个小秘密。",
        weights: { companionship: 2 },
      },
      {
        id: "to-future",
        label: "交给雨停以后的远方",
        detail: "窗外的庭院有一点光。",
        weights: { future: 2 },
      },
    ],
    completionText: "生日快乐。今天，你找到的不只是礼物。",
    finalPreference: null,
    hints: [
      "摸鱼把最后一张卡片放到床边。",
      "卡片上写着：选你此刻最想打开的那份心意。",
      "这一步会决定首通结局；之后仍然能回来找另外两份礼物。",
    ],
  },
];

export const endings = {
  oldMemory: {
    title: "雨窗里的旧照片",
    badge: "旧忆礼物",
    body: "你找到的是被雨声保存下来的回忆。那些一起走过的日子，没有被时间冲淡，只是安静地等在窗边。",
    poeticHint: "去窗边或卧室，找一份被旧时光压住的心意。",
    clearHint: "去卧室或窗边找一份和回忆有关的实体礼物，例如相册、手写信或纪念小物。",
  },
  companionship: {
    title: "暖灯下的普通日子",
    badge: "相伴礼物",
    body: "你找到的是很多普通日子里最珍贵的部分：有人在灯下等你，有摸鱼在旁边打盹，也有以后的每一个晚上。",
    poeticHint: "去客厅或玄关，找一份适合一起慢慢使用的心意。",
    clearHint: "去客厅或玄关找一份和日常陪伴有关的实体礼物，例如香薰、毯子、首饰或摸鱼定制物。",
  },
  future: {
    title: "池边未落的雨",
    badge: "来日礼物",
    body: "你找到的是雨停以后的远方。今晚先把心意藏在池边，等天亮以后，我们去更远的地方。",
    poeticHint: "去庭院或池塘边，找那张没有被雨打湿的来日。",
    clearHint: "去庭院或池塘边找防水小卡片、二维码或信封；它会指向机票、旅行基金或红包口令。",
  },
};
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```bash
node --test tests/state.test.mjs
```

Expected: PASS for all tests.

## Task 4: Render Scene Interaction

**Files:**
- Modify: `src/app.js`

- [ ] **Step 1: Replace temporary app with scene renderer**

Replace `src/app.js` with:

```js
import {
  applyChoice,
  chooseEnding,
  completeScene,
  createInitialState,
  loadState,
  nextHintLevel,
  saveState,
  unlockEnding,
} from "./state.js";
import { endings, scenes } from "./content.js";

const app = document.querySelector("#app");
let state = loadState();

function getCurrentScene() {
  return scenes.find((scene) => scene.id === state.currentSceneId) ?? scenes[0];
}

function setState(nextState) {
  state = nextState;
  saveState(state);
  render();
}

function render() {
  const scene = getCurrentScene();

  if (scene.id === "bedroom" && state.completedScenes.includes("bedroom")) {
    renderEnding();
    return;
  }

  app.innerHTML = `
    <section class="screen">
      <article class="card">
        <p class="eyebrow">${scene.eyebrow}</p>
        <h1>${scene.title}</h1>
        <p>${scene.body}</p>
        <p class="moyu">${scene.puzzlePrompt}</p>
        <div class="actions">
          ${scene.choices
            .map(
              (choice) => `
                <button class="choice" type="button" data-choice-id="${choice.id}">
                  <strong>${choice.label}</strong>
                  <span>${choice.detail}</span>
                </button>
              `
            )
            .join("")}
        </div>
        <p class="feedback" id="feedback"></p>
        <div class="actions">
          <button class="button secondary" type="button" data-action="hint">让摸鱼提示一下</button>
        </div>
      </article>
    </section>
  `;
}

function renderEnding() {
  const endingId = chooseEnding(state);
  const ending = endings[endingId];
  const unlockedState = unlockEnding(state, endingId);
  if (unlockedState !== state) {
    state = unlockedState;
    saveState(state);
  }

  app.innerHTML = `
    <section class="screen">
      <article class="card">
        <span class="ending-badge">${ending.badge}</span>
        <h1>${ending.title}</h1>
        <p>${ending.body}</p>
        <p class="moyu">${ending.poeticHint}</p>
        <p class="feedback" id="clear-hint"></p>
        <div class="actions">
          <button class="button" type="button" data-action="clear-ending-hint">让摸鱼说得更明白一点</button>
          <button class="button secondary" type="button" data-action="return">回到园中寻找隐藏结局</button>
          <button class="button secondary" type="button" data-action="restart">从头开始</button>
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
    const choice = scene.choices.find((item) => item.id === choiceButton.dataset.choiceId);
    const withChoice = applyChoice(state, choice.weights);
    const finalPreference = scene.id === "bedroom" ? Object.keys(choice.weights)[0] : scene.finalPreference;
    const next = completeScene(withChoice, scene.id, finalPreference);
    setState(next);
    return;
  }

  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  if (action === "hint") {
    const scene = getCurrentScene();
    const hinted = nextHintLevel(state, scene.id);
    state = hinted;
    saveState(state);
    const level = hinted.hintLevelByScene[scene.id] ?? 1;
    document.querySelector("#feedback").textContent = scene.hints[level - 1];
    return;
  }

  if (action === "clear-ending-hint") {
    const ending = endings[chooseEnding(state)];
    document.querySelector("#clear-hint").textContent = ending.clearHint;
    return;
  }

  if (action === "return") {
    setState({
      ...state,
      currentSceneId: "entrance",
      completedScenes: [],
      imprints: { oldMemory: 0, companionship: 0, future: 0 },
      finalPreference: null,
      hintLevelByScene: {},
    });
    return;
  }

  if (action === "restart") {
    setState(createInitialState());
  }
});

render();
```

- [ ] **Step 2: Preview scene flow manually**

Run:

```bash
python3 -m http.server 5173
```

Expected: clicking choices advances from 玄关 to 客厅 to 窗边 to 庭院与池塘 to 卧室, then shows one ending.

## Task 5: Polish Endings, Replay, And Mobile UX

**Files:**
- Modify: `src/app.js`
- Modify: `styles.css`
- Modify: `README.md`

- [ ] **Step 1: Display discovered endings**

In `renderEnding()` in `src/app.js`, insert this line after the opening `<article class="card">`:

```js
<p class="eyebrow">已找到 ${state.unlockedEndings.length} / 3 份心意</p>
```

Expected: ending screen shows progress toward three endings.

- [ ] **Step 2: Add rain and paw visual details**

Append to `styles.css`:

```css
.screen::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.22;
  background-image:
    linear-gradient(120deg, transparent 0 46%, rgba(255, 255, 255, 0.22) 47%, transparent 48%),
    linear-gradient(120deg, transparent 0 68%, rgba(255, 255, 255, 0.15) 69%, transparent 70%);
  background-size: 3rem 8rem, 5rem 10rem;
  animation: rain 18s linear infinite;
}

@keyframes rain {
  from {
    background-position: 0 0, 0 0;
  }
  to {
    background-position: 0 40rem, 0 50rem;
  }
}

.card::after {
  content: "🐾";
  display: block;
  margin-top: 1rem;
  color: var(--accent);
  opacity: 0.78;
}
```

- [ ] **Step 3: Add mobile deployment notes**

Append to `README.md`:

```markdown
## Deployment

This app is static. Deploy the whole folder to any static host such as Vercel, Netlify, GitHub Pages, or another static web service.

Birthday-day checklist:

- Test the hosted URL on the recipient's phone.
- Place physical gifts indoors.
- Place the `future` entry clue near the courtyard or pond only if it is waterproof.
- Keep a private fallback note with all three final gift instructions.
```

- [ ] **Step 4: Manual mobile check**

Run:

```bash
python3 -m http.server 5173
```

Expected: with browser responsive mode set near `390x844`, text is readable, buttons are easy to tap, and every scene fits within one or two screens.

## Task 6: Final Verification

**Files:**
- Modify only if verification reveals an issue.

- [ ] **Step 1: Run unit tests**

Run:

```bash
node --test tests/state.test.mjs
```

Expected: PASS for all tests.

- [ ] **Step 2: Run local static preview**

Run:

```bash
python3 -m http.server 5173
```

Expected: server starts and serves `index.html`.

- [ ] **Step 3: Verify all three endings manually**

Use three playthroughs:

- For `旧忆`, choose photo/date/memory options whenever available.
- For `相伴`, choose 摸鱼/home/living-room options whenever available.
- For `来日`, choose window/outside/pond/future options whenever available.

Expected: each route reaches the matching ending and the clear hint points to the correct gift type.

- [ ] **Step 4: Verify no backend or build dependency exists**

Run:

```bash
ls
```

Expected: app works with static files only; there is no required `package.json`, server code, or build output.

## Self-Review

Spec coverage:

- Mobile-first static web delivery is covered by Tasks 1, 5, and 6.
- Three hidden imprint tracks and ending selection are covered by Task 2.
- Five villa scenes are covered by Task 3 and rendered in Task 4.
- 摸鱼 as guide and hint system is covered by Tasks 3 and 4.
- Real-world gift fallback and clear hint button are covered by Tasks 2 and 4.
- Deployment and birthday-day checklist are covered by Task 5.

Placeholder scan:

- This plan intentionally contains no placeholder markers.
- All code-bearing steps include concrete code blocks.

Type consistency:

- State keys are `oldMemory`, `companionship`, and `future` in code.
- Display labels are `旧忆`, `相伴`, and `来日` in content.
- Ending IDs match between `src/state.js`, `src/content.js`, and tests.
