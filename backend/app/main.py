import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.seed_data import init_db
from app.services.live_simulator import live_simulator
from app.api.v1 import trains, control, simulation, metrics, websocket, railradar

# Auto-initialize DB on module load for serverless environments
try:
    init_db()
except Exception as e:
    print(f"[Init] Note on DB initialization: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize & Seed database
    init_db()
    
    # 2. Start background live train simulator task (for persistent server runtimes)
    simulator_task = asyncio.create_task(live_simulator.start())
    print("RAIL-CAST AI system initialized successfully.")
    
    yield
    
    # Shutdown
    live_simulator.stop()
    simulator_task.cancel()
    try:
        await simulator_task
    except asyncio.CancelledError:
        pass
    print("RAIL-CAST AI background services gracefully terminated.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Advanced AI-Powered Railway Real-Time ETA Prediction, Congestion & Delay Recovery Platform",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API and WebSocket routers
app.include_router(trains.router, prefix=settings.API_V1_STR, tags=["Trains"])
app.include_router(control.router, prefix=settings.API_V1_STR, tags=["Control Room"])
app.include_router(simulation.router, prefix=settings.API_V1_STR, tags=["Simulation"])
app.include_router(metrics.router, prefix=settings.API_V1_STR, tags=["Metrics"])
app.include_router(railradar.router, prefix=settings.API_V1_STR, tags=["RailRadar Real-Time API"])
app.include_router(websocket.router, tags=["WebSockets"])

@app.get("/", tags=["Health"])
@app.get("/api", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "ONLINE",
        "system": "RAIL-CAST AI",
        "version": settings.VERSION,
        "description": "Dynamic Railway ETA, Delay Recovery & Anomaly Intelligence",
        "docs_url": "/docs"
    }
