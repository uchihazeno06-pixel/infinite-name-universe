# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import generator

app = FastAPI()

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
    text = generator.chars_in_range(start, end)
    pos = text.find(name)
    
    if pos != -1:
        return {"found": True, "position": start + pos}
    return {"found": False}

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")