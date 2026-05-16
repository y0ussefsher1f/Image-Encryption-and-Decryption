"""
main.py - FastAPI Application Entry Point
==========================================
This is the root of the backend server.
It configures CORS (so the React frontend can talk to it)
and registers all the route modules.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import our routers (route groups)
from app.routers import encryption, analytics

# Create the FastAPI app instance
app = FastAPI(
    title="Image Encryption API",
    description="Backend API for XOR and AES-256 image encryption/decryption",
    version="1.0.0",
)

# ─── CORS Configuration ───────────────────────────────────────────────────────
# This allows our React frontend (running on localhost:5173) to make API calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routers ─────────────────────────────────────────────────────────
app.include_router(encryption.router, prefix="/api/encryption", tags=["Encryption"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "online", "message": "Image Encryption API is running"}


@app.get("/api/health")
def health():
    """Detailed health check."""
    return {"status": "healthy", "version": "1.0.0"}
