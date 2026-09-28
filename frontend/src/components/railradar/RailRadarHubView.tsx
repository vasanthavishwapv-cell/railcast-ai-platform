import React, { useState } from 'react';
import { Radio, Building2, Train, Settings, RefreshCw } from 'lucide-react';
import { RailRadarLiveTracker } from './RailRadarLiveTracker';
import { LiveStationBoard } from './LiveStationBoard';
import { RailRadarStatus } from '../../types';

interface RailRadarHubViewProps {
  onOpenConfig: () => void;
  railRadarStatus: RailRadarStatus | null;
  onSelectTrain?: (trainNumber: string) => void;
}

export const RailRadarHubView: React.FC<RailRadarHubViewProps> = ({
  onOpenConfig,
  railRadarStatus
}) => {
  const [subTab, setSubTab] = useState<'train' | 'station'>('train');

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Top Sub-Navigation Bar */}
      <div className="glass-panel p-2 bg-[#1D1D1F] border border-[#2C2C2E] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSubTab('train')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              subTab === 'train'
                ? 'bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/25'
                : 'text-[#AAAAAA] hover:text-[#F5F5F7] hover:bg-[#121214]'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            Live Train GPS & AI ETA
          </button>

          <button
            onClick={() => setSubTab('station')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              subTab === 'station'
                ? 'bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/25'
                : 'text-[#AAAAAA] hover:text-[#F5F5F7] hover:bg-[#121214]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Live Station Arrivals/Departures
          </button>
        </div>

        {/* API Settings Trigger */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121214] border border-[#2C2C2E] text-xs font-medium text-[#AAAAAA] hover:text-[#007AFF] transition"
          >
            <Settings className="w-3.5 h-3.5" />
            API Key & Endpoint Settings
          </button>
        </div>
      </div>

      {/* Active Sub-View */}
      {subTab === 'train' ? (
        <RailRadarLiveTracker
          onOpenConfig={onOpenConfig}
          railRadarStatus={railRadarStatus}
        />
      ) : (
        <LiveStationBoard />
      )}
    </div>
  );
};
