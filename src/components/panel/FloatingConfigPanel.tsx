import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useStore } from '../../store';
import type { PortMapping, VolumeMapping, HealthcheckConfig } from '../../store/types';
import { ImageSearchInput } from './ImageSearchInput';
import { RecommendationList } from './RecommendationList';

export function FloatingConfigPanel() {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const nodes = useStore((s) => s.nodes);
  const networks = useStore((s) => s.networks);
  const updateNode = useStore((s) => s.updateNode);
  const selectNode = useStore((s) => s.selectNode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectNode(null);
    };
    if (selectedNodeId) {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [selectedNodeId, selectNode]);

  if (!selectedNodeId || !selectedNode) return null;

  const d = selectedNode.data;
  const isPreset = d.preset !== 'custom';

  const update = (patch: Partial<typeof d>) => updateNode(selectedNode.id, patch);

  // Port helpers
  const updatePort = (idx: number, field: keyof PortMapping, value: string) => {
    const ports = [...d.ports];
    ports[idx] = { ...ports[idx], [field]: value };
    update({ ports });
  };
  const addPort = () => update({ ports: [...d.ports, { host: '', container: '' }] });
  const removePort = (idx: number) => update({ ports: d.ports.filter((_, i) => i !== idx) });

  // Volume helpers
  const updateVolume = (idx: number, field: keyof VolumeMapping, value: string) => {
    const volumes = [...d.volumes];
    volumes[idx] = { ...volumes[idx], [field]: value };
    update({ volumes });
  };
  const addVolume = () => update({ volumes: [...d.volumes, { source: '', target: '' }] });
  const removeVolume = (idx: number) => update({ volumes: d.volumes.filter((_, i) => i !== idx) });

  // Env helpers
  const updateEnvKey = (oldKey: string, newKey: string) => {
    const env = { ...d.environment };
    const val = env[oldKey];
    delete env[oldKey];
    env[newKey] = val;
    update({ environment: env });
  };
  const updateEnvVal = (key: string, val: string) => {
    update({ environment: { ...d.environment, [key]: val } });
  };
  const addEnv = () => update({ environment: { ...d.environment, '': '' } });
  const removeEnv = (key: string) => {
    const env = { ...d.environment };
    delete env[key];
    update({ environment: env });
  };

  // Healthcheck helpers
  const toggleHealthcheck = () => {
    if (d.healthcheck) {
      update({ healthcheck: undefined });
    } else {
      update({
        healthcheck: { test: 'CMD curl -f http://localhost', interval: '30s', timeout: '10s', retries: 3 },
      });
    }
  };
  const updateHC = (patch: Partial<HealthcheckConfig>) => {
    if (d.healthcheck) update({ healthcheck: { ...d.healthcheck, ...patch } });
  };

  const inputCls =
    'w-full rounded border border-subtle bg-elevated px-2 py-1.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none';
  const labelCls = 'block text-xs font-medium text-text-secondary mb-1';

  const panel = (
    <AnimatePresence>
      <motion.div
        key="floating-config"
        initial={{ opacity: 0, x: 40, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        drag
        dragMomentum={false}
        style={{
          position: 'fixed',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          backgroundColor: 'rgba(38, 34, 32, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        className="w-80 max-h-[70vh] overflow-y-auto border border-glow rounded-xl shadow-2xl"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-subtle cursor-grab active:cursor-grabbing"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Configure
          </h3>
          <button
            onClick={() => selectNode(null)}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Service Name */}
          <div>
            <label className={labelCls}>Service Name</label>
            <input
              className={inputCls}
              value={d.serviceName}
              onChange={(e) => update({ serviceName: e.target.value })}
            />
          </div>

          {/* Image */}
          <div>
            <label className={labelCls}>Image</label>
            <ImageSearchInput
              className={inputCls}
              value={d.image}
              disabled={isPreset}
              onChange={(v) => update({ image: v })}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

          {/* Ports */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls + ' mb-0'}>Ports</label>
              <button
                onClick={addPort}
                className="text-xs text-accent hover:opacity-75 transition-opacity"
              >
                + Add
              </button>
            </div>
            {d.ports.map((p, i) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <input
                  value={p.host}
                  onChange={(e) => updatePort(i, 'host', e.target.value)}
                  placeholder="host"
                  className="w-0 flex-1 rounded border border-subtle bg-elevated px-2 py-1 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
                />
                <span className="text-text-muted text-xs">:</span>
                <input
                  value={p.container}
                  onChange={(e) => updatePort(i, 'container', e.target.value)}
                  placeholder="container"
                  className="w-0 flex-1 rounded border border-subtle bg-elevated px-2 py-1 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
                />
                <button
                  onClick={() => removePort(i)}
                  className="text-xs text-text-muted hover:text-red-400 transition-colors"
                  aria-label="Remove port"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Volumes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls + ' mb-0'}>Volumes</label>
              <button
                onClick={addVolume}
                className="text-xs text-accent hover:opacity-75 transition-opacity"
              >
                + Add
              </button>
            </div>
            {d.volumes.map((v, i) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <input
                  value={v.source}
                  onChange={(e) => updateVolume(i, 'source', e.target.value)}
                  placeholder="source"
                  className="w-0 flex-1 rounded border border-subtle bg-elevated px-2 py-1 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
                />
                <span className="text-text-muted text-xs">:</span>
                <input
                  value={v.target}
                  onChange={(e) => updateVolume(i, 'target', e.target.value)}
                  placeholder="target"
                  className="w-0 flex-1 rounded border border-subtle bg-elevated px-2 py-1 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
                />
                <button
                  onClick={() => removeVolume(i)}
                  className="text-xs text-text-muted hover:text-red-400 transition-colors"
                  aria-label="Remove volume"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

          {/* Environment */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls + ' mb-0'}>Environment</label>
              <button
                onClick={addEnv}
                className="text-xs text-accent hover:opacity-75 transition-opacity"
              >
                + Add
              </button>
            </div>
            {Object.entries(d.environment).map(([key, val], i) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <input
                  value={key}
                  onChange={(e) => updateEnvKey(key, e.target.value)}
                  placeholder="KEY"
                  className="w-0 flex-1 rounded border border-subtle bg-elevated px-2 py-1 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none font-mono"
                />
                <span className="text-text-muted text-xs">=</span>
                <input
                  value={val}
                  onChange={(e) => updateEnvVal(key, e.target.value)}
                  placeholder="value"
                  className="w-0 flex-1 rounded border border-subtle bg-elevated px-2 py-1 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none font-mono"
                />
                <button
                  onClick={() => removeEnv(key)}
                  className="text-xs text-text-muted hover:text-red-400 transition-colors"
                  aria-label="Remove env var"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Networks */}
          {networks.length > 0 && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
              <div>
                <label className={labelCls}>Networks</label>
                <div className="space-y-1">
                  {networks.map((net) => (
                    <label key={net.name} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={d.networks.includes(net.name)}
                        onChange={(e) => {
                          const nets = e.target.checked
                            ? [...d.networks, net.name]
                            : d.networks.filter((n) => n !== net.name);
                          update({ networks: nets });
                        }}
                        className="rounded border-subtle accent-amber-500"
                      />
                      <span>{net.name}</span>
                      <span className="text-xs text-text-muted">({net.driver})</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

          {/* Healthcheck */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs font-medium text-text-secondary">Healthcheck</label>
              <button
                onClick={toggleHealthcheck}
                className={`h-5 w-9 rounded-full transition-colors ${d.healthcheck ? 'bg-accent' : 'bg-elevated border border-subtle'}`}
                aria-label="Toggle healthcheck"
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${d.healthcheck ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
            {d.healthcheck && (
              <div className="space-y-2 rounded border border-subtle bg-surface/50 p-2 pl-3">
                <input
                  className={inputCls}
                  placeholder="CMD curl -f http://localhost"
                  value={d.healthcheck.test}
                  onChange={(e) => updateHC({ test: e.target.value })}
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <span className="text-xs text-text-muted">interval</span>
                    <input
                      className={inputCls}
                      value={d.healthcheck.interval}
                      onChange={(e) => updateHC({ interval: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-text-muted">timeout</span>
                    <input
                      className={inputCls}
                      value={d.healthcheck.timeout}
                      onChange={(e) => updateHC({ timeout: e.target.value })}
                    />
                  </div>
                  <div className="w-16">
                    <span className="text-xs text-text-muted">retries</span>
                    <input
                      className={inputCls}
                      type="number"
                      value={d.healthcheck.retries}
                      onChange={(e) => updateHC({ retries: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <RecommendationList />
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(panel, document.body);
}
