from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Train, TrainPosition
from app.services.railradar_service import railradar_service

router = APIRouter(prefix="/railradar", tags=["RailRadar Real-Time API"])

class RailRadarConfigPayload(BaseModel):
    api_key: Optional[str] = Field(None, description="RailRadar API Bearer Token (e.g. rr_live_...)")
    base_url: Optional[str] = Field(None, description="RailRadar API Base URL (defaults to https://api.railradar.in/v1)")

@router.get("/status")
async def get_railradar_status():
    """
    Checks connection status, latency, and authentication status against https://api.railradar.in/v1.
    """
    status = await railradar_service.check_connection()
    return status

@router.post("/config")
def update_railradar_config(payload: RailRadarConfigPayload):
    """
    Updates the RailRadar API key or base URL at runtime.
    """
    railradar_service.update_config(api_key=payload.api_key, base_url=payload.base_url)
    return {
        "status": "SUCCESS",
        "message": "RailRadar API configuration updated successfully.",
        "base_url": railradar_service.base_url,
        "has_api_key": bool(railradar_service.api_key)
    }

@router.get("/train/{train_number}/live")
async def get_railradar_live_train(train_number: str):
    """
    Fetches real-time train tracking data from RailRadar (https://api.railradar.in/v1/trains/{number}/live)
    and combines it with RAIL-CAST AI ML predictions (Dynamic ETA, Recovery Buffer, Calibrated Confidence, Anomaly Detection).
    """
    result = await railradar_service.get_live_train(train_number)
    return result

@router.get("/station/{station_code}/live")
async def get_railradar_live_station(
    station_code: str,
    hours: int = Query(4, ge=1, le=12, description="Time window in hours")
):
    """
    Fetches real-time station arrivals and departures from RailRadar (https://api.railradar.in/v1/stations/{code}/live).
    """
    result = await railradar_service.get_station_live(station_code, hours=hours)
    return result

@router.post("/sync")
async def sync_railradar_to_db(
    train_numbers: Optional[List[str]] = Body(None, description="List of train numbers to sync. If empty, syncs default fleet."),
    db: Session = Depends(get_db)
):
    """
    Synchronizes real-time live data from RailRadar into RAIL-CAST AI database.
    Updates train positions, current speeds, and delays so the interactive map and controller hub reflect live Indian Railways state.
    """
    if not train_numbers:
        active_trains = db.query(Train).filter(Train.is_active == True).all()
        train_numbers = [t.train_number for t in active_trains]

    synced_records = []
    for num in train_numbers:
        try:
            live_data = await railradar_service.get_live_train(num)
            if live_data and live_data.get("success"):
                telem = live_data.get("telemetry", {})
                next_stn = live_data.get("next_station", {})
                
                pos = db.query(TrainPosition).filter(TrainPosition.train_number == num).order_by(TrainPosition.timestamp.desc()).first()
                if pos:
                    pos.latitude = telem.get("latitude", pos.latitude)
                    pos.longitude = telem.get("longitude", pos.longitude)
                    pos.current_speed = telem.get("speed_kmh", pos.current_speed)
                    pos.delay_minutes = telem.get("delay_minutes", pos.delay_minutes)
                    pos.status = "DELAYED" if pos.delay_minutes >= 15 else "ON_TIME"
                    pos.next_station = next_stn.get("code", pos.next_station)
                    pos.eta_next_station = next_stn.get("expected_arrival", pos.eta_next_station)
                    db.commit()
                    
                    synced_records.append({
                        "train_number": num,
                        "updated": True,
                        "speed": pos.current_speed,
                        "delay": pos.delay_minutes,
                        "source": live_data.get("data_source")
                    })
        except Exception as e:
            print(f"Error syncing train {num}: {e}")

    return {
        "status": "SUCCESS",
        "synced_count": len(synced_records),
        "trains": synced_records
    }
