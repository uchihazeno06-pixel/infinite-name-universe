const UNIVERSE_END = 2000000000;
let currentStart = UNIVERSE_END - 50000;
let isSearching = false;
let abortController = null;

// --- MODAL & LEADERBOARD LOGIC ---
async function openModal(id) {
  document.getElementById(id).classList.add("active");
  if (id === "leaderboardModal") {
    await loadLeaderboard();
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

async function loadLeaderboard() {
  const tbody = document.querySelector("#leaderboardTable tbody");
  tbody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";
  
  try {
    const res = await fetch("/leaderboard");
    const data = await res.json();
    
    if (data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='4'>No names claimed yet. Be the first!</td></tr>";
      return;
    }
    
    tbody.innerHTML = "";
    data.forEach(row => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${row.pattern}</strong></td>
          <td>${row.length}</td>
          <td>${row.username}</td>
          <td>${row.position.toLocaleString()}</td>
        </tr>
      `;
    });
  } catch (err) {
    tbody.innerHTML = "<tr><td colspan='4'>Error loading leaderboard.</td></tr>";
  }
}

async function claimName(name, position) {
  const username = prompt(`You found "${name}"! Enter your username to claim it:`);
  if (!username || username.trim() === "") return;
  
  try {
    const res = await fetch(`/claim?username=${encodeURIComponent(username)}&pattern=${encodeURIComponent(name)}`, {
      method: 'POST'
    });
    const data = await res.json();
    
    if (data.ok) {
      document.getElementById("result").innerHTML = `<span class="success">🏆 Successfully claimed "${name}"!</span>`;
    } else {
      document.getElementById("result").innerHTML = `<span class="error">Failed to claim: ${data.reason || 'Unknown error'}</span>`;
    }
  } catch (err) {
    document.getElementById("result").innerHTML = `<span class="error">Error claiming name.</span>`;
  }
}

// --- SEARCH LOGIC ---
async function loadWall(startPos) {
  const textContainer = document.getElementById("text-content");
  try {
    const res = await fetch(`/wall?start=${startPos}&end=${startPos + 50000}`);
    const data = await res.json();
    textContainer.textContent = data.text;
    document.getElementById("stats").textContent = `Window: ${data.start.toLocaleString()} - ${data.end.toLocaleString()}`;
  } catch (err) {
    textContainer.textContent = "Error loading universe.";
  }
}

loadWall(currentStart);

function cancelSearch() {
  if (abortController) abortController.abort();
  isSearching = false;
  document.getElementById("cancelBtn").style.display = "none";
  document.getElementById("result").innerHTML = "Search cancelled.";
}

async function startSearch(maxDepth) {
  if (isSearching) return;
  
  const name = document.getElementById("searchInput").value.toLowerCase().trim();
  if (!name) return;
  
  isSearching = true;
  abortController = new AbortController();
  
  const resultDiv = document.getElementById("result");
  const cancelBtn = document.getElementById("cancelBtn");
  cancelBtn.style.display = "block";
  
  let scanStart = UNIVERSE_END;
  let scanEnd = Math.max(0, UNIVERSE_END - maxDepth); 
  let startTime = Date.now();
  let lastPromptTime = startTime;
  let lastMessageTime = startTime;
  
  while (scanStart > scanEnd && scanStart > 0) {
    if (!isSearching) break; 
    
    const now = Date.now();
    const elapsedSeconds = (now - startTime) / 1000;
    
    if (now - lastPromptTime > 270000) { 
      const keepGoing = confirm("You've been searching for 4.5 minutes. Keep going?");
      if (!keepGoing) { cancelSearch(); break; }
      lastPromptTime = now;
    }
    
    if (now - lastMessageTime > 120000) {
      if (elapsedSeconds < 360) {
        resultDiv.innerHTML = "Still scanning... 7-letter names are rare. Keep holding on.";
      } else if (elapsedSeconds < 600) {
        resultDiv.innerHTML = "You're in deep space now. This is a really rare name!";
      } else {
        resultDiv.innerHTML = "Incredible dedication. The universe is massive, but we won't give up.";
      }
      lastMessageTime = now;
    } else {
      resultDiv.innerHTML = `Scanning backwards... currently at ${scanStart.toLocaleString()}`;
    }

    const chunkStart = Math.max(0, scanStart - 50000);
    
    try {
      const res = await fetch(`/search?name=${name}&start=${chunkStart}&end=${scanStart}`, { signal: abortController.signal });
      const data = await res.json();
      
      if (data.found) {
        resultDiv.innerHTML = `
          <span class="success">🎉 Found "${name}" at position ${data.position.toLocaleString()}!</span>
          <button class="btn-claim" onclick="claimName('${name}', ${data.position})">Claim Name</button>
        `;
        
        const foundPageStart = Math.max(0, data.position - 25000);
        await loadWall(foundPageStart);
        
        const textContainer = document.getElementById("text-content");
        const regex = new RegExp(`(${name})`, "gi");
        textContainer.innerHTML = textContainer.textContent.replace(regex, `<span class="highlight" id="found-match">$1</span>`);
        
        const matchElement = document.getElementById("found-match");
        if (matchElement) {
          matchElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        
        isSearching = false;
        cancelBtn.style.display = "none";
        return;
      }
      
      const wallRes = await fetch(`/wall?start=${chunkStart}&end=${scanStart}`);
      const wallData = await wallRes.json();
      document.getElementById("text-content").textContent = wallData.text;
      document.getElementById("stats").textContent = `Window: ${wallData.start.toLocaleString()} - ${wallData.end.toLocaleString()}`;
      
      scanStart = chunkStart;
      
    } catch (err) {
      if (err.name === 'AbortError') break;
      resultDiv.textContent = "Error searching.";
      break;
    }
  }
  
  if (isSearching) {
    resultDiv.innerHTML = `<span class="error">Reached the limit of the scan. Not found.</span>`;
    isSearching = false;
    cancelBtn.style.display = "none";
  }
}