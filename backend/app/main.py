"""
Quantaneer Backend Server
AI-Based Interactive Quantum Algorithm Learning Platform (SIH26140)
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routes_quantum import router as quantum_router
from app.api.routes_labs import router as labs_router
from app.api.routes_learn import router as learn_router
from app.api.routes_practice import router as practice_router
from app.api.routes_ai import router as ai_router
from app.api.routes_progress import router as progress_router
from app.api.routes_instructor import router as instructor_router
from app.api.routes_auth import router as auth_router
from contextlib import asynccontextmanager
from app.core.db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Quantaneer Quantum Platform API",
    description="Backend for SIH26140: AI-Based Interactive Quantum Algorithm Learning Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers first
app.include_router(auth_router)
app.include_router(quantum_router)
app.include_router(labs_router)
app.include_router(learn_router)
app.include_router(practice_router)
app.include_router(ai_router)
app.include_router(progress_router)
app.include_router(instructor_router)

@app.get("/api/health")
def healthcheck():
    return {
        "status": "online",
        "platform": "Quantaneer QuantumLearn AI",
        "sih_ps": "SIH26140",
        "organization": "Egreen Quanta",
        "simulation_backend": "NumPy Statevector Engine (Mathematical Rigor)"
    }

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    from fastapi.responses import Response
    return Response(status_code=204)

# Mount static frontend production build if present
dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
