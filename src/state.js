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
