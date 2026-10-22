const UNIVERSE_END = 2000000000;
let currentStart = UNIVERSE_END - 50000;
let isSearching = false;
let worker = null;

function openModal(id) { document.getElementById(id).classList.add("active"); }
function closeModal(id) { document.getElementById(id).classList.remove("active"); }

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
  if (worker) {
    worker.terminate(); // Instantly kills the background thread
    worker = null;
  }
  isSearching = false;
  document.getElementById("cancelBtn").style.display = "none";
  document.getElementById("result").innerHTML = "Search cancelled.";
}

function startSearch(maxDepth) {
  if (isSearching) return;
  
  const name = document.getElementById("searchInput").value.toLowerCase().trim();
  if (!name) return;
  
  isSearching = true;
  const resultDiv = document.getElementById("result");
  const cancelBtn = document.getElementById("cancelBtn");
  cancelBtn.style.display = "block";
  
  let scanStart = UNIVERSE_END;
  let scanEnd = Math.max(0, UNIVERSE_END - maxDepth); 
  
  resultDiv.innerHTML = "Scanning at max speed...";
  
  // Spin up the Web Worker
  worker = new Worker('worker.js');
  
  worker.onmessage = function(e) {
    const data = e.data;
    
    if (data.found) {
      resultDiv.innerHTML = `<span class="success">🎉 Found "${name}" at position ${data.position.toLocaleString()}!</span>`;
      
      // Load the page visually
      const foundPageStart = Math.max(0, data.position - 25000);
      loadWall(foundPageStart).then(() => {
        const textContainer = document.getElementById("text-content");
        const regex = new RegExp(`(${name})`, "gi");
        textContainer.innerHTML = textContainer.textContent.replace(regex, `<span class="highlight" id="found-match">$1</span>`);
        
        const matchElement = document.getElementById("found-match");
        if (matchElement) {
          matchElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
      
      cancelSearch(); // Stop the worker
      return;
    }
    
    if (data.done) {
      resultDiv.innerHTML = `<span class="error">Reached the limit of the scan. Not found.</span>`;
      cancelSearch();
      return;
    }
    
    // Update the visual wall as it scans
    if (!data.found && data.text) {
      document.getElementById("text-content").textContent = data.text;
      document.getElementById("stats").textContent = `Window: ${data.start.toLocaleString()} - ${data.end.toLocaleString()}`;
      resultDiv.innerHTML = `Scanning backwards... currently at ${data.start.toLocaleString()}`;
    }
  };
  
  // Tell the worker to start scanning
  worker.postMessage({ name: name, start: scanEnd, end: scanStart });
}