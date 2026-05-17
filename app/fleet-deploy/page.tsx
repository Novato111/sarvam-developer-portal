'use client';

import { memo, useCallback, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Info,
  Loader2,
  RefreshCw,
  RocketIcon,
  ServerCrash,
  WifiOff,
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

const MODEL_VERSIONS = [
  { id: 'sarvam-m-2.1', label: 'sarvam-m v2.1', tag: 'Latest', tagColor: 'emerald' },
  { id: 'sarvam-m-2.0', label: 'sarvam-m v2.0', tag: 'Stable', tagColor: 'blue' },
  { id: 'sarvam-m-1.9', label: 'sarvam-m v1.9', tag: 'Legacy', tagColor: 'zinc' },
  { id: 'saaras-v4',    label: 'saaras v4',     tag: 'Voice',  tagColor: 'purple' },
];

type DeviceStatus = 'online' | 'offline' | 'updating' | 'error';

interface Device {
  id: string;
  name: string;
  location: string;
  currentModel: string;
  status: DeviceStatus;
  lastSeen: string;
}

const INITIAL_DEVICES: Device[] = [
  { id: 'dev-001', name: 'edge-node-mumbai-01',  location: 'Mumbai, IN',   currentModel: 'sarvam-m v2.0', status: 'online',  lastSeen: '2s ago' },
  { id: 'dev-002', name: 'edge-node-delhi-01',   location: 'Delhi, IN',    currentModel: 'sarvam-m v2.0', status: 'online',  lastSeen: '5s ago' },
  { id: 'dev-003', name: 'edge-node-blr-01',     location: 'Bengaluru, IN',currentModel: 'sarvam-m v1.9', status: 'online',  lastSeen: '11s ago' },
  { id: 'dev-004', name: 'edge-node-blr-02',     location: 'Bengaluru, IN',currentModel: 'sarvam-m v1.9', status: 'offline', lastSeen: '4m ago' },
  { id: 'dev-005', name: 'edge-node-chennai-01', location: 'Chennai, IN',  currentModel: 'sarvam-m v2.0', status: 'online',  lastSeen: '1s ago' },
  { id: 'dev-006', name: 'edge-node-hyd-01',     location: 'Hyderabad, IN',currentModel: 'sarvam-m v1.9', status: 'error',   lastSeen: '18m ago' },
  { id: 'dev-007', name: 'edge-node-pune-01',    location: 'Pune, IN',     currentModel: 'sarvam-m v2.0', status: 'online',  lastSeen: '3s ago' },
  { id: 'dev-008', name: 'edge-node-kolkata-01', location: 'Kolkata, IN',  currentModel: 'sarvam-m v1.9', status: 'online',  lastSeen: '7s ago' },
];

const grainTexture =
  'radial-gradient(circle at 18% 24%, rgba(255,255,255,0.34) 0 0.7px, transparent 1px), radial-gradient(circle at 72% 34%, rgba(20,20,20,0.18) 0 0.55px, transparent 1px), radial-gradient(circle at 42% 76%, rgba(255,255,255,0.22) 0 0.65px, transparent 1px), radial-gradient(circle at 84% 82%, rgba(20,20,20,0.12) 0 0.55px, transparent 1px)';

const fineGrain =
  'radial-gradient(circle at 18% 24%, rgba(255,255,255,0.16) 0 0.35px, transparent 0.6px), radial-gradient(circle at 72% 34%, rgba(0,0,0,0.14) 0 0.35px, transparent 0.6px), radial-gradient(circle at 42% 76%, rgba(255,255,255,0.12) 0 0.35px, transparent 0.6px), radial-gradient(circle at 84% 82%, rgba(0,0,0,0.10) 0 0.35px, transparent 0.6px)';

const deployBtnGradient =
  'radial-gradient(circle at 24% 18%, rgba(255,202,152,0.8) 0%, rgba(214,102,77,0.62) 35%, transparent 60%), radial-gradient(circle at 82% 82%, rgba(177,91,121,0.66) 0%, transparent 45%), linear-gradient(135deg,#a64f46 0%,#cf6a54 52%,#a8577a 100%)';

const GlobalStyles = memo(function GlobalStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');`,
      }}
    />
  );
});

function StatusBadge({ status }: { status: DeviceStatus }) {
  const map: Record<DeviceStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    online:   { label: 'Online',   cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', icon: <Activity className="h-2.5 w-2.5" /> },
    offline:  { label: 'Offline',  cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',               icon: <WifiOff className="h-2.5 w-2.5" /> },
    updating: { label: 'Updating', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',             icon: <Loader2 className="h-2.5 w-2.5 animate-spin" /> },
    error:    { label: 'Error',    cls: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',                 icon: <ServerCrash className="h-2.5 w-2.5" /> },
  };
  const { label, cls, icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide ${cls}`}>
      {icon}{label}
    </span>
  );
}

function ModelTag({ tag, color }: { tag: string; color: string }) {
  const cls: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    blue:    'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    zinc:    'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    purple:  'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${cls[color] ?? cls.zinc}`}>
      {tag}
    </span>
  );
}

export default function FleetDeploy() {
  const { toast } = useToast();
  const [devices, setDevices]               = useState<Device[]>(INITIAL_DEVICES);
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [selectedModel, setSelectedModel]   = useState(MODEL_VERSIONS[0]);
  const [modelDropOpen, setModelDropOpen]   = useState(false);
  const [isDeploying, setIsDeploying]       = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployDone, setDeployDone]         = useState(false);

  const onlineDevices  = devices.filter((d) => d.status === 'online' || d.status === 'updating');
  const allOnlineSelected =
    onlineDevices.length > 0 && onlineDevices.every((d) => selectedIds.has(d.id));

  const toggleDevice = useCallback((id: string, status: DeviceStatus) => {
    if (status === 'offline' || status === 'error') return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setDeployDone(false);
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(
      allOnlineSelected
        ? new Set()
        : new Set(onlineDevices.map((d) => d.id))
    );
    setDeployDone(false);
  }, [allOnlineSelected, onlineDevices]);

  const handleDeploy = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast({ title: 'No devices selected', description: 'Select at least one online device.', variant: 'warning' });
      return;
    }
    if (isDeploying) return;

    setIsDeploying(true);
    setDeployProgress(0);
    setDeployDone(false);

    setDevices((prev) =>
      prev.map((d) => selectedIds.has(d.id) ? { ...d, status: 'updating' as DeviceStatus } : d)
    );

    const total = selectedIds.size;
    const ids = [...selectedIds];
    let completed = 0;

    for (const id of ids) {
      await new Promise<void>((res) => setTimeout(res, 600 + Math.random() * 800));
      completed++;
      setDeployProgress(Math.round((completed / total) * 100));
      setDevices((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, status: 'online', currentModel: selectedModel.label, lastSeen: 'just now' }
            : d
        )
      );
    }

    setIsDeploying(false);
    setDeployDone(true);
    setSelectedIds(new Set());
    toast({
      title: 'Deployment complete',
      description: `${total} device${total > 1 ? 's' : ''} updated to ${selectedModel.label}.`,
      variant: 'success',
    });
  }, [selectedIds, selectedModel, isDeploying, toast]);

  const handleRefresh = useCallback(() => {
    setDevices(INITIAL_DEVICES);
    setSelectedIds(new Set());
    setDeployDone(false);
    setDeployProgress(0);
    toast({ title: 'Fleet refreshed', description: 'Device statuses reloaded.', variant: 'default' });
  }, [toast]);

  const stats = {
    total:    devices.length,
    online:   devices.filter((d) => d.status === 'online').length,
    offline:  devices.filter((d) => d.status === 'offline').length,
    updating: devices.filter((d) => d.status === 'updating').length,
    error:    devices.filter((d) => d.status === 'error').length,
  };

  return (
    <div className="flex h-[calc(100dvh-64px)] w-full overflow-hidden bg-white font-['Geist'] text-[#09090b] dark:bg-[#09090b] dark:text-[#fafafa] lg:h-screen">
      <GlobalStyles />
      <main className="flex min-w-0 flex-1 flex-col bg-white dark:bg-[#0f0f12]">
        <header className="flex min-h-[64px] shrink-0 flex-col items-start justify-center gap-3 border-b border-black/5 bg-[#fafafa] px-4 py-3 dark:border-white/10 dark:bg-[#09090b] sm:min-h-[68px] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-col justify-center">
            <h1 className="font-['Geist'] text-[15px] font-semibold tracking-normal text-[#09090b] dark:text-[#fafafa]">
              Fleet Model Deploy
            </h1>
            <p className="mt-0.5 hidden truncate font-medium text-[10px] text-[#71717a] sm:block">
              Select devices and push a new model version across your enterprise fleet.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-black/10 bg-white px-3 py-1.5 text-[11px] font-medium text-[#71717a] shadow-sm transition hover:text-[#09090b] dark:border-white/10 dark:bg-[#18181b] dark:hover:text-[#fafafa]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 pt-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Devices', value: stats.total,    color: 'text-[#09090b] dark:text-[#fafafa]' },
              { label: 'Online',        value: stats.online,   color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Offline / Err', value: stats.offline + stats.error, color: 'text-red-500 dark:text-red-400' },
              { label: 'Updating',      value: stats.updating, color: 'text-blue-600 dark:text-blue-400' },
            ].map((s) => (
              <div
                key={s.label}
                className="relative isolate overflow-hidden rounded-[13px] border border-black/5 bg-[#fafafa] p-3 shadow-sm dark:border-white/10 dark:bg-[#09090b]"
              >
                <div className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay" style={{ backgroundImage: fineGrain, backgroundSize: '4px 4px' }} />
                <div className="relative z-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71717a]">{s.label}</p>
                  <p className={`mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em] ${s.color}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="relative isolate shrink-0 overflow-hidden rounded-[20px] border border-black/10 bg-[#fafafa] p-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#18181b] sm:rounded-[24px]">
            <div className="pointer-events-none absolute inset-x-6 -bottom-10 h-20 rounded-full bg-[linear-gradient(90deg,rgba(166,79,70,0.16),rgba(168,87,122,0.18),rgba(37,99,235,0.14))] blur-3xl" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71717a]">
                  Target Model Version
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setModelDropOpen((o) => !o)}
                    className="flex w-full items-center justify-between rounded-[12px] border border-black/10 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:border-black/20 dark:border-white/10 dark:bg-[#0f0f12] dark:hover:border-white/20"
                  >
                    <span className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-[#71717a]" />
                      {selectedModel.label}
                      <ModelTag tag={selectedModel.tag} color={selectedModel.tagColor} />
                    </span>
                    <ChevronDown className={`h-4 w-4 text-[#71717a] transition-transform ${modelDropOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {modelDropOpen && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[12px] border border-black/10 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#18181b]">
                      {MODEL_VERSIONS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => { setSelectedModel(m); setModelDropOpen(false); setDeployDone(false); }}
                          className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium transition hover:bg-[#f4f4f5] dark:hover:bg-[#27272a] ${selectedModel.id === m.id ? 'text-[#09090b] dark:text-[#fafafa]' : 'text-[#71717a]'}`}
                        >
                          <Cpu className="h-4 w-4" />
                          {m.label}
                          <ModelTag tag={m.tag} color={m.tagColor} />
                          {selectedModel.id === m.id && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px] font-medium text-[#71717a]">
                    {selectedIds.size === 0 ? 'No devices selected' : `${selectedIds.size} device${selectedIds.size > 1 ? 's' : ''} selected`}
                  </p>
                  {isDeploying && (
                    <p className="mt-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      {deployProgress}% complete
                    </p>
                  )}
                  {deployDone && (
                    <p className="mt-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Deployment complete ✓
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDeploy}
                  disabled={isDeploying || selectedIds.size === 0}
                  style={!isDeploying && selectedIds.size > 0 ? { background: deployBtnGradient } : undefined}
                  className="relative isolate inline-flex h-10 items-center gap-2 overflow-hidden rounded-full px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(148,74,68,0.22)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:bg-[#71717a]"
                >
                  {!isDeploying && selectedIds.size > 0 && (
                    <span className="pointer-events-none absolute inset-0 opacity-35 mix-blend-overlay" style={{ backgroundImage: grainTexture, backgroundSize: '7px 7px' }} />
                  )}
                  {isDeploying
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Deploying…</>
                    : <><RocketIcon className="h-4 w-4" />Deploy</>
                  }
                </button>
              </div>
            </div>
            {isDeploying && (
              <div className="relative z-10 mt-4 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#a64f46,#cf6a54,#a8577a)] transition-all duration-500"
                  style={{ width: `${deployProgress}%` }}
                />
              </div>
            )}
          </div>
          <div className="relative isolate min-h-0 overflow-hidden rounded-[16px] border border-black/5 bg-[#fafafa] shadow-sm dark:border-white/10 dark:bg-[#09090b]">
            <div className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay" style={{ backgroundImage: fineGrain, backgroundSize: '4px 4px' }} />
            <div className="relative z-10 flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0f0f12]">
              <input
                type="checkbox"
                id="select-all"
                checked={allOnlineSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-zinc-300 accent-[#09090b] dark:border-zinc-600"
                aria-label="Select all online devices"
              />
              <label htmlFor="select-all" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#71717a] cursor-pointer select-none">
                {allOnlineSelected ? 'Deselect all' : 'Select all online'}
              </label>
              <span className="ml-auto text-[11px] text-[#71717a]">{devices.length} devices</span>
            </div>
            <div className="relative z-10 grid grid-cols-[24px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_80px_60px] items-center gap-3 border-b border-black/5 bg-[#fafafa] px-4 py-2 dark:border-white/10 dark:bg-[#09090b]">
              {['', 'Device', 'Location', 'Current Model', 'Status', 'Last Seen'].map((h) => (
                <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71717a]">{h}</span>
              ))}
            </div>
            <div className="relative z-10 divide-y divide-black/5 dark:divide-white/10">
              {devices.map((device) => {
                const isSelectable = device.status === 'online' || device.status === 'updating';
                const isSelected   = selectedIds.has(device.id);
                return (
                  <div
                    key={device.id}
                    onClick={() => toggleDevice(device.id, device.status)}
                    className={`grid grid-cols-[24px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_80px_60px] items-center gap-3 px-4 py-3 text-sm transition
                      ${isSelectable ? 'cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]' : 'cursor-not-allowed opacity-50'}
                      ${isSelected ? 'bg-blue-50/60 dark:bg-blue-500/5' : ''}
                    `}
                    role="row"
                    aria-selected={isSelected}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!isSelectable}
                      onChange={() => toggleDevice(device.id, device.status)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-zinc-300 accent-[#09090b] dark:border-zinc-600"
                      aria-label={`Select ${device.name}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[13px] text-[#09090b] dark:text-[#fafafa]">{device.name}</p>
                      <p className="truncate text-[10px] text-[#71717a]">{device.id}</p>
                    </div>
                    <span className="truncate text-[12px] text-[#71717a]">{device.location}</span>
                    <span className="truncate text-[12px] font-medium text-[#09090b] dark:text-[#fafafa]">{device.currentModel}</span>
                    <StatusBadge status={device.status} />
                    <span className="text-[11px] text-[#71717a]">{device.lastSeen}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex shrink-0 items-start gap-2 text-[11px] leading-5 text-[#71717a] sm:items-center">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>
              Offline and error devices cannot be selected. Deployment is simulated — in production this would call the fleet management API.
            </span>
          </div>

        </div>
      </main>
    </div>
  );
}
