import type { StackDefinition } from './types';

export const STACK_CATALOG: StackDefinition[] = [
  // 1. Smart Home
  {
    key: 'smart-home',
    name: 'Smart Home',
    icon: '🏠',
    description: 'Complete home automation stack with Home Assistant, MQTT broker, Zigbee gateway, Node-RED automation, and InfluxDB + Grafana monitoring.',
    tags: ['smart home', 'home automation', 'iot', 'home assistant', 'mqtt', 'zigbee', 'node-red'],
    services: [
      { serviceKey: 'home-assistant', gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'mosquitto',      gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'zigbee2mqtt',    gridPosition: { col: 2, row: 0 } },
      { serviceKey: 'node-red',       gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'influxdb',       gridPosition: { col: 1, row: 1 } },
      { serviceKey: 'grafana',        gridPosition: { col: 2, row: 1 } },
    ],
    edges: [
      { source: 'mosquitto', target: 'zigbee2mqtt' },
      { source: 'mosquitto', target: 'node-red' },
      { source: 'influxdb',  target: 'grafana' },
      { source: 'mosquitto', target: 'home-assistant' },
    ],
  },

  // 2. IoT / MING Stack
  {
    key: 'iot-ming',
    name: 'IoT / MING Stack',
    icon: '📡',
    description: 'MQTT + InfluxDB + Node-RED + Grafana stack for IoT data collection, transformation, and visualization with Telegraf metrics agent.',
    tags: ['iot', 'ming', 'mqtt', 'influxdb', 'grafana', 'telegraf', 'node-red', 'time series'],
    services: [
      { serviceKey: 'mosquitto', gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'telegraf',  gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'influxdb',  gridPosition: { col: 2, row: 0 } },
      { serviceKey: 'node-red',  gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'grafana',   gridPosition: { col: 2, row: 1 } },
    ],
    edges: [
      { source: 'mosquitto', target: 'telegraf' },
      { source: 'influxdb',  target: 'telegraf' },
      { source: 'influxdb',  target: 'grafana' },
      { source: 'mosquitto', target: 'node-red' },
    ],
  },

  // 3. Media Server (Arr Stack)
  {
    key: 'media-arr',
    name: 'Media Server (Arr Stack)',
    icon: '🎬',
    description: 'Complete media automation stack with Jellyfin, Sonarr, Radarr, Prowlarr, Lidarr, Bazarr, and qBittorrent for automated media management.',
    tags: ['media', 'jellyfin', 'sonarr', 'radarr', 'prowlarr', 'lidarr', 'bazarr', 'qbittorrent', 'arr', 'plex'],
    services: [
      { serviceKey: 'jellyfin',    gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'prowlarr',    gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'sonarr',      gridPosition: { col: 2, row: 0 } },
      { serviceKey: 'radarr',      gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'lidarr',      gridPosition: { col: 1, row: 1 } },
      { serviceKey: 'bazarr',      gridPosition: { col: 2, row: 1 } },
      { serviceKey: 'qbittorrent', gridPosition: { col: 3, row: 0 } },
    ],
    edges: [
      { source: 'prowlarr',    target: 'sonarr' },
      { source: 'prowlarr',    target: 'radarr' },
      { source: 'prowlarr',    target: 'lidarr' },
      { source: 'qbittorrent', target: 'sonarr' },
      { source: 'qbittorrent', target: 'radarr' },
    ],
  },

  // 4. Monitoring Stack
  {
    key: 'monitoring',
    name: 'Monitoring Stack',
    icon: '📊',
    description: 'Prometheus-based monitoring stack with Grafana dashboards, Alertmanager notifications, cAdvisor container metrics, and Node Exporter host metrics.',
    tags: ['monitoring', 'prometheus', 'grafana', 'alertmanager', 'cadvisor', 'node-exporter', 'metrics', 'observability'],
    services: [
      { serviceKey: 'prometheus',    gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'grafana',       gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'alertmanager',  gridPosition: { col: 2, row: 0 } },
      { serviceKey: 'cadvisor',      gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'node-exporter', gridPosition: { col: 1, row: 1 } },
    ],
    edges: [
      { source: 'prometheus', target: 'grafana' },
      { source: 'prometheus', target: 'alertmanager' },
    ],
  },

  // 5. ELK Stack
  {
    key: 'elk',
    name: 'ELK Stack',
    icon: '🔍',
    description: 'Elasticsearch, Logstash, and Kibana for centralized log ingestion, processing, storage, and visualization.',
    tags: ['elk', 'elasticsearch', 'logstash', 'kibana', 'logging', 'search', 'observability'],
    services: [
      { serviceKey: 'elasticsearch', gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'logstash',      gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'kibana',        gridPosition: { col: 2, row: 0 } },
    ],
    edges: [
      { source: 'elasticsearch', target: 'logstash' },
      { source: 'elasticsearch', target: 'kibana' },
    ],
  },

  // 6. Loki Logging Stack
  {
    key: 'loki',
    name: 'Loki Logging Stack',
    icon: '📋',
    description: 'Grafana Loki-based logging stack with Promtail log shipper and Grafana dashboards for lightweight, cost-effective log aggregation.',
    tags: ['loki', 'grafana', 'promtail', 'logging', 'log aggregation', 'observability'],
    services: [
      { serviceKey: 'loki',     gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'promtail', gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'grafana',  gridPosition: { col: 2, row: 0 } },
    ],
    edges: [
      { source: 'loki', target: 'grafana' },
      { source: 'loki', target: 'promtail' },
    ],
  },

  // 7. AI / Local LLM Stack
  {
    key: 'ai-llm',
    name: 'AI / Local LLM Stack',
    icon: '🤖',
    description: 'Local AI stack with Ollama LLM runtime, Open WebUI chat interface, Qdrant vector database for RAG, and n8n for AI workflow automation.',
    tags: ['ai', 'llm', 'ollama', 'open-webui', 'qdrant', 'n8n', 'local ai', 'rag', 'vector database', 'automation'],
    services: [
      { serviceKey: 'ollama',    gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'open-webui', gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'qdrant',    gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'n8n',       gridPosition: { col: 1, row: 1 } },
    ],
    edges: [
      { source: 'ollama', target: 'open-webui' },
      { source: 'ollama', target: 'n8n' },
      { source: 'qdrant', target: 'n8n' },
    ],
  },

  // 8. LEMP Stack
  {
    key: 'lemp',
    name: 'LEMP Stack',
    icon: '🌐',
    description: 'Linux + Nginx + MySQL + PHP-FPM stack for hosting PHP web applications with Redis caching.',
    tags: ['lemp', 'nginx', 'mysql', 'php', 'php-fpm', 'redis', 'web server', 'lamp'],
    services: [
      { serviceKey: 'nginx',   gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'php-fpm', gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'mysql',   gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'redis',   gridPosition: { col: 1, row: 1 } },
    ],
    edges: [
      { source: 'php-fpm', target: 'nginx' },
      { source: 'mysql',   target: 'php-fpm' },
      { source: 'redis',   target: 'php-fpm' },
    ],
  },

  // 9. MERN Stack
  {
    key: 'mern',
    name: 'MERN Stack',
    icon: '⚛️',
    description: 'MongoDB + Express + React + Node.js stack with Mongo Express admin UI and Redis caching for full-stack JavaScript applications.',
    tags: ['mern', 'mongodb', 'node', 'nodejs', 'redis', 'mongo-express', 'javascript', 'fullstack'],
    services: [
      { serviceKey: 'mongodb',       gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'node',          gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'mongo-express', gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'redis',         gridPosition: { col: 1, row: 1 } },
    ],
    edges: [
      { source: 'mongodb', target: 'node' },
      { source: 'redis',   target: 'node' },
      { source: 'mongodb', target: 'mongo-express' },
    ],
  },

  // 10. WordPress Stack
  {
    key: 'wordpress',
    name: 'WordPress Stack',
    icon: '📝',
    description: 'WordPress CMS with MySQL database, Redis object cache, and phpMyAdmin database management.',
    tags: ['wordpress', 'mysql', 'redis', 'phpmyadmin', 'cms', 'blog', 'php'],
    services: [
      { serviceKey: 'wordpress',  gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'mysql',      gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'redis',      gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'phpmyadmin', gridPosition: { col: 1, row: 1 } },
    ],
    edges: [
      { source: 'mysql', target: 'wordpress' },
      { source: 'redis', target: 'wordpress' },
      { source: 'mysql', target: 'phpmyadmin' },
    ],
  },

  // 11. Nextcloud Stack
  {
    key: 'nextcloud',
    name: 'Nextcloud Stack',
    icon: '☁️',
    description: 'Nextcloud self-hosted cloud storage with PostgreSQL database, Redis cache, and OnlyOffice document editing.',
    tags: ['nextcloud', 'postgres', 'redis', 'onlyoffice', 'cloud storage', 'self-hosted', 'office'],
    services: [
      { serviceKey: 'nextcloud',  gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'postgres',   gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'redis',      gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'onlyoffice', gridPosition: { col: 1, row: 1 } },
    ],
    edges: [
      { source: 'postgres', target: 'nextcloud' },
      { source: 'redis',    target: 'nextcloud' },
    ],
  },

  // 12. GitOps Stack
  {
    key: 'gitops',
    name: 'GitOps Stack',
    icon: '🔧',
    description: 'Self-hosted GitOps pipeline with Gitea source control, Drone CI/CD, private Docker Registry, and Portainer container management.',
    tags: ['gitops', 'gitea', 'drone-ci', 'ci/cd', 'docker-registry', 'portainer', 'devops', 'self-hosted'],
    services: [
      { serviceKey: 'gitea',           gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'drone-ci',        gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'docker-registry', gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'portainer',       gridPosition: { col: 1, row: 1 } },
    ],
    edges: [
      { source: 'gitea', target: 'drone-ci' },
    ],
  },

  // 13. Security Stack
  {
    key: 'security',
    name: 'Security Stack',
    icon: '🔒',
    description: 'Self-hosted security stack with Nginx Proxy Manager reverse proxy, Authentik SSO, WireGuard VPN, and AdGuard Home DNS filtering.',
    tags: ['security', 'nginx-proxy-manager', 'authentik', 'wg-easy', 'wireguard', 'adguard', 'vpn', 'sso', 'dns', 'proxy'],
    services: [
      { serviceKey: 'nginx-proxy-manager', gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'authentik',           gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'wg-easy',             gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'adguard-home',        gridPosition: { col: 1, row: 1 } },
    ],
    edges: [
      { source: 'authentik', target: 'nginx-proxy-manager' },
    ],
  },

  // 14. Photo & Docs Stack
  {
    key: 'photo-docs',
    name: 'Photo & Docs Stack',
    icon: '📸',
    description: 'Self-hosted photo management with Immich and document management with Paperless-ngx, sharing a PostgreSQL database and Redis cache.',
    tags: ['photos', 'immich', 'paperless', 'paperless-ngx', 'documents', 'postgres', 'redis', 'self-hosted'],
    services: [
      { serviceKey: 'immich',       gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'paperless-ngx', gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'postgres',     gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'redis',        gridPosition: { col: 1, row: 1 } },
    ],
    edges: [
      { source: 'postgres', target: 'immich' },
      { source: 'redis',    target: 'immich' },
      { source: 'postgres', target: 'paperless-ngx' },
      { source: 'redis',    target: 'paperless-ngx' },
    ],
  },

  // 15. Dashboard Stack
  {
    key: 'dashboard',
    name: 'Dashboard Stack',
    icon: '🎮',
    description: 'Self-hosted dashboard and utility stack with Homepage service launcher, Uptime Kuma monitoring, and Vaultwarden password manager.',
    tags: ['dashboard', 'homepage', 'uptime-kuma', 'vaultwarden', 'bitwarden', 'monitoring', 'self-hosted'],
    services: [
      { serviceKey: 'homepage',    gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'uptime-kuma', gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'vaultwarden', gridPosition: { col: 2, row: 0 } },
    ],
    edges: [],
  },

  // 16. Coolify PaaS Stack
  {
    key: 'coolify',
    name: 'Coolify PaaS Stack',
    icon: '🚀',
    description: 'Coolify self-hosted PaaS with PostgreSQL database, Redis cache, Soketi WebSockets, and Traefik reverse proxy.',
    tags: ['coolify', 'paas', 'postgres', 'redis', 'soketi', 'traefik', 'self-hosted', 'platform'],
    services: [
      { serviceKey: 'coolify',  gridPosition: { col: 0, row: 0 } },
      { serviceKey: 'postgres', gridPosition: { col: 1, row: 0 } },
      { serviceKey: 'redis',    gridPosition: { col: 2, row: 0 } },
      { serviceKey: 'soketi',   gridPosition: { col: 0, row: 1 } },
      { serviceKey: 'traefik',  gridPosition: { col: 1, row: 1 } },
    ],
    edges: [
      { source: 'postgres', target: 'coolify' },
      { source: 'redis',    target: 'coolify' },
      { source: 'soketi',   target: 'coolify' },
      { source: 'traefik',  target: 'coolify' },
    ],
  },
];
