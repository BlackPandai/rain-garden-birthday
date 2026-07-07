import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SCENE_ORDER,
  canOpenEggGift,
  completeScene,
  createInitialState,
  loadState,
  nextHintLevel,
  rememberSceneChoice,
  resetState,
  saveState,
  shouldShowChoice,
  startReplayAtScene,
  unlockEggGift,
  unlockMainGift,
} from "../src/state.js";
import { eggGift, mainGift, scenes } from "../src/content.js";

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

test("initial state starts with both gifts locked", () => {
  const state = createInitialState();

  assert.equal(state.currentSceneId, "entrance");
  assert.equal(state.mainGiftUnlocked, false);
  assert.equal(state.eggGiftUnlocked, false);
  assert.equal(state.boxUnlocked, false);
  assert.equal(state.passwordAttempts, 0);
});

test("completeScene advances from entrance to courtyard", () => {
  const state = completeScene(createInitialState(), "entrance");

  assert.equal(state.currentSceneId, "courtyard-pond");
  assert.deepEqual(state.completedScenes, ["entrance"]);
});

test("scene route visits courtyard immediately after entrance", () => {
  assert.deepEqual(SCENE_ORDER, ["entrance", "courtyard-pond", "living-room", "bedroom"]);
});

test("main gift unlock enables the courtyard egg gate", () => {
  const state = unlockMainGift(createInitialState());

  assert.equal(state.mainGiftUnlocked, true);
  assert.equal(state.boxUnlocked, true);
  assert.equal(state.passwordAttempts, 0);
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

test("garden and living room hide previously chosen hotspots only after main gift", () => {
  const beforeMain = rememberSceneChoice(createInitialState(), "courtyard-pond", "courtyard-lantern");
  const afterMain = unlockMainGift(beforeMain);

  assert.equal(shouldShowChoice(beforeMain, "courtyard-pond", "courtyard-lantern"), true);
  assert.equal(shouldShowChoice(afterMain, "courtyard-pond", "courtyard-lantern"), false);
  assert.equal(shouldShowChoice(afterMain, "courtyard-pond", "courtyard-bridge"), true);
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
    currentSceneId: "living-room",
    mainGiftUnlocked: true,
  };

  saveState(state, storage);

  assert.equal(storage.getItem("rain-garden-birthday-state"), JSON.stringify(state));
  assert.deepEqual(loadState(storage), state);
});

test("loadState backfills new gift flags for old saved states", () => {
  const storage = createMemoryStorage();
  storage.setItem("rain-garden-birthday-state", JSON.stringify({ currentSceneId: "living-room" }));

  assert.deepEqual(loadState(storage), {
    ...createInitialState(),
    currentSceneId: "living-room",
  });
});

test("resetState removes saved state and returns initial state", () => {
  const storage = createMemoryStorage();
  saveState({ ...createInitialState(), mainGiftUnlocked: true }, storage);

  const reset = resetState(storage);

  assert.equal(storage.getItem("rain-garden-birthday-state"), null);
  assert.deepEqual(reset, createInitialState());
});

test("startReplayAtScene jumps to a chapter while preserving discovered gifts", () => {
  const state = {
    ...createInitialState(),
    currentSceneId: "bedroom",
    completedScenes: ["entrance", "living-room", "courtyard-pond", "bedroom"],
    mainGiftUnlocked: true,
    eggGiftUnlocked: true,
    canReturnToGarden: true,
    hintLevelByScene: { bedroom: 2 },
  };

  assert.deepEqual(startReplayAtScene(state, "living-room"), {
    ...state,
    currentSceneId: "living-room",
    completedScenes: [],
    hintLevelByScene: {},
  });
});

test("content defines all route scenes", () => {
  assert.deepEqual(
    scenes.map((scene) => scene.id).sort(),
    [...SCENE_ORDER].sort()
  );
});

test("each scene has two choices with one decoy and layered moyu hints", () => {
  for (const scene of scenes) {
    assert.ok(scene.title);
    assert.ok(scene.body);
    assert.equal(scene.choices.length, 2);
    assert.equal(scene.choices.filter((choice) => choice.isDecoy).length, 1);
    assert.equal(scene.hints.length, 3);
  }
});

test("main path hotspots match the simplified two-gift route", () => {
  const expectedMainChoices = {
    entrance: "rain-card",
    "courtyard-pond": "courtyard-lantern",
    "living-room": "lamp-direction",
    bedroom: "to-main-gift",
  };

  for (const [sceneId, choiceId] of Object.entries(expectedMainChoices)) {
    const scene = scenes.find((item) => item.id === sceneId);
    const mainChoices = scene.choices.filter((choice) => !choice.isDecoy);

    assert.equal(mainChoices.length, 1);
    assert.equal(mainChoices[0].id, choiceId);
  }
});

test("content defines one main gift and one gated egg gift", () => {
  assert.equal(mainGift.title, "灯下的小秘密");
  assert.match(mainGift.body, /卧室/);
  assert.match(mainGift.clearHint, /卧室|床边|书桌|柜上/);
  assert.equal(eggGift.title, "雨里的船票");
  assert.match(eggGift.image, /ticket\.png/);
});

test("bedroom asks player to find the physical handwritten card", () => {
  const bedroom = scenes.find((scene) => scene.id === "bedroom");

  assert.ok(bedroom);
  assert.equal(bedroom.choices.some((choice) => choice.id === "to-main-gift"), true);
  assert.match(bedroom.completionText, /手边|床边|纸/);
  assert.match(bedroom.puzzlePrompt, /小木盒/);
});

test("living room copy avoids photo frame objects", () => {
  const sceneText = scenes
    .filter((scene) => scene.id === "living-room")
    .map((scene) => [
      scene.body,
      scene.puzzlePrompt,
      scene.completionText,
      ...scene.hints,
      ...scene.choices.flatMap((choice) => [choice.label, choice.detail]),
    ].join("\n"))
    .join("\n");

  assert.equal(sceneText.includes("相框"), false);
  assert.equal(sceneText.includes("照片"), false);
});

test("hotspot coordinates match the refreshed scene images", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

  const expectedCoordinates = [
    '"rain-card": { x: 58, y: 47 }',
    '"lamp-direction": { x: 17, y: 47 }',
    '"moyu-bed": { x: 77, y: 76 }',
    '"courtyard-lantern": { x: 17, y: 35 }',
    '"courtyard-bridge": { x: 63, y: 62 }',
    '"courtyard-moon": { x: 68, y: 10 }',
    '"to-main-gift": { x: 82, y: 73 }',
    '"bedroom-card": { x: 75, y: 37 }',
    'data-x="68"',
    'data-y="10"',
    "inspectedChoice.isDecoy",
    "dialog--decoy",
    "这好像只是摸鱼故意留下的岔路。",
  ];

  for (const coordinate of expectedCoordinates) {
    assert.ok(appSource.includes(coordinate), `missing coordinate ${coordinate}`);
  }
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

test("final gift box requires unified eight digit clue and handwritten card prompt", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(appSource, /07070522/);
  assert.match(appSource, /输入八位线索/);
  assert.match(appSource, /最后一步在纸上/);
  assert.match(appSource, /被雨等到的人/);
  assert.match(appSource, /一路跟回家的小尾巴/);
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
    bedroom: ["两个相同的小数", "八个空格"],
  };

  for (const [sceneId, snippets] of Object.entries(required)) {
    const scene = scenes.find((item) => item.id === sceneId);
    assert.ok(scene, `missing scene ${sceneId}`);
    for (const snippet of snippets) {
      assert.match(scene.completionText, new RegExp(snippet));
    }
  }
});

test("correct final code plays gift opening animation before the main gift", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(appSource, /renderGiftOpening/);
  assert.match(appSource, /GIFT_OPENING_DURATION_MS/);
  assert.match(appSource, /gift-opening/);
  assert.match(appSource, /setTimeout/);
  assert.match(styles, /@keyframes\s+gift-lid-open/);
  assert.match(styles, /@keyframes\s+gift-glow-bloom/);
});

test("app renders a single main gift instead of three endings", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(appSource, /mainGift/);
  assert.match(appSource, /renderMainGift/);
  assert.match(appSource, /unlockMainGift/);
  assert.equal(appSource.includes("chooseEnding"), false);
  assert.equal(appSource.includes("unlockEnding"), false);
  assert.equal(appSource.includes("ending-badge"), false);
});

test("courtyard egg gift is gated by main gift state in render and click handling", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(appSource, /renderEggHotspot/);
  assert.match(appSource, /canOpenEggGift\(state\)/);
  assert.match(appSource, /open-egg-gift/);
  assert.match(appSource, /unlockEggGift/);
  assert.match(appSource, /renderTicketModal/);
  assert.match(appSource, /eggGift\.image/);
  assert.match(styles, /@keyframes\s+ticket-card-pop/);
  assert.match(styles, /@keyframes\s+ticket-backdrop-fade/);
  assert.match(styles, /animation:\s*ticket-card-pop/);
  assert.match(styles, /animation:\s*ticket-backdrop-fade/);
});

test("ticket image uses the provided PNG asset and is sized for the modal", () => {
  const ticket = readFileSync(new URL("../assets/ticket.png", import.meta.url));
  const contentSource = readFileSync(new URL("../src/content.js", import.meta.url), "utf8");
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

  assert.ok(ticket.length > 0);
  assert.match(contentSource, /ticket\.png/);
  assert.match(appSource, /ticket\.png/);
  assert.equal(appSource.includes("disney-cruise-ticket.svg"), false);
  assert.match(styles, /\.ticket-modal__image/);
  assert.match(styles, /max-width:\s*min\(24rem,\s*82vw\)/);
  assert.match(styles, /max-height:\s*min\(34rem,\s*64vh\)/);
  assert.match(styles, /object-fit:\s*contain/);
});

test("game layers bundled bgm mp3 with generated rain ambience without rendering a music toggle", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(appSource, /assets\/bgm\.mp3/);
  assert.match(appSource, /startBackgroundMusic/);
  assert.match(appSource, /startRainAmbience/);
  assert.match(appSource, /createRainNoise/);
  assert.match(appSource, /AudioContext/);
  assert.match(appSource, /new Audio/);
  assert.match(appSource, /loop = true/);
  assert.equal(appSource.includes('data-action="toggle-music"'), false);
  assert.equal(appSource.includes("renderMusicToggle"), false);
  assert.equal(styles.includes(".music-toggle"), false);
});

test("app preloads visual and audio assets when opened", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(appSource, /preloadResources/);
  assert.match(appSource, /PRELOAD_IMAGE_SOURCES/);
  assert.match(appSource, /new Image\(\)/);
  assert.match(appSource, /Promise\.allSettled/);
  assert.match(appSource, /preload = "auto"/);
  assert.match(appSource, /backgroundMusic\.load\(\)/);
  assert.match(appSource, /ticket\.png/);
  assert.match(appSource, /moyu-brown-cocker-dog-transparent\.png/);
  assert.match(appSource, /bgm\.mp3/);
});

test("window scene is removed from route, content, app assets, and hotspots", () => {
  const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const stateSource = readFileSync(new URL("../src/state.js", import.meta.url), "utf8");
  const contentSource = readFileSync(new URL("../src/content.js", import.meta.url), "utf8");

  assert.equal(scenes.some((scene) => scene.id === "window"), false);
  assert.equal(stateSource.includes('"window"'), false);
  assert.equal(contentSource.includes('id: "window"'), false);
  assert.equal(appSource.includes("rain-garden-window-room.png"), false);
  assert.equal(appSource.includes("paper-note"), false);
  assert.equal(appSource.includes("window-envelope"), false);
});

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
