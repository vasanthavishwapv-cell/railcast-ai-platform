export interface TrainSummary {
  train_number: string;
  name: string;
  train_type: string;
  origin_station: string;
  destination_station: string;
  priority_level: number;
  total_distance_km: number;
  scheduled_departure: string;
  scheduled_arrival: string;
  current_speed: number;
  delay_minutes: number;
  status: "ON_TIME" | "DELAYED" | "CRITICAL_DELAY" | "STOPPED";
  next_station?: string;
  eta_next_station?: string;
  risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  latitude: number;
  longitude: number;
}

export interface StationETA {
  station_code: string;
  station_name: string;
  distance_from_origin_km: number;
  scheduled_arrival: string;
  predicted_eta: string;
  delay_minutes: number;
  natural_recovery_minutes: number;
  confidence_percentage: number;
  confidence_window_p10_p90: string;
  status: string;
}

export interface TrainETAResponse {
  train_number: string;
  train_name: string;
  current_station?: string;
  next_station?: string;
  current_delay_minutes: number;
  total_recovered_minutes: number;
  final_destination_eta: string;
  final_destination_scheduled: string;
  overall_confidence_percentage: number;
  active_weather_condition: string;
  upcoming_stations: StationETA[];
}

export interface ContributingFactor {
  rank: number;
  feature: string;
  category: string;
  impact_minutes: number;
  contribution_percent: number;
  explanation: string;
}

export interface ExplanationResponse {
  train_number: string;
  prediction_time: string;
  base_travel_time_minutes: number;
  predicted_travel_time_minutes: number;
  net_impact_minutes: number;
  natural_recovery_minutes: number;
  explanation: {
    contributing_factors: ContributingFactor[];
    summary: string;
  };
}

export interface NetworkStatus {
  total_active_trains: number;
  on_time_trains: number;
  delayed_trains: number;
  critical_delayed_trains: number;
  network_punctuality_rate: number;
  active_alerts_count: number;
  avg_network_speed_kmh: number;
  highest_congestion_section: string;
  system_health: "OPTIMAL" | "ELEVATED_RISK" | "CONGESTED";
}

export interface RouteSectionRisk {
  section_id: string;
  corridor_name: string;
  from_station: string;
  to_station: string;
  distance_km: number;
  max_speed_kmh: number;
  congestion_score: number;
  risk_level: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  active_trains: number;
  signalling: string;
}

export interface AlertItem {
  id: number;
  alert_id: string;
  train_number?: string;
  section_id?: string;
  alert_type: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  recommendation?: string;
  is_active: boolean;
  created_at: string;
}

export interface WhatIfAffectedStation {
  station_code: string;
  station_name: string;
  baseline_eta: string;
  simulated_eta: string;
  delay_delta_minutes: number;
  simulated_delay_minutes: number;
  cascade_risk: "LOW" | "MEDIUM" | "HIGH";
}

export interface WhatIfResponse {
  scenario_id: string;
  scenario_name: string;
  train_number: string;
  disruption_type: string;
  baseline_final_eta: string;
  simulated_final_eta: string;
  net_delay_delta_minutes: number;
  impact_severity: string;
  affected_stations: WhatIfAffectedStation[];
  mitigation_recommendation: string;
}

export interface ModelMetricItem {
  model_name: string;
  version: string;
  mae_minutes: number;
  rmse_minutes: number;
  r2_score: number;
  ece_calibration_score: number;
  inference_latency_ms: number;
  status: string;
}

export interface RailRadarStatus {
  status: "CONNECTED" | "UNAUTHORIZED" | "OFFLINE" | string;
  base_url: string;
  has_api_key: boolean;
  valid_key: boolean;
  latency_ms: number;
  message: string;
  upstream_available: boolean;
}

export interface RailRadarTelemetry {
  latitude: number;
  longitude: number;
  speed_kmh: number;
  bearing: number;
  segment_progress_percent: number;
  delay_minutes: number;
}

export interface RailRadarNextStation {
  code: string;
  name: string;
  distance_km: number;
  scheduled_arrival: string;
  expected_arrival: string;
  platform: string;
}

export interface RailRadarAIIntelligence {
  natural_recovery_minutes: number;
  projected_net_delay_minutes: number;
  confidence_score: number;
  bounds: {
    p10_optimistic_min: number;
    p50_expected_min: number;
    p90_conservative_min: number;
  };
  anomaly: {
    is_anomaly: boolean;
    anomaly_type: string;
    severity: string;
  };
}

export interface RailRadarStop {
  code: string;
  name: string;
  scheduled_arrival: string;
  actual_arrival: string;
  delay_minutes: number;
  platform: string;
  has_departed: boolean;
  coordinates?: [number, number];
}

export interface RailRadarLiveTrain {
  success: boolean;
  train_number: string;
  train_name: string;
  data_source: string;
  is_live_upstream: boolean;
  note?: string;
  last_updated: string;
  status: string;
  telemetry: RailRadarTelemetry;
  next_station: RailRadarNextStation;
  ai_intelligence: RailRadarAIIntelligence;
  stops: RailRadarStop[];
}

export interface RailRadarArrivalDeparture {
  train_number: string;
  name: string;
  origin?: string;
  destination?: string;
  scheduled_time: string;
  expected_time: string;
  delay: number;
  platform: string;
  status: string;
}

export interface RailRadarStationLive {
  success: boolean;
  station_code: string;
  station_name: string;
  is_live_upstream: boolean;
  note?: string;
  arrivals: RailRadarArrivalDeparture[];
  departures: RailRadarArrivalDeparture[];
}

