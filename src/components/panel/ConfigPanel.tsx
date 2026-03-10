import { useStore } from '../../store';
import type { PortMapping, VolumeMapping, HealthcheckConfig } from '../../store/types';

export function ConfigPanel() {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const nodes = useStore((s) => s.nodes);
  const updateNode = useStore((s) => s.updateNode);
  const networks = useStore((s) => s.networks);

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const d = node.data;
  const isPreset = d.preset !== 'custom';

  const update = (patch: Partial<typeof d>) => updateNode(node.id, patch);

  // Dynamic list helpers
  const updatePort = (idx: number, field: keyof PortMapping, value: string) => {
    const ports = [...d.ports];
    ports[idx] = { ...ports[idx], [field]: value };
    update({ ports });
  };
  const addPort = () => update({ ports: [...d.ports, { host: '', container: '' }] });
  const removePort = (idx: number) => update({ ports: d.ports.filter((_, i) => i !== idx) });

  const updateVolume = (idx: number, field: keyof VolumeMapping, value: string) => {
    const volumes = [...d.volumes];
    volumes[idx] = { ...volumes[idx], [field]: value };
    update({ volumes });
  };
  const addVolume = () => update({ volumes: [...d.volumes, { source: '', target: '' }] });
  const removeVolume = (idx: number) => update({ volumes: d.volumes.filter((_, i) => i !== idx) });

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

  const inputCls = 'w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:outline-none';
  const labelCls = 'block text-xs font-medium uppercase tracking-wider text-gray-400 mb-1';
  const btnCls = 'rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600 transition-colors';

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Configure
      </h3>

      {/* Service Name */}
      <div className="mb-3">
        <label className={labelCls}>Service Name</label>
        <input
          className={inputCls}
          value={d.serviceName}
          onChange={(e) => update({ serviceName: e.target.value })}
        />
      </div>

      {/* Image */}
      <div className="mb-3">
        <label className={labelCls}>Image</label>
        <input
          className={inputCls}
          value={d.image}
          disabled={isPreset}
          onChange={(e) => update({ image: e.target.value })}
        />
      </div>

      {/* Ports */}
      <div className="mb-3">
        <label className={labelCls}>Ports</label>
        {d.ports.map((p, i) => (
          <div key={i} className="mb-1 flex items-center gap-1">
            <button onClick={() => removePort(i)} className="text-xs text-red-400 hover:text-red-300">✕</button>
            <input className={`${inputCls} w-20`} placeholder="host" value={p.host} onChange={(e) => updatePort(i, 'host', e.target.value)} />
            <span className="text-gray-500">:</span>
            <input className={`${inputCls} w-20`} placeholder="container" value={p.container} onChange={(e) => updatePort(i, 'container', e.target.value)} />
          </div>
        ))}
        <button onClick={addPort} className={btnCls}>+ Add Port</button>
      </div>

      {/* Volumes */}
      <div className="mb-3">
        <label className={labelCls}>Volumes</label>
        {d.volumes.map((v, i) => (
          <div key={i} className="mb-1 flex items-center gap-1">
            <button onClick={() => removeVolume(i)} className="text-xs text-red-400 hover:text-red-300">✕</button>
            <input className={`${inputCls} flex-1`} placeholder="source" value={v.source} onChange={(e) => updateVolume(i, 'source', e.target.value)} />
            <span className="text-gray-500">:</span>
            <input className={`${inputCls} flex-1`} placeholder="target" value={v.target} onChange={(e) => updateVolume(i, 'target', e.target.value)} />
          </div>
        ))}
        <button onClick={addVolume} className={btnCls}>+ Add Volume</button>
      </div>

      {/* Environment */}
      <div className="mb-3">
        <label className={labelCls}>Environment</label>
        {Object.entries(d.environment).map(([key, val]) => (
          <div key={key} className="mb-1 flex items-center gap-1">
            <button onClick={() => removeEnv(key)} className="text-xs text-red-400 hover:text-red-300">✕</button>
            <input className={`${inputCls} w-28`} placeholder="KEY" value={key} onChange={(e) => updateEnvKey(key, e.target.value)} />
            <span className="text-gray-500">=</span>
            <input className={`${inputCls} flex-1`} placeholder="value" value={val} onChange={(e) => updateEnvVal(key, e.target.value)} />
          </div>
        ))}
        <button onClick={addEnv} className={btnCls}>+ Add Variable</button>
      </div>


      {/* Networks */}
      <div className="mb-3">
        <label className={labelCls}>Networks</label>
        {networks.length === 0 ? (
          <p className="text-xs text-gray-600">No networks defined</p>
        ) : (
          <div className="space-y-1">
            {networks.map((net) => (
              <label key={net.name} className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={d.networks.includes(net.name)}
                  onChange={(e) => {
                    const nets = e.target.checked
                      ? [...d.networks, net.name]
                      : d.networks.filter((n) => n !== net.name);
                    update({ networks: nets });
                  }}
                  className="rounded border-gray-600"
                />
                {net.name}
                <span className="text-xs text-gray-500">({net.driver})</span>
              </label>
            ))}
          </div>
        )}
      </div>
      {/* Healthcheck */}
      <div className="mb-3">
        <div className="mb-1 flex items-center gap-2">
          <label className={labelCls + ' mb-0'}>Healthcheck</label>
          <button
            onClick={toggleHealthcheck}
            className={`h-5 w-9 rounded-full transition-colors ${d.healthcheck ? 'bg-blue-500' : 'bg-gray-600'}`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white transition-transform ${d.healthcheck ? 'translate-x-4' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
        {d.healthcheck && (
          <div className="space-y-2 rounded border border-gray-700 bg-gray-800/50 p-2">
            <input className={inputCls} placeholder="CMD curl -f http://localhost" value={d.healthcheck.test} onChange={(e) => updateHC({ test: e.target.value })} />
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-xs text-gray-500">interval</span>
                <input className={inputCls} value={d.healthcheck.interval} onChange={(e) => updateHC({ interval: e.target.value })} />
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-500">timeout</span>
                <input className={inputCls} value={d.healthcheck.timeout} onChange={(e) => updateHC({ timeout: e.target.value })} />
              </div>
              <div className="w-16">
                <span className="text-xs text-gray-500">retries</span>
                <input className={inputCls} type="number" value={d.healthcheck.retries} onChange={(e) => updateHC({ retries: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
