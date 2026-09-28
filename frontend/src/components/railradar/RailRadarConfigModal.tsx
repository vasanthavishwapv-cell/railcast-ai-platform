import React, { useState, useEffect } from 'react';
import { Radio, Key, CheckCircle, AlertTriangle, RefreshCw, X, ExternalLink, Zap } from 'lucide-react';
import { api } from '../../api/client';
import { RailRadarStatus } from '../../types';

interface RailRadarConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export const RailRadarConfigModal: React.FC<RailRadarConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState('https://api.railradar.in/v1');
  const [status, setStatus] = useState<RailRadarStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getRailRadarStatus();
      setStatus(res);
      if (res.base_url) setBaseUrl(res.base_url);
    } catch (e) {
      console.error('Failed to get RailRadar status:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setFeedback(null);
      await api.updateRailRadarConfig(apiKey, baseUrl);
      const res = await api.getRailRadarStatus();
      setStatus(res);
      setFeedback('Configuration updated and tested successfully.');
      if (onConfigUpdated) onConfigUpdated();
    } catch (e) {
      setFeedback('Failed to update configuration.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFleet = async () => {
    try {
      setSyncing(true);
      const res = await api.syncRailRadarFleet();
      setFeedback(`Successfully synced ${res.synced_count} active fleet trains with live RailRadar telemetry!`);
      if (onConfigUpdated) onConfigUpdated();
    } catch (e) {
      setFeedback('Fleet synchronization error.');
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[#1D1D1F] border border-[#2C2C2E] shadow-2xl p-6 text-left relative selection:bg-[#007AFF] selection:text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-lg shadow-[#007AFF]/25">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F5F7] flex items-center gap-2">
                RailRadar Live API
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#007AFF]/20 text-[#007AFF] font-mono font-semibold">
                  REST v1
                </span>
              </h3>
              <p className="text-xs text-[#AAAAAA]">
                Real-Time Indian Railways GPS Telemetry & Schedule Data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-[#F5F5F7] hover:bg-[#2C2C2E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Banner */}
        <div className="my-4 p-3.5 rounded-xl bg-[#121214] border border-[#2C2C2E] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#AAAAAA] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                status?.status === 'CONNECTED' ? 'bg-[#30D158] animate-pulse' :
                status?.status === 'UNAUTHORIZED' ? 'bg-[#FF9F0A]' : 'bg-[#FF453A]'
              }`} />
              Endpoint Status:
            </span>
            <span className={`font-mono font-bold ${
              status?.status === 'CONNECTED' ? 'text-[#30D158]' :
              status?.status === 'UNAUTHORIZED' ? 'text-[#FF9F0A]' : 'text-[#FF453A]'
            }`}>
              {status?.status === 'CONNECTED' ? 'CONNECTED (LIVE STREAM)' :
               status?.status === 'UNAUTHORIZED' ? 'API KEY REQUIRED (DEMO/HYBRID MODE)' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#AAAAAA]">API Base URL:</span>
            <code className="text-[#007AFF] font-mono text-[11px] bg-[#1D1D1F] px-2 py-0.5 rounded">
              {baseUrl}
            </code>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#AAAAAA]">Round-Trip Latency:</span>
            <span className="font-mono text-[#F5F5F7] font-semibold">
              {status?.latency_ms ? `${status.latency_ms} ms` : '--'}
            </span>
          </div>

          <p className="text-[11px] text-[#8E8E93] pt-1 border-t border-[#2C2C2E]/60">
            {status?.message || 'Connecting to RailRadar REST API service...'}
          </p>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#F5F5F7] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#007AFF]" />
                RailRadar API Key (Bearer Token)
              </label>
              <a
                href="https://railradar.in"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#007AFF] hover:underline flex items-center gap-1"
              >
                Get API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="rr_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full pl-3 pr-20 py-2.5 bg-[#121214] border border-[#2C2C2E] rounded-xl text-xs font-mono text-[#F5F5F7] placeholder-[#555] focus:outline-none focus:border-[#007AFF] transition"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#AAAAAA] hover:text-[#F5F5F7] bg-[#2C2C2E] px-2 py-1 rounded"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[10px] text-[#8E8E93] mt-1">
              Supports Bearer Token format (<code>Authorization: Bearer &lt;key&gt;</code>) or header (<code>x-api-key</code>).
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#F5F5F7] block mb-1.5">
              API Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.railradar.in/v1"
              className="w-full px-3 py-2 bg-[#121214] border border-[#2C2C2E] rounded-xl text-xs font-mono text-[#F5F5F7] focus:outline-none focus:border-[#007AFF] transition"
            />
          </div>

          {feedback && (
            <div className="p-2.5 rounded-lg bg-[#007AFF]/10 border border-[#007AFF]/30 text-xs text-[#007AFF] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleSyncFleet}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#F5F5F7] bg-[#121214] border border-[#2C2C2E] hover:border-[#007AFF] transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Fleet to DB'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={checkStatus}
                disabled={loading}
                className="px-3 py-2 rounded-xl text-xs font-medium text-[#AAAAAA] hover:text-[#F5F5F7] bg-[#121214] border border-[#2C2C2E]"
              >
                {loading ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#007AFF] hover:bg-[#0062CC] shadow-lg shadow-[#007AFF]/25 transition"
              >
                <Zap className="w-3.5 h-3.5" />
                Save & Connect
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
