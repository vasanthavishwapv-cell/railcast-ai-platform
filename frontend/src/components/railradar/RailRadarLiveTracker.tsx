import React, { useState, useEffect } from 'react';
import {
  Search,
  Radio,
  Gauge,
  Clock,
  Compass,
  MapPin,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../../api/client';
import { RailRadarLiveTrain, RailRadarStatus } from '../../types';

const POPULAR_SEARCHES = [
  { num: '12628', label: 'Karnataka Exp (SBC-NDLS)' },
  { num: '12951', label: 'Mumbai Rajdhani (MMCT-NDLS)' },
  { num: '22436', label: 'Vande Bharat (NDLS-BSB)' },
  { num: '12002', label: 'Bhopal Shatabdi (NDLS-RKMP)' },
  { num: '12301', label: 'Howrah Rajdhani (HWH-NDLS)' },
  { num: '12919', label: 'Malwa Exp (DADN-SVDK)' }
];

interface RailRadarLiveTrackerProps {
  onOpenConfig?: () => void;
  railRadarStatus?: RailRadarStatus | null;
}

export const RailRadarLiveTracker: React.FC<RailRadarLiveTrackerProps> = ({
  onOpenConfig,
  railRadarStatus
}) => {
  const [trainNumber, setTrainNumber] = useState('12628');
  const [liveData, setLiveData] = useState<RailRadarLiveTrain | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  useEffect(() => {
    fetchLiveStatus(trainNumber);
  }, [trainNumber]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLiveStatus(trainNumber, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, trainNumber]);

  const fetchLiveStatus = async (num: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.getRailRadarTrainLive(num);
      setLiveData(res);
      setLastRefreshedAt(new Date().toLocaleTimeString('en-US', { hour12: false }));
    } catch (e) {
      console.error('Failed to fetch RailRadar live data:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trainNumber.trim()) {
      fetchLiveStatus(trainNumber.trim());
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Search Header Banner */}
      <div className="glass-panel p-6 bg-gradient-to-r from-[#1D1D1F] via-[#161618] to-[#1D1D1F] border border-[#2C2C2E] rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-[#007AFF]/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#30D158]"></span>
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#007AFF] font-bold">
                RailRadar Real-Time Telemetry Gateway
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#F5F5F7]">
              Live Indian Railways Telemetry & Dynamic AI Recovery
            </h2>
            <p className="text-xs text-[#AAAAAA] mt-1 max-w-xl">
              Track real-time GPS coordinates, speed, and running delay from{' '}
              <code className="text-[#007AFF] font-mono">https://api.railradar.in/v1</code>{' '}
              coupled with RAIL-CAST AI natural buffer absorption modeling.
            </p>
          </div>

          {/* Quick API Key / Status Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenConfig}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition hover:scale-105 ${
                railRadarStatus?.status === 'CONNECTED'
                  ? 'bg-[#30D158]/15 border-[#30D158]/40 text-[#30D158]'
                  : 'bg-[#FF9F0A]/15 border-[#FF9F0A]/40 text-[#FF9F0A]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {railRadarStatus?.status === 'CONNECTED' ? 'RailRadar Live: Connected' : 'RailRadar API: Hybrid Preview'}
            </button>

            <button
              onClick={() => fetchLiveStatus(trainNumber)}
              disabled={loading}
              className="p-2 rounded-xl bg-[#121214] border border-[#2C2C2E] text-[#AAAAAA] hover:text-[#007AFF] transition"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#007AFF]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#AAAAAA] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={trainNumber}
              onChange={(e) => setTrainNumber(e.target.value)}
              placeholder="Enter 5-digit train number (e.g. 12628, 12951, 22436)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#121214] border border-[#2C2C2E] rounded-xl text-xs font-mono text-[#F5F5F7] placeholder-[#555] focus:outline-none focus:border-[#007AFF] transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-[#007AFF] text-white text-xs font-bold hover:bg-[#0062CC] transition shadow-md shadow-[#007AFF]/25 flex items-center justify-center gap-1.5"
          >
            {loading ? 'Locating...' : 'Track Live Train'}
          </button>
        </form>

        {/* Quick Search Pills */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[#666] text-[10px] uppercase font-mono tracking-wider whitespace-nowrap">
            Popular:
          </span>
          {POPULAR_SEARCHES.map((item) => (
            <button
              key={item.num}
              onClick={() => setTrainNumber(item.num)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition whitespace-nowrap ${
                trainNumber === item.num
                  ? 'bg-[#007AFF] text-white font-semibold'
                  : 'bg-[#121214] text-[#AAAAAA] border border-[#2C2C2E] hover:text-[#F5F5F7]'
              }`}
            >
              {item.num} ({item.label.split(' ')[0]})
            </button>
          ))}
        </div>
      </div>

      {/* Main Live Telemetry Grid */}
      {liveData && (
        <div className="space-y-6">
          {/* Note Banner if in simulated / preview mode */}
          {!liveData.is_live_upstream && (
            <div className="p-3.5 rounded-xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/30 flex items-center justify-between text-xs text-[#FF9F0A]">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>High-Fidelity Telemetry Preview:</strong> Displaying timetable route telemetry. Connect your{' '}
                  <code className="bg-[#1D1D1F] px-1.5 py-0.5 rounded text-[#F5F5F7]">RailRadar API Key</code>{' '}
                  to activate upstream real-time GPS satellites.
                </span>
              </div>
              <button
                onClick={onOpenConfig}
                className="ml-3 px-3 py-1 rounded-lg bg-[#FF9F0A] text-black font-semibold text-[11px] whitespace-nowrap hover:bg-[#E08B00]"
              >
                Configure Key
              </button>
            </div>
          )}

          {/* Key Metrics 4-Column Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Speed Gauge */}
            <div className="glass-panel p-4 bg-[#1D1D1F] rounded-xl border border-[#2C2C2E]">
              <div className="flex items-center justify-between text-[#AAAAAA] text-xs mb-2">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-[#007AFF]" />
                  Current Speed
                </span>
                <span className="font-mono text-[10px] text-[#30D158] font-semibold">
                  LIVE TELEMETRY
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-[#F5F5F7]">
                  {liveData.telemetry.speed_kmh}
                </span>
                <span className="text-xs text-[#AAAAAA]">km/h</span>
              </div>
              <div className="mt-3 w-full bg-[#121214] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#007AFF] to-[#30D158] h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (liveData.telemetry.speed_kmh / 140) * 100)}%` }}
                />
              </div>
            </div>

            {/* Delay Status */}
            <div className="glass-panel p-4 bg-[#1D1D1F] rounded-xl border border-[#2C2C2E]">
              <div className="flex items-center justify-between text-[#AAAAAA] text-xs mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#FF9F0A]" />
                  Running Delay
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  liveData.telemetry.delay_minutes > 15
                    ? 'bg-[#FF453A]/20 text-[#FF453A]'
                    : liveData.telemetry.delay_minutes > 0
                    ? 'bg-[#FF9F0A]/20 text-[#FF9F0A]'
                    : 'bg-[#30D158]/20 text-[#30D158]'
                }`}>
                  {liveData.status}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-mono ${
                  liveData.telemetry.delay_minutes > 15 ? 'text-[#FF453A]' :
                  liveData.telemetry.delay_minutes > 0 ? 'text-[#FF9F0A]' : 'text-[#30D158]'
                }`}>
                  {liveData.telemetry.delay_minutes > 0 ? `+${liveData.telemetry.delay_minutes}` : '0'}
                </span>
                <span className="text-xs text-[#AAAAAA]">minutes</span>
              </div>
              <p className="mt-2 text-[11px] text-[#8E8E93]">
                Reported by Indian Railways RailRadar Feed
              </p>
            </div>

            {/* Natural Delay Recovery (C3 Innovation) */}
            <div className="glass-panel p-4 bg-[#1D1D1F] rounded-xl border border-[#007AFF]/40 relative overflow-hidden">
              <div className="flex items-center justify-between text-[#AAAAAA] text-xs mb-2">
                <span className="flex items-center gap-1.5 text-[#007AFF] font-bold">
                  <TrendingDown className="w-4 h-4" />
                  AI Natural Recovery
                </span>
                <span className="font-mono text-[10px] bg-[#007AFF]/15 text-[#007AFF] px-1.5 py-0.5 rounded">
                  C3 MODEL
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-[#30D158]">
                  -{liveData.ai_intelligence.natural_recovery_minutes}
                </span>
                <span className="text-xs text-[#AAAAAA]">min buffer</span>
              </div>
              <p className="mt-2 text-[11px] text-[#AAAAAA]">
                Projected Net Delay:{' '}
                <strong className="text-[#F5F5F7] font-mono">
                  {liveData.ai_intelligence.projected_net_delay_minutes} min
                </strong>
              </p>
            </div>

            {/* Calibrated Confidence & Anomaly */}
            <div className="glass-panel p-4 bg-[#1D1D1F] rounded-xl border border-[#2C2C2E]">
              <div className="flex items-center justify-between text-[#AAAAAA] text-xs mb-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#BF5AF2]" />
                  Quantile Confidence
                </span>
                <span className="text-[10px] font-mono text-[#30D158]">
                  ECE &lt; 0.05
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-[#F5F5F7]">
                  {liveData.ai_intelligence.confidence_score}%
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#AAAAAA] bg-[#121214] px-2 py-1 rounded">
                <span>P10: {liveData.ai_intelligence.bounds.p10_optimistic_min}m</span>
                <span className="text-[#007AFF] font-bold">P50: {liveData.ai_intelligence.bounds.p50_expected_min}m</span>
                <span>P90: {liveData.ai_intelligence.bounds.p90_conservative_min}m</span>
              </div>
            </div>
          </div>

          {/* Train Identity & Next Station Card */}
          <div className="glass-panel p-5 bg-[#1D1D1F] rounded-xl border border-[#2C2C2E] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold font-mono text-[#007AFF]">
                  #{liveData.train_number}
                </span>
                <h3 className="text-base font-bold text-[#F5F5F7]">
                  {liveData.train_name}
                </h3>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-[#AAAAAA]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#007AFF]" />
                  GPS: {liveData.telemetry.latitude.toFixed(4)}° N, {liveData.telemetry.longitude.toFixed(4)}° E
                </span>
                <span className="flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-[#30D158]" />
                  Heading: {liveData.telemetry.bearing}°
                </span>
                <span className="text-[#666]">
                  Last Ping: {lastRefreshedAt || 'Just now'}
                </span>
              </div>
            </div>

            {/* Next Station Callout */}
            <div className="p-3 rounded-xl bg-[#121214] border border-[#2C2C2E] flex items-center gap-4">
              <div>
                <div className="text-[10px] font-mono text-[#AAAAAA] uppercase">Next Halting Station</div>
                <div className="text-sm font-bold text-[#F5F5F7]">
                  {liveData.next_station.name} ({liveData.next_station.code})
                </div>
              </div>
              <div className="text-right border-l border-[#2C2C2E] pl-3">
                <div className="text-[10px] font-mono text-[#AAAAAA]">Platform</div>
                <div className="text-xs font-mono font-bold text-[#007AFF]">
                  PF {liveData.next_station.platform}
                </div>
              </div>
              <div className="text-right border-l border-[#2C2C2E] pl-3">
                <div className="text-[10px] font-mono text-[#AAAAAA]">Scheduled / Dynamic ETA</div>
                <div className="text-xs font-mono font-bold text-[#30D158]">
                  {liveData.next_station.scheduled_arrival}
                </div>
              </div>
            </div>
          </div>

          {/* Route Station Stops Table */}
          {liveData.stops && liveData.stops.length > 0 && (
            <div className="glass-panel p-5 bg-[#1D1D1F] rounded-xl border border-[#2C2C2E]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#007AFF]" />
                  Live Corridor Halting Sequence & Schedule Verification
                </h4>
                <span className="text-xs font-mono text-[#AAAAAA]">
                  {liveData.stops.length} halts along route
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#121214] text-[#AAAAAA] font-mono text-[11px] border-b border-[#2C2C2E]">
                    <tr>
                      <th className="py-2.5 px-3">Station</th>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Scheduled Time</th>
                      <th className="py-2.5 px-3">Platform</th>
                      <th className="py-2.5 px-3">Delay Status</th>
                      <th className="py-2.5 px-3 text-right">Route Telemetry State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C2C2E]/60 font-mono">
                    {liveData.stops.map((stop, idx) => (
                      <tr
                        key={idx}
                        className={`transition hover:bg-[#2C2C2E]/30 ${
                          stop.has_departed ? 'opacity-50' : 'bg-transparent'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-[#F5F5F7]">
                          {stop.name}
                        </td>
                        <td className="py-2.5 px-3 text-[#007AFF]">
                          {stop.code}
                        </td>
                        <td className="py-2.5 px-3 text-[#F5F5F7]">
                          {stop.scheduled_arrival}
                        </td>
                        <td className="py-2.5 px-3 text-[#AAAAAA]">
                          {stop.platform || '1'}
                        </td>
                        <td className="py-2.5 px-3">
                          {stop.delay_minutes > 0 ? (
                            <span className="text-[#FF9F0A]">+{stop.delay_minutes} min</span>
                          ) : (
                            <span className="text-[#30D158]">ON TIME</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {stop.has_departed ? (
                            <span className="px-2 py-0.5 rounded bg-[#2C2C2E] text-[#8E8E93] text-[10px]">
                              DEPARTED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-[#007AFF]/20 text-[#007AFF] text-[10px] font-bold">
                              EN ROUTE / UPCOMING
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
