import React, { useState, useEffect } from 'react';
import { Activity, Train, Navigation, SlidersHorizontal, BarChart3, Settings, Wifi, RefreshCw, Radio } from 'lucide-react';
import { wsClient, ConnectionStatus } from '../../api/websocket';
import { getApiBaseUrl, setCustomApiUrl } from '../../api/client';
import { RailRadarStatus } from '../../types';

export type MainTabType = 'passenger' | 'controller' | 'simulation' | 'metrics' | 'railradar';

interface HeaderProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  activeAlertsCount: number;
  onOpenRailRadarModal?: () => void;
  railRadarStatus?: RailRadarStatus | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeAlertsCount,
  onOpenRailRadarModal,
  railRadarStatus
}) => {
  const [time, setTime] = useState<string>('');
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('WS_CONNECTED');
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(getApiBaseUrl());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    const unsubStatus = wsClient.onStatusChange((status) => {
      setConnStatus(status);
    });

    return () => {
      clearInterval(interval);
      unsubStatus();
    };
  }, []);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApiUrl(customUrl);
    setShowConfig(false);
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-[#2C2C2E] px-6 py-3 mb-6 bg-[#1D1D1F]/90">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#007AFF] flex items-center justify-center shadow-lg shadow-[#007AFF]/30 transition-transform hover:scale-105">
            <Train className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#F5F5F7]">
                RAIL<span className="text-[#007AFF]">-CAST</span> <span className="text-[#007AFF] font-extrabold">AI</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#007AFF]/15 border border-[#007AFF]/40 text-[#007AFF] font-mono font-semibold tracking-wider">
                v2.0 PROD
              </span>
            </div>
            <p className="text-xs text-[#AAAAAA]">
              Next-Gen Dynamic Railway ETA & Operational Disruption Intelligence
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center bg-[#121214] p-1 rounded-xl border border-[#2C2C2E] overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('passenger')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'passenger'
                ? 'bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/30'
                : 'text-[#AAAAAA] hover:text-[#F5F5F7] hover:bg-[#1D1D1F]'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Passenger ETA
          </button>

          <button
            onClick={() => setActiveTab('railradar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap relative ${
              activeTab === 'railradar'
                ? 'bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white shadow-md shadow-[#007AFF]/30'
                : 'text-[#AAAAAA] hover:text-[#F5F5F7] hover:bg-[#1D1D1F]'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[#30D158] animate-pulse" />
            RailRadar Live
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#30D158]/20 text-[#30D158] font-mono font-bold">
              LIVE
            </span>
          </button>

          <button
            onClick={() => setActiveTab('controller')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap relative ${
              activeTab === 'controller'
                ? 'bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/30'
                : 'text-[#AAAAAA] hover:text-[#F5F5F7] hover:bg-[#1D1D1F]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Control Dispatch
            {activeAlertsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-ping absolute top-1.5 right-1.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'simulation'
                ? 'bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/30'
                : 'text-[#AAAAAA] hover:text-[#F5F5F7] hover:bg-[#1D1D1F]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            What-If Sandbox
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'metrics'
                ? 'bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/30'
                : 'text-[#AAAAAA] hover:text-[#F5F5F7] hover:bg-[#1D1D1F]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            ML & XAI Metrics
          </button>
        </nav>

        {/* Right: Live Telemetry Status & Endpoint Config */}
        <div className="flex items-center gap-2.5">
          {/* RailRadar Status Pill Button */}
          {onOpenRailRadarModal && (
            <button
              onClick={onOpenRailRadarModal}
              title="RailRadar API Connection & Settings"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-semibold transition hover:scale-105 ${
                railRadarStatus?.status === 'CONNECTED'
                  ? 'bg-[#30D158]/10 border-[#30D158]/40 text-[#30D158]'
                  : 'bg-[#FF9F0A]/10 border-[#FF9F0A]/40 text-[#FF9F0A]'
              }`}
            >
              <Radio className="w-3 h-3 animate-pulse" />
              <span>{railRadarStatus?.status === 'CONNECTED' ? 'RailRadar API' : 'RailRadar (Key)'}</span>
            </button>
          )}

          {connStatus === 'WS_CONNECTED' ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#30D158]/10 border border-[#30D158]/30">
              <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
              <span className="text-[11px] font-medium text-[#30D158] flex items-center gap-1">
                <Wifi className="w-3 h-3" /> LIVE WS
              </span>
            </div>
          ) : connStatus === 'HTTP_POLLING' ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#007AFF]/10 border border-[#007AFF]/30">
              <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
              <span className="text-[11px] font-medium text-[#007AFF] flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> SYNC (3s)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#FF9F0A]/10 border border-[#FF9F0A]/30">
              <span className="w-2 h-2 rounded-full bg-[#FF9F0A] animate-ping" />
              <span className="text-[11px] font-medium text-[#FF9F0A]">SYNCING</span>
            </div>
          )}

          <div className="text-right font-mono hidden lg:block">
            <div className="text-xs font-bold text-[#F5F5F7] tracking-wider">{time} IST</div>
            <div className="text-[10px] text-[#AAAAAA]">
              {connStatus === 'WS_CONNECTED' ? 'SUB-50ms WS' : 'RESILIENT HTTP'}
            </div>
          </div>

          {/* API Settings Trigger */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            title="Backend API Configuration"
            className="p-2 rounded-lg bg-[#121214] border border-[#2C2C2E] text-[#AAAAAA] hover:text-[#007AFF] hover:border-[#007AFF]/40 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>


      {/* Backend API Configuration Modal / Dropdown */}
      {showConfig && (
        <div className="mt-4 p-4 rounded-xl bg-[#1D1D1F] border border-[#007AFF]/40 shadow-2xl max-w-xl mx-auto text-left">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[#F5F5F7] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#007AFF]" />
              Backend API Connection & Vercel Settings
            </h4>
            <button
              onClick={() => setShowConfig(false)}
              className="text-xs text-[#AAAAAA] hover:text-[#F5F5F7]"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSaveUrl} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#AAAAAA] mb-1">
                API Base URL (FastAPI Endpoint)
              </label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="http://localhost:8000/api or https://your-backend.railway.app/api"
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#121214] border border-[#2C2C2E] text-[#F5F5F7] focus:outline-none focus:border-[#007AFF]"
              />
              <p className="text-[10px] text-[#AAAAAA] mt-1">
                When deploying on Vercel, leave empty to use relative <code className="text-[#007AFF]">/api</code> or enter your hosted backend URL.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomUrl('http://localhost:8000/api');
                  setCustomApiUrl('');
                  window.location.reload();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#AAAAAA] hover:text-[#F5F5F7] bg-[#121214] border border-[#2C2C2E]"
              >
                Reset to Default
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#007AFF] text-white hover:bg-[#0062CC] transition-colors"
              >
                Apply & Connect
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};
