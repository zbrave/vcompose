# YAML Import Spec

> Phase 2 feature. Kullanici mevcut `docker-compose.yml` dosyasini yapistirarak canvas'a aktarabilir.

---

## Giris Yontemi

- YamlOutput panelinde "Import" butonu
- Tiklandiginda modal/textarea acilir
- Kullanici YAML yapistirir, "Import" ile onaylar
- Mevcut canvas temizlenir (confirm dialog), yeni state yuklenir

---

## `parseYaml(yamlString: string): ParseResult`

Pure function in `src/lib/yaml-parser.ts`.

### Input
Raw YAML string (docker-compose v3.x format).

### Output

```typescript
export interface ParseResult {
  success: boolean;
  nodes: ServiceNode[];
  edges: DependencyEdge[];
  networks: NetworkConfig[];
  namedVolumes: NamedVolume[];
  errors: string[]; // parse/validation errors
}
```

### Parsing Rules

1. **version**: Accept any `3.x` string or missing version. Ignore value.
2. **services**: Each key becomes a `ServiceNode`.
   - `id`: `crypto.randomUUID()`
   - `type`: `'serviceNode'`
   - `position`: Auto-layout grid (200px spacing, 3 columns)
   - `data.serviceName`: service key
   - `data.image`: `services[key].image` or `''`
   - `data.preset`: Match image to preset key (`nginx` -> `'nginx'`, `postgres` -> `'postgres'`, etc.), fallback `'custom'`
   - `data.ports`: Parse `"host:container"` string format -> `PortMapping[]`
   - `data.volumes`: Parse `"source:target"` string format -> `VolumeMapping[]`
   - `data.environment`: Support both object `{KEY: val}` and array `["KEY=val"]` formats
   - `data.healthcheck`: Map `test`, `interval`, `timeout`, `retries`. Test array `["CMD", ...]` -> single string `"CMD ..."`.
   - `data.networks`: From service-level `networks` list

3. **depends_on**: Each `depends_on` entry creates a `DependencyEdge`.
   - `source`: referenced service node id
   - `target`: current service node id
   - Support both array `[svc]` and object `{svc: {condition: ...}}` formats (ignore conditions)

4. **networks** (top-level): Each key -> `NetworkConfig`. Driver defaults to `'bridge'`.

5. **volumes** (top-level): Each key -> `NamedVolume`. Driver defaults to `'local'`.

### Auto-Layout

Nodes are positioned in a grid:
- Column width: 250px
- Row height: 150px
- Max columns: 3
- Starting offset: (50, 50)

### Error Handling

- Invalid YAML syntax -> `errors: ["Invalid YAML syntax: ..."]`, `success: false`
- Missing `services` key -> `errors: ["No services found"]`, `success: false`
- Invalid port format -> skip port, add warning to errors
- Unknown fields -> silently ignore

---

## Store Action

```typescript
importCompose: (result: ParseResult) => void;
```

Replaces entire state: nodes, edges, networks, namedVolumes. Clears selectedNodeId.

---

## UI

- "Import" button next to Copy/Download in YamlOutput header
- Click opens modal with `<textarea>` (full-width, 20 rows)
- "Import" + "Cancel" buttons
- On import: confirm dialog "This will replace current canvas. Continue?"
- On success: close modal, show toast/flash
- On error: show error messages in modal, don't close

---

## Edge Cases

- Empty services object -> success with empty arrays
- Service with only `image` -> valid minimal node
- Circular depends_on -> import as-is (validator will catch)
- Duplicate service names -> last one wins (YAML spec)
- Port with protocol `"80:80/tcp"` -> strip protocol, parse as `"80:80"`
