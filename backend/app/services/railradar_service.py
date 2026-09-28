import asyncio
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import httpx
from sqlalchemy.orm import Session
from app.config import settings
from app.ml.anomaly_detector import anomaly_detector
from app.ml.delay_recovery_model import delay_recovery_model
from app.ml.confidence_engine import confidence_engine

# Known Indian Railway Train Profiles for fallback/simulated mode
POPULAR_INDIAN_TRAINS = {
    "12628": {
        "name": "Karnataka Express",
        "origin": "SBC",
        "destination": "NDLS",
        "distance": 2404.0,
        "type": "SUPERFAST",
        "stations": [
            {"code": "SBC", "name": "KSR Bengaluru", "dist": 0.0, "lat": 12.9781, "lon": 77.5696, "sch_arr": "19:20", "sch_dep": "19:20", "platform": "1"},
            {"code": "BWT", "name": "Bangarapet", "dist": 70.0, "lat": 12.9972, "lon": 78.2045, "sch_arr": "20:20", "sch_dep": "20:22", "platform": "4"},
            {"code": "JTJ", "name": "Jolarpettai Jn", "dist": 144.0, "lat": 12.5658, "lon": 78.5833, "sch_arr": "21:38", "sch_dep": "21:40", "platform": "2"},
            {"code": "KPD", "name": "Katpadi Jn", "dist": 228.0, "lat": 12.9733, "lon": 79.1384, "sch_arr": "22:48", "sch_dep": "22:50", "platform": "2"},
            {"code": "MAS", "name": "MGR Chennai Central", "dist": 358.0, "lat": 13.0827, "lon": 80.2707, "sch_arr": "01:10", "sch_dep": "01:30", "platform": "5"},
            {"code": "BZA", "name": "Vijayawada Jn", "dist": 789.0, "lat": 16.5186, "lon": 80.6200, "sch_arr": "07:35", "sch_dep": "07:45", "platform": "1"},
            {"code": "NGP", "name": "Nagpur Jn", "dist": 1447.0, "lat": 21.1524, "lon": 79.0888, "sch_arr": "17:40", "sch_dep": "17:50", "platform": "3"},
            {"code": "BPL", "name": "Bhopal Jn", "dist": 1837.0, "lat": 23.2599, "lon": 77.4126, "sch_arr": "23:55", "sch_dep": "00:05", "platform": "2"},
            {"code": "GWL", "name": "Gwalior Jn", "dist": 2226.0, "lat": 26.2183, "lon": 78.1828, "sch_arr": "05:20", "sch_dep": "05:22", "platform": "4"},
            {"code": "AGC", "name": "Agra Cantt", "dist": 2345.0, "lat": 27.1592, "lon": 77.9944, "sch_arr": "07:05", "sch_dep": "07:10", "platform": "2"},
            {"code": "NDLS", "name": "New Delhi", "dist": 2540.0, "lat": 28.6431, "lon": 77.2197, "sch_arr": "10:30", "sch_dep": "10:30", "platform": "7"},
        ]
    },
    "12951": {
        "name": "Mumbai Tejas Rajdhani Express",
        "origin": "MMCT",
        "destination": "NDLS",
        "distance": 1386.0,
        "type": "RAJDHANI",
        "stations": [
            {"code": "MMCT", "name": "Mumbai Central", "dist": 0.0, "lat": 18.9696, "lon": 72.8193, "sch_arr": "17:00", "sch_dep": "17:00", "platform": "1"},
            {"code": "BVI", "name": "Borivali", "dist": 30.0, "lat": 19.2288, "lon": 72.8576, "sch_arr": "17:22", "sch_dep": "17:24", "platform": "6"},
            {"code": "ST", "name": "Surat", "dist": 263.0, "lat": 21.2049, "lon": 72.8407, "sch_arr": "19:43", "sch_dep": "19:48", "platform": "1"},
            {"code": "BRC", "name": "Vadodara Jn", "dist": 392.0, "lat": 22.3107, "lon": 73.1812, "sch_arr": "21:06", "sch_dep": "21:16", "platform": "2"},
            {"code": "RTM", "name": "Ratlam Jn", "dist": 652.0, "lat": 23.3441, "lon": 75.0352, "sch_arr": "00:25", "sch_dep": "00:28", "platform": "5"},
            {"code": "KOTA", "name": "Kota Jn", "dist": 918.0, "lat": 25.2188, "lon": 75.8648, "sch_arr": "03:15", "sch_dep": "03:20", "platform": "1"},
            {"code": "MTJ", "name": "Mathura Jn", "dist": 1242.0, "lat": 27.4924, "lon": 77.6737, "sch_arr": "06:38", "sch_dep": "06:40", "platform": "3"},
            {"code": "NDLS", "name": "New Delhi", "dist": 1386.0, "lat": 28.6431, "lon": 77.2197, "sch_arr": "08:32", "sch_dep": "08:32", "platform": "2"},
        ]
    },
    "22436": {
        "name": "Vande Bharat Express (NDLS-BSB)",
        "origin": "NDLS",
        "destination": "BSB",
        "distance": 759.0,
        "type": "VANDE_BHARAT",
        "stations": [
            {"code": "NDLS", "name": "New Delhi", "dist": 0.0, "lat": 28.6431, "lon": 77.2197, "sch_arr": "06:00", "sch_dep": "06:00", "platform": "16"},
            {"code": "CNB", "name": "Kanpur Central", "dist": 440.0, "lat": 26.4547, "lon": 80.3507, "sch_arr": "10:08", "sch_dep": "10:10", "platform": "1"},
            {"code": "PRYJ", "name": "Prayagraj Jn", "dist": 634.0, "lat": 25.4439, "lon": 81.8258, "sch_arr": "12:08", "sch_dep": "12:10", "platform": "6"},
            {"code": "BSB", "name": "Varanasi Jn", "dist": 759.0, "lat": 25.3268, "lon": 82.9873, "sch_arr": "14:00", "sch_dep": "14:00", "platform": "1"},
        ]
    },
    "12002": {
        "name": "Bhopal Shatabdi Express",
        "origin": "NDLS",
        "destination": "RKMP",
        "distance": 708.0,
        "type": "SHATABDI",
        "stations": [
            {"code": "NDLS", "name": "New Delhi", "dist": 0.0, "lat": 28.6431, "lon": 77.2197, "sch_arr": "06:00", "sch_dep": "06:00", "platform": "1"},
            {"code": "MTJ", "name": "Mathura Jn", "dist": 141.0, "lat": 27.4924, "lon": 77.6737, "sch_arr": "07:19", "sch_dep": "07:20", "platform": "1"},
            {"code": "AGC", "name": "Agra Cantt", "dist": 195.0, "lat": 27.1592, "lon": 77.9944, "sch_arr": "07:50", "sch_dep": "07:55", "platform": "1"},
            {"code": "GWL", "name": "Gwalior Jn", "dist": 314.0, "lat": 26.2183, "lon": 78.1828, "sch_arr": "09:23", "sch_dep": "09:28", "platform": "2"},
            {"code": "VGLB", "name": "VGL Jhansi Jn", "dist": 411.0, "lat": 25.4484, "lon": 78.5685, "sch_arr": "10:45", "sch_dep": "10:50", "platform": "1"},
            {"code": "BPL", "name": "Bhopal Jn", "dist": 701.0, "lat": 23.2599, "lon": 77.4126, "sch_arr": "14:07", "sch_dep": "14:12", "platform": "1"},
            {"code": "RKMP", "name": "Rani Kamlapati", "dist": 708.0, "lat": 23.2081, "lon": 77.4372, "sch_arr": "14:40", "sch_dep": "14:40", "platform": "2"},
        ]
    },
    "12301": {
        "name": "Howrah Rajdhani Express",
        "origin": "HWH",
        "destination": "NDLS",
        "distance": 1451.0,
        "type": "RAJDHANI",
        "stations": [
            {"code": "HWH", "name": "Howrah Jn", "dist": 0.0, "lat": 22.5838, "lon": 88.3432, "sch_arr": "16:50", "sch_dep": "16:50", "platform": "9"},
            {"code": "ASN", "name": "Asansol Jn", "dist": 200.0, "lat": 23.6845, "lon": 86.9746, "sch_arr": "18:57", "sch_dep": "19:00", "platform": "4"},
            {"code": "DHN", "name": "Dhanbad Jn", "dist": 259.0, "lat": 23.7915, "lon": 86.4304, "sch_arr": "19:50", "sch_dep": "19:55", "platform": "3"},
            {"code": "GAYA", "name": "Gaya Jn", "dist": 458.0, "lat": 24.7955, "lon": 85.0002, "sch_arr": "22:19", "sch_dep": "22:22", "platform": "1"},
            {"code": "DDU", "name": "Pt Deen Dayal Upadhyaya", "dist": 663.0, "lat": 25.2818, "lon": 83.1165, "sch_arr": "00:45", "sch_dep": "00:55", "platform": "6"},
            {"code": "PRYJ", "name": "Prayagraj Jn", "dist": 816.0, "lat": 25.4439, "lon": 81.8258, "sch_arr": "02:33", "sch_dep": "02:35", "platform": "1"},
            {"code": "CNB", "name": "Kanpur Central", "dist": 1010.0, "lat": 26.4547, "lon": 80.3507, "sch_arr": "04:40", "sch_dep": "04:45", "platform": "1"},
            {"code": "NDLS", "name": "New Delhi", "dist": 1451.0, "lat": 28.6431, "lon": 77.2197, "sch_arr": "10:05", "sch_dep": "10:05", "platform": "3"},
        ]
    },
    "12919": {
        "name": "Malwa Express",
        "origin": "DADN",
        "destination": "SVDK",
        "distance": 1640.0,
        "type": "EXPRESS",
        "stations": [
            {"code": "INDB", "name": "Indore Jn", "dist": 21.0, "lat": 22.7196, "lon": 75.8677, "sch_arr": "12:15", "sch_dep": "12:25", "platform": "4"},
            {"code": "UJN", "name": "Ujjain Jn", "dist": 100.0, "lat": 23.1828, "lon": 75.7772, "sch_arr": "13:50", "sch_dep": "14:05", "platform": "1"},
            {"code": "BPL", "name": "Bhopal Jn", "dist": 283.0, "lat": 23.2599, "lon": 77.4126, "sch_arr": "17:25", "sch_dep": "17:35", "platform": "3"},
            {"code": "VGLB", "name": "VGL Jhansi Jn", "dist": 575.0, "lat": 25.4484, "lon": 78.5685, "sch_arr": "21:30", "sch_dep": "21:38", "platform": "4"},
            {"code": "AGC", "name": "Agra Cantt", "dist": 791.0, "lat": 27.1592, "lon": 77.9944, "sch_arr": "00:50", "sch_dep": "00:55", "platform": "2"},
            {"code": "NDLS", "name": "New Delhi", "dist": 986.0, "lat": 28.6431, "lon": 77.2197, "sch_arr": "04:15", "sch_dep": "04:30", "platform": "5"},
            {"code": "UMB", "name": "Ambala Cant Jn", "dist": 1184.0, "lat": 30.3600, "lon": 76.8300, "sch_arr": "07:35", "sch_dep": "07:43", "platform": "6"},
            {"code": "LDH", "name": "Ludhiana Jn", "dist": 1298.0, "lat": 30.9010, "lon": 75.8573, "sch_arr": "09:40", "sch_dep": "09:50", "platform": "3"},
            {"code": "JAT", "name": "Jammu Tawi", "dist": 1562.0, "lat": 32.7060, "lon": 74.8770, "sch_arr": "14:15", "sch_dep": "14:25", "platform": "1"},
            {"code": "SVDK", "name": "Shri Mata Vaishno Devi Katra", "dist": 1640.0, "lat": 32.9900, "lon": 74.9500, "sch_arr": "16:30", "sch_dep": "16:30", "platform": "2"},
        ]
    }
}

class RailRadarService:
    def __init__(self):
        self.base_url = settings.RAILRADAR_BASE_URL.rstrip("/")
        self.api_key = settings.RAILRADAR_API_KEY
        self.timeout = settings.RAILRADAR_TIMEOUT_SECONDS
        self._last_status_cache: Optional[Dict[str, Any]] = None
        self._last_status_time: float = 0.0

    def update_config(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        if api_key is not None:
            self.api_key = api_key.strip()
        if base_url is not None:
            self.base_url = base_url.rstrip("/")
        # Invalidate status cache
        self._last_status_cache = None

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/json",
            "User-Agent": "RAIL-CAST-AI-Platform/2.0"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            headers["x-api-key"] = self.api_key
        return headers

    async def check_connection(self) -> Dict[str, Any]:
        """
        Tests connectivity to https://api.railradar.in/v1, validates API key, and measures latency.
        """
        now = time.time()
        if self._last_status_cache and (now - self._last_status_time) < 10.0:
            return self._last_status_cache

        start_t = time.time()
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Test with a known train query
                test_url = f"{self.base_url}/trains/12628/live"
                headers = self._get_headers()
                resp = await client.get(test_url, headers=headers)
                latency_ms = round((time.time() - start_t) * 1000, 1)

                if resp.status_code == 200:
                    status_info = {
                        "status": "CONNECTED",
                        "base_url": self.base_url,
                        "has_api_key": bool(self.api_key),
                        "valid_key": True,
                        "latency_ms": latency_ms,
                        "message": "Connected to RailRadar Live REST API v1. Streaming real-time data.",
                        "upstream_available": True
                    }
                elif resp.status_code == 401:
                    data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                    err_msg = data.get("error", {}).get("message", "API Key is required or invalid")
                    status_info = {
                        "status": "UNAUTHORIZED",
                        "base_url": self.base_url,
                        "has_api_key": bool(self.api_key),
                        "valid_key": False,
                        "latency_ms": latency_ms,
                        "message": f"RailRadar returned 401 ({err_msg}). Configure a valid API key to stream live telemetry.",
                        "upstream_available": False
                    }
                else:
                    status_info = {
                        "status": f"HTTP_{resp.status_code}",
                        "base_url": self.base_url,
                        "has_api_key": bool(self.api_key),
                        "valid_key": False,
                        "latency_ms": latency_ms,
                        "message": f"RailRadar responded with status {resp.status_code}",
                        "upstream_available": False
                    }
        except httpx.RequestError as e:
            latency_ms = round((time.time() - start_t) * 1000, 1)
            status_info = {
                "status": "OFFLINE",
                "base_url": self.base_url,
                "has_api_key": bool(self.api_key),
                "valid_key": False,
                "latency_ms": latency_ms,
                "message": f"Could not connect to RailRadar endpoint: {str(e)}",
                "upstream_available": False
            }

        self._last_status_cache = status_info
        self._last_status_time = now
        return status_info

    async def get_live_train(self, train_number: str) -> Dict[str, Any]:
        """
        Fetches live train running status from RailRadar REST API.
        If API key is valid, upstream data is processed and enriched with RAIL-CAST AI intelligence.
        If unauthorized or unavailable, a realistic fallback with full AI models is generated.
        """
        clean_num = str(train_number).strip()
        headers = self._get_headers()
        upstream_data = None
        upstream_success = False

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.base_url}/trains/{clean_num}/live"
                params = {
                    "includeCoordinates": "true",
                    "geometry": "true",
                    "format": "geojson"
                }
                resp = await client.get(url, headers=headers, params=params)

                if resp.status_code == 200:
                    body = resp.json()
                    if body.get("success") and "data" in body:
                        upstream_data = body["data"]
                        upstream_success = True
                elif resp.status_code == 404:
                    # Train not found on RailRadar
                    pass
        except Exception as e:
            print(f"[RailRadarService] Upstream fetch notice for train {clean_num}: {e}")

        # If upstream succeeded, adapt to RAIL-CAST AI model
        if upstream_success and upstream_data:
            return self._enrich_upstream_data(clean_num, upstream_data)

        # Fallback realistic simulator / timetable data
        return self._generate_simulated_realtime_data(clean_num)

    def _enrich_upstream_data(self, train_number: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enriches genuine upstream RailRadar live data with RAIL-CAST AI models:
        Dynamic Delay Recovery (C3), Calibrated Confidence Bounds (C5/C6), and Anomaly Detection (C4).
        """
        curr_loc = data.get("currentLocation", {})
        speed = float(curr_loc.get("speed", 85.0))
        lat = float(curr_loc.get("latitude", 0.0))
        lon = float(curr_loc.get("longitude", 0.0))
        bearing = float(curr_loc.get("bearing", 0.0))
        progress = float(curr_loc.get("segmentProgress", 0.5))
        delay_min = float(data.get("delayMinutes", 0.0))
        train_name = data.get("trainName", f"Train {train_number}")
        next_halt = data.get("nextHaltingStation", {})

        # Natural buffer recovery calculation (C3: models natural slack absorption over high-speed section)
        buffer_slack = max(4.0, (90.0 / 100.0) * 8.0)
        recovered_min = min(delay_min, round(buffer_slack * 0.45 * (speed / 100.0), 1)) if delay_min > 0 else 0.0
        net_delay = max(0.0, delay_min - recovered_min)

        # Confidence bounds & calibration
        conf_bounds = confidence_engine.calculate_confidence_bounds(
            predicted_travel_time_min=max(15.0, net_delay),
            distance_remaining_km=150.0,
            congestion_score=0.25,
            weather_condition="CLEAR"
        )
        anomaly_res = anomaly_detector.evaluate_telemetry(
            current_speed=speed,
            previous_speed=speed,
            is_at_station=(speed < 1.0),
            dwell_time_min=0.0,
            scheduled_dwell_min=2.0,
            max_permissible_speed=130.0
        )

        return {
            "success": True,
            "train_number": train_number,
            "train_name": train_name,
            "data_source": "RAILRADAR_LIVE_API_V1",
            "is_live_upstream": True,
            "last_updated": data.get("lastUpdatedAt", datetime.now(timezone.utc).isoformat()),
            "status": "RUNNING" if speed > 5 else "HALTED" if speed == 0 else "SLOW",
            "telemetry": {
                "latitude": lat,
                "longitude": lon,
                "speed_kmh": round(speed, 1),
                "bearing": bearing,
                "segment_progress_percent": round(progress * 100, 1),
                "delay_minutes": round(delay_min, 1)
            },
            "next_station": {
                "code": next_halt.get("code", "N/A"),
                "name": next_halt.get("name", "Upcoming Station"),
                "distance_km": next_halt.get("distance", 0.0),
                "scheduled_arrival": next_halt.get("scheduledArrival", "N/A"),
                "expected_arrival": next_halt.get("expectedArrival", "N/A"),
                "platform": next_halt.get("platform", "1")
            },
            "ai_intelligence": {
                "natural_recovery_minutes": round(recovered_min, 1),
                "projected_net_delay_minutes": round(net_delay, 1),
                "confidence_score": conf_bounds.get("confidence_percentage", 94.2),
                "bounds": {
                    "p10_optimistic_min": conf_bounds.get("p10_minutes", round(net_delay - 2, 1)),
                    "p50_expected_min": conf_bounds.get("p50_minutes", round(net_delay, 1)),
                    "p90_conservative_min": conf_bounds.get("p90_minutes", round(net_delay + 4, 1))
                },
                "anomaly": {
                    "is_anomaly": anomaly_res.get("is_anomaly", False),
                    "anomaly_type": anomaly_res.get("type", "NONE"),
                    "severity": anomaly_res.get("severity", "LOW")
                }
            },
            "stops": data.get("stops", [])
        }

    def _generate_simulated_realtime_data(self, train_number: str) -> Dict[str, Any]:
        """
        High-fidelity realistic fallback that computes dynamic real-world train tracking
        for any Indian Railways train when upstream API is in preview / mock mode.
        """
        profile = POPULAR_INDIAN_TRAINS.get(train_number, {
            "name": f"Express Special ({train_number})",
            "origin": "NDLS",
            "destination": "BPL",
            "distance": 707.0,
            "type": "SUPERFAST",
            "stations": [
                {"code": "NDLS", "name": "New Delhi", "dist": 0.0, "lat": 28.6431, "lon": 77.2197, "sch_arr": "06:00", "sch_dep": "06:00", "platform": "1"},
                {"code": "MTJ", "name": "Mathura Jn", "dist": 141.0, "lat": 27.4924, "lon": 77.6737, "sch_arr": "07:30", "sch_dep": "07:32", "platform": "2"},
                {"code": "AGC", "name": "Agra Cantt", "dist": 195.0, "lat": 27.1592, "lon": 77.9944, "sch_arr": "08:15", "sch_dep": "08:20", "platform": "1"},
                {"code": "GWL", "name": "Gwalior Jn", "dist": 314.0, "lat": 26.2183, "lon": 78.1828, "sch_arr": "10:05", "sch_dep": "10:10", "platform": "3"},
                {"code": "BPL", "name": "Bhopal Jn", "dist": 707.0, "lat": 23.2599, "lon": 77.4126, "sch_arr": "14:40", "sch_dep": "14:40", "platform": "2"},
            ]
        })

        stations = profile["stations"]
        total_dist = profile["distance"]

        # Calculate a realistic progress based on current system time
        now_dt = datetime.now()
        minute_of_day = now_dt.hour * 60 + now_dt.minute
        progress_ratio = ((minute_of_day * 7 + int(train_number[-2:] if train_number[-2:].isdigit() else "10")) % 1000) / 1000.0
        covered_dist = progress_ratio * total_dist

        # Locate segment
        prev_stn = stations[0]
        next_stn = stations[-1]
        for i in range(len(stations) - 1):
            if stations[i]["dist"] <= covered_dist <= stations[i+1]["dist"]:
                prev_stn = stations[i]
                next_stn = stations[i+1]
                break

        seg_dist = max(1.0, next_stn["dist"] - prev_stn["dist"])
        seg_progress = min(1.0, max(0.0, (covered_dist - prev_stn["dist"]) / seg_dist))

        # Interpolate GPS coordinates
        cur_lat = prev_stn["lat"] + seg_progress * (next_stn["lat"] - prev_stn["lat"])
        cur_lon = prev_stn["lon"] + seg_progress * (next_stn["lon"] - prev_stn["lon"])
        speed = 92.5 if 0.1 < seg_progress < 0.9 else 45.0
        delay_min = 12.0 if train_number == "12628" else 4.0 if train_number == "12951" else 8.0

        # AI Delay Recovery
        buffer_slack = max(4.0, (seg_dist / 100.0) * 8.0)
        recovered_min = min(delay_min, round(buffer_slack * 0.45 * (speed / 100.0), 1)) if delay_min > 0 else 0.0
        net_delay = max(0.0, delay_min - recovered_min)

        # Confidence bounds & calibration
        conf_bounds = confidence_engine.calculate_confidence_bounds(
            predicted_travel_time_min=max(15.0, net_delay),
            distance_remaining_km=max(20.0, total_dist - covered_dist),
            congestion_score=0.25,
            weather_condition="CLEAR"
        )
        anomaly_res = anomaly_detector.evaluate_telemetry(
            current_speed=speed,
            previous_speed=speed,
            is_at_station=(speed < 1.0),
            dwell_time_min=0.0,
            scheduled_dwell_min=2.0,
            max_permissible_speed=130.0
        )

        stops = []
        for s in stations:
            is_passed = s["dist"] < covered_dist
            stops.append({
                "code": s["code"],
                "name": s["name"],
                "scheduled_arrival": s["sch_arr"],
                "actual_arrival": s["sch_arr"],
                "delay_minutes": round(delay_min if not is_passed else 0.0, 1),
                "platform": s.get("platform", "1"),
                "has_departed": is_passed,
                "coordinates": [s["lat"], s["lon"]]
            })

        return {
            "success": True,
            "train_number": train_number,
            "train_name": profile["name"],
            "data_source": "RAILRADAR_HYBRID_ENGINE",
            "is_live_upstream": False,
            "note": "Preview telemetry active. Enter your RailRadar API Key in header settings to connect upstream live feed.",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "status": "RUNNING",
            "telemetry": {
                "latitude": round(cur_lat, 5),
                "longitude": round(cur_lon, 5),
                "speed_kmh": round(speed, 1),
                "bearing": 180.0,
                "segment_progress_percent": round(seg_progress * 100, 1),
                "delay_minutes": round(delay_min, 1)
            },
            "next_station": {
                "code": next_stn["code"],
                "name": next_stn["name"],
                "distance_km": round(next_stn["dist"] - covered_dist, 1),
                "scheduled_arrival": next_stn["sch_arr"],
                "expected_arrival": next_stn["sch_arr"],
                "platform": next_stn.get("platform", "1")
            },
            "ai_intelligence": {
                "natural_recovery_minutes": round(recovered_min, 1),
                "projected_net_delay_minutes": round(net_delay, 1),
                "confidence_score": conf_bounds.get("confidence_percentage", 93.5),
                "bounds": {
                    "p10_optimistic_min": conf_bounds.get("p10_minutes", round(net_delay - 1.5, 1)),
                    "p50_expected_min": conf_bounds.get("p50_minutes", round(net_delay, 1)),
                    "p90_conservative_min": conf_bounds.get("p90_minutes", round(net_delay + 3.5, 1))
                },
                "anomaly": {
                    "is_anomaly": anomaly_res.get("is_anomaly", False),
                    "anomaly_type": anomaly_res.get("type", "NONE"),
                    "severity": anomaly_res.get("severity", "LOW")
                }
            },
            "stops": stops
        }


    async def get_station_live(self, station_code: str, hours: int = 4) -> Dict[str, Any]:
        """
        Fetches live station arrivals/departures board from RailRadar API.
        """
        clean_code = str(station_code).upper().strip()
        headers = self._get_headers()

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.base_url}/stations/{clean_code}/live"
                params = {"hours": hours}
                resp = await client.get(url, headers=headers, params=params)

                if resp.status_code == 200:
                    body = resp.json()
                    if body.get("success") and "data" in body:
                        return {
                            "success": True,
                            "station_code": clean_code,
                            "is_live_upstream": True,
                            "data": body["data"]
                        }
        except Exception as e:
            print(f"[RailRadarService] Live station fetch notice: {e}")

        # Fallback Station Board for major stations
        return self._generate_station_fallback_board(clean_code)

    def _generate_station_fallback_board(self, station_code: str) -> Dict[str, Any]:
        sample_arrivals = [
            {"train_number": "12628", "name": "Karnataka Express", "origin": "SBC", "scheduled_time": "10:30", "expected_time": "10:48", "delay": 18, "platform": "7", "status": "DELAYED"},
            {"train_number": "12951", "name": "Mumbai Tejas Rajdhani", "origin": "MMCT", "scheduled_time": "08:32", "expected_time": "08:35", "delay": 3, "platform": "2", "status": "ON_TIME"},
            {"train_number": "22436", "name": "Vande Bharat Express", "origin": "BSB", "scheduled_time": "14:00", "expected_time": "14:00", "delay": 0, "platform": "16", "status": "ON_TIME"},
            {"train_number": "12301", "name": "Howrah Rajdhani", "origin": "HWH", "scheduled_time": "10:05", "expected_time": "10:15", "delay": 10, "platform": "3", "status": "MODERATE_DELAY"},
            {"train_number": "12002", "name": "Bhopal Shatabdi", "origin": "RKMP", "scheduled_time": "14:40", "expected_time": "14:47", "delay": 7, "platform": "1", "status": "SLIGHT_DELAY"}
        ]
        return {
            "success": True,
            "station_code": station_code,
            "station_name": f"{station_code} Railway Station",
            "is_live_upstream": False,
            "note": "Preview station board active. Configure RailRadar API Key for live upstream schedule board.",
            "arrivals": sample_arrivals,
            "departures": sample_arrivals
        }

# Global singleton
railradar_service = RailRadarService()
