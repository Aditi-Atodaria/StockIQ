#!/usr/bin/env python3
"""
StockIQ — Startup helper script.
Run this to start both backend and frontend together.

Usage:
    python start.py
"""

import subprocess
import sys
import os
from pathlib import Path

ROOT = Path(__file__).parent
BACKEND  = ROOT / "backend"
FRONTEND = ROOT / "frontend"

def main():
    print("=" * 60)
    print("  🚀 StockIQ — Stock Market Intelligence Platform")
    print("=" * 60)
    print()
    print("Starting services...")
    print()

    # Start FastAPI backend
    print("▶ Backend  →  http://localhost:8000")
    print("  API Docs  →  http://localhost:8000/docs")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
        cwd=str(BACKEND),
    )

    # Start Next.js frontend
    print()
    print("▶ Frontend →  http://localhost:3000")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(FRONTEND),
        shell=True,
    )

    print()
    print("✅ Both services running. Press Ctrl+C to stop.")
    print()

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\n🛑 Stopping services...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
