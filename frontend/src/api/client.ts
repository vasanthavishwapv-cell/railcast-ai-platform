import axios from 'axios';
import {
  TrainSummary,
  TrainETAResponse,
  ExplanationResponse,
  NetworkStatus,
  RouteSectionRisk,
  AlertItem,
  WhatIfResponse,
  ModelMetricItem,
  RailRadarStatus,
  RailRadarLiveTrain,
  RailRadarStationLive
} from '../types';

// Fallback Mock Data for standalone Vercel preview or backend warmup
const FALLBACK_TRAINS: TrainSummary[] = [
  {
    train_number: "12628",
    name: "Karnataka Express",
    train_type: "SUPERFAST",
    origin_station: "SBC",
    destination_station: "NDLS",
    priority_level: 1,
    total_distance_km: 2404,
    scheduled_departure: "19:20",
    scheduled_arrival: "09:00",
    current_speed: 104.5,
    delay_minutes: 18.0,
    status: "DELAYED",
    next_station: "KPD",
    eta_next_station: "21:40",
    risk_level: "MODERATE",
    latitude: 12.9716,
    longitude: 77.5946
  },
  {
    train_number: "12951",
    name: "Mumbai Tejas Rajdhani Express",
    train_type: "RAJDHANI",
    origin_station: "MMCT",
    destination_station: "NDLS",
    priority_level: 1,
    total_distance_km: 1384,
    scheduled_departure: "17:00",
    scheduled_arrival: "08:32",
    current_speed: 128.0,
    delay_minutes: 3.0,
    status: "ON_TIME",
    next_station: "BVI",
    eta_next_station: "17:35",
    risk_level: "LOW",
    latitude: 18.9696,
    longitude: 72.8193
  },
  {
    train_number: "22436",
    name: "Vande Bharat Express",
    train_type: "VANDE_BHARAT",
    origin_station: "NDLS",
    destination_station: "BSB",
    priority_level: 1,
    total_distance_km: 759,
    scheduled_departure: "06:00",
    scheduled_arrival: "14:00",
    current_speed: 130.0,
    delay_minutes: 0.0,
    status: "ON_TIME",
    next_station: "CNB",
    eta_next_station: "10:10",
    risk_level: "LOW",
    latitude: 28.6139,
    longitude: 77.2090
  },
  {
    train_number: "12002",
    name: "Bhopal Shatabdi Express",
    train_type: "SHATABDI",
    origin_station: "NDLS",
    destination_station: "RKMP",
    priority_level: 2,
    total_distance_km: 708,
    scheduled_departure: "06:00",
    scheduled_arrival: "14:40",
    current_speed: 118.0,
    delay_minutes: 7.0,
    status: "DELAYED",
    next_station: "AGC",
    eta_next_station: "07:50",
    risk_level: "LOW",
    latitude: 27.1767,
    longitude: 78.0081
  },
  {
    train_number: "12301",
    name: "Howrah Rajdhani Express",
    train_type: "RAJDHANI",
    origin_station: "HWH",
    destination_station: "NDLS",
    priority_level: 1,
    total_distance_km: 1451,
    scheduled_departure: "16:50",
    scheduled_arrival: "10:05",
    current_speed: 110.0,
    delay_minutes: 12.0,
    status: "DELAYED",
    next_station: "ASN",
    eta_next_station: "19:15",
    risk_level: "MODERATE",
    latitude: 22.5857,
    longitude: 88.3426
  },
  {
    train_number: "12626",
    name: "Kerala Express",
    train_type: "SUPERFAST",
    origin_station: "NDLS",
    destination_station: "TVC",
    priority_level: 2,
    total_distance_km: 3030,
    scheduled_departure: "20:10",
    scheduled_arrival: "18:00",
    current_speed: 85.0,
    delay_minutes: 28.0,
    status: "CRITICAL_DELAY",
    next_station: "GWL",
    eta_next_station: "01:25",
    risk_level: "CRITICAL",
    latitude: 26.2183,
    longitude: 78.1828
  }
];

export const getApiBaseUrl = (): string => {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('RAILCAST_API_URL') : null;
  if (stored) return stored;
  
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Relative '/api' works seamlessly on Vercel and via Vite dev proxy
  return '/api';
};

export const setCustomApiUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    if (url.trim()) {
      localStorage.setItem('RAILCAST_API_URL', url.trim());
    } else {
      localStorage.removeItem('RAILCAST_API_URL');
    }
  }
};

const createClient = () => {
  return axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 8000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const api = {
  // Trains
  getTrains: async (): Promise<TrainSummary[]> => {
    try {
      const client = createClient();
      const res = await client.get<TrainSummary[]>('/trains');
      return res.data;
    } catch (e) {
      console.warn('[API] getTrains fallback mode:', e);
      return FALLBACK_TRAINS;
    }
  },

  getTrainDetails: async (trainNumber: string) => {
    try {
      const client = createClient();
      const res = await client.get(`/train/${trainNumber}`);
      return res.data;
    } catch (e) {
      const match = FALLBACK_TRAINS.find(t => t.train_number === trainNumber) || FALLBACK_TRAINS[0];
      return match;
    }
  },

  getTrainETA: async (trainNumber: string): Promise<TrainETAResponse> => {
    try {
      const client = createClient();
      const res = await client.get<TrainETAResponse>(`/train/${trainNumber}/eta`);
      return res.data;
    } catch (e) {
      console.warn('[API] getTrainETA fallback mode for train:', trainNumber);
      return {
        train_number: trainNumber,
        train_name: trainNumber === "12628" ? "Karnataka Express" : "Vande Bharat Express",
        current_station: "SBC",
        next_station: "KPD",
        current_delay_minutes: 18.0,
        total_recovered_minutes: 7.8,
        final_destination_eta: "12:22",
        final_destination_scheduled: "12:30",
        overall_confidence_percentage: 92.4,
        active_weather_condition: "CLEAR",
        upcoming_stations: [
          {
            station_code: "KPD",
            station_name: "Katpadi Junction",
            distance_from_origin_km: 215,
            scheduled_arrival: "21:45",
            predicted_eta: "21:55",
            delay_minutes: 10.0,
            natural_recovery_minutes: 8.0,
            confidence_percentage: 95.0,
            confidence_window_p10_p90: "21:51 - 22:00",
            status: "RECOVERING"
          },
          {
            station_code: "RU",
            station_name: "Renigunta Junction",
            distance_from_origin_km: 330,
            scheduled_arrival: "23:55",
            predicted_eta: "00:02",
            delay_minutes: 7.0,
            natural_recovery_minutes: 3.0,
            confidence_percentage: 91.5,
            confidence_window_p10_p90: "23:57 - 00:08",
            status: "RECOVERING"
          },
          {
            station_code: "BZA",
            station_name: "Vijayawada Junction",
            distance_from_origin_km: 710,
            scheduled_arrival: "05:40",
            predicted_eta: "05:44",
            delay_minutes: 4.0,
            natural_recovery_minutes: 3.0,
            confidence_percentage: 88.0,
            confidence_window_p10_p90: "05:37 - 05:52",
            status: "ON_TIME"
          },
          {
            station_code: "BPQ",
            station_name: "Balharshah",
            distance_from_origin_km: 1160,
            scheduled_arrival: "12:30",
            predicted_eta: "12:22",
            delay_minutes: -8.0,
            natural_recovery_minutes: 12.0,
            confidence_percentage: 84.5,
            confidence_window_p10_p90: "12:12 - 12:34",
            status: "ON_TIME"
          }
        ]
      };
    }
  },

  getTrainExplanation: async (trainNumber: string): Promise<ExplanationResponse> => {
    try {
      const client = createClient();
      const res = await client.get<ExplanationResponse>(`/train/${trainNumber}/explanation`);
      return res.data;
    } catch (e) {
      return {
        train_number: trainNumber,
        prediction_time: new Date().toISOString(),
        base_travel_time_minutes: 1440,
        predicted_travel_time_minutes: 1448,
        net_impact_minutes: 8,
        natural_recovery_minutes: 7.8,
        explanation: {
          contributing_factors: [
            {
              rank: 1,
              feature: "current_delay_propagation",
              category: "DISPATCH",
              impact_minutes: 9.4,
              contribution_percent: 25.2,
              explanation: "Residual propagation from current delay"
            },
            {
              rank: 2,
              feature: "natural_slack_recovery",
              category: "AI_RECOVERY",
              impact_minutes: -8.6,
              contribution_percent: 22.8,
              explanation: "AI-modeled recovery capacity across high-speed buffer segments"
            },
            {
              rank: 3,
              feature: "junction_turnaround_dwell",
              category: "CONGESTION",
              impact_minutes: 4.2,
              contribution_percent: 14.5,
              explanation: "Elevated platform occupancy at upcoming junction"
            },
            {
              rank: 4,
              feature: "weather_visibility_clear",
              category: "ENVIRONMENT",
              impact_minutes: -1.2,
              contribution_percent: 8.0,
              explanation: "Optimal weather conditions along corridor"
            }
          ],
          summary: "ETA dynamically calculated by XGBoost + GradientBoosting. RAIL-CAST AI predicts 7.8 minutes of natural buffer absorption in downstream high-speed segments."
        }
      };
    }
  },

  injectAnomaly: async (trainNumber: string, anomalyType: string, durationSec: number = 60) => {
    const client = createClient();
    const res = await client.post(`/train/${trainNumber}/inject-anomaly?anomaly_type=${anomalyType}&duration_sec=${durationSec}`);
    return res.data;
  },

  clearAnomaly: async (trainNumber: string) => {
    const client = createClient();
    const res = await client.post(`/train/${trainNumber}/clear-anomaly`);
    return res.data;
  },

  // Control Room
  getNetworkStatus: async (): Promise<NetworkStatus> => {
    try {
      const client = createClient();
      const res = await client.get<NetworkStatus>('/control/network-status');
      return res.data;
    } catch (e) {
      return {
        total_active_trains: 6,
        on_time_trains: 4,
        delayed_trains: 1,
        critical_delayed_trains: 1,
        network_punctuality_rate: 83.3,
        active_alerts_count: 2,
        avg_network_speed_kmh: 112.4,
        highest_congestion_section: "SEC-SBC-KPD",
        system_health: "OPTIMAL"
      };
    }
  },

  getRiskMap: async (): Promise<{ sections: RouteSectionRisk[]; summary: any }> => {
    try {
      const client = createClient();
      const res = await client.get('/control/risk-map');
      return res.data;
    } catch (e) {
      return {
        sections: [
          {
            section_id: "SEC-SBC-KPD",
            corridor_name: "Southern Trunk Corridor",
            from_station: "SBC",
            to_station: "KPD",
            distance_km: 215.0,
            max_speed_kmh: 110.0,
            congestion_score: 0.42,
            risk_level: "MODERATE",
            active_trains: 2,
            signalling: "AUTOMATIC_BLOCK"
          },
          {
            section_id: "SEC-KPD-RU",
            corridor_name: "Southern Trunk Corridor",
            from_station: "KPD",
            to_station: "RU",
            distance_km: 115.0,
            max_speed_kmh: 130.0,
            congestion_score: 0.18,
            risk_level: "LOW",
            active_trains: 1,
            signalling: "AUTOMATIC_BLOCK"
          },
          {
            section_id: "SEC-MMCT-BVI",
            corridor_name: "Western High-Density Corridor",
            from_station: "MMCT",
            to_station: "BVI",
            distance_km: 30.0,
            max_speed_kmh: 100.0,
            congestion_score: 0.65,
            risk_level: "HIGH",
            active_trains: 3,
            signalling: "AUTOMATIC_BLOCK"
          }
        ],
        summary: { total_sections: 3, high_risk_sections: 1 }
      };
    }
  },

  getAlerts: async (): Promise<AlertItem[]> => {
    try {
      const client = createClient();
      const res = await client.get<AlertItem[]>('/control/alerts');
      return res.data;
    } catch (e) {
      return [
        {
          id: 1,
          alert_id: "ALT-AUTO-101",
          train_number: "12628",
          alert_type: "ANOMALY",
          severity: "MEDIUM",
          title: "Section Dwell Deviation Detected",
          message: "Train 12628 stopped 4m longer than scheduled in Katpadi Section.",
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          alert_id: "ALT-AUTO-102",
          train_number: "12626",
          alert_type: "CONGESTION",
          severity: "HIGH",
          title: "Downstream Bottleneck Warning",
          message: "Gwalior junction approaching 88% track occupancy.",
          is_active: true,
          created_at: new Date(Date.now() - 300000).toISOString()
        }
      ];
    }
  },

  resolveAlert: async (alertId: string) => {
    try {
      const client = createClient();
      const res = await client.post(`/control/alerts/${alertId}/resolve`);
      return res.data;
    } catch (e) {
      return { status: "RESOLVED", alert_id: alertId };
    }
  },

  // Simulation
  runSimulation: async (payload: {
    scenario_name: string;
    train_number: string;
    disruption_type: string;
    severity: string;
    duration_minutes: number;
    weather_type?: string;
    speed_limit_kmh?: number;
  }): Promise<WhatIfResponse> => {
    try {
      const client = createClient();
      const res = await client.post<WhatIfResponse>('/simulation/run', payload);
      return res.data;
    } catch (e) {
      const delayDelta = payload.duration_minutes * (payload.severity === 'CRITICAL' ? 1.4 : payload.severity === 'HIGH' ? 1.1 : 0.8);
      return {
        scenario_id: `SIM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        scenario_name: payload.scenario_name,
        train_number: payload.train_number,
        disruption_type: payload.disruption_type,
        baseline_final_eta: "12:22",
        simulated_final_eta: "12:54",
        net_delay_delta_minutes: Math.round(delayDelta * 10) / 10,
        impact_severity: payload.severity,
        affected_stations: [
          {
            station_code: "KPD",
            station_name: "Katpadi Junction",
            baseline_eta: "21:45",
            simulated_eta: "22:15",
            delay_delta_minutes: 30.0,
            simulated_delay_minutes: 38.0,
            cascade_risk: "HIGH"
          },
          {
            station_code: "RU",
            station_name: "Renigunta Junction",
            baseline_eta: "23:55",
            simulated_eta: "00:20",
            delay_delta_minutes: 25.0,
            simulated_delay_minutes: 32.0,
            cascade_risk: "MEDIUM"
          }
        ],
        mitigation_recommendation: "Grant priority signal dispatch through high-speed section to utilize buffer and prevent cascade bottleneck."
      };
    }
  },

  // Metrics
  getModelMetrics: async (): Promise<{ models: ModelMetricItem[]; system_targets: any }> => {
    try {
      const client = createClient();
      const res = await client.get('/metrics');
      return res.data;
    } catch (e) {
      return {
        models: [
          {
            model_name: "TravelTimeXGBoost (C1)",
            version: "2.4.0",
            mae_minutes: 2.64,
            rmse_minutes: 3.48,
            r2_score: 0.942,
            ece_calibration_score: 0.012,
            inference_latency_ms: 0.017,
            status: "ACTIVE"
          },
          {
            model_name: "DelayRecoveryModel (C3)",
            version: "2.1.0",
            mae_minutes: 1.82,
            rmse_minutes: 2.41,
            r2_score: 0.918,
            ece_calibration_score: 0.015,
            inference_latency_ms: 0.010,
            status: "ACTIVE"
          },
          {
            model_name: "AnomalyDetector (C4)",
            version: "1.9.0",
            mae_minutes: 0.0,
            rmse_minutes: 0.0,
            r2_score: 0.0,
            ece_calibration_score: 0.008,
            inference_latency_ms: 0.045,
            status: "ACTIVE"
          },
          {
            model_name: "CalibratedConfidenceEngine (C5/C6)",
            version: "2.0.0",
            mae_minutes: 0.0,
            rmse_minutes: 0.0,
            r2_score: 0.0,
            ece_calibration_score: 0.0126,
            inference_latency_ms: 0.014,
            status: "ACTIVE"
          }
        ],
        system_targets: {
          target_mae_minutes: 4.0,
          target_ece_score: 0.05,
          current_ece_score: 0.0126,
          inference_latency_p95_ms: 14.2
        }
      };
    }
  },

  // RailRadar Real-Time API (https://api.railradar.in/v1)
  getRailRadarStatus: async (): Promise<RailRadarStatus> => {
    try {
      const client = createClient();
      const res = await client.get<RailRadarStatus>('/railradar/status');
      return res.data;
    } catch {
      return {
        status: "UNAUTHORIZED",
        base_url: "https://api.railradar.in/v1",
        has_api_key: false,
        valid_key: false,
        latency_ms: 62.0,
        message: "RailRadar Live API requires authentication. Configure API Key to stream live data.",
        upstream_available: false
      };
    }
  },

  updateRailRadarConfig: async (apiKey: string, baseUrl?: string): Promise<{ status: string; message: string }> => {
    const client = createClient();
    const res = await client.post('/railradar/config', { api_key: apiKey, base_url: baseUrl });
    return res.data;
  },

  getRailRadarTrainLive: async (trainNumber: string): Promise<RailRadarLiveTrain> => {
    try {
      const client = createClient();
      const res = await client.get<RailRadarLiveTrain>(`/railradar/train/${trainNumber}/live`);
      return res.data;
    } catch (e) {
      console.warn(`Falling back for train ${trainNumber}:`, e);
      return {
        success: true,
        train_number: trainNumber,
        train_name: `Express Train (${trainNumber})`,
        data_source: "FALLBACK_PREVIEW",
        is_live_upstream: false,
        last_updated: new Date().toISOString(),
        status: "RUNNING",
        telemetry: {
          latitude: 28.6139,
          longitude: 77.2090,
          speed_kmh: 88.0,
          bearing: 180.0,
          segment_progress_percent: 52.0,
          delay_minutes: 8.0
        },
        next_station: {
          code: "AGC",
          name: "Agra Cantt",
          distance_km: 85.0,
          scheduled_arrival: "14:10",
          expected_arrival: "14:18",
          platform: "1"
        },
        ai_intelligence: {
          natural_recovery_minutes: 3.5,
          projected_net_delay_minutes: 4.5,
          confidence_score: 93.8,
          bounds: {
            p10_optimistic_min: 3.0,
            p50_expected_min: 4.5,
            p90_conservative_min: 7.0
          },
          anomaly: {
            is_anomaly: false,
            anomaly_type: "NONE",
            severity: "LOW"
          }
        },
        stops: []
      };
    }
  },

  getRailRadarStationLive: async (stationCode: string, hours = 4): Promise<RailRadarStationLive> => {
    try {
      const client = createClient();
      const res = await client.get<RailRadarStationLive>(`/railradar/station/${stationCode}/live`, {
        params: { hours }
      });
      return res.data;
    } catch {
      return {
        success: true,
        station_code: stationCode,
        station_name: `${stationCode} Station`,
        is_live_upstream: false,
        arrivals: [],
        departures: []
      };
    }
  },

  syncRailRadarFleet: async (trainNumbers?: string[]): Promise<any> => {
    const client = createClient();
    const res = await client.post('/railradar/sync', trainNumbers || []);
    return res.data;
  }
};


