# generator.py
import time

MASK64 = (1 << 64) - 1
ALPHABET = "abcdefghijklmnopqrstuvwxyz"
SEED = 847291056          # fixed forever
SPEED = 1000              # chars per second
START_TIME = 1700000000   # fixed timestamp (set once, never change)


def splitmix64(x: int) -> int:
    x = (x + 0x9E3779B97F4A7C15) & MASK64
    z = x
    z = ((z ^ (z >> 30)) * 0xBF58476D1CE4E5B9) & MASK64
    z = ((z ^ (z >> 27)) * 0x94D049BB133111EB) & MASK64
    return z ^ (z >> 31)


def char_at(position: int) -> str:
    h = splitmix64(SEED ^ position)
    return ALPHABET[h % 26]


def chars_in_range(start: int, end: int) -> str:
    return "".join(char_at(p) for p in range(start, end))


def current_position() -> int:
    """Where the universe is right now (time-based, no loop needed)."""
    elapsed = time.time() - START_TIME
    return int(elapsed * SPEED)