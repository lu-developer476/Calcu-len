"""Minimal Vercel ASGI entrypoint.

Keeps the module surface tiny so Vercel's Python runtime detects only the FastAPI app.
"""

from api.index import app
