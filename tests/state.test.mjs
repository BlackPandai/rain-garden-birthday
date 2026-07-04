import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SCENE_ORDER,
  createInitialState,
  applyChoice,
  completeScene,
  chooseEnding,
  unlockEnding,
  getClearGiftHint,
  nextHintLevel,
  saveState,
  loadState,
  resetState,
  startReplayAtScene,
  rememberSceneChoice,
  shouldShowChoice,
} from "../src/state.js";

function createMemoryStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

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

test("initial state tracks unopened gift box", () => {
  const state = createInitialState();

  assert.equal(state.boxUnlocked, false);
  assert.equal(state.passwordAttempts, 0);
});

test("completeScene advances from entrance to courtyard and records final preference", () => {
  const state = completeScene(createInitialState(), "entrance", "companionship");

  assert.equal(state.currentSceneId, "courtyard-pond");
  assert.equal(state.finalPreference, "companionship");
  assert.deepEqual(state.completedScenes, ["entrance"]);
});

test("scene route visits courtyard immediately after entrance", () => {
  assert.deepEqual(SCENE_ORDER, ["entrance", "courtyard-pond", "living-room", "window", "bedroom"]);
});

test("getClearGiftHint returns explicit fallback copy", () => {
  assert.equal(
    getClearGiftHint("future"),
    "去庭院或池塘边找防水小卡片、二维码或信封；它会指向机票、旅行基金或红包口令。"
  );
});

test("nextHintLevel increments from zero and caps at three for a scene", () => {
  const firstHint = nextHintLevel(createInitialState(), "entrance");
  const secondHint = nextHintLevel(firstHint, "entrance");
  const thirdHint = nextHintLevel(secondHint, "entrance");
  const cappedHint = nextHintLevel(thirdHint, "entrance");

  assert.equal(firstHint.hintLevelByScene.entrance, 1);
  assert.equal(cappedHint.hintLevelByScene.entrance, 3);
});

test("saveState writes JSON to injected storage and loadState returns it", () => {
  const storage = createMemoryStorage();
  const state = {
    ...createInitialState(),
    currentSceneId: "window",
    imprints: { oldMemory: 2, companionship: 1, future: 3 },
  };

  saveState(state, storage);

  assert.equal(storage.getItem("rain-garden-birthday-state"), JSON.stringify(state));
  assert.deepEqual(loadState(storage), state);
});

test("resetState removes saved state and returns initial state", () => {
  const storage = createMemoryStorage();
  const state = {
    ...createInitialState(),
    currentSceneId: "bedroom",
  };
  saveState(state, storage);

  const reset = resetState(storage);

  assert.equal(storage.getItem("rain-garden-birthday-state"), null);
  assert.deepEqual(reset, createInitialState());
});

test("startReplayAtScene jumps to a chapter while preserving discovered endings", () => {
  const state = {
    ...createInitialState(),
    currentSceneId: "bedroom",
    completedScenes: ["entrance", "living-room", "window", "courtyard-pond", "bedroom"],
    imprints: { oldMemory: 2, companionship: 1, future: 5 },
    finalPreference: "future",
    unlockedEndings: ["future"],
    canReturnToGarden: true,
    hintLevelByScene: { bedroom: 2 },
  };

  assert.deepEqual(startReplayAtScene(state, "window"), {
    ...state,
    currentSceneId: "window",
    completedScenes: [],
    imprints: { oldMemory: 0, companionship: 0, future: 0 },
    finalPreference: null,
    hintLevelByScene: {},
  });
});

test("bedroom hides the hotspot for an already unlocked ending", () => {
  const state = {
    ...createInitialState(),
    unlockedEndings: ["future"],
  };

  assert.equal(shouldShowChoice(state, "bedroom", "to-future"), false);
  assert.equal(shouldShowChoice(state, "bedroom", "to-memory"), true);
  assert.equal(shouldShowChoice(state, "bedroom", "to-together"), true);
  assert.equal(shouldShowChoice(state, "courtyard-pond", "courtyard-lantern"), true);
});

test("garden room and window hide previously chosen hotspots only after an ending", () => {
  const beforeEnding = rememberSceneChoice(createInitialState(), "courtyard-pond", "courtyard-lantern");
  const afterEnding = unlockEnding(beforeEnding, "future");

  assert.equal(shouldShowChoice(beforeEnding, "courtyard-pond", "courtyard-lantern"), true);
  assert.equal(shouldShowChoice(afterEnding, "courtyard-pond", "courtyard-lantern"), false);
  assert.equal(shouldShowChoice(afterEnding, "courtyard-pond", "courtyard-bridge"), true);
});

test("restart clears remembered hotspot choices", () => {
  const state = rememberSceneChoice(createInitialState(), "living-room", "moyu-bed");

  assert.deepEqual(state.selectedChoiceIdsByScene, {
    "living-room": ["moyu-bed"],
  });
  assert.deepEqual(createInitialState().selectedChoiceIdsByScene, {});
});

import { scenes, endings } from "../src/content.js";

test("content defines all route scenes", () => {
  assert.deepEqual(
    scenes.map((scene) => scene.id).sort(),
    [...SCENE_ORDER].sort()
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

test("desktop scene UI does not render horizontal view controls", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

  assert.equal(appSource.includes("view-control"), false);
  assert.equal(appSource.includes("view-dots"), false);
  assert.match(styles, /background-size:\s*cover/);
});

test("scene UI does not render moyu hint button", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

  assert.equal(appSource.includes("让摸鱼提示一下"), false);
  assert.equal(appSource.includes('data-action="hint"'), false);
});

test("mobile scene UI supports smooth swipe panning without buttons", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(appSource, /pointerdown/);
  assert.match(appSource, /pointermove/);
  assert.match(appSource, /--pan-x/);
  assert.match(styles, /@media\s*\(max-width:\s*700px\)/);
  assert.match(styles, /background-size:\s*auto 100%/);
  assert.match(styles, /transition:\s*background-position/);
});

test("final gift box requires unified eight digit clue without explicit ending count", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(appSource, /07070522/);
  assert.match(appSource, /输入八位线索/);
  assert.match(appSource, /data-action="submit-box-code"/);
  assert.equal(appSource.includes("1 / 3"), false);
  assert.equal(appSource.includes("/ 3"), false);
  assert.equal(appSource.includes("隐藏结局"), false);
});

test("main scene completion copy carries the four required digit clues", () => {
  const required = {
    entrance: ["一个圆", "七字折角"],
    "courtyard-pond": ["出现两遍"],
    "living-room": ["五月的开头"],
    window: ["两个相同的小数"],
    bedroom: ["八个空格"],
  };

  for (const [sceneId, snippets] of Object.entries(required)) {
    const scene = scenes.find((item) => item.id === sceneId);
    assert.ok(scene, `missing scene ${sceneId}`);
    for (const snippet of snippets) {
      assert.match(scene.completionText, new RegExp(snippet));
    }
  }
});

test("correct final code plays gift opening animation before the ending", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(appSource, /renderGiftOpening/);
  assert.match(appSource, /GIFT_OPENING_DURATION_MS/);
  assert.match(appSource, /gift-opening/);
  assert.match(appSource, /setTimeout/);
  assert.match(styles, /@keyframes\s+gift-lid-open/);
  assert.match(styles, /@keyframes\s+gift-glow-bloom/);
});

test("game uses bundled bgm mp3 without rendering a music toggle", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(appSource, /assets\/bgm\.mp3/);
  assert.match(appSource, /startBackgroundMusic/);
  assert.match(appSource, /new Audio/);
  assert.match(appSource, /loop = true/);
  assert.equal(appSource.includes('data-action="toggle-music"'), false);
  assert.equal(appSource.includes("renderMusicToggle"), false);
  assert.equal(styles.includes(".music-toggle"), false);
});
