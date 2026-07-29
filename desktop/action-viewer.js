const actionList = window.qqPenguinActions || [];
const groupList = document.getElementById("group-list");
const stage = document.getElementById("stage");
const fileName = document.getElementById("file-name");
const note = document.getElementById("note");
const ruffle = window.RufflePlayer.newest();
const player = ruffle.createPlayer();

let activeButton;

player.style.width = "360px";
player.style.height = "360px";
player.style.background = "transparent";
stage.appendChild(player);

function playAction(action, button) {
  if (activeButton) {
    activeButton.classList.remove("active");
  }

  activeButton = button;
  activeButton.classList.add("active");
  fileName.textContent = action.file;
  note.textContent = action.note;
  player.load(action.file);
}

function renderActions() {
  const groups = new Map();
  actionList.forEach((action) => {
    if (!groups.has(action.group)) {
      groups.set(action.group, []);
    }
    groups.get(action.group).push(action);
  });

  groups.forEach((actions, group) => {
    const title = document.createElement("div");
    title.className = "group-title";
    title.textContent = group;
    groupList.appendChild(title);

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.className = "action-button";
      button.type = "button";
      button.textContent = action.file.split("/").pop();
      button.addEventListener("click", () => playAction(action, button));
      groupList.appendChild(button);
    });
  });

  const firstButton = groupList.querySelector(".action-button");
  if (firstButton && actionList[0]) {
    playAction(actionList[0], firstButton);
  }
}

renderActions();
