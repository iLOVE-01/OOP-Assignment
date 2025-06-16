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

const formationSelect = document.getElementById("formationSelect");

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

// Edit player (open modal)
const editPlayer = (index) => {
  const player = lineup[index];
  // Fill modal fields
  document.getElementById("editPlayerName").value = player.name;
  document.getElementById("editPlayerNumber").value = player.number;
  document.getElementById("editPlayerPosition").value = player.position;
  document.getElementById("editPlayerIndex").value = index;
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('editPlayerModal'));
  modal.show();
};

// Handle modal save
const editPlayerForm = document.getElementById("editPlayerForm");
editPlayerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const index = parseInt(document.getElementById("editPlayerIndex").value);
  const name = document.getElementById("editPlayerName").value.trim();
  const number = parseInt(document.getElementById("editPlayerNumber").value);
  const position = document.getElementById("editPlayerPosition").value;
  if (name && !isNaN(number) && position) {
    lineup[index].name = name;
    lineup[index].number = number;
    lineup[index].position = position;
    lineup[index].imgUrl = await fetchPlayerImage(name);
    saveLineup();
    displayLineup();
    // Hide modal
    const modalEl = document.getElementById('editPlayerModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
  }
});

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

// Parse formation string (e.g. "4-3-3" or "4-3-2-1") to array of numbers
function parseFormation(str) {
  return str.split('-').map(Number);
}

// Get current formation as array
function getCurrentFormation() {
  return parseFormation(formationSelect.value);
}

// Position mapping for pitch layout
const positionMap = {
  GK: { row: 'pitch-gk', slot: 1 },
  RB: { row: 'pitch-def', slot: 1 },
  CB: { row: 'pitch-def', slot: 2 },
  LB: { row: 'pitch-def', slot: 3 },
  RWB: { row: 'pitch-def', slot: 4 },
  LWB: { row: 'pitch-def', slot: 5 },
  DMF: { row: 'pitch-mid', slot: 1 },
  CMF: { row: 'pitch-mid', slot: 2 },
  AMF: { row: 'pitch-mid', slot: 3 },
  LMF: { row: 'pitch-mid', slot: 4 },
  RMF: { row: 'pitch-mid', slot: 5 },
  LWF: { row: 'pitch-fwd', slot: 1 },
  RWF: { row: 'pitch-fwd', slot: 2 },
  CF: { row: 'pitch-fwd', slot: 3 },
  SS: { row: 'pitch-fwd', slot: 4 },
};

// Helper to get all players for a row, sorted by slot
function getPlayersForRow(rowId) {
  // Filter players by positionMap row, then sort by slot
  return lineup
    .map((p, i) => ({ ...p, _idx: i, ...positionMap[p.position] }))
    .filter((p) => p.row === rowId)
    .sort((a, b) => (a.slot || 99) - (b.slot || 99));
}

const updatePitch = () => {
  pitchGK.innerHTML = "";
  pitchDEF.innerHTML = "";
  pitchMID.innerHTML = "";
  pitchFWD.innerHTML = "";

  // GK
  getPlayersForRow('pitch-gk').forEach((p) => (pitchGK.innerHTML += playerDot(p)));
  // DEF
  getPlayersForRow('pitch-def').forEach((p) => (pitchDEF.innerHTML += playerDot(p)));
  // MID
  getPlayersForRow('pitch-mid').forEach((p) => (pitchMID.innerHTML += playerDot(p)));
  // FWD
  getPlayersForRow('pitch-fwd').forEach((p) => (pitchFWD.innerHTML += playerDot(p)));
};

// Update pitch when formation changes
formationSelect.addEventListener("change", updatePitch);

const displayLineup = () => {
  lineupDisplay.innerHTML = "";
  lineup.forEach((player, i) => {
    lineupDisplay.innerHTML += `
            <div class="player-card">
                <span>Name: ${player.name}, Number: ${player.number}, Position: ${player.position}</span>
                <span>
                    <button class="fpl-btn" style="padding:2px 10px;font-size:0.9rem;margin-right:4px;" onclick="editPlayer(${i})" data-bs-toggle="modal" data-bs-target="#editPlayerModal">Edit</button>
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
