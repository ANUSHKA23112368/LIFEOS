from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import connect_to_database, close_database
from app.api import (
    auth,
    activities,
    tasks,
    focus,
    habits,
    goals,
    reviews,
    analytics,
    ai,
    reports,
    settings as settings_api,
    demo
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_database()
    yield
    # Shutdown
    await close_database()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="LIFEOS — Personal Life Intelligence and Continuous Improvement System REST API",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(focus.router, prefix="/api")
app.include_router(habits.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(settings_api.router, prefix="/api")
app.include_router(demo.router, prefix="/api")

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "LIFEOS API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.get("/api", tags=["Root"])
async def root():
    return {
        "message": "Welcome to LIFEOS API — Your Personal Life Intelligence System",
        "docs_url": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
