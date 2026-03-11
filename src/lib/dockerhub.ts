export interface DockerHubResult {
  name: string;
  description: string;
  starCount: number;
  isOfficial: boolean;
}

interface DockerHubApiResponse {
  results: {
    repo_name: string;
    short_description: string;
    star_count: number;
    is_official: boolean;
  }[];
}

const POPULAR_IMAGES: DockerHubResult[] = [
  { name: 'nginx', description: 'Official build of Nginx', starCount: 20000, isOfficial: true },
  { name: 'nginx:alpine', description: 'Nginx Alpine variant', starCount: 20000, isOfficial: true },
  { name: 'postgres', description: 'The PostgreSQL object-relational database', starCount: 13000, isOfficial: true },
  { name: 'postgres:16-alpine', description: 'PostgreSQL 16 Alpine', starCount: 13000, isOfficial: true },
  { name: 'redis', description: 'Redis in-memory data structure store', starCount: 13000, isOfficial: true },
  { name: 'redis:7-alpine', description: 'Redis 7 Alpine variant', starCount: 13000, isOfficial: true },
  { name: 'node', description: 'Node.js JavaScript runtime', starCount: 13000, isOfficial: true },
  { name: 'node:20-alpine', description: 'Node.js 20 Alpine', starCount: 13000, isOfficial: true },
  { name: 'node:22-alpine', description: 'Node.js 22 Alpine', starCount: 13000, isOfficial: true },
  { name: 'mysql', description: 'MySQL relational database', starCount: 15000, isOfficial: true },
  { name: 'mysql:8', description: 'MySQL 8', starCount: 15000, isOfficial: true },
  { name: 'mongo', description: 'MongoDB document database', starCount: 10000, isOfficial: true },
  { name: 'mongo:7', description: 'MongoDB 7', starCount: 10000, isOfficial: true },
  { name: 'python', description: 'Python programming language', starCount: 9000, isOfficial: true },
  { name: 'python:3.12-slim', description: 'Python 3.12 slim', starCount: 9000, isOfficial: true },
  { name: 'alpine', description: 'Minimal Docker image based on Alpine Linux', starCount: 11000, isOfficial: true },
  { name: 'ubuntu', description: 'Ubuntu base image', starCount: 17000, isOfficial: true },
  { name: 'debian', description: 'Debian base image', starCount: 5000, isOfficial: true },
  { name: 'httpd', description: 'Apache HTTP Server', starCount: 5000, isOfficial: true },
  { name: 'mariadb', description: 'MariaDB relational database', starCount: 6000, isOfficial: true },
  { name: 'rabbitmq', description: 'RabbitMQ message broker', starCount: 5000, isOfficial: true },
  { name: 'rabbitmq:3-management', description: 'RabbitMQ with management UI', starCount: 5000, isOfficial: true },
  { name: 'memcached', description: 'Memcached distributed memory caching', starCount: 2000, isOfficial: true },
  { name: 'elasticsearch', description: 'Elasticsearch search engine', starCount: 6000, isOfficial: true },
  { name: 'traefik', description: 'Cloud native application proxy', starCount: 4000, isOfficial: true },
  { name: 'caddy', description: 'Fast multi-platform web server with HTTPS', starCount: 2000, isOfficial: true },
  { name: 'grafana/grafana', description: 'Grafana observability platform', starCount: 3000, isOfficial: false },
  { name: 'prom/prometheus', description: 'Prometheus monitoring system', starCount: 2000, isOfficial: false },
  { name: 'portainer/portainer-ce', description: 'Portainer container management', starCount: 2000, isOfficial: false },
  { name: 'minio/minio', description: 'MinIO object storage', starCount: 1500, isOfficial: false },
  { name: 'dpage/pgadmin4', description: 'pgAdmin 4 web interface for PostgreSQL', starCount: 1000, isOfficial: false },
  { name: 'adminer', description: 'Database management in a single PHP file', starCount: 1000, isOfficial: true },
  { name: 'wordpress', description: 'WordPress blogging platform', starCount: 5000, isOfficial: true },
  { name: 'sonarqube', description: 'SonarQube code quality analysis', starCount: 1000, isOfficial: true },
  { name: 'jenkins/jenkins', description: 'Jenkins automation server', starCount: 3000, isOfficial: false },
  { name: 'mailhog/mailhog', description: 'Email testing tool for developers', starCount: 800, isOfficial: false },
  { name: 'vault', description: 'HashiCorp Vault secrets management', starCount: 1500, isOfficial: true },
  { name: 'consul', description: 'HashiCorp Consul service mesh', starCount: 1200, isOfficial: true },
  { name: 'haproxy', description: 'HAProxy load balancer', starCount: 2000, isOfficial: true },
  { name: 'registry', description: 'Docker Registry for storing images', starCount: 4000, isOfficial: true },
];

export function searchLocal(query: string): DockerHubResult[] {
  const q = query.toLowerCase();
  return POPULAR_IMAGES.filter(
    (img) => img.name.toLowerCase().includes(q) || img.description.toLowerCase().includes(q),
  ).slice(0, 10);
}

export async function searchRemote(
  query: string,
  signal?: AbortSignal,
): Promise<DockerHubResult[]> {
  try {
    const url = `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page_size=10`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data: DockerHubApiResponse = await res.json();
    return (data.results ?? []).map((r) => ({
      name: r.is_official ? r.repo_name.replace(/^library\//, '') : r.repo_name,
      description: r.short_description ?? '',
      starCount: r.star_count ?? 0,
      isOfficial: r.is_official ?? false,
    }));
  } catch {
    return [];
  }
}

export async function searchImages(
  query: string,
  signal?: AbortSignal,
): Promise<DockerHubResult[]> {
  const local = searchLocal(query);
  const remote = await searchRemote(query, signal);
  if (remote.length > 0) return remote;
  return local;
}
