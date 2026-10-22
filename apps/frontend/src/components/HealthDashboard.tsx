import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, Wifi, RefreshCw } from 'lucide-react';
import { fetchHealth } from '../services/api';
import { HealthMetrics } from '../types';

export const HealthDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHealth();
      setMetrics(data);
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Workspace Health Dashboard</h2>
            <p className="text-xs text-slate-400">Real-time system telemetry and infrastructure metrics</p>
          </div>
        </div>

        <button
          onClick={loadMetrics}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <p className="font-semibold">Service Unreachable</p>
          <p className="text-xs text-rose-400/80 mt-1">{error}</p>
          <p className="text-xs text-slate-400 mt-2">Ensure the backend is running with `npm run dev` on port 5000.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* API Server Node */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" /> API Gateway
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <div className="text-xl font-bold text-slate-100">
              {metrics ? `${metrics.uptimeSeconds}s Uptime` : '--'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Node {metrics?.system.nodeVersion || 'v24'} • {metrics?.system.memoryUsageMb ?? '--'} MB heap
            </p>
          </div>

          {/* Database Status */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" /> PostgreSQL / Prisma
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  metrics?.database.status === 'healthy'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {metrics?.database.status === 'healthy' ? 'CONNECTED' : 'STANDBY'}
              </span>
            </div>
            <div className="text-xl font-bold text-slate-100">
              {metrics?.database.latencyMs !== null && metrics?.database.latencyMs !== undefined
                ? `${metrics.database.latencyMs} ms`
                : 'Local Mode'}
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate" title={metrics?.database.status}>
              {metrics?.database.status ?? 'Checking connection...'}
            </p>
          </div>

          {/* Real-time WebSocket Bus */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Real-time Bus
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LISTENING
              </span>
            </div>
            <div className="text-xl font-bold text-slate-100">
              {metrics?.realtime.connectedClients ?? 0} Clients
            </div>
            <p className="text-xs text-slate-500 mt-1">Endpoint: ws://localhost:5000/ws</p>
          </div>

          {/* Syncro Monorepo Status */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" /> Workspace
              </span>
              <span className="text-[10px] text-slate-400">v{metrics?.version || '0.1.0'}</span>
            </div>
            <div className="text-xl font-bold text-indigo-400">Syncro Core</div>
            <p className="text-xs text-slate-500 mt-1">Last sync: {lastRefreshed.toLocaleTimeString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};
