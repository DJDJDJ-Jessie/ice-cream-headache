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

let state = loadState();
let currentGroup = "idle";
let actionIndex = 0;
let bubbleTimer;
let actionTimer;
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
  return `饥饿 ${state.hunger}  清洁 ${state.clean}  心情 ${state.mood}  健康 ${state.health}  等级 ${state.level}  元宝 ${state.coins}`;
}

function playAction(group, options = {}) {
  const list = actions[group] || actions.idle;
  currentGroup = group;
  actionIndex = options.random ? Math.floor(Math.random() * list.length) : (actionIndex + 1) % list.length;
  player.load(list[actionIndex]);
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
    showBubble("我已经没有力气了...");
    return;
  }

  if (state.health < 30) {
    playAction("sick", { random: true });
    showBubble("我好像生病了。");
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
  showBubble(`升级啦！现在是 ${state.level} 级。`, 4200);
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

  if (state.hunger < 25 || state.clean < 25 || state.mood < 25) {
    showBubble("主人，我需要照顾一下。");
  }
}

function feed() {
  if (state.coins < 10) {
    showBubble("元宝不够啦，先去打工吧。");
    return;
  }

  state.hunger = clamp(state.hunger + 24);
  state.mood = clamp(state.mood + 4);
  state.health = clamp(state.health + 2);
  state.coins = Math.max(0, state.coins - 10);
  saveState();
  playAction("eat", { random: true });
  showBubble("好吃！谢谢主人。");
  returnToIdle();
}

function drink() {
  if (state.coins < 6) {
    showBubble("元宝不够，喝不起饮料啦。");
    return;
  }

  state.hunger = clamp(state.hunger + 8);
  state.mood = clamp(state.mood + 3);
  state.health = clamp(state.health + 2);
  state.coins = Math.max(0, state.coins - 6);
  saveState();
  playAction("drink", { random: true });
  showBubble("咕噜咕噜，舒服多了。");
  returnToIdle();
}

function cleanPet() {
  state.clean = clamp(state.clean + 30);
  state.mood = clamp(state.mood + 3);
  state.health = clamp(state.health + 2);
  saveState();
  playAction("clean", { random: true });
  showBubble("洗香香了。");
  returnToIdle(5200);
}

function playWithPet() {
  state.mood = clamp(state.mood + 18);
  state.hunger = clamp(state.hunger - 5);
  saveState();
  playAction("play", { random: true });
  showBubble("再玩一次嘛！");
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
  showBubble("学习中，变聪明一点。");
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
  showBubble("打工回来，赚到 35 元宝。");
  returnToIdle(5600);
}

function medicine() {
  if (state.health >= 80) {
    showBubble("我现在很健康，不用吃药。");
    return;
  }

  if (state.coins < 20) {
    showBubble("买药需要 20 元宝。");
    return;
  }

  state.coins = Math.max(0, state.coins - 20);
  state.health = clamp(state.health + 36);
  state.mood = clamp(state.mood - 4);
  saveState();
  playAction("drink", { random: true });
  showBubble("药有点苦，但好多了。");
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

  dragging = true;
  pointer = { x: event.screenX, y: event.screenY };
  playAction("drag", { random: true });
  showBubble("轻一点，轻一点。", 1800);
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
showBubble("我来啦。");
autoWalkTimer = window.setInterval(autoWalk, 9000);
decayTimer = window.setInterval(tickState, 60000);

window.addEventListener("beforeunload", () => {
  window.clearInterval(autoWalkTimer);
  window.clearInterval(decayTimer);
  saveState();
});
