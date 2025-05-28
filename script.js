class FootballPlayer {
  constructor(name, number, position) {
    this.name = name;
    this.number = number;
    this.position = position;
  }

  displayPlayer() {
    return `<div class="player-card">Name: ${this.name}, Number: ${this.number}, Position: ${this.position}</div>`;
  }
}

const createPlayerBtn = document.getElementById("createPlayerBtn");
const lineupDisplay = document.getElementById("lineup-display");
const playerNameInput = document.getElementById("playerName");
const playerNumberInput = document.getElementById("playerNumber");
const playerPositionInput = document.getElementById("playerPosition");

const pitchGK = document.getElementById("pitch-gk");
const pitchDEF = document.getElementById("pitch-def");
const pitchMID = document.getElementById("pitch-mid");
const pitchFWD = document.getElementById("pitch-fwd");

const lineup = []; // Array to hold our FootballPlayer objects

// Helper to fetch player image from TheSportsDB API
const fetchPlayerImage = async (name) => {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(
      name
    )}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.player && data.player[0] && data.player[0].strCutout) {
      return data.player[0].strCutout;
    } else if (
      data &&
      data.player &&
      data.player[0] &&
      data.player[0].strThumb
    ) {
      return data.player[0].strThumb;
    } else {
      return "https://www.thesportsdb.com/images/media/player/thumb/uwtpvq1422103018.jpg"; // Fallback generic player
    }
  } catch (e) {
    return "https://www.thesportsdb.com/images/media/player/thumb/uwtpvq1422103018.jpg";
  }
};

// Modified playerDot to accept image
const playerDot = (player) => {
  const img = player.imgUrl
    ? `<img src="${player.imgUrl}" alt="${player.name}" class="player-img">`
    : "";
  return `<div class="player-dot">${img}${player.number}<span>${player.name}</span></div>`;
};

// Load lineup from localStorage
const loadLineup = () => {
  const saved = localStorage.getItem("fpl_lineup");
  if (saved) {
    const arr = JSON.parse(saved);
    arr.forEach((obj) => {
      const p = new FootballPlayer(obj.name, obj.number, obj.position);
      p.imgUrl = obj.imgUrl;
      lineup.push(p);
    });
  }
};

// Save lineup to localStorage
const saveLineup = () => {
  localStorage.setItem("fpl_lineup", JSON.stringify(lineup));
};

// Edit player
const editPlayer = (index) => {
  const player = lineup[index];
  playerNameInput.value = player.name;
  playerNumberInput.value = player.number;
  playerPositionInput.value = player.position;
  createPlayerBtn.textContent = "Update Player";
  createPlayerBtn.dataset.editing = index;
};

// Delete player
const deletePlayer = (index) => {
  lineup.splice(index, 1);
  saveLineup();
  displayLineup();
};

// Update createPlayerBtn event
createPlayerBtn.addEventListener("click", async () => {
  const name = playerNameInput.value.trim();
  const number = parseInt(playerNumberInput.value);
  const position = playerPositionInput.value.trim();
  const editing = createPlayerBtn.dataset.editing;

  if (name && !isNaN(number) && position) {
    if (editing !== undefined) {
      // Update existing player
      const idx = parseInt(editing);
      lineup[idx].name = name;
      lineup[idx].number = number;
      lineup[idx].position = position;
      // Optionally update image if name changed
      lineup[idx].imgUrl = await fetchPlayerImage(name);
      createPlayerBtn.textContent = "Create Player";
      delete createPlayerBtn.dataset.editing;
    } else {
      // Add new player
      const imgUrl = await fetchPlayerImage(name);
      const newPlayer = new FootballPlayer(name, number, position);
      newPlayer.imgUrl = imgUrl;
      lineup.push(newPlayer);
    }
    saveLineup();
    displayLineup();
    playerNameInput.value = "";
    playerNumberInput.value = "";
    playerPositionInput.value = "";
  } else {
    alert("Please fill in all player details.");
  }
});

const updatePitch = () => {
  pitchGK.innerHTML = "";
  pitchDEF.innerHTML = "";
  pitchMID.innerHTML = "";
  pitchFWD.innerHTML = "";
  // Group players by position
  const gks = lineup.filter((p) => p.position === "Goalkeeper");
  const defs = lineup.filter((p) => p.position === "Defender");
  const mids = lineup.filter((p) => p.position === "Midfielder");
  const fwds = lineup.filter((p) => p.position === "Forward");
  // Evenly space each group using flex and width
  pitchGK.style.display = "flex";
  pitchGK.style.justifyContent = "center";
  gks.forEach((p) => (pitchGK.innerHTML += playerDot(p)));
  pitchDEF.style.display = "flex";
  pitchDEF.style.justifyContent = defs.length > 1 ? "space-evenly" : "center";
  defs.forEach((p) => (pitchDEF.innerHTML += playerDot(p)));
  pitchMID.style.display = "flex";
  pitchMID.style.justifyContent = mids.length > 1 ? "space-evenly" : "center";
  mids.forEach((p) => (pitchMID.innerHTML += playerDot(p)));
  pitchFWD.style.display = "flex";
  pitchFWD.style.justifyContent = fwds.length > 1 ? "space-evenly" : "center";
  fwds.forEach((p) => (pitchFWD.innerHTML += playerDot(p)));
};

const displayLineup = () => {
  lineupDisplay.innerHTML = "";
  lineup.forEach((player, i) => {
    lineupDisplay.innerHTML += `
            <div class="player-card">
                <span>Name: ${player.name}, Number: ${player.number}, Position: ${player.position}</span>
                <span>
                    <button class="fpl-btn" style="padding:2px 10px;font-size:0.9rem;margin-right:4px;" onclick="editPlayer(${i})">Edit</button>
                    <button class="fpl-btn" style="padding:2px 10px;font-size:0.9rem;background:#c0392b;" onclick="deletePlayer(${i})">Delete</button>
                </span>
            </div>
        `;
  });
  updatePitch();
};

const clearAllBtn = document.getElementById("clearAllBtn");

clearAllBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear all players from the lineup?")) {
    lineup.length = 0;
    saveLineup();
    displayLineup();
  }
});

// Expose edit/delete for inline onclick
window.editPlayer = editPlayer;
window.deletePlayer = deletePlayer;

// On load
loadLineup();
displayLineup();
