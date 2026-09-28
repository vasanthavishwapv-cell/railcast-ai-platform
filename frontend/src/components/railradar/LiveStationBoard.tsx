import React, { useState, useEffect } from 'react';
import { Building2, Search, ArrowDownRight, ArrowUpRight, Clock, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { RailRadarStationLive } from '../../types';

const MAJOR_STATIONS = [
  { code: 'NDLS', name: 'New Delhi' },
  { code: 'SBC', name: 'KSR Bengaluru' },
  { code: 'MAS', name: 'MGR Chennai Central' },
  { code: 'MMCT', name: 'Mumbai Central' },
  { code: 'HWH', name: 'Howrah Jn' },
  { code: 'BPL', name: 'Bhopal Jn' }
];

export const LiveStationBoard: React.FC = () => {
  const [stationCode, setStationCode] = useState('NDLS');
  const [stationData, setStationData] = useState<RailRadarStationLive | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'arrivals' | 'departures'>('arrivals');

  useEffect(() => {
    fetchBoard(stationCode);
  }, [stationCode]);

  const fetchBoard = async (code: string) => {
    try {
      setLoading(true);
      const res = await api.getRailRadarStationLive(code, 4);
      setStationData(res);
    } catch (e) {
      console.error('Failed to fetch station board:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (stationCode.trim()) {
      fetchBoard(stationCode.trim().toUpperCase());
    }
  };

  const currentList = mode === 'arrivals' ? stationData?.arrivals : stationData?.departures;

  return (
    <div className="glass-panel p-6 bg-[#1D1D1F] border border-[#2C2C2E] rounded-2xl space-y-6 text-left">
      {/* Header and Station Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-[#007AFF]" />
            <h3 className="text-base font-bold text-[#F5F5F7]">
              Live Station Arrival & Departure Radar Board
            </h3>
          </div>
          <p className="text-xs text-[#AAAAAA]">
            Real-time platform allocations & delay status powered by RailRadar REST API
          </p>
        </div>

        {/* Station Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 text-[#AAAAAA] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value.toUpperCase())}
              placeholder="e.g. NDLS, SBC..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#121214] border border-[#2C2C2E] rounded-xl text-xs font-mono text-[#F5F5F7] focus:outline-none focus:border-[#007AFF] uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-[#007AFF] text-white text-xs font-semibold hover:bg-[#0062CC] transition"
          >
            {loading ? 'Fetching...' : 'View Board'}
          </button>
        </form>
      </div>

      {/* Quick Station Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {MAJOR_STATIONS.map((s) => (
          <button
            key={s.code}
            onClick={() => setStationCode(s.code)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition whitespace-nowrap ${
              stationCode === s.code
                ? 'bg-[#007AFF] text-white font-bold'
                : 'bg-[#121214] text-[#AAAAAA] border border-[#2C2C2E] hover:text-[#F5F5F7]'
            }`}
          >
            {s.name} ({s.code})
          </button>
        ))}
      </div>

      {/* Mode Toggle: Arrivals vs Departures */}
      <div className="flex items-center justify-between border-b border-[#2C2C2E] pb-3">
        <div className="flex items-center gap-2 bg-[#121214] p-1 rounded-xl border border-[#2C2C2E]">
          <button
            onClick={() => setMode('arrivals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'arrivals'
                ? 'bg-[#007AFF] text-white'
                : 'text-[#AAAAAA] hover:text-[#F5F5F7]'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            Live Arrivals
          </button>
          <button
            onClick={() => setMode('departures')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'departures'
                ? 'bg-[#007AFF] text-white'
                : 'text-[#AAAAAA] hover:text-[#F5F5F7]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Live Departures
          </button>
        </div>

        <button
          onClick={() => fetchBoard(stationCode)}
          className="text-xs text-[#AAAAAA] hover:text-[#007AFF] flex items-center gap-1 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Board Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#121214] text-[#AAAAAA] font-mono text-[11px] border-b border-[#2C2C2E]">
            <tr>
              <th className="py-2.5 px-3">Train No.</th>
              <th className="py-2.5 px-3">Train Name</th>
              <th className="py-2.5 px-3">{mode === 'arrivals' ? 'Origin' : 'Destination'}</th>
              <th className="py-2.5 px-3">Scheduled Time</th>
              <th className="py-2.5 px-3">Expected Time</th>
              <th className="py-2.5 px-3">Delay</th>
              <th className="py-2.5 px-3">Platform</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2C2C2E]/60 font-mono">
            {currentList && currentList.length > 0 ? (
              currentList.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#2C2C2E]/30 transition">
                  <td className="py-2.5 px-3 text-[#007AFF] font-bold">
                    {item.train_number}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#F5F5F7]">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3 text-[#AAAAAA]">
                    {mode === 'arrivals' ? item.origin || 'N/A' : item.destination || 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 text-[#AAAAAA]">
                    {item.scheduled_time}
                  </td>
                  <td className="py-2.5 px-3 text-[#F5F5F7] font-bold">
                    {item.expected_time}
                  </td>
                  <td className="py-2.5 px-3">
                    {item.delay > 0 ? (
                      <span className="text-[#FF9F0A]">+{item.delay} min</span>
                    ) : (
                      <span className="text-[#30D158]">ON TIME</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-[#007AFF]/20 text-[#007AFF] font-bold">
                      PF {item.platform}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.delay > 15 ? 'bg-[#FF453A]/20 text-[#FF453A]' :
                      item.delay > 0 ? 'bg-[#FF9F0A]/20 text-[#FF9F0A]' : 'bg-[#30D158]/20 text-[#30D158]'
                    }`}>
                      {item.status || (item.delay > 0 ? 'DELAYED' : 'ON TIME')}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-6 text-center text-[#AAAAAA] text-xs">
                  {loading ? 'Loading station schedule board...' : 'No trains scheduled in this time window.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
