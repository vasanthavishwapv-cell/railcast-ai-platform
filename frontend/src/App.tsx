import React, { useState, useEffect } from 'react';
import { Header, MainTabType } from './components/common/Header';
import { AlertToast } from './components/common/AlertToast';
import { PassengerView } from './components/passenger/PassengerView';
import { ControllerView } from './components/controller/ControllerView';
import { WhatIfSandbox } from './components/simulation/WhatIfSandbox';
import { ModelMetricsView } from './components/metrics/ModelMetricsView';
import { RailRadarHubView } from './components/railradar/RailRadarHubView';
import { RailRadarConfigModal } from './components/railradar/RailRadarConfigModal';
import { TrainSummary, NetworkStatus, RouteSectionRisk, AlertItem, RailRadarStatus } from './types';
import { api } from './api/client';
import { wsClient } from './api/websocket';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTabType>('passenger');
  const [trains, setTrains] = useState<TrainSummary[]>([]);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [riskSections, setRiskSections] = useState<RouteSectionRisk[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedTrainNumber, setSelectedTrainNumber] = useState<string>('12628');
  const [railRadarStatus, setRailRadarStatus] = useState<RailRadarStatus | null>(null);
  const [showRailRadarModal, setShowRailRadarModal] = useState(false);


  useEffect(() => {
    loadInitialData();

    // Subscribe to WebSocket / HTTP polling live telemetry
    const unsubTelemetry = wsClient.onTelemetry((payload) => {
      if (payload.type === 'TELEMETRY_UPDATE' && payload.trains) {
        setTrains((prev) => {
          const map = new Map<string, any>(payload.trains.map((t: any) => [t.train_number, t]));
          return prev.map((item) => {
            const update: any = map.get(item.train_number);
            if (update) {
              return {
                ...item,
                latitude: update.latitude,
                longitude: update.longitude,
                current_speed: update.speed,
                delay_minutes: update.delay,
                status: update.status,
                next_station: update.next_station,
                eta_next_station: update.eta_next,
                risk_level: update.delay >= 25 ? 'CRITICAL' : update.delay >= 15 ? 'HIGH' : update.delay >= 5 ? 'MODERATE' : 'LOW'
              };
            }
            return item;
          });
        });
      }
    });

    // Subscribe to WebSocket live alerts
    const unsubAlerts = wsClient.onAlert((payload) => {
      if (payload.type === 'NEW_ALERT') {
        const newAlt: AlertItem = {
          id: Date.now(),
          alert_id: payload.alert_id,
          train_number: payload.train_number,
          alert_type: 'ANOMALY',
          severity: payload.severity,
          title: payload.title,
          message: payload.message,
          is_active: true,
          created_at: payload.timestamp
        };
        setAlerts((prev) => [newAlt, ...prev]);
      }
    });

    return () => {
      unsubTelemetry();
      unsubAlerts();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [trainsData, netData, riskData, alertsData, radarStatus] = await Promise.all([
        api.getTrains(),
        api.getNetworkStatus(),
        api.getRiskMap(),
        api.getAlerts(),
        api.getRailRadarStatus()
      ]);
      setTrains(trainsData);
      setNetworkStatus(netData);
      setRiskSections(riskData.sections || []);
      setAlerts(alertsData);
      setRailRadarStatus(radarStatus);
      if (trainsData.length > 0 && !selectedTrainNumber) {
        setSelectedTrainNumber(trainsData[0].train_number);
      }
    } catch (e) {
      console.error('Initial fetch failed:', e);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.resolveAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
    } catch (e) {
      console.error('Failed to resolve alert:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#121214] text-[#F5F5F7] pb-12 selection:bg-[#007AFF] selection:text-white">
      {/* Top Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlertsCount={alerts.length}
        onOpenRailRadarModal={() => setShowRailRadarModal(true)}
        railRadarStatus={railRadarStatus}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        {activeTab === 'passenger' && (
          <PassengerView
            trains={trains}
            selectedTrainNumber={selectedTrainNumber}
            onSelectTrain={setSelectedTrainNumber}
          />
        )}

        {activeTab === 'railradar' && (
          <RailRadarHubView
            onOpenConfig={() => setShowRailRadarModal(true)}
            railRadarStatus={railRadarStatus}
            onSelectTrain={(num) => {
              setSelectedTrainNumber(num);
              setActiveTab('passenger');
            }}
          />
        )}

        {activeTab === 'controller' && (
          <ControllerView
            trains={trains}
            networkStatus={networkStatus}
            riskSections={riskSections}
            alerts={alerts}
            onSelectTrain={(num) => {
              setSelectedTrainNumber(num);
              setActiveTab('passenger');
            }}
            onResolveAlert={handleResolveAlert}
          />
        )}

        {activeTab === 'simulation' && (
          <WhatIfSandbox trains={trains} />
        )}

        {activeTab === 'metrics' && (
          <ModelMetricsView />
        )}
      </main>

      {/* Floating Real-Time Anomaly Toast Notifications */}
      <AlertToast alerts={alerts} onResolve={handleResolveAlert} />

      {/* RailRadar API Connection & Configuration Modal */}
      <RailRadarConfigModal
        isOpen={showRailRadarModal}
        onClose={() => setShowRailRadarModal(false)}
        onConfigUpdated={loadInitialData}
      />
    </div>
  );
};

export default App;

