import { useState } from 'react';
import { useStore } from '../../store';
import type { NetworkConfig } from '../../store/types';

const DRIVERS: NetworkConfig['driver'][] = ['bridge', 'overlay', 'host', 'none'];

export function NetworkPanel() {
  const networks = useStore((s) => s.networks);
  const addNetwork = useStore((s) => s.addNetwork);
  const updateNetwork = useStore((s) => s.updateNetwork);
  const removeNetwork = useStore((s) => s.removeNetwork);

  const [newName, setNewName] = useState('');
  const [newDriver, setNewDriver] = useState<NetworkConfig['driver']>('bridge');

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (networks.some((n) => n.name === name)) return;
    addNetwork({ name, driver: newDriver });
    setNewName('');
    setNewDriver('bridge');
  };

  const inputCls =
    'w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:outline-none';
  const btnCls =
    'rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600 transition-colors';

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Networks
      </h2>

      {networks.length === 0 && (
        <p className="mb-2 text-xs text-gray-600">No networks yet</p>
      )}

      <div className="mb-3 space-y-2">
        {networks.map((net) => (
          <div
            key={net.name}
            className="flex items-center gap-1 rounded border border-gray-700 bg-gray-800/50 px-2 py-1.5"
          >
            <input
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-gray-200 focus:outline-none"
              value={net.name}
              onChange={(e) => updateNetwork(net.name, { ...net, name: e.target.value })}
            />
            <select
              className="rounded border border-gray-600 bg-gray-800 px-1 py-0.5 text-xs text-gray-300"
              value={net.driver}
              onChange={(e) =>
                updateNetwork(net.name, {
                  ...net,
                  driver: e.target.value as NetworkConfig['driver'],
                })
              }
            >
              {DRIVERS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <button
              onClick={() => removeNetwork(net.name)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <input
          className={`${inputCls} flex-1`}
          placeholder="network name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <select
          className="rounded border border-gray-600 bg-gray-800 px-1 py-1.5 text-xs text-gray-300"
          value={newDriver}
          onChange={(e) => setNewDriver(e.target.value as NetworkConfig['driver'])}
        >
          {DRIVERS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button onClick={handleAdd} className={btnCls} data-testid="add-network-btn">
          +
        </button>
      </div>
    </div>
  );
}
