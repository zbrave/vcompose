import type { RecommendationDefault } from '../lib/recommendation-types';

export const RECOMMENDATION_DEFAULTS: Record<string, RecommendationDefault> = {
  pgadmin: {
    image: 'dpage/pgadmin4',
    ports: [{ host: '5050', container: '80' }],
    environment: {
      PGADMIN_DEFAULT_EMAIL: 'admin@admin.com',
      PGADMIN_DEFAULT_PASSWORD: 'admin',
    },
  },
  adminer: {
    image: 'adminer',
    ports: [{ host: '8080', container: '8080' }],
  },
  certbot: {
    image: 'certbot/certbot',
    volumes: [
      { source: './certbot/conf', target: '/etc/letsencrypt' },
      { source: './certbot/www', target: '/var/www/certbot' },
    ],
  },
  mongo: {
    image: 'mongo:7',
    ports: [{ host: '27017', container: '27017' }],
    environment: {
      MONGO_INITDB_ROOT_USERNAME: 'root',
      MONGO_INITDB_ROOT_PASSWORD: 'password',
    },
  },
  'mongo-express': {
    image: 'mongo-express',
    ports: [{ host: '8081', container: '8081' }],
    environment: {
      ME_CONFIG_MONGODB_ADMINUSERNAME: 'root',
      ME_CONFIG_MONGODB_ADMINPASSWORD: 'password',
    },
  },
  'redis-commander': {
    image: 'rediscommander/redis-commander',
    ports: [{ host: '8082', container: '8081' }],
  },
  rabbitmq: {
    image: 'rabbitmq:3-management',
    ports: [
      { host: '5672', container: '5672' },
      { host: '15672', container: '15672' },
    ],
  },
  elasticsearch: {
    image: 'elasticsearch:8.12.0',
    ports: [{ host: '9200', container: '9200' }],
    environment: {
      'discovery.type': 'single-node',
      'xpack.security.enabled': 'false',
    },
  },
  kibana: {
    image: 'kibana:8.12.0',
    ports: [{ host: '5601', container: '5601' }],
  },
  logstash: {
    image: 'logstash:8.12.0',
    ports: [{ host: '5044', container: '5044' }],
  },
};
