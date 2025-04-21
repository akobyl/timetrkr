from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "static")

app = FastAPI(title="TimeTrkr")


if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/api/hello")
async def root():
    return {"message": "Welcome to the TimeTrkr API"}


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend_app(full_path: str):
    index_path = os.path.join(FRONTEND_DIR, "index.html")

    if os.path.exists(index_path):
        return FileResponse(index_path)

    else:
        return HTTPException(status_code=500, detail="index file not found")
