from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, auth, documents,search,chat



def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Secure Document Intelligence Platform",
        description="Upload, analyze, search, and chat with your documents using local AI.",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:5174"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(documents.router)
    app.include_router(search.router)
    app.include_router(chat.router)

    return app


app = create_app()