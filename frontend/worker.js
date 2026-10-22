// worker.js
const MASK64 = (1n << 64n) - 1n;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const SEED = 847291056n;

function splitmix64(x) {
    x = (x + 0x9E3779B97F4A7C15n) & MASK64;
    let z = x;
    z = ((z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n) & MASK64;
    z = ((z ^ (z >> 27n)) * 0x94D049BB133111EBn) & MASK64;
    return (z ^ (z >> 31n));
}

function charAt(position) {
    let h = splitmix64(SEED ^ BigInt(position));
    return ALPHABET[Number(h % 26n)];
}

function charsInRange(start, end) {
    let str = "";
    for (let p = start; p < end; p++) {
        str += charAt(p);
    }
    return str;
}

self.onmessage = function(e) {
    const { name, start, end } = e.data;
    
    // We scan in chunks of 10,000 to send back to the UI for the visual flip
    const CHUNK_SIZE = 10000;
    let current = end;
    
    while (current > start) {
        let chunkStart = Math.max(start, current - CHUNK_SIZE);
        let text = charsInRange(chunkStart, current);
        
        if (text.includes(name)) {
            self.postMessage({ found: true, position: chunkStart + text.indexOf(name) });
            return;
        }
        
        // Send the text back to the main thread so it can update the wall visually
        self.postMessage({ found: false, text: text, start: chunkStart, end: current });
        current = chunkStart;
    }
    
    self.postMessage({ done: true });
};