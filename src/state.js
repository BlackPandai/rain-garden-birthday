export const SCENE_ORDER = ["entrance", "courtyard-pond", "living-room", "window", "bedroom"];

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
    boxUnlocked: false,
    passwordAttempts: 0,
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

export function startReplayAtScene(state, sceneId) {
  return {
    ...state,
    currentSceneId: sceneId,
    completedScenes: [],
    imprints: {
      oldMemory: 0,
      companionship: 0,
      future: 0,
    },
    finalPreference: null,
    hintLevelByScene: {},
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
