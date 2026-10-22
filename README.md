# 🌌 Infinite Name Universe

An interactive, procedurally generated web application where users can search a massive 2-billion character universe of random letters to see if their name exists.

**🔗 Live Demo:** [https://infinite-name-universe.onrender.com](https://infinite-name-universe.onrender.com) 
*(Note: Hosted on Render's free tier, the first load may take 30–50 seconds to wake up).*

## 🧠 The Concept
Inspired by the Infinite Monkey Theorem, this project explores probability and procedural generation. The universe is not stored in a database; it is generated mathematically on the fly using a 64-bit PRNG (Pseudo-Random Number Generator). Because it uses a fixed seed, the position of every letter is deterministic—meaning the universe is exactly the same every time you load it.

## 📉 The Math & What I Learned (The Hard Truth)
Building this taught me a massive lesson about probability. The alphabet is 26 lowercase letters. The expected position to find a specific string of letters is `26^L` (where L is the length of the name).

*   **3-letter name (e.g., "sam"):** Expected around character 17,576. Found almost instantly.
*   **5-letter name (e.g., "sarah"):** Expected around character 11.9 million. Found in a few seconds.
*   **7-letter name (e.g., "genghis"):** Expected around character 8 billion. Finding this in a 2-billion character universe is mathematically unlikely (but not impossible).
*   **10-letter name (e.g., "okwuchukwu"):** Expected around character **141 trillion**. 

**The Lesson:** I originally wanted to search 10-letter names, but the math makes it practically impossible without scanning for thousands of years. I learned that in procedural generation, **short strings appear fast, but every additional character exponentially increases the rarity of the string.** 

## ⚙️ How It Works
*   **Backend (Python/FastAPI):** Serves the frontend and hosts the `generator.py` script, which uses a SplitMix64 algorithm to generate characters.
*   **Frontend (Vanilla JS):** To bypass the network latency of free hosting, the search logic was moved into a **Web Worker** (`worker.js`). When you search, your browser's CPU does the heavy lifting of calculating the 64-bit math and searching the chunks, making the search run at maximum speed without crashing the UI.
*   **The UI:** Built with HTML/CSS, featuring a 2-column reading layout, dynamic text highlighting, and responsive search modals.

## 🛠️ Tech Stack
*   **Python 3** (FastAPI, Uvicorn)
*   **Vanilla JavaScript** (Web Workers, Fetch API)
*   **HTML/CSS** (Custom UI, CSS Animations)
*   **Render** (Deployment)

## 👨‍💻 Author
**Zeno**
- GitHub: [@uchihazeno06-pixel](https://github.com/uchihazeno06-pixel)
