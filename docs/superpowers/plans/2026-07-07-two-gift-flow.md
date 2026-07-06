# Two Gift Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current three-ending gift system with one bedroom main physical gift and one gated courtyard Disney cruise ticket egg gift.

**Architecture:** Keep the static vanilla JS app structure. Move gift progression into explicit state flags (`mainGiftUnlocked`, `eggGiftUnlocked`) instead of hidden imprint scoring and ending selection. Render the main gift from the bedroom password flow; render the egg gift hotspot and ticket modal only after the main gift is unlocked.

**Tech Stack:** Vanilla JavaScript ES modules, CSS, HTML, Node built-in test runner, static assets under `/Users/bytedance/rain-garden-birthday/assets`.

---

## File Structure

- Modify `/Users/bytedance/rain-garden-birthday/src/state.js`: replace three-ending state helpers with explicit two-gift progression helpers.
- Modify `/Users/bytedance/rain-garden-birthday/src/content.js`: replace `endings` with `mainGift` and `eggGift` content and adjust bedroom/courtyard text.
- Modify `/Users/bytedance/rain-garden-birthday/src/app.js`: remove ending selection, render main gift, render gated egg hotspot, render ticket popup, preserve password and audio behavior.
- Modify `/Users/bytedance/rain-garden-birthday/styles.css`: add ticket popup styling and optional egg hotspot styling.
- Modify `/Users/bytedance/rain-garden-birthday/tests/state.test.mjs`: replace three-ending tests with two-gift state and UI tests.
- Create `/Users/bytedance/rain-garden-birthday/assets/disney-cruise-ticket.svg`: static ticket image displayed in the popup.
- Modify `/Users/bytedance/rain-garden-birthday/index.html`: bump cache version after implementation.

## Task 1: State Model For Two Gifts

**Files:**
- Modify: `/Users/bytedance/rain-garden-birthday/src/state.js`
- Test: `/Users/bytedance/rain-garden-birthday/tests/state.test.mjs`

- [ ] **Step 1: Write failing tests for explicit gift state**

Add imports in `/Users/bytedance/rain-garden-birthday/tests/state.test.mjs`:

```js
import {
  SCENE_ORDER,
  createInitialState,
  completeScene,
  unlockMainGift,
  unlockEggGift,
  canOpenEggGift,
  shouldShowChoice,
  saveState,
  loadState,
  resetState,
} from "../src/state.js";
```

Replace old ending/imprint tests with:

```js
test("initial state starts with both gifts locked", () => {
  const state = createInitialState();

  assert.equal(state.mainGiftUnlocked, false);
  assert.equal(state.eggGiftUnlocked, false);
  assert.equal(state.boxUnlocked, false);
  assert.equal(state.passwordAttempts, 0);
});

test("main gift unlock enables the courtyard egg gate", () => {
  const state = unlockMainGift(createInitialState());

  assert.equal(state.mainGiftUnlocked, true);
  assert.equal(state.boxUnlocked, true);
  assert.equal(state.canReturnToGarden, true);
  assert.equal(canOpenEggGift(state), true);
});

test("egg gift cannot unlock before main gift", () => {
  const locked = unlockEggGift(createInitialState());
  const unlocked = unlockEggGift(unlockMainGift(createInitialState()));

  assert.equal(locked.eggGiftUnlocked, false);
  assert.equal(canOpenEggGift(locked), false);
  assert.equal(unlocked.eggGiftUnlocked, true);
});

test("bedroom choices remain visible until the main gift is unlocked", () => {
  const beforeMain = createInitialState();
  const afterMain = unlockMainGift(createInitialState());

  assert.equal(shouldShowChoice(beforeMain, "bedroom", "to-main-gift"), true);
  assert.equal(shouldShowChoice(afterMain, "bedroom", "to-main-gift"), false);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
node --test "/Users/bytedance/rain-garden-birthday/tests/state.test.mjs"
```

Expected: FAIL because `unlockMainGift`, `unlockEggGift`, and `canOpenEggGift` are not exported yet, and old state fields still exist.

- [ ] **Step 3: Implement explicit gift state**

In `/Users/bytedance/rain-garden-birthday/src/state.js`, replace the current exports with:

```js
export const SCENE_ORDER = ["entrance", "courtyard-pond", "living-room", "window", "bedroom"];

const REPLAY_HIDDEN_CHOICE_SCENES = new Set(["courtyard-pond", "living-room", "window"]);

export function createInitialState() {
  return {
    currentSceneId: "entrance",
    completedScenes: [],
    mainGiftUnlocked: false,
    eggGiftUnlocked: false,
    canReturnToGarden: false,
    boxUnlocked: false,
    passwordAttempts: 0,
    selectedChoiceIdsByScene: {},
    hintLevelByScene: {},
  };
}

export function completeScene(state, sceneId) {
  const currentIndex = SCENE_ORDER.indexOf(sceneId);
  const nextSceneId = SCENE_ORDER[currentIndex + 1] ?? sceneId;
  const completedScenes = state.completedScenes.includes(sceneId)
    ? state.completedScenes
    : [...state.completedScenes, sceneId];

  return {
    ...state,
    currentSceneId: nextSceneId,
    completedScenes,
  };
}

export function unlockMainGift(state) {
  return {
    ...state,
    mainGiftUnlocked: true,
    boxUnlocked: true,
    passwordAttempts: 0,
    canReturnToGarden: true,
  };
}

export function canOpenEggGift(state) {
  return state.mainGiftUnlocked === true;
}

export function unlockEggGift(state) {
  if (!canOpenEggGift(state)) {
    return state;
  }

  return {
    ...state,
    eggGiftUnlocked: true,
  };
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

export function startReplayAtScene(state, sceneId) {
  return {
    ...state,
    currentSceneId: sceneId,
    completedScenes: [],
    hintLevelByScene: {},
  };
}

export function rememberSceneChoice(state, sceneId, choiceId) {
  const selectedChoiceIdsByScene = state.selectedChoiceIdsByScene ?? {};
  const sceneChoiceIds = selectedChoiceIdsByScene[sceneId] ?? [];

  if (sceneChoiceIds.includes(choiceId)) {
    return state;
  }

  return {
    ...state,
    selectedChoiceIdsByScene: {
      ...selectedChoiceIdsByScene,
      [sceneId]: [...sceneChoiceIds, choiceId],
    },
  };
}

export function shouldShowChoice(state, sceneId, choiceId) {
  if (sceneId === "bedroom") {
    return !(state.mainGiftUnlocked && choiceId === "to-main-gift");
  }

  if (!state.canReturnToGarden || !REPLAY_HIDDEN_CHOICE_SCENES.has(sceneId)) {
    return true;
  }

  return !(state.selectedChoiceIdsByScene?.[sceneId] ?? []).includes(choiceId);
}

export function saveState(state, storage = window.localStorage) {
  storage.setItem("rain-garden-birthday-state", JSON.stringify(state));
}

export function loadState(storage = window.localStorage) {
  const raw = storage.getItem("rain-garden-birthday-state");
  return raw ? { ...createInitialState(), ...JSON.parse(raw) } : createInitialState();
}

export function resetState(storage = window.localStorage) {
  storage.removeItem("rain-garden-birthday-state");
  return createInitialState();
}
```

- [ ] **Step 4: Run state tests**

Run:

```bash
node --test "/Users/bytedance/rain-garden-birthday/tests/state.test.mjs"
```

Expected: state tests for gift flags pass; tests still referencing `chooseEnding`, `unlockEnding`, `applyChoice`, or `getClearGiftHint` fail until Task 2 and Task 3 remove old assumptions.

## Task 2: Content For Main Gift And Egg Gift

**Files:**
- Modify: `/Users/bytedance/rain-garden-birthday/src/content.js`
- Test: `/Users/bytedance/rain-garden-birthday/tests/state.test.mjs`

- [ ] **Step 1: Write failing content tests**

Replace the old `content defines three gift endings` test with:

```js
import { scenes, mainGift, eggGift } from "../src/content.js";

test("content defines one main gift and one gated egg gift", () => {
  assert.equal(mainGift.title, "灯下的小秘密");
  assert.match(mainGift.body, /卧室/);
  assert.match(mainGift.clearHint, /卧室|床边|书桌|柜上/);
  assert.equal(eggGift.title, "雨里的船票");
  assert.match(eggGift.image, /disney-cruise-ticket\.svg/);
});

test("bedroom asks player to find the physical handwritten card", () => {
  const bedroom = scenes.find((scene) => scene.id === "bedroom");

  assert.ok(bedroom);
  assert.match(bedroom.completionText, /手边|床边|纸/);
  assert.match(bedroom.puzzlePrompt, /小木盒/);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
node --test "/Users/bytedance/rain-garden-birthday/tests/state.test.mjs"
```

Expected: FAIL because `mainGift` and `eggGift` do not exist yet.

- [ ] **Step 3: Replace ending content**

In `/Users/bytedance/rain-garden-birthday/src/content.js`:

- Keep `scenes`.
- Remove `export const endings = { ... }`.
- Add:

```js
export const mainGift = {
  title: "灯下的小秘密",
  badge: "主线礼物",
  body: "你打开的是今晚最认真藏好的心意。它不在雨里，也不在远方，而是在卧室里安静等你走近。",
  poeticHint: "摸鱼坐在灯下，尾巴轻轻扫过地面，像是在说：真正要拆开的那一份，就在这间屋子里。",
  clearHint: "去卧室里找靠近床边、书桌或柜上的实体礼物；它应该和小木盒或那张手写卡片放在一起。",
};

export const eggGift = {
  title: "雨里的船票",
  badge: "彩蛋礼物",
  body: "庭院里的雨忽然像海风一样轻。摸鱼把一张蓝色船票推到你面前，像是已经选好了下一次一起出发的日子。",
  image: "./assets/disney-cruise-ticket.svg",
  alt: "迪士尼游轮船票",
};
```

Update bedroom scene choice to a single final object:

```js
choices: [
  {
    id: "to-main-gift",
    label: "看柜上的小木盒",
    detail: "小木盒安静地放在柜上，盒盖边缘露出一点暖色的光。",
  },
],
completionText:
  "小木盒没有锁孔，只有八个空格。摸鱼把爪子搭在床边那张纸上，像是在说：最后一步，不在雨里，在你手边。",
```

- [ ] **Step 4: Run content tests**

Run:

```bash
node --test "/Users/bytedance/rain-garden-birthday/tests/state.test.mjs"
```

Expected: content tests pass; app tests still fail until UI imports and rendering are updated.

## Task 3: Main Gift Rendering And Password Flow

**Files:**
- Modify: `/Users/bytedance/rain-garden-birthday/src/app.js`
- Test: `/Users/bytedance/rain-garden-birthday/tests/state.test.mjs`

- [ ] **Step 1: Write failing static UI tests**

Add:

```js
test("app renders a single main gift instead of three endings", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(appSource, /mainGift/);
  assert.match(appSource, /renderMainGift/);
  assert.match(appSource, /unlockMainGift/);
  assert.equal(appSource.includes("chooseEnding"), false);
  assert.equal(appSource.includes("unlockEnding"), false);
  assert.equal(appSource.includes("ending-badge"), false);
});

test("bedroom password points to the physical handwritten card", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(appSource, /最后一步在纸上/);
  assert.match(appSource, /被雨等到的人/);
  assert.match(appSource, /一路跟回家的小尾巴/);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
node --test "/Users/bytedance/rain-garden-birthday/tests/state.test.mjs"
```

Expected: FAIL because app still imports `chooseEnding`, `unlockEnding`, and `endings`.

- [ ] **Step 3: Update app imports**

In `/Users/bytedance/rain-garden-birthday/src/app.js`, change imports to:

```js
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
```

- [ ] **Step 4: Replace ending rendering**

Replace `renderEnding()` with:

```js
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
```

Update `render()`:

```js
if (scene.id === "bedroom" && state.mainGiftUnlocked) {
  renderMainGift();
  return;
}
```

- [ ] **Step 5: Update password success**

In `submit-box-code`, replace the current success state update with:

```js
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
```

Update error lines:

```js
const errorLines = [
  "",
  "木盒没有动，雨声像是漏掉了一拍。",
  "摸鱼把纸往手边推了推，像是在提醒：最后一步在纸上。",
  "摸鱼点了点两行字：先是被雨等到的人，再是一路跟回家的小尾巴。",
];
```

- [ ] **Step 6: Run tests**

Run:

```bash
node --test "/Users/bytedance/rain-garden-birthday/tests/state.test.mjs"
```

Expected: main gift UI tests pass; egg gift tests still fail until Task 4.

## Task 4: Gated Courtyard Egg Gift And Ticket Popup

**Files:**
- Modify: `/Users/bytedance/rain-garden-birthday/src/app.js`
- Modify: `/Users/bytedance/rain-garden-birthday/styles.css`
- Create: `/Users/bytedance/rain-garden-birthday/assets/disney-cruise-ticket.svg`
- Test: `/Users/bytedance/rain-garden-birthday/tests/state.test.mjs`

- [ ] **Step 1: Write failing static tests for egg gate**

Add:

```js
test("courtyard egg gift is gated by main gift state in render and click handling", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(appSource, /renderEggHotspot/);
  assert.match(appSource, /canOpenEggGift\(state\)/);
  assert.match(appSource, /open-egg-gift/);
  assert.match(appSource, /unlockEggGift/);
  assert.match(appSource, /renderTicketModal/);
  assert.match(appSource, /eggGift\.image/);
});

test("ticket image asset exists as an SVG file", () => {
  const ticket = readFileSync(new URL("../assets/disney-cruise-ticket.svg", import.meta.url), "utf8");

  assert.match(ticket, /Disney Cruise/i);
  assert.match(ticket, /<svg/);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
node --test "/Users/bytedance/rain-garden-birthday/tests/state.test.mjs"
```

Expected: FAIL because egg rendering functions and SVG asset do not exist yet.

- [ ] **Step 3: Create ticket SVG asset**

Create `/Users/bytedance/rain-garden-birthday/assets/disney-cruise-ticket.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-labelledby="title desc">
  <title id="title">Disney Cruise Ticket</title>
  <desc id="desc">A romantic blue and gold illustrated Disney cruise ticket.</desc>
  <defs>
    <linearGradient id="sea" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#b9ecff"/>
      <stop offset="0.52" stop-color="#3d8fbd"/>
      <stop offset="1" stop-color="#1d4f7a"/>
    </linearGradient>
    <linearGradient id="paper" x1="0" x2="1">
      <stop offset="0" stop-color="#fff8df"/>
      <stop offset="1" stop-color="#f3d99a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="720" rx="54" fill="#08243a"/>
  <rect x="68" y="76" width="1064" height="568" rx="42" fill="url(#paper)"/>
  <path d="M90 500c130-70 250 70 380 0s250-70 380 0 190 20 260-25v169H90z" fill="url(#sea)" opacity=".92"/>
  <path d="M785 255c76 19 138 75 165 148H645c24-75 78-131 140-148z" fill="#ffffff" opacity=".92"/>
  <path d="M645 403h305l-42 76H690z" fill="#1c668f"/>
  <path d="M732 250l37-88 37 88z" fill="#e24b5d"/>
  <circle cx="234" cy="218" r="64" fill="#112c47"/>
  <circle cx="188" cy="156" r="32" fill="#112c47"/>
  <circle cx="280" cy="156" r="32" fill="#112c47"/>
  <text x="120" y="350" font-family="Georgia, serif" font-size="76" font-weight="700" fill="#12324d">Disney Cruise</text>
  <text x="124" y="420" font-family="Georgia, serif" font-size="34" fill="#6a4b22">雨停以后，一起去更远的海上</text>
  <text x="124" y="545" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#12324d">BOARDING PASS</text>
  <text x="124" y="586" font-family="Arial, sans-serif" font-size="24" fill="#12324d">Passenger: You &amp; Me · Companion: Moyu</text>
  <path d="M1030 92v536" stroke="#12324d" stroke-width="3" stroke-dasharray="14 16" opacity=".35"/>
  <text x="1068" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#12324d" transform="rotate(90 1068 170)">RAIN GARDEN SURPRISE</text>
</svg>
```

- [ ] **Step 4: Add egg hotspot rendering**

In `/Users/bytedance/rain-garden-birthday/src/app.js`, add:

```js
function renderEggHotspot(scene) {
  if (scene.id !== "courtyard-pond" || !canOpenEggGift(state)) {
    return "";
  }

  return `
    <button
      class="scene-hotspot scene-hotspot--egg"
      type="button"
      data-action="open-egg-gift"
      data-x="32"
      data-y="58"
      aria-label="看池边的船票信封"
    >
      <span></span>
      <strong>看池边的船票信封</strong>
    </button>
  `;
}
```

Update scene rendering:

```js
${renderHotspots(scene)}
${renderEggHotspot(scene)}
```

Update `syncSceneLayout()` to position action hotspots too:

```js
for (const hotspot of stage.querySelectorAll(".scene-hotspot")) {
  const position = getHotspotPosition({
    x: Number(hotspot.dataset.x),
    y: Number(hotspot.dataset.y),
  }, pan);

  hotspot.style.left = `${position.left}px`;
  hotspot.style.top = `${position.top}px`;
  hotspot.hidden = !position.visible;
}
```

- [ ] **Step 5: Add ticket modal rendering**

Add:

```js
function renderTicketModal() {
  app.insertAdjacentHTML("beforeend", `
    <div class="ticket-modal" role="dialog" aria-modal="true" aria-label="${eggGift.title}">
      <div class="ticket-modal__backdrop" data-action="close-ticket"></div>
      <article class="ticket-modal__card">
        <button class="ticket-modal__close" type="button" data-action="close-ticket" aria-label="关闭船票">×</button>
        <p class="eyebrow">${eggGift.badge}</p>
        <h1>${eggGift.title}</h1>
        <img class="ticket-modal__image" src="${eggGift.image}" alt="${eggGift.alt}" />
        <p>${eggGift.body}</p>
      </article>
    </div>
  `);
}
```

Update click handler:

```js
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
```

- [ ] **Step 6: Add ticket modal styles**

In `/Users/bytedance/rain-garden-birthday/styles.css`, add:

```css
.scene-hotspot--egg span {
  background: rgba(111, 210, 255, 0.28);
  box-shadow: 0 0 1.7rem rgba(111, 210, 255, 0.58);
}

.ticket-modal {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.ticket-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(3, 8, 10, 0.72);
  backdrop-filter: blur(10px);
}

.ticket-modal__card {
  position: relative;
  z-index: 1;
  width: min(44rem, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1.4rem;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(8, 20, 24, 0.94), rgba(5, 10, 12, 0.98));
  box-shadow: 0 1.4rem 4rem rgba(0, 0, 0, 0.5);
}

.ticket-modal__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 2.4rem;
  height: 2.4rem;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  color: var(--text);
  font-size: 1.5rem;
}

.ticket-modal__image {
  display: block;
  width: 100%;
  margin: 0.75rem 0;
  border-radius: 1rem;
  box-shadow: 0 0.8rem 2rem rgba(0, 0, 0, 0.28);
}
```

- [ ] **Step 7: Run egg gift tests**

Run:

```bash
node --test "/Users/bytedance/rain-garden-birthday/tests/state.test.mjs"
```

Expected: egg gift tests pass; remaining failures are cache/version or old static assertions.

## Task 5: Remove Old Three-Ending Assumptions

**Files:**
- Modify: `/Users/bytedance/rain-garden-birthday/tests/state.test.mjs`
- Modify: `/Users/bytedance/rain-garden-birthday/src/app.js`
- Modify: `/Users/bytedance/rain-garden-birthday/index.html`

- [ ] **Step 1: Delete obsolete tests**

Remove tests that refer to:

```js
applyChoice
chooseEnding
unlockEnding
getClearGiftHint
endings
BEDROOM_CHOICE_BY_ENDING
oldMemory
companionship
future
```

- [ ] **Step 2: Add no-old-structure regression test**

Add:

```js
test("source no longer exposes the old three ending structure", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const stateSource = readFileSync(new URL("../src/state.js", import.meta.url), "utf8");
  const contentSource = readFileSync(new URL("../src/content.js", import.meta.url), "utf8");

  for (const source of [appSource, stateSource, contentSource]) {
    assert.equal(source.includes("chooseEnding"), false);
    assert.equal(source.includes("unlockEnding"), false);
    assert.equal(source.includes("oldMemory"), false);
    assert.equal(source.includes("companionship"), false);
    assert.equal(source.includes("future"), false);
  }
});
```

- [ ] **Step 3: Bump cache version**

Update `/Users/bytedance/rain-garden-birthday/index.html`:

```html
<link rel="stylesheet" href="./styles.css?v=two-gift-flow-1" />
<script type="module" src="./src/app.js?v=two-gift-flow-1"></script>
```

- [ ] **Step 4: Run final tests and syntax checks**

Run:

```bash
node --check "/Users/bytedance/rain-garden-birthday/src/app.js" &&
node --check "/Users/bytedance/rain-garden-birthday/src/state.js" &&
node --test "/Users/bytedance/rain-garden-birthday/tests/state.test.mjs"
```

Expected: syntax checks pass and all tests pass.

- [ ] **Step 5: Read lints**

Use Cursor lints for:

- `/Users/bytedance/rain-garden-birthday/src/app.js`
- `/Users/bytedance/rain-garden-birthday/src/state.js`
- `/Users/bytedance/rain-garden-birthday/src/content.js`
- `/Users/bytedance/rain-garden-birthday/styles.css`
- `/Users/bytedance/rain-garden-birthday/tests/state.test.mjs`
- `/Users/bytedance/rain-garden-birthday/index.html`

Expected: no new linter errors.

## Self-Review

- Spec coverage: The plan covers one bedroom main physical gift, physical handwritten card password support, gated courtyard egg gift, ticket image popup, repeatable egg opening, restart reset, and cache/test updates.
- Placeholder scan: No `TBD`, unresolved file path, or vague implementation step remains.
- Type consistency: State helpers are consistently named `unlockMainGift`, `unlockEggGift`, and `canOpenEggGift`; UI functions are consistently named `renderMainGift`, `renderEggHotspot`, and `renderTicketModal`.
