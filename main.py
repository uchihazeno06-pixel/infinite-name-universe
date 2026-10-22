# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os, time
import sqlite3

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRES = True
except ImportError:
    POSTGRES = False

app = FastAPI()

# When deployed, this will use your Supabase URL. 
# When local, it falls back to SQLite.
DATABASE_URL = os.getenv("DATABASE_URL", "universe.db")

def get_db():
    if POSTGRES and DATABASE_URL.startswith("postgres://"):
        return psycopg2.connect(DATABASE_URL)
    else:
        return sqlite3.connect(DATABASE_URL)

def init_db():
    con = get_db()
    cur = con.cursor()
    
    if POSTGRES and DATABASE_URL.startswith("postgres://"):
        cur.execute("""
        CREATE TABLE IF NOT EXISTS findings (
            pattern TEXT PRIMARY KEY,
            position INTEGER,
            found_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS leaderboard (
            username TEXT,
            pattern TEXT,
            length INTEGER,
            position INTEGER,
            claimed_at INTEGER
        );
        """)
    else:
        cur.executescript("""
        CREATE TABLE IF NOT EXISTS findings (
            pattern TEXT PRIMARY KEY,
            position INTEGER,
            found_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS leaderboard (
            username TEXT,
            pattern TEXT,
            length INTEGER,
            position INTEGER,
            claimed_at INTEGER
        );
        """)
    con.commit()
    con.close()

init_db()

UNIVERSE_END = 2000000000 

@app.get("/wall")
def wall(start: int, end: int):
    if end - start > 50000:
        end = start + 50000
    text = generator.chars_in_range(start, end)
    return {"start": start, "end": end, "text": text}

@app.get("/search")
def search(name: str, start: int, end: int):
    name = name.lower()
    con = get_db()
    cur = con.cursor()
    
    cur.execute("SELECT position FROM findings WHERE pattern=?", (name,))
    row = cur.fetchone()
    if row:
        con.close()
        return {"found": True, "position": row[0]}

    text = generator.chars_in_range(start, end)
    pos = text.find(name)
    
    if pos != -1:
        actual_position = start + pos
        cur.execute("INSERT INTO findings (pattern, position, found_at) VALUES (?,?,?) ON CONFLICT (pattern) DO NOTHING",
                    (name, actual_position, int(time.time())))
        con.commit()
        con.close()
        return {"found": True, "position": actual_position}

    con.close()
    return {"found": False}

@app.get("/leaderboard")
def leaderboard():
    con = get_db()
    cur = con.cursor()
    cur.execute("SELECT username, pattern, length, position FROM leaderboard ORDER BY length DESC LIMIT 20")
    rows = cur.fetchall()
    con.close()
    return [{"username": r[0], "pattern": r[1], "length": r[2], "position": r[3]} for r in rows]

@app.post("/claim")
def claim(username: str, pattern: str):
    pattern = pattern.lower()
    con = get_db()
    cur = con.cursor()
    
    cur.execute("SELECT position FROM findings WHERE pattern=?", (pattern,))
    row = cur.fetchone()
    if not row:
        con.close()
        return {"ok": False, "reason": "Name not found in universe yet"}
    
    cur.execute("SELECT username FROM leaderboard WHERE pattern=?", (pattern,))
    claimed = cur.fetchone()
    if claimed:
        con.close()
        return {"ok": False, "reason": "This name has already been claimed!"}

    cur.execute("INSERT INTO leaderboard (username, pattern, length, position, claimed_at) VALUES (?,?,?,?,?)",
                (username, pattern, len(pattern), row[0], int(time.time())))
    con.commit()
    con.close()
    return {"ok": True}

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")