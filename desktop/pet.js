const actions = [
  "/Penguin/GG/chang/1.swf",
  "/Penguin/GG/chang/2.swf",
  "/Penguin/GG/chang/3.swf",
  "/Penguin/GG/chang/4.swf",
];

const stage = document.getElementById("pet-stage");
const ruffle = window.RufflePlayer.newest();
const player = ruffle.createPlayer();
let index = 0;

player.style.width = "220px";
player.style.height = "260px";
player.style.background = "transparent";
stage.appendChild(player);

function playCurrentAction() {
  player.load(actions[index]);
}

function nextAction() {
  index = (index + 1) % actions.length;
  playCurrentAction();
}

playCurrentAction();
window.setInterval(nextAction, 12000);
