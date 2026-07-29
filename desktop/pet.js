const stage = document.getElementById("pet-stage");
const bubble = document.getElementById("bubble");
const interactionLayer = document.getElementById("interaction-layer");
const ruffle = window.RufflePlayer.newest();
const desktop = window.qqPetDesktop;

const actions = {
  idle: ["/Penguin/GG/chang/1.swf"],
  walk: [
    "/Penguin/GG/chang/5.swf",
    "/Penguin/GG/chang/6.swf",
    "/Penguin/GG/chang/7.swf",
    "/Penguin/GG/chang/8.swf",
  ],
  eat: [
    "/Penguin/GG/e/chi1.swf",
    "/Penguin/GG/e/chi2.swf",
    "/Penguin/GG/e/chi3.swf",
  ],
  clean: ["/Penguin/GG/e/xizao.swf"],
  drink: ["/Penguin/GG/e/he1.swf", "/Penguin/GG/e/he2.swf", "/Penguin/GG/e/he3.swf"],
  study: ["/Penguin/GG/e/study.swf"],
  work: ["/Penguin/GG/e/work.swf"],
  play: ["/Penguin/GG/other/lai0.swf", "/Penguin/GG/other/lai1.swf", "/Penguin/GG/other/lai2.swf"],
  sick: ["/Penguin/GG/bing/1.swf", "/Penguin/GG/bing/2.swf", "/Penguin/GG/bing/3.swf"],
  drag: ["/Penguin/GG/chang/drag.swf", "/Penguin/GG/chang/drag0.swf"],
  drop: ["/Penguin/GG/chang/drop.swf"],
  land: ["/Penguin/GG/chang/land.swf"],
  levelUp: ["/Penguin/GG/other/shengji.swf"],
  death: ["/Penguin/GG/other/si0.swf", "/Penguin/GG/other/si1.swf"],
};

const statusLabels = {
  hunger: "\u9965\u997f",
  clean: "\u6e05\u6d01",
  mood: "\u5fc3\u60c5",
  health: "\u5065\u5eb7",
  level: "\u7b49\u7ea7",
  coins: "\u5143\u5b9d",
};

const defaultState = {
  hunger: 72,
  clean: 68,
  mood: 75,
  health: 82,
  growth: 1,
  level: 1,
  coins: 300,
  lastTickAt: Date.now(),
};

const players = [createPlayer(), createPlayer()];
const verifiedIdleOptions = { random: false };
let activePlayerIndex = 0;
let actionIndex = 0;
let transitionToken = 0;
let bubbleTimer;
let actionTimer;
let autoWalkTimer = null;
let decayTimer;
let dragging = false;
let pointer = null;
let state = loadState();

function createPlayer() {
  const player = ruffle.createPlayer();
  player.classList.add("player-layer");
  player.style.background = "transparent";
  player.style.setProperty("--logo-display", "none");
  player.style.setProperty("--preloader-background", "transparent");
  stage.appendChild(player);
  suppressRuffleChrome(player);
  return player;
}

function suppressRuffleChrome(player) {
  const hideChrome = () => {
    if (!player.shadowRoot) {
      return false;
    }

    if (!player.shadowRoot.querySelector("#qqpet-ruffle-chrome-fix")) {
      const style = document.createElement("style");
      style.id = "qqpet-ruffle-chrome-fix";
      style.textContent = `
        #preloader,
        #play_button,
        #unmute_overlay,
        #message_overlay {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }

        #container.hidden {
          display: block !important;
        }
      `;
      player.shadowRoot.appendChild(style);
    }

    return true;
  };

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (hideChrome() || attempts > 40) {
      window.clearInterval(timer);
    }
  }, 50);
}

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem("qq-penguin-state") || "{}") };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem("qq-penguin-state", JSON.stringify(state));
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function showBubble(message, duration = 3600) {
  window.clearTimeout(bubbleTimer);
  bubble.textContent = message;
  bubble.hidden = false;
  bubbleTimer = window.setTimeout(hideBubble, duration);
}

function hideBubble() {
  window.clearTimeout(bubbleTimer);
  bubble.hidden = true;
  bubble.textContent = "";
}

function currentStatusMessage() {
  return [
    `${statusLabels.hunger} ${state.hunger}`,
    `${statusLabels.clean} ${state.clean}`,
    `${statusLabels.mood} ${state.mood}`,
    `${statusLabels.health} ${state.health}`,
    `${statusLabels.level} ${state.level}`,
    `${statusLabels.coins} ${state.coins}`,
  ].join("  ");
}

function chooseAction(group, options = {}) {
  const list = actions[group] || actions.idle;
  actionIndex = options.random ? Math.floor(Math.random() * list.length) : (actionIndex + 1) % list.length;
  return list[actionIndex];
}

async function playAction(group, options = {}) {
  const nextSource = chooseAction(group, options);
  const token = ++transitionToken;
  const currentPlayer = players[activePlayerIndex];
  const nextPlayerIndex = activePlayerIndex === 0 ? 1 : 0;
  const nextPlayer = players[nextPlayerIndex];

  nextPlayer.classList.remove("is-active");
  nextPlayer.classList.add("is-buffering");

  try {
    await nextPlayer.load(nextSource);
    suppressRuffleChrome(nextPlayer);
    await waitForRuffleFrame(nextPlayer);
  } catch {
    return;
  }

  if (token !== transitionToken) {
    return;
  }

  nextPlayer.classList.remove("is-buffering");
  nextPlayer.classList.add("is-active");
  currentPlayer.classList.remove("is-active");
  activePlayerIndex = nextPlayerIndex;
}

function waitForRuffleFrame(player) {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const settleMs = 220;
    const maxWaitMs = 900;

    const check = () => {
      const elapsed = performance.now() - startedAt;
      const hasCanvas = Boolean(player.shadowRoot?.querySelector("canvas"));

      if ((hasCanvas && elapsed >= settleMs) || elapsed >= maxWaitMs) {
        resolve();
        return;
      }

      window.requestAnimationFrame(check);
    };

    check();
  });
}

function returnToIdle(delay = 3600) {
  window.clearTimeout(actionTimer);
  actionTimer = window.setTimeout(() => {
    if (!dragging) {
      playAction("idle", { random: true });
    }
  }, delay);
}

function updateCondition() {
  const carePressure = Math.max(0, 35 - state.hunger) + Math.max(0, 35 - state.clean) + Math.max(0, 35 - state.mood);
  state.health = clamp(state.health - carePressure * 0.02);

  if (state.health <= 0) {
    playAction("death", { random: true });
    return;
  }

  if (state.health < 30) {
    playAction("sick", { random: true });
  }
}

function maybeLevelUp() {
  const nextLevelGrowth = state.level * 100;
  if (state.growth < nextLevelGrowth) {
    return;
  }

  state.level += 1;
  state.coins += 80;
  playAction("levelUp", { random: true });
}

function tickState() {
  const now = Date.now();
  const elapsedMinutes = Math.floor((now - state.lastTickAt) / 60000);

  if (elapsedMinutes < 1) {
    return;
  }

  state.hunger = clamp(state.hunger - elapsedMinutes * 0.5);
  state.clean = clamp(state.clean - elapsedMinutes * 0.35);
  state.mood = clamp(state.mood - elapsedMinutes * 0.25);
  state.growth += elapsedMinutes * 0.01;
  state.lastTickAt = now;
  updateCondition();
  maybeLevelUp();
  saveState();
}

function feed() {
  if (state.coins < 10) {
    return;
  }

  state.hunger = clamp(state.hunger + 24);
  state.mood = clamp(state.mood + 4);
  state.health = clamp(state.health + 2);
  state.coins = Math.max(0, state.coins - 10);
  saveState();
  playAction("eat", { random: true });
  returnToIdle();
}

function drink() {
  if (state.coins < 6) {
    return;
  }

  state.hunger = clamp(state.hunger + 8);
  state.mood = clamp(state.mood + 3);
  state.health = clamp(state.health + 2);
  state.coins = Math.max(0, state.coins - 6);
  saveState();
  playAction("drink", { random: true });
  returnToIdle();
}

function cleanPet() {
  state.clean = clamp(state.clean + 30);
  state.mood = clamp(state.mood + 3);
  state.health = clamp(state.health + 2);
  saveState();
  playAction("clean", { random: true });
  returnToIdle(5200);
}

function playWithPet() {
  state.mood = clamp(state.mood + 18);
  state.hunger = clamp(state.hunger - 5);
  saveState();
  playAction("play", { random: true });
  returnToIdle();
}

function study() {
  state.growth += 12;
  state.mood = clamp(state.mood - 5);
  state.hunger = clamp(state.hunger - 5);
  state.clean = clamp(state.clean - 2);
  maybeLevelUp();
  saveState();
  playAction("study", { random: true });
  returnToIdle(5600);
}

function work() {
  state.coins += 35;
  state.mood = clamp(state.mood - 8);
  state.hunger = clamp(state.hunger - 10);
  state.clean = clamp(state.clean - 4);
  state.growth += 5;
  maybeLevelUp();
  saveState();
  playAction("work", { random: true });
  returnToIdle(5600);
}

function medicine() {
  if (state.health >= 80 || state.coins < 20) {
    return;
  }

  state.coins = Math.max(0, state.coins - 20);
  state.health = clamp(state.health + 36);
  state.mood = clamp(state.mood - 4);
  saveState();
  playAction("drink", { random: true });
  returnToIdle();
}

function handleCommand(command) {
  if (command === "feed") {
    feed();
  } else if (command === "drink") {
    drink();
  } else if (command === "clean") {
    cleanPet();
  } else if (command === "play") {
    playWithPet();
  } else if (command === "study") {
    study();
  } else if (command === "work") {
    work();
  } else if (command === "medicine") {
    medicine();
  } else if (command === "status") {
    showBubble(currentStatusMessage(), 4500);
  }
}

function startDrag(event) {
  if (event.button !== 0) {
    return;
  }

  hideBubble();
  dragging = true;
  pointer = { x: event.screenX, y: event.screenY };
  playAction("drag", { random: true });
  interactionLayer.setPointerCapture(event.pointerId);
}

function drag(event) {
  if (!dragging || !pointer) {
    return;
  }

  const dx = event.screenX - pointer.x;
  const dy = event.screenY - pointer.y;
  pointer = { x: event.screenX, y: event.screenY };
  desktop.moveBy({ x: dx, y: dy });
}

function endDrag(event) {
  dragging = false;
  pointer = null;
  playAction("drop", { random: true });
  window.setTimeout(() => {
    playAction("land", { random: true });
    returnToIdle(900);
  }, 900);
  if (interactionLayer.hasPointerCapture(event.pointerId)) {
    interactionLayer.releasePointerCapture(event.pointerId);
  }
}

function autoWalk() {
  if (dragging || Math.random() < 0.45) {
    playAction("idle", verifiedIdleOptions);
    return;
  }

  const direction = Math.random() > 0.5 ? 1 : -1;
  const steps = 18 + Math.floor(Math.random() * 18);
  let moved = 0;
  playAction("walk", { random: true });

  const walkTimer = window.setInterval(() => {
    desktop.moveBy({ x: direction * 3, y: 0 });
    moved += 1;

    if (moved >= steps) {
      window.clearInterval(walkTimer);
      playAction("idle", verifiedIdleOptions);
    }
  }, 110);
}

interactionLayer.addEventListener("pointerdown", startDrag);
interactionLayer.addEventListener("pointermove", drag);
interactionLayer.addEventListener("pointerup", endDrag);
interactionLayer.addEventListener("pointercancel", endDrag);
interactionLayer.addEventListener("dblclick", () => showBubble(currentStatusMessage(), 4500));
interactionLayer.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  desktop.showMenu();
});

desktop.onCommand(handleCommand);

tickState();
playAction("idle", verifiedIdleOptions);
decayTimer = window.setInterval(tickState, 60000);

window.addEventListener("beforeunload", () => {
  if (autoWalkTimer) {
    window.clearInterval(autoWalkTimer);
  }
  window.clearInterval(decayTimer);
  window.clearTimeout(actionTimer);
  saveState();
});
