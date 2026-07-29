const stage = document.getElementById("pet-stage");
const bubble = document.getElementById("bubble");
const interactionLayer = document.getElementById("interaction-layer");
const ruffle = window.RufflePlayer.newest();
const player = ruffle.createPlayer();
const desktop = window.qqPetDesktop;

const actions = {
  idle: [
    "/Penguin/GG/chang/1.swf",
    "/Penguin/GG/chang/2.swf",
    "/Penguin/GG/chang/3.swf",
    "/Penguin/GG/chang/4.swf",
  ],
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
  play: ["/Penguin/GG/other/lai0.swf", "/Penguin/GG/other/lai1.swf", "/Penguin/GG/other/lai2.swf"],
  sick: ["/Penguin/GG/bing/1.swf", "/Penguin/GG/bing/2.swf", "/Penguin/GG/bing/3.swf"],
};

const defaultState = {
  hunger: 72,
  clean: 68,
  mood: 75,
  growth: 1,
  coins: 300,
  lastTickAt: Date.now(),
};

let state = loadState();
let currentGroup = "idle";
let actionIndex = 0;
let bubbleTimer;
let autoWalkTimer;
let decayTimer;
let dragging = false;
let pointer = null;

player.style.width = "230px";
player.style.height = "275px";
player.style.background = "transparent";
stage.appendChild(player);

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

function showBubble(message, duration = 3200) {
  window.clearTimeout(bubbleTimer);
  bubble.textContent = message;
  bubble.hidden = false;
  bubbleTimer = window.setTimeout(() => {
    bubble.hidden = true;
  }, duration);
}

function currentStatusMessage() {
  return `Hunger ${state.hunger}  Clean ${state.clean}  Mood ${state.mood}  Coins ${state.coins}`;
}

function playAction(group, options = {}) {
  const list = actions[group] || actions.idle;
  currentGroup = group;
  actionIndex = options.random ? Math.floor(Math.random() * list.length) : (actionIndex + 1) % list.length;
  player.load(list[actionIndex]);
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
  saveState();

  if (state.hunger < 25 || state.clean < 25 || state.mood < 25) {
    playAction("sick", { random: true });
    showBubble("I need a little care.");
  }
}

function feed() {
  state.hunger = clamp(state.hunger + 24);
  state.mood = clamp(state.mood + 4);
  state.coins = Math.max(0, state.coins - 10);
  saveState();
  playAction("eat", { random: true });
  showBubble("Yum. Thank you!");
}

function cleanPet() {
  state.clean = clamp(state.clean + 30);
  state.mood = clamp(state.mood + 3);
  saveState();
  playAction("clean", { random: true });
  showBubble("All clean now.");
}

function playWithPet() {
  state.mood = clamp(state.mood + 18);
  state.hunger = clamp(state.hunger - 5);
  saveState();
  playAction("play", { random: true });
  showBubble("Again, again!");
}

function handleCommand(command) {
  if (command === "feed") {
    feed();
  } else if (command === "clean") {
    cleanPet();
  } else if (command === "play") {
    playWithPet();
  } else if (command === "status") {
    showBubble(currentStatusMessage(), 4500);
  }
}

function startDrag(event) {
  if (event.button !== 0) {
    return;
  }

  dragging = true;
  pointer = { x: event.screenX, y: event.screenY };
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
  if (interactionLayer.hasPointerCapture(event.pointerId)) {
    interactionLayer.releasePointerCapture(event.pointerId);
  }
}

function autoWalk() {
  if (dragging || Math.random() < 0.45) {
    playAction("idle", { random: true });
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
      playAction("idle", { random: true });
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
playAction(currentGroup, { random: true });
showBubble("I'm here.");
autoWalkTimer = window.setInterval(autoWalk, 9000);
decayTimer = window.setInterval(tickState, 60000);

window.addEventListener("beforeunload", () => {
  window.clearInterval(autoWalkTimer);
  window.clearInterval(decayTimer);
  saveState();
});
